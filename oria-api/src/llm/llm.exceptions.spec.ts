import { HttpStatus } from '@nestjs/common';
import { LlmPermanenteError, LlmTransientError } from './llm.exceptions';

describe('LlmTransientError', () => {
  it('é 503, retryable, e preserva a mensagem original', () => {
    const erro = new LlmTransientError('falhou após 2 tentativas: timeout');

    expect(erro.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(erro.message).toBe('falhou após 2 tentativas: timeout');
    expect(erro.getResponse()).toMatchObject({
      message: 'falhou após 2 tentativas: timeout',
      codigo: 'LLM_TRANSIENTE',
      retryable: true,
    });
  });
});

describe('LlmPermanenteError', () => {
  it('é 502, não-retryable, e preserva a mensagem original', () => {
    const erro = new LlmPermanenteError('falhou após 2 tentativas: schema inválido');

    expect(erro.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    expect(erro.message).toBe('falhou após 2 tentativas: schema inválido');
    expect(erro.getResponse()).toMatchObject({
      message: 'falhou após 2 tentativas: schema inválido',
      codigo: 'LLM_PERMANENTE',
      retryable: false,
    });
  });
});
