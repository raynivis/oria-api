import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Query,
} from '@nestjs/common';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/jwt-payload.interface';
import { FichamentoResumoDto } from './dto/fichamento-resumo.dto';
import { FichamentosService } from './fichamentos.service';

@Controller('me/fichamentos')
export class MeFichamentosController {
  constructor(private readonly fichamentosService: FichamentosService) {}

  @Get()
  listar(
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
    @Query('livroId') livroId?: string,
  ): Promise<FichamentoResumoDto[]> {
    return this.fichamentosService.listarMeus(usuarioAtual.id, livroId);
  }

  /**
   * Só markdown por enquanto. PDF (previsto em IMPLEMENTATION.md) fica para
   * quando houver demanda real — nenhum cenário de SCENARIOS.md o exercita.
   */
  @Get('exportar')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="fichamentos.md"')
  async exportar(
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
    @Query('formato') formato?: string,
  ): Promise<string> {
    if (formato && formato !== 'md') {
      throw new BadRequestException(
        'Exportação em PDF ainda não implementada nesta fase; use ?formato=md.',
      );
    }
    return this.fichamentosService.exportarMarkdown(usuarioAtual.id);
  }
}
