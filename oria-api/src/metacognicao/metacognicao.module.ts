import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Section } from '../catalog/entities/section.entity';
import { ErrorReport } from './entities/error-report.entity';
import { Metacognicao } from './entities/metacognicao.entity';
import {
  MeMetacognicaoController,
  SecaoMetacognicaoController,
} from './metacognicao.controller';
import { MetacognicaoService } from './metacognicao.service';
import { MeReportesController, ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Metacognicao, ErrorReport, Section])],
  controllers: [
    SecaoMetacognicaoController,
    MeMetacognicaoController,
    ReportesController,
    MeReportesController,
  ],
  providers: [MetacognicaoService, ReportesService],
})
export class MetacognicaoModule {}
