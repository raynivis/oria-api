import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CriarReporteDto } from './dto/criar-reporte.dto';
import { ReporteSaidaDto } from './dto/reporte-saida.dto';
import { ErrorReport } from './entities/error-report.entity';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(ErrorReport)
    private readonly reportesRepository: Repository<ErrorReport>,
  ) {}

  async criar(userId: string, dto: CriarReporteDto): Promise<ReporteSaidaDto> {
    const reporte = await this.reportesRepository.save(
      this.reportesRepository.create({
        userId,
        alvoTipo: dto.alvoTipo,
        alvoId: dto.alvoId,
        descricao: dto.descricao,
        status: 'aberto',
      }),
    );
    return this.paraSaida(reporte);
  }

  async listarMinhas(userId: string): Promise<ReporteSaidaDto[]> {
    const reportes = await this.reportesRepository.find({
      where: { userId },
      order: { criadoEm: 'DESC' },
    });
    return reportes.map((r) => this.paraSaida(r));
  }

  private paraSaida(reporte: ErrorReport): ReporteSaidaDto {
    return {
      id: reporte.id,
      alvoTipo: reporte.alvoTipo,
      alvoId: reporte.alvoId,
      descricao: reporte.descricao,
      status: reporte.status,
      criadoEm: reporte.criadoEm,
    };
  }
}
