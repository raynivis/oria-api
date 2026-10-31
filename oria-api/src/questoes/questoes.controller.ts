import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/jwt-payload.interface';
import { ConjuntoResumoDto } from './dto/conjunto-resumo.dto';
import { ConjuntoSaidaDto } from './dto/conjunto-saida.dto';
import { GerarQuestoesDto } from './dto/gerar-questoes.dto';
import { QuestoesService } from './questoes.service';

@Controller('secoes')
export class GerarQuestoesController {
  constructor(private readonly questoesService: QuestoesService) {}

  @Post(':id/questoes')
  gerar(
    @Param('id') sectionId: string,
    @Body() dto: GerarQuestoesDto,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<ConjuntoSaidaDto> {
    return this.questoesService.gerarConjunto(usuarioAtual.id, sectionId, dto.conceitoIds);
  }
}

@Controller('conjuntos')
export class ConjuntosController {
  constructor(private readonly questoesService: QuestoesService) {}

  @Get(':id')
  obter(
    @Param('id') id: string,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
  ): Promise<ConjuntoSaidaDto> {
    return this.questoesService.obterConjunto(usuarioAtual.id, id);
  }
}

@Controller('me/conjuntos')
export class MeConjuntosController {
  constructor(private readonly questoesService: QuestoesService) {}

  @Get()
  listar(
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
    @Query('livroId') livroId?: string,
  ): Promise<ConjuntoResumoDto[]> {
    return this.questoesService.listarMeusConjuntos(usuarioAtual.id, livroId);
  }
}
