import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import axios from 'axios';

@Injectable()
export class EmbeddingsHealthIndicator extends HealthIndicator {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await axios.get(
        `${this.configService.get<string>('EMBEDDINGS_URL')}/health`,
        { timeout: 3000 },
      );
      return this.getStatus(key, true);
    } catch (erro) {
      throw new HealthCheckError(
        'Falha na verificação do servidor de embeddings',
        this.getStatus(key, false, {
          mensagem: erro instanceof Error ? erro.message : 'erro desconhecido',
        }),
      );
    }
  }
}
