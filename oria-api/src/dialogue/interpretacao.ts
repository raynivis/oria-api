import { RECUSA_SEM_BASE } from '../prompts/templates/dialogue';

export interface ResultadoInterpretacao {
  encontrouBase: boolean;
  chunksCitados: string[];
}

/**
 * Recusa sem base é decidida duas vezes: antes do LLM, pela recuperação vazia
 * (regra 2 do CLAUDE.md), e depois, se o modelo devolver a frase exata de recusa.
 * Citações são os marcadores `[n]` do texto, mapeados para os chunks na ordem
 * em que foram numerados no prompt.
 */
export function interpretarResposta(
  texto: string,
  chunkIds: string[],
): ResultadoInterpretacao {
  if (chunkIds.length === 0 || texto.includes(RECUSA_SEM_BASE)) {
    return { encontrouBase: false, chunksCitados: [] };
  }

  const citados: string[] = [];
  for (const marcador of texto.matchAll(/\[(\d+)\]/g)) {
    const chunkId = chunkIds[Number(marcador[1]) - 1];
    if (chunkId && !citados.includes(chunkId)) {
      citados.push(chunkId);
    }
  }

  return { encontrouBase: true, chunksCitados: citados };
}
