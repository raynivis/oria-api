import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chunk } from '../catalog/entities/chunk.entity';
import { Section } from '../catalog/entities/section.entity';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { RetrievalService } from './retrieval.service';

@Module({
  imports: [TypeOrmModule.forFeature([Section, Chunk]), EmbeddingsModule],
  providers: [RetrievalService],
  exports: [RetrievalService],
})
export class RetrievalModule {}
