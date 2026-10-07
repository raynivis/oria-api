import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/jwt-payload.interface';
import { ProgressoSaidaDto } from './dto/progresso-saida.dto';
import { RegistrarEventosDto } from './dto/registrar-eventos.dto';
import { TelemetryService } from './telemetry.service';

@Controller('eventos')
export class EventosController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post()
  registrar(
    @Body() dto: RegistrarEventosDto,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<{ recebidos: number; gravados: number }> {
    return this.telemetryService.registrarLote(usuarioAtual.id, dto.eventos);
  }
}

@Controller('me/progresso')
export class MeProgressoController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Get()
  obter(@UsuarioAtual() usuarioAtual: UsuarioAutenticado): Promise<ProgressoSaidaDto> {
    return this.telemetryService.progresso(usuarioAtual.id);
  }
}
