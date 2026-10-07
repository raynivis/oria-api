import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Section } from '../catalog/entities/section.entity';
import { EventosController, MeProgressoController } from './eventos.controller';
import { ReadingEvent } from './entities/reading-event.entity';
import { TelemetryService } from './telemetry.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReadingEvent, Section])],
  controllers: [EventosController, MeProgressoController],
  providers: [TelemetryService],
})
export class TelemetryModule {}
