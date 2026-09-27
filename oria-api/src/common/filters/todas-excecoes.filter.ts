import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class TodasExcecoesFilter implements ExceptionFilter {
  private readonly logger = new Logger(TodasExcecoesFilter.name);

  catch(excecao: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      excecao instanceof HttpException
        ? excecao.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        excecao instanceof Error ? excecao.stack : String(excecao),
      );
    }

    response.status(status).json({
      ...this.montarCorpo(excecao),
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  /**
   * Preserva o corpo original da exceção quando ele é um objeto estruturado
   * (ex.: o `HealthCheckError` do Terminus, com `info`/`error`/`details` por
   * indicador) em vez de reduzir tudo a uma string genérica.
   */
  private montarCorpo(excecao: unknown): Record<string, unknown> {
    if (!(excecao instanceof HttpException)) {
      return { message: 'Erro interno do servidor' };
    }

    const resposta = excecao.getResponse();

    if (typeof resposta === 'string') {
      return { message: resposta };
    }

    if (resposta && typeof resposta === 'object') {
      return resposta as Record<string, unknown>;
    }

    return { message: excecao.message };
  }
}
