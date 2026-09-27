import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [ConfigModule, HealthModule, EmbeddingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
