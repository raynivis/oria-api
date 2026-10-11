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

function criarDataSource(media: number | null): DataSource {
  return { query: jest.fn().mockResolvedValue([{ media }]) } as unknown as DataSource;
}

const SECAO: Partial<Section> = { id: 'secao-1', titulo: 'Capítulo 1' };

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
      criarDataSource(3),
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
      criarDataSource(3),
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
      criarDataSource(null),
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
      criarDataSource(0),
      metacognicoesRepository,
      sectionsRepository,
      criarConfigService(),
    );

    await expect(
      service.registrar('aluno-1', 'nao-existe', { oQueAprendi: 'x', oQueDuvido: 'y', confianca: 50 }),
    ).rejects.toThrow(NotFoundException);
  });
});
