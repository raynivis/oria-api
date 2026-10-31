import { Body, Controller, Param, Post } from '@nestjs/common';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/jwt-payload.interface';
import { FichamentoSaidaDto } from './dto/fichamento-saida.dto';
import { GerarFichamentoDto } from './dto/gerar-fichamento.dto';
import { FichamentosService } from './fichamentos.service';

@Controller('secoes')
export class GerarFichamentoController {
  constructor(private readonly fichamentosService: FichamentosService) {}

  @Post(':id/fichamento')
  gerar(
    @Param('id') sectionId: string,
    @Body() dto: GerarFichamentoDto,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<FichamentoSaidaDto> {
    return this.fichamentosService.gerarOuObter(usuarioAtual.id, sectionId, dto);
  }
}
