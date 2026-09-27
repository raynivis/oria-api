import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { Client } from 'pg';

@Injectable()
export class PostgresHealthIndicator extends HealthIndicator {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const client = new Client({
      connectionString: this.configService.get<string>('DATABASE_URL'),
      connectionTimeoutMillis: 3000,
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
      return this.getStatus(key, true);
    } catch (erro) {
      throw new HealthCheckError(
        'Falha na verificação do Postgres',
        this.getStatus(key, false, {
          mensagem: erro instanceof Error ? erro.message : 'erro desconhecido',
        }),
      );
    } finally {
      await client.end().catch(() => undefined);
    }
  }
}
