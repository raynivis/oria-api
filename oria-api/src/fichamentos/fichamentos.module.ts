import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Section } from '../catalog/entities/section.entity';
import { LlmModule } from '../llm/llm.module';
import { FichamentosController } from './fichamentos.controller';
import { FichamentosService } from './fichamentos.service';
import { GerarFichamentoController } from './gerar-fichamento.controller';
import { MeFichamentosController } from './me-fichamentos.controller';
import { Fichamento } from './entities/fichamento.entity';
import { FichamentoVersao } from './entities/fichamento-versao.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Fichamento, FichamentoVersao, Section]),
    LlmModule,
  ],
  controllers: [
    GerarFichamentoController,
    FichamentosController,
    MeFichamentosController,
  ],
  providers: [FichamentosService],
})
export class FichamentosModule {}
