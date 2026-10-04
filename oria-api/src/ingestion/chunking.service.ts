import { Injectable } from '@nestjs/common';

export interface TrechoDividido {
  texto: string;
  tokens: number;
}

const LIMITE_TOKENS_POR_CHUNK = 500;

@Injectable()
export class ChunkingService {
  /**
   * Agrupa parágrafos (separados por linha em branco) até ~500 tokens por
   * chunk, sem nunca partir um parágrafo ao meio. Um parágrafo sozinho maior
   * que o limite vira um chunk único, fora do limite — preferível a
   * fragmentar o parágrafo.
   *
   * Sem tokenizer real disponível: estima tokens por ~4 caracteres, uma
   * aproximação comum para prosa em português/inglês.
   */
  dividir(texto: string): TrechoDividido[] {
    const paragrafos = texto
      .split(/\n\s*\n/)
      .map((paragrafo) => paragrafo.trim())
      .filter((paragrafo) => paragrafo.length > 0);

    const chunks: TrechoDividido[] = [];
    let paragrafosAtuais: string[] = [];
    let tokensAtuais = 0;

    const fecharChunkAtual = () => {
      if (paragrafosAtuais.length === 0) {
        return;
      }
      chunks.push({
        texto: paragrafosAtuais.join('\n\n'),
        tokens: tokensAtuais,
      });
      paragrafosAtuais = [];
      tokensAtuais = 0;
    };

    for (const paragrafo of paragrafos) {
      const tokensParagrafo = this.estimarTokens(paragrafo);

      if (
        paragrafosAtuais.length > 0 &&
        tokensAtuais + tokensParagrafo > LIMITE_TOKENS_POR_CHUNK
      ) {
        fecharChunkAtual();
      }

      paragrafosAtuais.push(paragrafo);
      tokensAtuais += tokensParagrafo;
    }

    fecharChunkAtual();

    return chunks;
  }

  private estimarTokens(texto: string): number {
    return Math.max(1, Math.ceil(texto.length / 4));
  }
}
