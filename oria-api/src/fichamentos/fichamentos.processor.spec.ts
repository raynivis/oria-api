import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { LlmService } from '../llm/llm.service';
import { Section } from '../catalog/entities/section.entity';
import { Fichamento } from './entities/fichamento.entity';
import { FichamentoVersao } from './entities/fichamento-versao.entity';
import { FichamentoJobData } from './fichamentos.constants';
import { FichamentosProcessor } from './fichamentos.processor';

function criarConfigService(): ConfigService {
  return { get: () => 'modelo-de-teste' } as unknown as ConfigService;
}

function criarJob(fichamentoId: string): Job<FichamentoJobData> {
  return { data: { fichamentoId } } as unknown as Job<FichamentoJobData>;
}

describe('FichamentosProcessor (item 2.5)', () => {
  it('sucesso: chama o LLM, grava a versão 1 e marca statusGeracao "pronto"', async () => {
    const fichamento: Partial<Fichamento> = {
      id: 'f1',
      sectionId: 'secao-1',
      trechoTexto: null,
      statusGeracao: 'pendente',
    };
    const fichamentosRepository = {
      findOneByOrFail: jest.fn().mockResolvedValue(fichamento),
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as Repository<Fichamento>;
    const versoesRepository = {
      create: jest.fn((dados) => dados),
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as Repository<FichamentoVersao>;
    const sectionsRepository = {
      findOneByOrFail: jest
        .fn()
        .mockResolvedValue({ id: 'secao-1', titulo: 'Seção 1', textoCompleto: 'Texto completo.' }),
    } as unknown as Repository<Section>;
    const llmService = {
      completar: jest.fn().mockResolvedValue({ conteudo: 'Conteúdo gerado.' }),
    } as unknown as LlmService;

    const processor = new FichamentosProcessor(
      fichamentosRepository,
      versoesRepository,
      sectionsRepository,
      llmService,
      criarConfigService(),
    );

    await processor.process(criarJob('f1'));

    expect(llmService.completar).toHaveBeenCalledWith(
      'fichamento',
      { tituloSecao: 'Seção 1', texto: 'Texto completo.' },
      expect.anything(),
    );
    expect(versoesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ fichamentoId: 'f1', numero: 1, origem: 'ia', conteudo: 'Conteúdo gerado.' }),
    );
    expect(fichamento.statusGeracao).toBe('pronto');
  });

  it('falha do LLM: marca statusGeracao "erro" com a mensagem, e relança', async () => {
    const fichamento: Partial<Fichamento> = {
      id: 'f1',
      sectionId: 'secao-1',
      trechoTexto: null,
      statusGeracao: 'pendente',
    };
    const fichamentosRepository = {
      findOneByOrFail: jest.fn().mockResolvedValue(fichamento),
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as Repository<Fichamento>;
    const versoesRepository = { create: jest.fn(), save: jest.fn() } as unknown as Repository<FichamentoVersao>;
    const sectionsRepository = {
      findOneByOrFail: jest
        .fn()
        .mockResolvedValue({ id: 'secao-1', titulo: 'Seção 1', textoCompleto: 'Texto completo.' }),
    } as unknown as Repository<Section>;
    const llmService = {
      completar: jest.fn().mockRejectedValue(new Error('falha simulada do LLM')),
    } as unknown as LlmService;

    const processor = new FichamentosProcessor(
      fichamentosRepository,
      versoesRepository,
      sectionsRepository,
      llmService,
      criarConfigService(),
    );

    await expect(processor.process(criarJob('f1'))).rejects.toThrow('falha simulada do LLM');

    expect(fichamento.statusGeracao).toBe('erro');
    expect(fichamento.erroMensagem).toBe('falha simulada do LLM');
    expect(versoesRepository.create).not.toHaveBeenCalled();
  });
});
