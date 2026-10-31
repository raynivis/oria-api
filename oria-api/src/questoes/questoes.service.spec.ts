import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Chunk } from '../catalog/entities/chunk.entity';
import { Section } from '../catalog/entities/section.entity';
import { ConceitosService } from './conceitos.service';
import { Attempt } from './entities/attempt.entity';
import { QuestionSet } from './entities/question-set.entity';
import { LlmService } from '../llm/llm.service';
import { QuestoesService } from './questoes.service';

const SECTION_ID = 'secao-1';
const CONCEITO_A = '11111111-1111-4111-8111-111111111111';
const CONCEITO_B = '22222222-2222-4222-8222-222222222222';
const CONCEITOS_DA_SECAO = [
  { id: CONCEITO_A, nome: 'Conceito A', descricaoCurta: 'descrição a' },
  { id: CONCEITO_B, nome: 'Conceito B', descricaoCurta: 'descrição b' },
];

function criarManagerFalso() {
  const questoesCriadas: Array<{ conceitos: Array<{ id: string }> }> = [];
  const manager = {
    create: jest.fn((_entidade: unknown, dados: Record<string, unknown>) => {
      if (dados.conceitos) {
        questoesCriadas.push(dados as never);
      }
      return dados;
    }),
    save: jest.fn((dados: unknown) =>
      Promise.resolve(
        Array.isArray(dados) ? dados : { ...(dados as Record<string, unknown>), id: 'conjunto-1' },
      ),
    ),
  } as unknown as EntityManager;
  return { manager, questoesCriadas };
}

