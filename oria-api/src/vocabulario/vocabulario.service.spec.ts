import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { LlmService } from '../llm/llm.service';
import { Section } from '../catalog/entities/section.entity';
import { VocabularioService } from './vocabulario.service';

function criarConfigService(): ConfigService {
  return { get: () => 'modelo-de-teste' } as unknown as ConfigService;
}

describe('VocabularioService (item 1.9)', () => {
  it('chama o papel "vocabulario" com termo/trecho/tituloSecao e devolve a saída', async () => {
    const secao: Partial<Section> = { id: 'secao-1', titulo: 'Seção 1' };
    const sectionsRepository = {
      findOneBy: jest.fn().mockResolvedValue(secao),
    } as unknown as Repository<Section>;
    const llmService = {
      completar: jest.fn().mockResolvedValue({ conteudo: 'pista no trecho' }),
    } as unknown as LlmService;

    const service = new VocabularioService(sectionsRepository, llmService, criarConfigService());

    const resultado = await service.explicar('secao-1', { termo: 'educomunicação', trecho: 'trecho X' });

    expect(llmService.completar).toHaveBeenCalledWith(
      'vocabulario',
      { termo: 'educomunicação', trecho: 'trecho X', tituloSecao: 'Seção 1' },
      expect.anything(),
    );
    expect(resultado).toEqual({
      conteudo: 'pista no trecho',
      promptVersao: 1,
      modelo: 'modelo-de-teste',
    });
  });

  it('erra com 404 se a seção não existe', async () => {
    const sectionsRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
    } as unknown as Repository<Section>;
    const llmService = { completar: jest.fn() } as unknown as LlmService;

    const service = new VocabularioService(sectionsRepository, llmService, criarConfigService());

    await expect(
      service.explicar('nao-existe', { termo: 'x', trecho: 'y' }),
    ).rejects.toThrow(NotFoundException);
    expect(llmService.completar).not.toHaveBeenCalled();
  });
});
