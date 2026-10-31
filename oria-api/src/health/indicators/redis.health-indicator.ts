import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const cliente = new Redis(this.configService.get<string>('REDIS_URL')!, {
      lazyConnect: true,
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });

    try {
      await cliente.connect();
      await cliente.ping();
      return this.getStatus(key, true);
    } catch (erro) {
      throw new HealthCheckError(
        'Falha na verificação do Redis',
        this.getStatus(key, false, {
          mensagem: erro instanceof Error ? erro.message : 'erro desconhecido',
        }),
      );
    } finally {
      cliente.disconnect();
    }
  }
}
