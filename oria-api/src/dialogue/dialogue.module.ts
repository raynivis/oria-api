import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Section } from '../catalog/entities/section.entity';
import { LlmModule } from '../llm/llm.module';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { MeSessoesController, SessoesController } from './dialogue.controller';
import { DialogueService } from './dialogue.service';
import { Message } from './entities/message.entity';
import { Session } from './entities/session.entity';
import { HistoricoController } from './historico.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Message, Section]), LlmModule, RetrievalModule],
  controllers: [SessoesController, MeSessoesController, HistoricoController],
  providers: [DialogueService],
})
export class DialogueModule {}
