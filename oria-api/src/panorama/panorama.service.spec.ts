import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { LlmService } from '../llm/llm.service';
import { Section } from '../catalog/entities/section.entity';
import { Book } from '../catalog/entities/book.entity';
import { Panorama } from './entities/panorama.entity';
import { PanoramaService } from './panorama.service';

function criarConfigService(): ConfigService {
  return {
    get: () => 'modelo-de-teste',
  } as unknown as ConfigService;
}

const SAIDA_LLM = {
  niveis: [
    { rotulo: 'Ideia mais geral', titulo: 'T1', texto: 'texto 1' },
    { rotulo: 'Mecanismo central', titulo: 'T2', texto: 'texto 2' },
    { rotulo: 'Consequência', titulo: 'T3', texto: 'texto 3' },
    { rotulo: 'Casos específicos', titulo: 'T4', texto: 'texto 4' },
  ],
  tempoEstimadoMin: 5,
};

describe('PanoramaService', () => {
  it('na primeira chamada, gera pelo LLM e persiste', async () => {
    const panoramasRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((dados) => dados),
      save: jest.fn((dados) => Promise.resolve({ ...dados })),
    } as unknown as Repository<Panorama>;

    const secao: Partial<Section> = {
      id: 'secao-1',
      titulo: 'Seção 1',
      textoCompleto: 'Texto completo da seção.',
      livro: { titulo: 'Livro X' } as Book,
    };
    const sectionsRepository = {
      findOne: jest.fn().mockResolvedValue(secao),
    } as unknown as Repository<Section>;

    const llmService = {
      completar: jest.fn().mockResolvedValue(SAIDA_LLM),
    } as unknown as LlmService;

    const service = new PanoramaService(
      panoramasRepository,
      sectionsRepository,
      llmService,
      criarConfigService(),
    );

    const resultado = await service.obterOuGerar('secao-1');

    expect(llmService.completar).toHaveBeenCalledTimes(1);
    expect(llmService.completar).toHaveBeenCalledWith(
      'panorama',
      {
        tituloLivro: 'Livro X',
        tituloSecao: 'Seção 1',
        textoSecao: 'Texto completo da seção.',
      },
      expect.anything(),
    );
    expect(resultado.niveis).toEqual(SAIDA_LLM.niveis);
    expect(resultado.tempoEstimadoMin).toBe(5);
    expect(panoramasRepository.save).toHaveBeenCalledTimes(1);
  });

  it('na segunda chamada, vem do cache sem tocar no LLM', async () => {
    const panoramaExistente: Partial<Panorama> = {
      sectionId: 'secao-1',
      niveis: SAIDA_LLM.niveis,
      tempoEstimadoMin: 5,
    };
    const panoramasRepository = {
      findOneBy: jest.fn().mockResolvedValue(panoramaExistente),
    } as unknown as Repository<Panorama>;
    const sectionsRepository = {} as unknown as Repository<Section>;
    const llmService = {
      completar: jest.fn(),
    } as unknown as LlmService;

    const service = new PanoramaService(
      panoramasRepository,
      sectionsRepository,
      llmService,
      criarConfigService(),
    );

    const resultado = await service.obterOuGerar('secao-1');

    expect(llmService.completar).not.toHaveBeenCalled();
    expect(resultado.niveis).toEqual(SAIDA_LLM.niveis);
  });

  it('erra com 404 se a seção não existe', async () => {
    const panoramasRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
    } as unknown as Repository<Panorama>;
    const sectionsRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    } as unknown as Repository<Section>;
    const llmService = { completar: jest.fn() } as unknown as LlmService;

    const service = new PanoramaService(
      panoramasRepository,
      sectionsRepository,
      llmService,
      criarConfigService(),
    );

    await expect(service.obterOuGerar('nao-existe')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('em corrida concorrente (unique violation ao salvar), devolve o que já foi gravado', async () => {
    const jaGravado: Partial<Panorama> = {
      sectionId: 'secao-1',
      niveis: SAIDA_LLM.niveis,
      tempoEstimadoMin: 5,
    };
    const panoramasRepository = {
      findOneBy: jest
        .fn()
        .mockResolvedValueOnce(null) // primeira checagem: ainda não existe
        .mockResolvedValueOnce(jaGravado), // depois do conflito: já existe
      create: jest.fn((dados) => dados),
      save: jest.fn().mockRejectedValue({ driverError: { code: '23505' } }),
    } as unknown as Repository<Panorama>;

    const secao: Partial<Section> = {
      id: 'secao-1',
      titulo: 'Seção 1',
      textoCompleto: 'Texto completo da seção.',
      livro: { titulo: 'Livro X' } as Book,
    };
    const sectionsRepository = {
      findOne: jest.fn().mockResolvedValue(secao),
    } as unknown as Repository<Section>;

    const llmService = {
      completar: jest.fn().mockResolvedValue(SAIDA_LLM),
    } as unknown as LlmService;

    const service = new PanoramaService(
      panoramasRepository,
      sectionsRepository,
      llmService,
      criarConfigService(),
    );

    const resultado = await service.obterOuGerar('secao-1');

    expect(resultado.niveis).toEqual(SAIDA_LLM.niveis);
  });
});
