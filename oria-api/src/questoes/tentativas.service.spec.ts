import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { Chunk } from '../catalog/entities/chunk.entity';
import { Section } from '../catalog/entities/section.entity';
import { LlmPermanenteError, LlmTransientError } from '../llm/llm.exceptions';
import { LlmService } from '../llm/llm.service';
import { Attempt } from './entities/attempt.entity';
import { AttemptStep } from './entities/attempt-step.entity';
import { Question } from './entities/question.entity';
import { TentativasService } from './tentativas.service';

function criarConfigService(maximoPassos = 3): ConfigService {
  return { get: () => maximoPassos } as unknown as ConfigService;
}

const QUESTAO_COM_CHUNK = {
  id: 'questao-1',
  enunciado: 'Enunciado',
  respostaReferencia: 'Resposta de referência',
  chunksFonte: ['chunk-1'],
  conjunto: { sectionId: 'secao-1', userId: 'user-1' },
} as unknown as Question;

const CHUNK_FONTE: Partial<Chunk> = {
  id: 'chunk-1',
  sectionId: 'secao-1',
  texto: 'Texto do chunk que sustenta a questão.',
  ancoraCfi: 'epubcfi(/6/4!/4/2)',
  ordem: 0,
};

/** Fake de EntityManager/DataSource por despacho de classe de entidade — o
 * suficiente para exercitar `TentativasService` sem banco real. `passos`
 * reflete o estado da trilha entre chamadas de `manager.find(AttemptStep,...)`. */
function criarContexto(opts: {
  questao?: Question;
  tentativa: Partial<Attempt>;
  passosExistentes?: Array<Partial<AttemptStep>>;
  chunks?: Array<Partial<Chunk>>;
  secao?: Partial<Section> | null;
  llmService: { completar: (papel: string, ...args: unknown[]) => Promise<unknown> };
  maximoPassos?: number;
}) {
  const questao = opts.questao ?? QUESTAO_COM_CHUNK;
  let passos = [...(opts.passosExistentes ?? [])] as AttemptStep[];
  const passosSalvos: AttemptStep[] = [];

  const manager = {
    findOne: jest.fn((entidade: unknown) => {
      if (entidade === Question) return Promise.resolve(questao);
      if (entidade === Attempt) return Promise.resolve(opts.tentativa);
      return Promise.resolve(null);
    }),
    findOneOrFail: jest.fn((entidade: unknown) => {
      if (entidade === Question) return Promise.resolve(questao);
      throw new Error('findOneOrFail não configurado para esta entidade no fake');
    }),
    findOneBy: jest.fn((entidade: unknown) => {
      if (entidade === Section) return Promise.resolve(opts.secao ?? null);
      return Promise.resolve(null);
    }),
    find: jest.fn((entidade: unknown) => {
      if (entidade === Chunk) return Promise.resolve(opts.chunks ?? [CHUNK_FONTE]);
      if (entidade === AttemptStep) return Promise.resolve(passos);
      return Promise.resolve([]);
    }),
    create: jest.fn((_entidade: unknown, dados: Record<string, unknown>) => dados),
    save: jest.fn((dados: Record<string, unknown>) => {
      if ('tipo' in dados && 'attemptId' in dados) {
        const passo = { ...dados, criadoEm: new Date() } as AttemptStep;
        passosSalvos.push(passo);
        passos = [...passos, passo];
        return Promise.resolve(passo);
      }
      return Promise.resolve(dados);
    }),
  } as unknown as EntityManager;

  const dataSource = {
    transaction: jest.fn((callback: (m: EntityManager) => unknown) => callback(manager)),
    manager,
  } as unknown as DataSource;

  const service = new TentativasService(
    dataSource,
    opts.llmService as LlmService,
    criarConfigService(opts.maximoPassos),
  );

  return { service, passosSalvos, manager };
}

