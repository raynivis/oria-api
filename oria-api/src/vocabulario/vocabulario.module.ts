import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Section } from '../catalog/entities/section.entity';
import { LlmModule } from '../llm/llm.module';
import { VocabularioController } from './vocabulario.controller';
import { VocabularioService } from './vocabulario.service';

@Module({
  imports: [TypeOrmModule.forFeature([Section]), LlmModule],
  controllers: [VocabularioController],
  providers: [VocabularioService],
})
export class VocabularioModule {}
