import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chunk } from '../catalog/entities/chunk.entity';
import { Section } from '../catalog/entities/section.entity';
import { LlmModule } from '../llm/llm.module';
import { ConceitosService } from './conceitos.service';
import { MeConceitosController, SecaoConceitosController } from './conceitos.controller';
import { Conceito } from './entities/conceito.entity';
import { QuestionSet } from './entities/question-set.entity';
import { Question } from './entities/question.entity';
import { Attempt } from './entities/attempt.entity';
import { AttemptStep } from './entities/attempt-step.entity';
import { ConjuntosController, GerarQuestoesController } from './questoes.controller';
import { QuestoesService } from './questoes.service';
import { IniciarTentativaController, TentativasController } from './tentativas.controller';
import { TentativasService } from './tentativas.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Conceito,
      QuestionSet,
      Question,
      Attempt,
      AttemptStep,
      Section,
      Chunk,
    ]),
    LlmModule,
  ],
  controllers: [
    SecaoConceitosController,
    MeConceitosController,
    GerarQuestoesController,
    ConjuntosController,
    IniciarTentativaController,
    TentativasController,
  ],
  providers: [ConceitosService, QuestoesService, TentativasService],
})
export class QuestoesModule {}
