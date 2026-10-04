import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { Chunk } from './entities/chunk.entity';
import { Section } from './entities/section.entity';
import { LivrosController } from './livros.controller';
import { LivrosService } from './livros.service';
import { SecoesController } from './secoes.controller';
import { SecoesService } from './secoes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Book, Section, Chunk])],
  controllers: [LivrosController, SecoesController],
  providers: [LivrosService, SecoesService],
  exports: [LivrosService, SecoesService, TypeOrmModule],
})
export class CatalogModule {}
