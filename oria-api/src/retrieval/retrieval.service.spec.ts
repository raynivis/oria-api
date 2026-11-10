import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Chunk } from '../catalog/entities/chunk.entity';
import { Section } from '../catalog/entities/section.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { RetrievalService } from './retrieval.service';

function criarConfigService(): ConfigService {
  const valores: Record<string, number> = { RETRIEVAL_LIMIAR: 0.82, RETRIEVAL_TOP_K: 6 };
  return { get: (chave: string) => valores[chave] } as unknown as ConfigService;
}

const SECAO_ATUAL: Partial<Section> = { id: 'secao-3', bookId: 'livro-1', ordem: 3 };

describe('RetrievalService (item 1.1)', () => {
  it('por padrão, restringe a busca a "s.ordem <= $3" (seção atual e anteriores)', async () => {
    const sectionsRepository = {
      findOneBy: jest.fn().mockResolvedValue(SECAO_ATUAL),
    } as unknown as Repository<Section>;
    const chunksRepository = { query: jest.fn().mockResolvedValue([]) } as unknown as Repository<Chunk>;
    const embeddingsService = {
      embedQuery: jest.fn().mockResolvedValue([0.1, 0.2]),
    } as unknown as EmbeddingsService;

    const service = new RetrievalService(
      sectionsRepository,
      chunksRepository,
      embeddingsService,
      criarConfigService(),
    );

    await service.buscar('secao-3', 'pergunta qualquer');

    const [sql] = (chunksRepository.query as jest.Mock).mock.calls[0];
    expect(sql).toMatch(/s\.ordem <= \$3/);
  });

  it('com ignorarLimiteDeOrdem, remove a restrição de ordem e busca no livro inteiro', async () => {
    const sectionsRepository = {
      findOneBy: jest.fn().mockResolvedValue(SECAO_ATUAL),
    } as unknown as Repository<Section>;
    const chunksRepository = { query: jest.fn().mockResolvedValue([]) } as unknown as Repository<Chunk>;
    const embeddingsService = {
      embedQuery: jest.fn().mockResolvedValue([0.1, 0.2]),
    } as unknown as EmbeddingsService;

    const service = new RetrievalService(
      sectionsRepository,
      chunksRepository,
      embeddingsService,
      criarConfigService(),
    );

    await service.buscar('secao-3', 'pergunta qualquer', { ignorarLimiteDeOrdem: true });

    const [sql, parametros] = (chunksRepository.query as jest.Mock).mock.calls[0];
    expect(sql).not.toMatch(/ordem/);
    expect(parametros).toHaveLength(4);
  });

  it('erra com 404 se a seção não existe', async () => {
    const sectionsRepository = { findOneBy: jest.fn().mockResolvedValue(null) } as unknown as Repository<Section>;
    const chunksRepository = { query: jest.fn() } as unknown as Repository<Chunk>;
    const embeddingsService = { embedQuery: jest.fn() } as unknown as EmbeddingsService;

    const service = new RetrievalService(
      sectionsRepository,
      chunksRepository,
      embeddingsService,
      criarConfigService(),
    );

    await expect(service.buscar('nao-existe', 'x')).rejects.toThrow(NotFoundException);
  });
});
