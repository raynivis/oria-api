import type { Response } from 'express';

/** Eventos da Fase 8: token, citacao, fim e erro. */
export class EscritorSse {
  constructor(private readonly resposta: Response) {}

  token(texto: string): void {
    this.emitir('token', { texto });
  }

  citacao(dados: {
    chunkId: string;
    trecho: string;
    ancoraCfi: string;
    secaoTitulo: string;
  }): void {
    this.emitir('citacao', dados);
  }

  fim(messageId: string, encontrouBase: boolean): void {
    this.emitir('fim', { messageId, encontrouBase });
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
