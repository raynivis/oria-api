import { Controller, Get, Param } from '@nestjs/common';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/jwt-payload.interface';
import {
  ClassificacaoConceitosDto,
  ConceitoSaidaDto,
} from './dto/conceitos-saida.dto';
import { ConceitosService } from './conceitos.service';

@Controller('secoes')
export class SecaoConceitosController {
  constructor(private readonly conceitosService: ConceitosService) {}

  @Get(':id/conceitos')
  listar(@Param('id') sectionId: string): Promise<ConceitoSaidaDto[]> {
    return this.conceitosService.listarDaSecao(sectionId);
  }
}

@Controller('me/conceitos')
export class MeConceitosController {
  constructor(private readonly conceitosService: ConceitosService) {}

  @Get()
  classificar(
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<ClassificacaoConceitosDto> {
    return this.conceitosService.classificarDoAluno(usuarioAtual.id);
  }
}
