import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { LlmService } from '../llm/llm.service';
import { Book } from '../catalog/entities/book.entity';
import { Section } from '../catalog/entities/section.entity';
import { Fichamento } from './entities/fichamento.entity';
import { FichamentoVersao } from './entities/fichamento-versao.entity';
import { FichamentosService } from './fichamentos.service';

function criarConfigService(): ConfigService {
  return { get: () => 'modelo-de-teste' } as unknown as ConfigService;
}

const CONTEUDO_IA =
  '## Ideia central\n\nTexto gerado pela IA com bastante conteúdo repetido para passar do mínimo de duzentos caracteres exigido pelo schema de validação do fichamento.';

function criarSecao(): Partial<Section> {
  return {
    id: 'secao-1',
    titulo: 'Seção 1',
    textoCompleto: 'Texto completo da seção.',
    bookId: 'livro-1',
    livro: { id: 'livro-1', titulo: 'Livro X' } as Book,
  };
}

describe('FichamentosService', () => {
  function montarServico(opts: {
    fichamentosRepository: Partial<Repository<Fichamento>>;
    versoesRepository?: Partial<Repository<FichamentoVersao>>;
    sectionsRepository?: Partial<Repository<Section>>;
    llmService?: Partial<LlmService>;
  }): FichamentosService {
    return new FichamentosService(
      opts.fichamentosRepository as Repository<Fichamento>,
      (opts.versoesRepository ?? {}) as Repository<FichamentoVersao>,
      (opts.sectionsRepository ?? {}) as Repository<Section>,
      (opts.llmService ?? {}) as LlmService,
      criarConfigService(),
    );
  }

  describe('gerarOuObter', () => {
    it('sem trecho, gera o fichamento da seção inteira e persiste a versão 1 com origem ia', async () => {
      const fichamentosRepository = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn((dados) => dados),
        save: jest.fn((dados) => Promise.resolve({ ...dados, id: 'fichamento-1' })),
      } as unknown as Repository<Fichamento>;
      const versoesRepository = {
        create: jest.fn((dados) => dados),
        save: jest.fn((dados) => Promise.resolve({ ...dados, id: 'versao-1' })),
      } as unknown as Repository<FichamentoVersao>;
      const sectionsRepository = {
        findOneBy: jest.fn().mockResolvedValue(criarSecao()),
      } as unknown as Repository<Section>;
      const llmService = {
        completar: jest.fn().mockResolvedValue({ conteudo: CONTEUDO_IA }),
      } as unknown as LlmService;

      const service = montarServico({
        fichamentosRepository,
        versoesRepository,
        sectionsRepository,
        llmService,
      });

      const resultado = await service.gerarOuObter('aluno-1', 'secao-1', {});

      expect(llmService.completar).toHaveBeenCalledWith(
        'fichamento',
        { tituloSecao: 'Seção 1', texto: 'Texto completo da seção.' },
        expect.anything(),
      );
      expect(versoesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ numero: 1, origem: 'ia' }),
      );
      expect(resultado.conteudo).toBe(CONTEUDO_IA);
      expect(resultado.numeroVersaoAtual).toBe(1);
      expect(resultado.origemVersaoAtual).toBe('ia');
      expect(resultado.trechoCfi).toBeNull();
    });

    it('com trechoCfi/trechoTexto, usa o trecho como entrada do prompt, não o texto da seção', async () => {
      const fichamentosRepository = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn((dados) => dados),
        save: jest.fn((dados) => Promise.resolve({ ...dados, id: 'fichamento-2' })),
      } as unknown as Repository<Fichamento>;
      const versoesRepository = {
        create: jest.fn((dados) => dados),
        save: jest.fn((dados) => Promise.resolve({ ...dados, id: 'versao-1' })),
      } as unknown as Repository<FichamentoVersao>;
      const sectionsRepository = {
        findOneBy: jest.fn().mockResolvedValue(criarSecao()),
      } as unknown as Repository<Section>;
      const llmService = {
        completar: jest.fn().mockResolvedValue({ conteudo: CONTEUDO_IA }),
      } as unknown as LlmService;

      const service = montarServico({
        fichamentosRepository,
        versoesRepository,
        sectionsRepository,
        llmService,
      });

      const resultado = await service.gerarOuObter('aluno-1', 'secao-1', {
        trechoCfi: 'epubcfi(/6/4!/4/2)',
        trechoTexto: 'Texto só do trecho selecionado.',
      });

      expect(llmService.completar).toHaveBeenCalledWith(
        'fichamento',
        { tituloSecao: 'Seção 1', texto: 'Texto só do trecho selecionado.' },
        expect.anything(),
      );
      expect(resultado.trechoCfi).toBe('epubcfi(/6/4!/4/2)');
    });

    it('chamando de novo com o mesmo recorte, devolve o fichamento existente sem tocar no LLM', async () => {
      const jaGravado: Partial<Fichamento> = {
        id: 'fichamento-1',
        userId: 'aluno-1',
        sectionId: 'secao-1',
        trechoCfi: null,
        versoes: [
          {
            numero: 1,
            conteudo: CONTEUDO_IA,
            origem: 'ia',
          } as FichamentoVersao,
        ],
      };
      const fichamentosRepository = {
        findOne: jest.fn().mockResolvedValue(jaGravado),
      } as unknown as Repository<Fichamento>;
      const llmService = { completar: jest.fn() } as unknown as LlmService;

      const service = montarServico({ fichamentosRepository, llmService });

      const resultado = await service.gerarOuObter('aluno-1', 'secao-1', {});

      expect(llmService.completar).not.toHaveBeenCalled();
      expect(resultado.conteudo).toBe(CONTEUDO_IA);
    });

    it('erra com 404 se a seção não existe', async () => {
      const fichamentosRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      } as unknown as Repository<Fichamento>;
      const sectionsRepository = {
        findOneBy: jest.fn().mockResolvedValue(null),
      } as unknown as Repository<Section>;
      const llmService = { completar: jest.fn() } as unknown as LlmService;

      const service = montarServico({
        fichamentosRepository,
        sectionsRepository,
        llmService,
      });

      await expect(
        service.gerarOuObter('aluno-1', 'nao-existe', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('em corrida concorrente (unique violation ao salvar), devolve o que já foi gravado', async () => {
      const jaGravado: Partial<Fichamento> = {
        id: 'fichamento-1',
        trechoCfi: null,
        versoes: [{ numero: 1, conteudo: CONTEUDO_IA, origem: 'ia' } as FichamentoVersao],
      };
      const fichamentosRepository = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(jaGravado),
        create: jest.fn((dados) => dados),
        save: jest.fn().mockRejectedValue({ driverError: { code: '23505' } }),
      } as unknown as Repository<Fichamento>;
      const sectionsRepository = {
        findOneBy: jest.fn().mockResolvedValue(criarSecao()),
      } as unknown as Repository<Section>;
      const llmService = {
        completar: jest.fn().mockResolvedValue({ conteudo: CONTEUDO_IA }),
      } as unknown as LlmService;

      const service = montarServico({
        fichamentosRepository,
        sectionsRepository,
        llmService,
      });

      const resultado = await service.gerarOuObter('aluno-1', 'secao-1', {});

      expect(resultado.conteudo).toBe(CONTEUDO_IA);
    });
  });

  describe('editar', () => {
    it('três PATCH sucessivos produzem as versões 2, 3 e 4, todas de origem aluno', async () => {
      const fichamento: Fichamento = {
        id: 'fichamento-1',
        userId: 'aluno-1',
        sectionId: 'secao-1',
        trechoCfi: null,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        versoes: [{ numero: 1, conteudo: CONTEUDO_IA, origem: 'ia' } as FichamentoVersao],
      };

      const fichamentosRepository = {
        findOne: jest.fn().mockResolvedValue(fichamento),
        save: jest.fn().mockResolvedValue(undefined),
      } as unknown as Repository<Fichamento>;
      const versoesRepository = {
        create: jest.fn((dados) => dados),
        save: jest.fn((dados) => Promise.resolve({ ...dados, id: `versao-${dados.numero}` })),
      } as unknown as Repository<FichamentoVersao>;

      const service = montarServico({ fichamentosRepository, versoesRepository });

      const r2 = await service.editar('aluno-1', 'fichamento-1', { conteudo: 'Edição 1' });
      expect(r2.numeroVersaoAtual).toBe(2);
      expect(r2.origemVersaoAtual).toBe('aluno');

      const r3 = await service.editar('aluno-1', 'fichamento-1', { conteudo: 'Edição 2' });
      expect(r3.numeroVersaoAtual).toBe(3);

      const r4 = await service.editar('aluno-1', 'fichamento-1', { conteudo: 'Edição 3' });
      expect(r4.numeroVersaoAtual).toBe(4);

      expect(versoesRepository.create).toHaveBeenCalledTimes(3);
      expect(
        (versoesRepository.create as jest.Mock).mock.calls.every(
          ([dados]: [{ origem: string }]) => dados.origem === 'aluno',
        ),
      ).toBe(true);
    });

    it('erra com 404 se o fichamento não existe ou não é do aluno', async () => {
      const fichamentosRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      } as unknown as Repository<Fichamento>;

      const service = montarServico({ fichamentosRepository });

      await expect(
        service.editar('aluno-1', 'nao-existe', { conteudo: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('elaboração (caracteresIa/caracteresAluno/proporcaoAluno)', () => {
    it('bate com contagem manual: rascunho sem edição tem proporcaoAluno 0', async () => {
      const fichamento: Partial<Fichamento> = {
        id: 'f1',
        trechoCfi: null,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        versoes: [{ numero: 1, conteudo: 'abcde', origem: 'ia' } as FichamentoVersao],
      };
      const fichamentosRepository = {
        findOne: jest.fn().mockResolvedValue(fichamento),
      } as unknown as Repository<Fichamento>;

      const service = montarServico({ fichamentosRepository });
      const resultado = await service.obterPorId('aluno-1', 'f1');

      expect(resultado.caracteresIa).toBe(5);
      expect(resultado.caracteresAluno).toBe(0);
      expect(resultado.proporcaoAluno).toBe(0);
    });

    it('bate com contagem manual: texto totalmente reescrito tem proporcaoAluno 1', async () => {
      const fichamento: Partial<Fichamento> = {
        id: 'f1',
        trechoCfi: null,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        versoes: [
          { numero: 1, conteudo: 'abcde', origem: 'ia' } as FichamentoVersao,
          { numero: 2, conteudo: 'xyz123', origem: 'aluno' } as FichamentoVersao,
        ],
      };
      const fichamentosRepository = {
        findOne: jest.fn().mockResolvedValue(fichamento),
      } as unknown as Repository<Fichamento>;

      const service = montarServico({ fichamentosRepository });
      const resultado = await service.obterPorId('aluno-1', 'f1');

      expect(resultado.caracteresIa).toBe(0);
      expect(resultado.caracteresAluno).toBe(6);
      expect(resultado.proporcaoAluno).toBe(1);
    });

    it('bate com contagem manual: edição parcial dá proporção intermediária', async () => {
      // "abcde" -> "abcXYe": mantém "ab" e "e" (3 chars da IA), troca "cd" por "XY" (2 chars do aluno)
      const fichamento: Partial<Fichamento> = {
        id: 'f1',
        trechoCfi: null,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        versoes: [
          { numero: 1, conteudo: 'abcde', origem: 'ia' } as FichamentoVersao,
          { numero: 2, conteudo: 'abXYe', origem: 'aluno' } as FichamentoVersao,
        ],
      };
      const fichamentosRepository = {
        findOne: jest.fn().mockResolvedValue(fichamento),
      } as unknown as Repository<Fichamento>;

      const service = montarServico({ fichamentosRepository });
      const resultado = await service.obterPorId('aluno-1', 'f1');

      expect(resultado.caracteresIa).toBe(3);
      expect(resultado.caracteresAluno).toBe(2);
      expect(resultado.proporcaoAluno).toBeCloseTo(2 / 5);
    });
  });

  describe('listarVersoes', () => {
    it('devolve o histórico completo em ordem, com origem registrada', async () => {
      const fichamento: Partial<Fichamento> = {
        id: 'f1',
        versoes: [
          { numero: 2, conteudo: 'v2', origem: 'aluno', criadoEm: new Date() } as FichamentoVersao,
          { numero: 1, conteudo: 'v1', origem: 'ia', criadoEm: new Date() } as FichamentoVersao,
        ],
      };
      const fichamentosRepository = {
        findOne: jest.fn().mockResolvedValue(fichamento),
      } as unknown as Repository<Fichamento>;

      const service = montarServico({ fichamentosRepository });
      const versoes = await service.listarVersoes('aluno-1', 'f1');

      expect(versoes.map((v) => v.numero)).toEqual([1, 2]);
      expect(versoes.map((v) => v.origem)).toEqual(['ia', 'aluno']);
    });
  });
});
