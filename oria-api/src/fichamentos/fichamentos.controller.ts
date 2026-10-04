import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/jwt-payload.interface';
import { EditarFichamentoDto } from './dto/editar-fichamento.dto';
import { FichamentoSaidaDto } from './dto/fichamento-saida.dto';
import { FichamentoVersaoSaidaDto } from './dto/fichamento-versao-saida.dto';
import { FichamentosService } from './fichamentos.service';

@Controller('fichamentos')
export class FichamentosController {
  constructor(private readonly fichamentosService: FichamentosService) {}

  @Get(':id')
  obter(
    @Param('id') id: string,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<FichamentoSaidaDto> {
    return this.fichamentosService.obterPorId(usuarioAtual.id, id);
  }

  @Patch(':id')
  editar(
    @Param('id') id: string,
    @Body() dto: EditarFichamentoDto,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<FichamentoSaidaDto> {
    return this.fichamentosService.editar(usuarioAtual.id, id, dto);
  }

  @Get(':id/versoes')
  listarVersoes(
    @Param('id') id: string,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<FichamentoVersaoSaidaDto[]> {
    return this.fichamentosService.listarVersoes(usuarioAtual.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(
    @Param('id') id: string,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<void> {
    return this.fichamentosService.remover(usuarioAtual.id, id);
  }
}
