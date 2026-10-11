import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminApiKeyGuard } from '../ingestion/guards/admin-api-key.guard';
import { LlmCall } from '../llm/entities/llm-call.entity';
import { CodigoCego } from './entities/codigo-cego.entity';
import { Execucao } from './entities/execucao.entity';
import { Pontuacao } from './entities/pontuacao.entity';
import { Saida } from './entities/saida.entity';
import { Tarefa } from './entities/tarefa.entity';
import { MetricasController } from './metricas.controller';

/**
 * Só o pedaço da Fase 10 que é API de verdade: o endpoint de métricas que a
 * Avaliação C consome durante a demonstração. As entidades de validação e os
 * scripts de `scripts/validacao/` não passam pela API — rodam via `ts-node`,
 * fora do processo do produto (VALIDATION.md §4: "implemente como script, não
 * endpoint").
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([LlmCall, Execucao, Tarefa, Saida, CodigoCego, Pontuacao]),
  ],
  controllers: [MetricasController],
  providers: [AdminApiKeyGuard],
})
export class ValidacaoModule {}
