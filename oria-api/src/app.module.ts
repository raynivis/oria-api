import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CatalogModule } from './catalog/catalog.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { FichamentosModule } from './fichamentos/fichamentos.module';
import { HealthModule } from './health/health.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { PanoramaModule } from './panorama/panorama.module';
import { DialogueModule } from './dialogue/dialogue.module';
import { QuestoesModule } from './questoes/questoes.module';
import { QueueModule } from './queue/queue.module';
import { RetrievalModule } from './retrieval/retrieval.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    QueueModule,
    HealthModule,
    EmbeddingsModule,
    UsersModule,
    AuthModule,
    CatalogModule,
    IngestionModule,
    RetrievalModule,
    PanoramaModule,
    FichamentosModule,
    TelemetryModule,
    QuestoesModule,
    DialogueModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