describe('QuestoesService.gerarConjunto', () => {
  function montarServico(opts: {
    llmService: Partial<LlmService>;
    manager: EntityManager;
    conjuntoSalvo?: unknown;
    attemptsRepository?: Partial<Repository<Attempt>>;
  }) {
    const dataSource = {
      transaction: jest.fn((callback: (m: EntityManager) => unknown) => callback(opts.manager)),
    } as unknown as DataSource;
    const conceitosService = {
      listarDaSecao: jest.fn().mockResolvedValue(CONCEITOS_DA_SECAO),
    } as unknown as ConceitosService;
    const configService = { get: () => 'modelo-de-teste' } as unknown as ConfigService;
    const sectionsRepository = {
      findOneBy: jest.fn().mockResolvedValue({
        id: SECTION_ID,
        titulo: 'Seção',
        textoCompleto: 'texto',
      }),
    } as unknown as Repository<Section>;
    const chunksRepository = {
      find: jest.fn().mockResolvedValue([]),
    } as unknown as Repository<Chunk>;
    const conjuntosRepository = {
      findOne: jest.fn().mockResolvedValue(
        opts.conjuntoSalvo ?? {
          id: 'conjunto-1',
          sectionId: SECTION_ID,
          criadoEm: new Date(),
          questoes: [],
        },
      ),
    } as unknown as Repository<QuestionSet>;

    const attemptsRepository = (opts.attemptsRepository ?? {
      find: jest.fn().mockResolvedValue([]),
    }) as unknown as Repository<Attempt>;

    return new QuestoesService(
      dataSource,
      conceitosService,
      opts.llmService as LlmService,
      configService,
      sectionsRepository,
      chunksRepository,
      conjuntosRepository,
      attemptsRepository,
    );
  }

  it('aceita o UUID completo do conceito sem alteração', async () => {
    const { manager, questoesCriadas } = criarManagerFalso();
    const llmService = {
      completar: jest.fn().mockResolvedValue({
        questoes: [
          {
            enunciado: 'Pergunta 1',
            respostaReferencia: 'Resposta 1',
            conceitoIds: [CONCEITO_A],
            trechosFonte: [],
          },
        ],
      }),
    };
    const service = montarServico({ llmService, manager });

    await service.gerarConjunto('user-1', SECTION_ID);

    expect(questoesCriadas[0].conceitos).toEqual([{ id: CONCEITO_A }]);
  });

  it('resolve um id truncado pro primeiro segmento do UUID (observado num modelo real)', async () => {
    const { manager, questoesCriadas } = criarManagerFalso();
    const llmService = {
      completar: jest.fn().mockResolvedValue({
        questoes: [
          {
            enunciado: 'Pergunta 1',
            respostaReferencia: 'Resposta 1',
            conceitoIds: [CONCEITO_A.split('-')[0]], // "11111111"
            trechosFonte: [],
          },
        ],
      }),
    };
    const service = montarServico({ llmService, manager });

    await service.gerarConjunto('user-1', SECTION_ID);

    expect(questoesCriadas[0].conceitos).toEqual([{ id: CONCEITO_A }]);
  });

  it('descarta uma questão cujo id de conceito não resolve de nenhuma forma', async () => {
    const { manager, questoesCriadas } = criarManagerFalso();
    const llmService = {
      completar: jest.fn().mockResolvedValue({
        questoes: [
          {
            enunciado: 'Questão com id bom',
            respostaReferencia: 'r',
            conceitoIds: [CONCEITO_A],
            trechosFonte: [],
          },
          {
            enunciado: 'Questão com id inventado',
            respostaReferencia: 'r',
            conceitoIds: ['nao-existe'],
            trechosFonte: [],
          },
        ],
      }),
    };
    const service = montarServico({ llmService, manager });

    await service.gerarConjunto('user-1', SECTION_ID);

    expect(questoesCriadas).toHaveLength(1);
    expect(questoesCriadas[0].conceitos).toEqual([{ id: CONCEITO_A }]);
  });

  it('erra com 503 se nenhuma questão sobra com conceito resolvido', async () => {
    const { manager } = criarManagerFalso();
    const llmService = {
      completar: jest.fn().mockResolvedValue({
        questoes: [
          {
            enunciado: 'Questão órfã',
            respostaReferencia: 'r',
            conceitoIds: ['nao-existe'],
            trechosFonte: [],
          },
        ],
      }),
    };
    const service = montarServico({ llmService, manager });

    await expect(service.gerarConjunto('user-1', SECTION_ID)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('erra com 404 se a seção não existe', async () => {
    const dataSource = { transaction: jest.fn() } as unknown as DataSource;
    const conceitosService = { listarDaSecao: jest.fn() } as unknown as ConceitosService;
    const configService = { get: () => 'modelo' } as unknown as ConfigService;
    const sectionsRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
    } as unknown as Repository<Section>;
    const chunksRepository = {} as unknown as Repository<Chunk>;
    const conjuntosRepository = {} as unknown as Repository<QuestionSet>;
    const attemptsRepository = {} as unknown as Repository<Attempt>;
    const servicoSemSecao = new QuestoesService(
      dataSource,
      conceitosService,
      { completar: jest.fn() } as unknown as LlmService,
      configService,
      sectionsRepository,
      chunksRepository,
      conjuntosRepository,
      attemptsRepository,
    );

    await expect(servicoSemSecao.gerarConjunto('user-1', 'nao-existe')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('erra com 400 se algum conceitoId pedido não pertence à seção', async () => {
    const { manager } = criarManagerFalso();
    const service = montarServico({ llmService: { completar: jest.fn() }, manager });

    await expect(
      service.gerarConjunto('user-1', SECTION_ID, ['id-de-outra-secao']),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('QuestoesService.listarMeusConjuntos', () => {
  const LIVRO_1 = 'livro-1';
  const LIVRO_2 = 'livro-2';

  function montarServicoDeListagem(opts: {
    conjuntos: unknown[];
    secoes: unknown[];
    tentativas: unknown[];
  }) {
    const dataSource = {} as unknown as DataSource;
    const conceitosService = {} as unknown as ConceitosService;
    const llmService = {} as unknown as LlmService;
    const configService = {} as unknown as ConfigService;
    const sectionsRepository = {
      find: jest.fn().mockResolvedValue(opts.secoes),
    } as unknown as Repository<Section>;
    const chunksRepository = {} as unknown as Repository<Chunk>;
    const conjuntosRepository = {
      find: jest.fn().mockResolvedValue(opts.conjuntos),
    } as unknown as Repository<QuestionSet>;
    const attemptsRepository = {
      find: jest.fn().mockResolvedValue(opts.tentativas),
    } as unknown as Repository<Attempt>;

    return new QuestoesService(
      dataSource,
      conceitosService,
      llmService,
      configService,
      sectionsRepository,
      chunksRepository,
      conjuntosRepository,
      attemptsRepository,
    );
  }

  it('sem nenhum conjunto, devolve lista vazia', async () => {
    const service = montarServicoDeListagem({ conjuntos: [], secoes: [], tentativas: [] });

    const resultado = await service.listarMeusConjuntos('user-1');

    expect(resultado).toEqual([]);
  });

  it('questão sem tentativa fica pendente; questão com tentativa reaproveita o estado dela', async () => {
    const service = montarServicoDeListagem({
      conjuntos: [
        {
          id: 'conjunto-1',
          sectionId: 'secao-1',
          criadoEm: new Date('2026-01-01'),
          questoes: [
            { id: 'questao-1', ordem: 0, enunciado: 'Pergunta 1' },
            { id: 'questao-2', ordem: 1, enunciado: 'Pergunta 2' },
          ],
        },
      ],
      secoes: [
        { id: 'secao-1', titulo: 'Seção 1', bookId: LIVRO_1, livro: { titulo: 'Livro 1' } },
      ],
      tentativas: [
        { id: 'tentativa-1', questionId: 'questao-2', estado: 'resolvida', criadaEm: new Date('2026-01-02') },
      ],
    });

    const [conjunto] = await service.listarMeusConjuntos('user-1');

    expect(conjunto.questoes).toEqual([
      { id: 'questao-1', enunciado: 'Pergunta 1', tentativaId: null, estado: 'pendente' },
      { id: 'questao-2', enunciado: 'Pergunta 2', tentativaId: 'tentativa-1', estado: 'resolvida' },
    ]);
  });

  it('com mais de uma tentativa na mesma questão, usa a mais recente', async () => {
    const service = montarServicoDeListagem({
      conjuntos: [
        {
          id: 'conjunto-1',
          sectionId: 'secao-1',
          criadoEm: new Date(),
          questoes: [{ id: 'questao-1', ordem: 0, enunciado: 'Pergunta 1' }],
        },
      ],
      secoes: [
        { id: 'secao-1', titulo: 'Seção 1', bookId: LIVRO_1, livro: { titulo: 'Livro 1' } },
      ],
      // já vem ordenado DESC por criadaEm, como o repositório real devolveria
      tentativas: [
        { id: 'tentativa-recente', questionId: 'questao-1', estado: 'em_passos', criadaEm: new Date('2026-02-01') },
        { id: 'tentativa-antiga', questionId: 'questao-1', estado: 'abandonada', criadaEm: new Date('2026-01-01') },
      ],
    });

    const [conjunto] = await service.listarMeusConjuntos('user-1');

    expect(conjunto.questoes[0]).toEqual({
      id: 'questao-1',
      enunciado: 'Pergunta 1',
      tentativaId: 'tentativa-recente',
      estado: 'em_passos',
    });
  });

  it('filtra por livroId, excluindo conjuntos de outros livros', async () => {
    const service = montarServicoDeListagem({
      conjuntos: [
        { id: 'conjunto-1', sectionId: 'secao-1', criadoEm: new Date(), questoes: [] },
        { id: 'conjunto-2', sectionId: 'secao-2', criadoEm: new Date(), questoes: [] },
      ],
      secoes: [
        { id: 'secao-1', titulo: 'Seção 1', bookId: LIVRO_1, livro: { titulo: 'Livro 1' } },
        { id: 'secao-2', titulo: 'Seção 2', bookId: LIVRO_2, livro: { titulo: 'Livro 2' } },
      ],
      tentativas: [],
    });

    const resultado = await service.listarMeusConjuntos('user-1', LIVRO_1);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe('conjunto-1');
    expect(resultado[0].livroId).toBe(LIVRO_1);
  });
});
