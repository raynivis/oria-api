import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { EmbeddingsService } from './embeddings.service';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

function criarConfigService(dimensao: number): ConfigService {
  const valores: Record<string, string | number> = {
    EMBEDDINGS_URL: 'http://embeddings.local',
    EMBEDDINGS_DIM: dimensao,
  };
  return { get: (chave: string) => valores[chave] } as unknown as ConfigService;
}

describe('EmbeddingsService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('valida a dimensão no onModuleInit quando o servidor concorda', async () => {
    axiosMock.post.mockResolvedValue({ data: [Array.from({ length: 768 }, () => 0)] });
    const service = new EmbeddingsService(criarConfigService(768));

    await expect(service.onModuleInit()).resolves.toBeUndefined();
  });

  it('derruba o boot com mensagem clara quando a dimensão diverge', async () => {
    axiosMock.post.mockResolvedValue({ data: [Array.from({ length: 768 }, () => 0)] });
    const service = new EmbeddingsService(criarConfigService(384));

    await expect(service.onModuleInit()).rejects.toThrow(
      /EMBEDDINGS_DIM está configurado como 384/,
    );
  });

  it('embedPassages aplica o prefixo "passage: " a cada texto', async () => {
    axiosMock.post.mockResolvedValue({
      data: [
        [1, 2],
        [3, 4],
      ],
    });
    const service = new EmbeddingsService(criarConfigService(2));

    await service.embedPassages(['um texto', 'outro texto']);

    expect(axiosMock.post).toHaveBeenCalledWith('http://embeddings.local/embed', {
      inputs: ['passage: um texto', 'passage: outro texto'],
    });
  });

  it('embedQuery aplica o prefixo "query: " e retorna um único vetor', async () => {
    axiosMock.post.mockResolvedValue({ data: [[5, 6]] });
    const service = new EmbeddingsService(criarConfigService(2));

    const vetor = await service.embedQuery('minha pergunta');

    expect(axiosMock.post).toHaveBeenCalledWith('http://embeddings.local/embed', {
      inputs: ['query: minha pergunta'],
    });
    expect(vetor).toEqual([5, 6]);
  });
});
