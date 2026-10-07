import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { z } from 'zod';
import { LlmService } from './llm.service';
import { LlmCall } from './entities/llm-call.entity';
import { PapelLlm } from './llm.types';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

function criarConfigService(): ConfigService {
  const valores: Record<string, string> = {
    OPENROUTER_BASE_URL: 'https://openrouter.test/api/v1',
    OPENROUTER_API_KEY: 'chave-de-teste',
    LLM_PANORAMA_MODEL: 'modelo-de-teste',
  };
  return { get: (chave: string) => valores[chave] } as unknown as ConfigService;
}

function criarRepositorioFalso() {
  const linhasSalvas: Partial<LlmCall>[] = [];
  const repositorio = {
    create: (dados: Partial<LlmCall>) => dados,
    save: jest.fn((dados: Partial<LlmCall>) => {
      linhasSalvas.push(dados);
      return Promise.resolve(dados);
    }),
  } as unknown as Repository<LlmCall>;
  return { repositorio, linhasSalvas };
}

function respostaOpenRouter(conteudo: string, usage = { prompt_tokens: 10, completion_tokens: 20, cost: 0 }) {
  return { data: { choices: [{ message: { content: conteudo } }], usage } };
}

const schemaTeste = z.object({ ok: z.boolean() });

describe('LlmService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('retorna os dados validados e grava um único LlmCall de sucesso', async () => {
    axiosMock.post.mockResolvedValue(respostaOpenRouter('{"ok": true}'));
    const { repositorio, linhasSalvas } = criarRepositorioFalso();
    const service = new LlmService(criarConfigService(), repositorio);

    const resultado = await service.completar(
      'panorama',
      { tituloLivro: 'L', tituloSecao: 'S', textoSecao: 'T' },
      schemaTeste,
    );

    expect(resultado).toEqual({ ok: true });
    expect(linhasSalvas).toHaveLength(1);
    expect(linhasSalvas[0]).toMatchObject({
      papel: 'panorama',
      modelo: 'modelo-de-teste',
      sucesso: true,
      tokensIn: 10,
      tokensOut: 20,
    });
  });

  it('tenta de novo em falha de schema e usa o resultado da segunda tentativa', async () => {
    axiosMock.post
      .mockResolvedValueOnce(respostaOpenRouter('{"ok": "não é booleano"}'))
      .mockResolvedValueOnce(respostaOpenRouter('{"ok": true}'));
    const { repositorio, linhasSalvas } = criarRepositorioFalso();
    const service = new LlmService(criarConfigService(), repositorio);

    const resultado = await service.completar(
      'panorama',
      { tituloLivro: 'L', tituloSecao: 'S', textoSecao: 'T' },
      schemaTeste,
    );

    expect(resultado).toEqual({ ok: true });
    expect(axiosMock.post).toHaveBeenCalledTimes(2);
    expect(linhasSalvas).toHaveLength(2);
    expect(linhasSalvas[0].sucesso).toBe(false);
    expect(linhasSalvas[1].sucesso).toBe(true);
  });

  it('erra após a segunda falha de schema, com as duas tentativas registradas', async () => {
    axiosMock.post.mockResolvedValue(respostaOpenRouter('{"ok": "nunca é booleano"}'));
    const { repositorio, linhasSalvas } = criarRepositorioFalso();
    const service = new LlmService(criarConfigService(), repositorio);

    await expect(
      service.completar(
        'panorama',
        { tituloLivro: 'L', tituloSecao: 'S', textoSecao: 'T' },
        schemaTeste,
      ),
    ).rejects.toThrow(/após 2 tentativas/);

    expect(axiosMock.post).toHaveBeenCalledTimes(2);
    expect(linhasSalvas).toHaveLength(2);
    expect(linhasSalvas.every((linha) => linha.sucesso === false)).toBe(true);
  });

  it('trata erro de rede como tentativa falha e registra o LlmCall mesmo assim', async () => {
    axiosMock.post
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValueOnce(respostaOpenRouter('{"ok": true}'));
    const { repositorio, linhasSalvas } = criarRepositorioFalso();
    const service = new LlmService(criarConfigService(), repositorio);

    const resultado = await service.completar(
      'panorama',
      { tituloLivro: 'L', tituloSecao: 'S', textoSecao: 'T' },
      schemaTeste,
    );

    expect(resultado).toEqual({ ok: true });
    expect(linhasSalvas[0].tokensIn).toBe(0);
    expect(linhasSalvas[0].custo).toBe(0);
  });

  it('aceita ```json cercado por markdown na saída', async () => {
    axiosMock.post.mockResolvedValue(
      respostaOpenRouter('```json\n{"ok": true}\n```'),
    );
    const { repositorio } = criarRepositorioFalso();
    const service = new LlmService(criarConfigService(), repositorio);

    const resultado = await service.completar(
      'panorama',
      { tituloLivro: 'L', tituloSecao: 'S', textoSecao: 'T' },
      schemaTeste,
    );

    expect(resultado).toEqual({ ok: true });
  });

  it('repassa temperature/seed/provider ao OpenRouter e grava no LlmCall', async () => {
    axiosMock.post.mockResolvedValue(respostaOpenRouter('{"ok": true}'));
    const { repositorio, linhasSalvas } = criarRepositorioFalso();
    const service = new LlmService(criarConfigService(), repositorio);

    await service.completar(
      'panorama',
      { tituloLivro: 'L', tituloSecao: 'S', textoSecao: 'T' },
      schemaTeste,
      { temperature: 0, seed: 42, provider: 'algum-provedor' },
    );

    const corpoEnviado = axiosMock.post.mock.calls[0][1] as Record<string, unknown>;
    expect(corpoEnviado.temperature).toBe(0);
    expect(corpoEnviado.seed).toBe(42);
    expect(corpoEnviado.provider).toEqual({
      order: ['algum-provedor'],
      allow_fallbacks: false,
    });
    expect(linhasSalvas[0]).toMatchObject({
      temperatura: 0,
      seed: 42,
      provider: 'algum-provedor',
    });
  });

  it('erra com mensagem clara para papel sem template registrado', async () => {
    const { repositorio } = criarRepositorioFalso();
    const service = new LlmService(criarConfigService(), repositorio);

    await expect(
      service.completar('inexistente' as PapelLlm, {}, schemaTeste),
    ).rejects.toThrow(/Nenhum template de prompt registrado/);
  });
});
