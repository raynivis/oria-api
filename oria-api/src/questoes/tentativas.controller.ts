import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/jwt-payload.interface';
import { IniciarTentativaDto } from './dto/iniciar-tentativa.dto';
import { PassoTentativaDto } from './dto/passo-tentativa.dto';
import { TentativaSaidaDto } from './dto/tentativa-saida.dto';
import { TentativasService } from './tentativas.service';

@Controller('questoes')
export class IniciarTentativaController {
  constructor(private readonly tentativasService: TentativasService) {}

  @Post(':id/tentativas')
  iniciar(
    @Param('id') questaoId: string,
    @Body() dto: IniciarTentativaDto,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<TentativaSaidaDto> {
    return this.tentativasService.iniciar(usuarioAtual.id, questaoId, dto);
  }
}

@Controller('tentativas')
export class TentativasController {
  constructor(private readonly tentativasService: TentativasService) {}

  @Post(':id/passos')
  registrarPasso(
    @Param('id') tentativaId: string,
    @Body() dto: PassoTentativaDto,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<TentativaSaidaDto> {
    return this.tentativasService.registrarPasso(usuarioAtual.id, tentativaId, dto);
  }

  @Post(':id/desistir')
  @HttpCode(HttpStatus.OK)
  desistir(
    @Param('id') tentativaId: string,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<TentativaSaidaDto> {
    return this.tentativasService.desistir(usuarioAtual.id, tentativaId);
  }

  @Get(':id')
  obter(
    @Param('id') tentativaId: string,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<TentativaSaidaDto> {
    return this.tentativasService.obter(usuarioAtual.id, tentativaId);
  }
}
