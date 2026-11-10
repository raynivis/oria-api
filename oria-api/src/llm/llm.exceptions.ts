import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Falha de rede, limite de taxa ou indisponibilidade do provedor — repetir a
 * mesma chamada mais tarde pode funcionar. O LlmCall de cada tentativa já
 * fica registrado antes desta exceção subir (CLAUDE.md regra 5).
 */
export class LlmTransientError extends HttpException {
  constructor(mensagem: string) {
    super(
      { message: mensagem, codigo: 'LLM_TRANSIENTE', retryable: true },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

/**
 * Falha que não se resolve tentando de novo com a mesma entrada: erro 4xx do
 * provedor fora de limite de taxa, ou saída que nunca valida contra o schema
 * depois das tentativas de retry.
 */
export class LlmPermanenteError extends HttpException {
  constructor(mensagem: string) {
    super(
      { message: mensagem, codigo: 'LLM_PERMANENTE', retryable: false },
      HttpStatus.BAD_GATEWAY,
    );
  }
}
