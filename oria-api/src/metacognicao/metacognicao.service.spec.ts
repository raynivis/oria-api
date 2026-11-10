import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { Section } from '../catalog/entities/section.entity';
import { Metacognicao } from './entities/metacognicao.entity';
import { MetacognicaoService } from './metacognicao.service';

function criarConfigService(): ConfigService {
  const valores: Record<string, number> = {
    METACOG_CONFIANCA_MIN: 70,
    METACOG_PASSOS_MIN: 2.5,
  };
  return { get: (chave: string) => valores[chave] } as unknown as ConfigService;
}

/** Fake que distingue pela SQL — `registrar`/`listarDaSecao`/`listarMinhas`
 * passaram a emitir mais de uma consulta depois dos itens 3.1/3.6 (média de
 * passos + situação de questões da rodada mais recente). */
function criarDataSource(opts: {
  media?: number | null;
  ultimoSet?: { id: string } | null;
  contagem?: { total: number; concluidas: number };
}): DataSource {
  const query = jest.fn((sql: string) => {
    if (sql.includes('AVG(t."nPassos")')) {
      return Promise.resolve([{ media: opts.media ?? null }]);
    }
    if (sql.includes('FROM question_sets')) {
      return Promise.resolve(opts.ultimoSet ? [opts.ultimoSet] : []);
    }
    if (sql.includes('FROM questions q')) {
      return Promise.resolve([opts.contagem ?? { total: 0, concluidas: 0 }]);
    }
    throw new Error(`SQL inesperado no fake de DataSource: ${sql}`);
  });
  return { query } as unknown as DataSource;
}

const SECAO: Partial<Section> = { id: 'secao-1', titulo: 'Capítulo 1' };
const SEM_RODADA = { ultimoSet: null };
const RODADA_CONCLUIDA = { ultimoSet: { id: 'set-1' }, contagem: { total: 5, concluidas: 5 } };

