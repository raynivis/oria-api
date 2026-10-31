import type { StatusReporte } from '../entities/error-report.entity';

export class ReporteSaidaDto {
  id: string;
  alvoTipo: string;
  alvoId: string;
  descricao: string;
  status: StatusReporte;
  criadoEm: Date;
}
