import { BadRequestException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Section } from '../catalog/entities/section.entity';
import { EventoDto } from './dto/registrar-eventos.dto';
import { ReadingEvent } from './entities/reading-event.entity';
import { TelemetryService } from './telemetry.service';

const SECAO_ID = '11111111-1111-4111-8111-111111111111';

function criarLote(quantidade: number): EventoDto[] {
  return Array.from({ length: quantidade }, (_, indice) => ({
    tipo: 'rolou',
    sectionId: SECAO_ID,
    criadoEm: new Date(Date.UTC(2026, 9, 6, 12, 0, indice)).toISOString(),
  }));
}

function criarDataSource(linhasGravadas: unknown[]) {
  const builder: Record<'insert' | 'into' | 'values' | 'orIgnore' | 'returning' | 'execute', jest.Mock> = {
    insert: jest.fn(() => builder),
    into: jest.fn(() => builder),
    values: jest.fn(() => builder),
    orIgnore: jest.fn(() => builder),
    returning: jest.fn(() => builder),
    execute: jest.fn(() => Promise.resolve({ raw: linhasGravadas })),
  };
  const manager = { createQueryBuilder: jest.fn(() => builder) };
  const dataSource = {
    transaction: jest.fn((callback: (m: unknown) => Promise<unknown>) =>
      callback(manager),
    ),
    query: jest.fn(),
  } as unknown as DataSource;
  return { dataSource, builder, manager };
}

function criarSectionsRepository(encontradas: number): Repository<Section> {
  return { count: jest.fn().mockResolvedValue(encontradas) } as unknown as Repository<Section>;
}

describe('TelemetryService', () => {
  describe('registrarLote', () => {
    it('grava um lote de 50 eventos numa única transação, ignorando conflitos', async () => {
      const lote = criarLote(50);
      const linhas = Array.from({ length: 50 }, () => ({ id: 'x' }));
      const { dataSource, builder } = criarDataSource(linhas);
      const service = new TelemetryService(dataSource, criarSectionsRepository(1));

      const resultado = await service.registrarLote('aluno-1', lote);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(builder.into).toHaveBeenCalledWith(ReadingEvent);
      expect(builder.values).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: 'aluno-1', tipo: 'rolou', sectionId: SECAO_ID }),
        ]),
      );
      expect((builder.values as jest.Mock).mock.calls[0][0]).toHaveLength(50);
      expect(builder.orIgnore).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({ recebidos: 50, gravados: 50 });
    });

    it('reenvio do mesmo lote não duplica: gravados volta a zero quando tudo conflita', async () => {
      const { dataSource } = criarDataSource([]);
      const service = new TelemetryService(dataSource, criarSectionsRepository(1));

      const resultado = await service.registrarLote('aluno-1', criarLote(50));

      expect(resultado).toEqual({ recebidos: 50, gravados: 0 });
    });

    it('trunca criadoEm ao segundo, para a chave de idempotência', async () => {
      const { dataSource, builder } = criarDataSource([]);
      const service = new TelemetryService(dataSource, criarSectionsRepository(1));

      await service.registrarLote('aluno-1', [
        { tipo: 'abriu', sectionId: SECAO_ID, criadoEm: '2026-10-06T12:00:00.789Z' },
      ]);

      const [linhas] = (builder.values as jest.Mock).mock.calls[0] as [
        Array<{ criadoEm: Date }>,
      ];
      expect(linhas[0].criadoEm.toISOString()).toBe('2026-10-06T12:00:00.000Z');
    });

    it('lote com sectionId inexistente é recusado antes de abrir transação', async () => {
      const { dataSource } = criarDataSource([]);
      const service = new TelemetryService(dataSource, criarSectionsRepository(0));

      await expect(service.registrarLote('aluno-1', criarLote(1))).rejects.toThrow(
        BadRequestException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('evento sem sectionId grava com sectionId nulo', async () => {
      const { dataSource, builder } = criarDataSource([{ id: 'x' }]);
      const service = new TelemetryService(dataSource, criarSectionsRepository(0));

      await service.registrarLote('aluno-1', [
        { tipo: 'registrou_metacognicao', criadoEm: '2026-10-06T12:00:00Z' },
      ]);

      const [linhas] = (builder.values as jest.Mock).mock.calls[0] as [
        Array<{ sectionId: string | null }>,
      ];
      expect(linhas[0].sectionId).toBeNull();
    });
  });

  describe('progresso — ultimaSecaoLida (item 1.4)', () => {
    function criarSectionsRepositoryComSecao(secao: { id: string; titulo: string; bookId: string } | null) {
      return { findOneBy: jest.fn().mockResolvedValue(secao) } as unknown as Repository<Section>;
    }

    it('sem nenhum evento "abriu", devolve null', async () => {
      const { dataSource } = criarDataSource([]);
      (dataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ n: 0 }])
        .mockResolvedValueOnce([{ total: 0, comEdicaoDoAluno: 0 }])
        .mockResolvedValueOnce([]);
      const service = new TelemetryService(dataSource, criarSectionsRepositoryComSecao(null));

      const resultado = await service.progresso('aluno-1');

      expect(resultado.ultimaSecaoLida).toBeNull();
    });

    it('a seção do evento "abriu" mais recente por criadoEm vence', async () => {
      const { dataSource } = criarDataSource([]);
      (dataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ n: 2 }])
        .mockResolvedValueOnce([{ total: 0, comEdicaoDoAluno: 0 }])
        .mockResolvedValueOnce([{ sectionId: SECAO_ID }]);
      const sectionsRepository = criarSectionsRepositoryComSecao({
        id: SECAO_ID,
        titulo: 'Seção mais recente',
        bookId: 'livro-1',
      });
      const service = new TelemetryService(dataSource, sectionsRepository);

      const resultado = await service.progresso('aluno-1');

      expect(resultado.ultimaSecaoLida).toEqual({
        sectionId: SECAO_ID,
        tituloSecao: 'Seção mais recente',
        livroId: 'livro-1',
      });
      const [sql] = (dataSource.query as jest.Mock).mock.calls[2];
      expect(sql).toMatch(/ORDER BY "criadoEm" DESC/);
    });
  });
});