describe('TentativasService', () => {
  describe('item 3.9 — chunksMostrados', () => {
    it('iniciar: o passo "pedido_justificativa" recebe chunksMostrados com o chunk da questão', async () => {
      const llmService = {
        completar: jest.fn().mockResolvedValue({ conteudo: 'Em que trecho você se apoiou?', entregouResolucao: false }),
      };
      const { service, passosSalvos } = criarContexto({
        tentativa: {},
        llmService,
      });

      await service.iniciar('user-1', 'questao-1', { resposta: 'resposta inicial' });

      expect(passosSalvos).toHaveLength(1);
      expect(passosSalvos[0].chunksMostrados).toEqual([
        { chunkId: 'chunk-1', sectionId: 'secao-1', ancoraCfi: 'epubcfi(/6/4!/4/2)' },
      ]);
    });

    it('iniciar sem chunksFonte (fallback para a seção inteira): chunkId/ancoraCfi nulos', async () => {
      const llmService = {
        completar: jest.fn().mockResolvedValue({ conteudo: 'Em que trecho você se apoiou?', entregouResolucao: false }),
      };
      const questaoSemChunk = { ...QUESTAO_COM_CHUNK, chunksFonte: [] } as unknown as Question;
      const { service, passosSalvos } = criarContexto({
        questao: questaoSemChunk,
        tentativa: {},
        chunks: [],
        secao: { id: 'secao-1', textoCompleto: 'Texto da seção inteira.' },
        llmService,
      });

      await service.iniciar('user-1', 'questao-1', { resposta: 'resposta inicial' });

      expect(passosSalvos[0].chunksMostrados).toEqual([
        { chunkId: null, sectionId: 'secao-1', ancoraCfi: null },
      ]);
    });

    it('registrarPasso: justificativa insuficiente grava o passo do aluno com chunksMostrados vazio e a dica com chunksMostrados do material', async () => {
      const llmService = {
        completar: jest.fn((papel: string) => {
          if (papel === 'avaliacao') return Promise.resolve({ suficiente: false });
          return Promise.resolve({ conteudo: 'Pense no conceito X.', entregouResolucao: false });
        }),
      };
      const tentativa = { id: 'tentativa-1', questionId: 'questao-1', userId: 'user-1', estado: 'aberta', nPassos: 1 } as unknown as Attempt;
      const passosExistentes = [
        { numero: 1, tipo: 'pedido_justificativa', conteudo: 'x', chunksMostrados: [] } as unknown as AttemptStep,
      ];
      const { service, passosSalvos } = criarContexto({ tentativa, passosExistentes, llmService });

      await service.registrarPasso('user-1', 'tentativa-1', {
        tipo: 'justificativa_aluno',
        conteudo: 'minha justificativa',
      });

      const [passoAluno, passoDica] = passosSalvos;
      expect(passoAluno.tipo).toBe('justificativa_aluno');
      expect(passoAluno.chunksMostrados).toEqual([]);
      expect(passoDica.tipo).toBe('dica_conceitual');
      expect(passoDica.chunksMostrados).toEqual([
        { chunkId: 'chunk-1', sectionId: 'secao-1', ancoraCfi: 'epubcfi(/6/4!/4/2)' },
      ]);
    });
  });

  describe('item 3.11 — erros estruturados do LLM propagam sem fallback na avaliação/resolução', () => {
    it('avaliarJustificativa: LlmPermanenteError do papel "avaliacao" propaga intacto por registrarPasso', async () => {
      const erro = new LlmPermanenteError('Falha ao obter saída válida do papel "avaliacao" após 2 tentativas: schema inválido');
      const llmService = {
        completar: jest.fn().mockRejectedValue(erro),
      };
      const tentativa = { id: 'tentativa-1', questionId: 'questao-1', userId: 'user-1', estado: 'aberta', nPassos: 1 } as unknown as Attempt;
      const { service } = criarContexto({ tentativa, llmService });

      await expect(
        service.registrarPasso('user-1', 'tentativa-1', {
          tipo: 'justificativa_aluno',
          conteudo: 'minha justificativa',
        }),
      ).rejects.toBe(erro);
    });

    it('resolução (desistir): LlmTransientError do papel "hint" propaga intacto, sem fallback neutro', async () => {
      const erro = new LlmTransientError('Falha ao obter saída válida do papel "hint" após 2 tentativas: timeout');
      const llmService = {
        completar: jest.fn().mockRejectedValue(erro),
      };
      const tentativa = { id: 'tentativa-1', questionId: 'questao-1', userId: 'user-1', estado: 'aberta', nPassos: 3 } as unknown as Attempt;
      const { service } = criarContexto({ tentativa, llmService, maximoPassos: 3 });

      await expect(service.desistir('user-1', 'tentativa-1')).rejects.toBe(erro);
    });

    it('dica intermediária (não resolução): falha do LLM ainda cai no fallback neutro, não propaga', async () => {
      const tentativa = { id: 'tentativa-1', questionId: 'questao-1', userId: 'user-1', estado: 'aberta', nPassos: 1 } as unknown as Attempt;
      const passosExistentes = [
        { numero: 1, tipo: 'pedido_justificativa', conteudo: 'x', chunksMostrados: [] } as unknown as AttemptStep,
      ];
      // avaliacao precisa suceder (insuficiente) para cair no ramo de dica.
      const llmComAvaliacao = {
        completar: jest.fn((papel: string) =>
          papel === 'avaliacao'
            ? Promise.resolve({ suficiente: false })
            : Promise.reject(new LlmTransientError('timeout')),
        ),
      };
      const { service, passosSalvos } = criarContexto({
        tentativa,
        passosExistentes,
        llmService: llmComAvaliacao,
      });

      await service.registrarPasso('user-1', 'tentativa-1', {
        tipo: 'justificativa_aluno',
        conteudo: 'minha justificativa',
      });

      const passoDica = passosSalvos.find((p) => p.tipo === 'dica_conceitual')!;
      expect(passoDica.conteudo).toBe('Tente reformular sua resposta com base no que leu.');
    });
  });
});
