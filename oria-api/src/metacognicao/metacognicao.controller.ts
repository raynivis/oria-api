import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/jwt-payload.interface';
import { MetacognicaoSaidaDto } from './dto/metacognicao-saida.dto';
import { RegistrarMetacognicaoDto } from './dto/registrar-metacognicao.dto';
import { MetacognicaoService } from './metacognicao.service';

@Controller('secoes')
export class SecaoMetacognicaoController {
  constructor(private readonly metacognicaoService: MetacognicaoService) {}

  @Get(':id/metacognicao')
  listar(
    @Param('id') sectionId: string,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<MetacognicaoSaidaDto[]> {
    return this.metacognicaoService.listarDaSecao(usuarioAtual.id, sectionId);
  }

  @Post(':id/metacognicao')
  registrar(
    @Param('id') sectionId: string,
    @Body() dto: RegistrarMetacognicaoDto,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<MetacognicaoSaidaDto> {
    return this.metacognicaoService.registrar(usuarioAtual.id, sectionId, dto);
  }
}

@Controller('me/metacognicao')
export class MeMetacognicaoController {
  constructor(private readonly metacognicaoService: MetacognicaoService) {}

  @Get()
  listar(@UsuarioAtual() usuarioAtual: UsuarioAutenticado): Promise<MetacognicaoSaidaDto[]> {
    return this.metacognicaoService.listarMinhas(usuarioAtual.id);
  }
}
