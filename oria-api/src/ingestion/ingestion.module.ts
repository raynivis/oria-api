import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../catalog/entities/book.entity';
import { Chunk } from '../catalog/entities/chunk.entity';
import { Section } from '../catalog/entities/section.entity';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { ChunkingService } from './chunking.service';
import { EpubParserService } from './epub-parser.service';
import { AdminApiKeyGuard } from './guards/admin-api-key.guard';
import { IngestionController } from './ingestion.controller';
import { FILA_INGESTAO } from './ingestion.constants';
import { IngestionProcessor } from './ingestion.processor';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, Section, Chunk]),
    BullModule.registerQueue({ name: FILA_INGESTAO }),
    EmbeddingsModule,
  ],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    IngestionProcessor,
    EpubParserService,
    ChunkingService,
    AdminApiKeyGuard,
  ],
  exports: [IngestionService],
})
export class IngestionModule {}
