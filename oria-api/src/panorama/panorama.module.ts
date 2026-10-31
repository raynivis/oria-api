import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Section } from '../catalog/entities/section.entity';
import { LlmModule } from '../llm/llm.module';
import { Panorama } from './entities/panorama.entity';
import { PanoramaController } from './panorama.controller';
import { PanoramaService } from './panorama.service';

@Module({
  imports: [TypeOrmModule.forFeature([Panorama, Section]), LlmModule],
  controllers: [PanoramaController],
  providers: [PanoramaService],
})
export class PanoramaModule {}
