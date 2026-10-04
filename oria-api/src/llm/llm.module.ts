import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmCall } from './entities/llm-call.entity';
import { LlmService } from './llm.service';

@Module({
  imports: [TypeOrmModule.forFeature([LlmCall])],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
