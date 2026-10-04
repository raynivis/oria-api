import { ChunkingService } from './chunking.service';

describe('ChunkingService', () => {
  const service = new ChunkingService();

  it('agrupa parágrafos curtos num único chunk', () => {
    const texto = ['Parágrafo um.', 'Parágrafo dois.', 'Parágrafo três.'].join(
      '\n\n',
    );

    const chunks = service.dividir(texto);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].texto).toBe(texto);
  });

  it('divide em vários chunks quando o texto passa do limite de tokens', () => {
    const paragrafoGrande = 'palavra '.repeat(400); // ~800 tokens estimados
    const texto = [paragrafoGrande, paragrafoGrande, paragrafoGrande].join(
      '\n\n',
    );

    const chunks = service.dividir(texto);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.texto.split('\n\n')).toHaveLength(1);
    }
  });

  it('nunca parte um parágrafo ao meio, mesmo sozinho acima do limite', () => {
    const paragrafoEnorme = 'palavra '.repeat(1000);

    const chunks = service.dividir(paragrafoEnorme);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].texto).toBe(paragrafoEnorme.trim());
  });

  it('ignora linhas em branco e espaços nas bordas', () => {
    const chunks = service.dividir('  \n\n  Único parágrafo.  \n\n  ');

    expect(chunks).toHaveLength(1);
    expect(chunks[0].texto).toBe('Único parágrafo.');
  });

  it('retorna lista vazia para texto vazio', () => {
    expect(service.dividir('')).toEqual([]);
  });
});
