import { RECUSA_SEM_BASE } from '../prompts/templates/dialogue';
import { interpretarResposta } from './interpretacao';

const CHUNKS = ['chunk-a', 'chunk-b', 'chunk-c'];

describe('interpretarResposta', () => {
  it('sem chunks recuperados, é recusa independentemente do texto', () => {
    expect(interpretarResposta('Qualquer coisa [1]', [])).toEqual({
      encontrouBase: false,
      chunksCitados: [],
    });
  });

  it('a frase exata de recusa do modelo vira encontrouBase false, mesmo com chunks', () => {
    expect(interpretarResposta(RECUSA_SEM_BASE, CHUNKS)).toEqual({
      encontrouBase: false,
      chunksCitados: [],
    });
  });

  it('marcadores [n] viram ids na ordem da primeira menção, sem repetir', () => {
    const texto = 'Primeiro [2], depois [1] e de novo [2].';
    expect(interpretarResposta(texto, CHUNKS)).toEqual({
      encontrouBase: true,
      chunksCitados: ['chunk-b', 'chunk-a'],
    });
  });

  it('marcador fora da faixa dos chunks é ignorado', () => {
    expect(interpretarResposta('Veja [9] e [3].', CHUNKS)).toEqual({
      encontrouBase: true,
      chunksCitados: ['chunk-c'],
    });
  });

  it('resposta com base e sem marcadores não inventa citação', () => {
    expect(interpretarResposta('Resposta sem marcadores.', CHUNKS)).toEqual({
      encontrouBase: true,
      chunksCitados: [],
    });
  });
});
