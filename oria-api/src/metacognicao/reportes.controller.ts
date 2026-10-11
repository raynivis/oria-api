import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/jwt-payload.interface';
import { CriarReporteDto } from './dto/criar-reporte.dto';
import { ReporteSaidaDto } from './dto/reporte-saida.dto';
import { ReportesService } from './reportes.service';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Post()
  criar(
    @Body() dto: CriarReporteDto,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<ReporteSaidaDto> {
    return this.reportesService.criar(usuarioAtual.id, dto);
  }
}

@Controller('me/reportes')
export class MeReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get()
  listar(@UsuarioAtual() usuarioAtual: UsuarioAutenticado): Promise<ReporteSaidaDto[]> {
    return this.reportesService.listarMinhas(usuarioAtual.id);
  }
}
