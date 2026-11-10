import type { Response } from 'express';
import type { SugestaoRecusa } from './dialogue.types';

/** Eventos da Fase 8: token, citacao, fim e erro. */
export class EscritorSse {
  constructor(private readonly resposta: Response) {}

  token(texto: string): void {
    this.emitir('token', { texto });
  }

  citacao(dados: {
    chunkId: string;
    sectionId: string;
    trecho: string;
    ancoraCfi: string;
    secaoTitulo: string;
  }): void {
    this.emitir('citacao', dados);
  }

  /** `sugestoes` (item 1.1): só não-vazio quando `fim` fecha uma recusa sem
   * nenhuma base encontrada. Aditivo — sempre presente no payload, `[]` fora
   * desse caso. */
  fim(messageId: string, encontrouBase: boolean, sugestoes: SugestaoRecusa[] = []): void {
    this.emitir('fim', { messageId, encontrouBase, sugestoes });
  }

  erro(mensagem: string): void {
    this.emitir('erro', { mensagem });
  }

  private emitir(evento: string, dados: unknown): void {
    if (this.resposta.writableEnded) {
      return;
    }
    this.resposta.write(`event: ${evento}\ndata: ${JSON.stringify(dados)}\n\n`);
  }
}