describe('MetacognicaoService', () => {
  it('confiança alta com média de passos alta grava sinalizouIlusao=true e observação', async () => {
    const metacognicoesRepository = {
      save: jest.fn((dados) => Promise.resolve({ ...dados, id: 'meta-1' })),
      create: jest.fn((dados) => dados),
    } as unknown as Repository<Metacognicao>;
    const sectionsRepository = {
      findOneBy: jest.fn().mockResolvedValue(SECAO),
    } as unknown as Repository<Section>;

    const service = new MetacognicaoService(
      criarDataSource({ media: 3, ...RODADA_CONCLUIDA }),
      metacognicoesRepository,
      sectionsRepository,
      criarConfigService(),
    );

    const resultado = await service.registrar('aluno-1', 'secao-1', {
      oQueAprendi: 'x',
      oQueDuvido: 'y',
      confianca: 85,
    });

    expect(resultado.sinalizouIlusao).toBe(true);
    expect(resultado.observacaoIa).toContain('85%');
    expect(resultado.observacaoIa).toContain('Capítulo 1');
    expect(metacognicoesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ sinalizouIlusao: true }),
    );
  });

  it('confiança baixa com a mesma média de passos não sinaliza e não gera observação', async () => {
    const metacognicoesRepository = {
      save: jest.fn((dados) => Promise.resolve({ ...dados, id: 'meta-2' })),
      create: jest.fn((dados) => dados),
    } as unknown as Repository<Metacognicao>;
    const sectionsRepository = {
      findOneBy: jest.fn().mockResolvedValue(SECAO),
    } as unknown as Repository<Section>;

    const service = new MetacognicaoService(
      criarDataSource({ media: 3, ...RODADA_CONCLUIDA }),
      metacognicoesRepository,
      sectionsRepository,
      criarConfigService(),
    );

    const resultado = await service.registrar('aluno-1', 'secao-1', {
      oQueAprendi: 'x',
      oQueDuvido: 'y',
      confianca: 40,
    });

    expect(resultado.sinalizouIlusao).toBe(false);
    expect(resultado.observacaoIa).toBeNull();
  });

  it('sem tentativa encerrada na seção, média de passos é 0 (não inventa dado)', async () => {
    const metacognicoesRepository = {
      save: jest.fn((dados) => Promise.resolve({ ...dados, id: 'meta-3' })),
      create: jest.fn((dados) => dados),
    } as unknown as Repository<Metacognicao>;
    const sectionsRepository = {
      findOneBy: jest.fn().mockResolvedValue(SECAO),
    } as unknown as Repository<Section>;

    const service = new MetacognicaoService(
      criarDataSource({ media: null, ...SEM_RODADA }),
      metacognicoesRepository,
      sectionsRepository,
      criarConfigService(),
    );

    const resultado = await service.registrar('aluno-1', 'secao-1', {
      oQueAprendi: 'x',
      oQueDuvido: 'y',
      confianca: 95,
    });

    expect(resultado.sinalizouIlusao).toBe(false);
  });

  it('erra com 404 se a seção não existe', async () => {
    const metacognicoesRepository = {} as unknown as Repository<Metacognicao>;
    const sectionsRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
    } as unknown as Repository<Section>;

    const service = new MetacognicaoService(
      criarDataSource({ media: 0, ...SEM_RODADA }),
      metacognicoesRepository,
      sectionsRepository,
      criarConfigService(),
    );

    await expect(
      service.registrar('aluno-1', 'nao-existe', { oQueAprendi: 'x', oQueDuvido: 'y', confianca: 50 }),
    ).rejects.toThrow(NotFoundException);
  });

  describe('situação de questões da rodada mais recente (itens 3.1/3.6)', () => {
    function montarServicoPara(dataSource: DataSource): MetacognicaoService {
      const metacognicoesRepository = {
        save: jest.fn((dados) => Promise.resolve({ ...dados, id: 'meta-x' })),
        create: jest.fn((dados) => dados),
      } as unknown as Repository<Metacognicao>;
      const sectionsRepository = {
        findOneBy: jest.fn().mockResolvedValue(SECAO),
      } as unknown as Repository<Section>;
      return new MetacognicaoService(
        dataSource,
        metacognicoesRepository,
        sectionsRepository,
        criarConfigService(),
      );
    }

    it('nenhuma rodada gerada ainda: semDadosDeComparacao=true, questoesFaltando=0', async () => {
      const service = montarServicoPara(criarDataSource({ media: 0, ...SEM_RODADA }));

      const resultado = await service.registrar('aluno-1', 'secao-1', {
        oQueAprendi: 'x',
        oQueDuvido: 'y',
        confianca: 50,
      });

      expect(resultado.semDadosDeComparacao).toBe(true);
      expect(resultado.questoesFaltando).toBe(0);
    });

    it('rodada gerada, nenhuma tentativa concluída: semDadosDeComparacao=true, questoesFaltando=total', async () => {
      const service = montarServicoPara(
        criarDataSource({
          media: 0,
          ultimoSet: { id: 'set-1' },
          contagem: { total: 5, concluidas: 0 },
        }),
      );

      const resultado = await service.registrar('aluno-1', 'secao-1', {
        oQueAprendi: 'x',
        oQueDuvido: 'y',
        confianca: 50,
      });

      expect(resultado.semDadosDeComparacao).toBe(true);
      expect(resultado.questoesFaltando).toBe(5);
    });

    it('rodada com algumas concluídas: semDadosDeComparacao=false, questoesFaltando=restantes', async () => {
      const service = montarServicoPara(
        criarDataSource({
          media: 1,
          ultimoSet: { id: 'set-1' },
          contagem: { total: 5, concluidas: 2 },
        }),
      );

      const resultado = await service.registrar('aluno-1', 'secao-1', {
        oQueAprendi: 'x',
        oQueDuvido: 'y',
        confianca: 50,
      });

      expect(resultado.semDadosDeComparacao).toBe(false);
      expect(resultado.questoesFaltando).toBe(3);
    });

    it('rodada totalmente concluída: semDadosDeComparacao=false, questoesFaltando=0', async () => {
      const service = montarServicoPara(criarDataSource({ media: 1, ...RODADA_CONCLUIDA }));

      const resultado = await service.registrar('aluno-1', 'secao-1', {
        oQueAprendi: 'x',
        oQueDuvido: 'y',
        confianca: 50,
      });

      expect(resultado.semDadosDeComparacao).toBe(false);
      expect(resultado.questoesFaltando).toBe(0);
    });
  });
});
