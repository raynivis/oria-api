import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { EmbeddingsHealthIndicator } from './indicators/embeddings.health-indicator';
import { PostgresHealthIndicator } from './indicators/postgres.health-indicator';
import { RedisHealthIndicator } from './indicators/redis.health-indicator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly postgres: PostgresHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly embeddings: EmbeddingsHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  verificar() {
    return this.health.check([
      () => this.postgres.isHealthy('postgres'),
      () => this.redis.isHealthy('redis'),
      () => this.embeddings.isHealthy('embeddings'),
    ]);
  }
}
