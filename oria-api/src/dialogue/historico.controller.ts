import { Controller, Get, Param, Query } from '@nestjs/common';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/jwt-payload.interface';
import { DialogueService } from './dialogue.service';
import { HistoricoSecaoSaidaDto } from './dto/historico-secao-saida.dto';

const PAGINA_PADRAO = 1;
const TAMANHO_PADRAO = 20;
const TAMANHO_MAXIMO = 100;

/** Item 1.8 (correção de usabilidade): histórico de conversa por seção,
 * paginado, persistindo entre logins — não depende de estado do navegador. */
@Controller('me/secoes')
export class HistoricoController {
  constructor(private readonly dialogueService: DialogueService) {}

  @Get(':sectionId/historico')
  obter(
    @Param('sectionId') sectionId: string,
    @UsuarioAtual() usuarioAtual: UsuarioAutenticado,
    @Query('pagina') paginaBruta?: string,
    @Query('tamanho') tamanhoBruta?: string,
  ): Promise<HistoricoSecaoSaidaDto> {
    return this.dialogueService.historicoDaSecao(
      usuarioAtual.id,
      sectionId,
      this.resolverPagina(paginaBruta),
      this.resolverTamanho(tamanhoBruta),
    );
  }

  private resolverPagina(bruta?: string): number {
    const numero = Number(bruta);
    return !bruta || !Number.isInteger(numero) || numero < 1 ? PAGINA_PADRAO : numero;
  }

  private resolverTamanho(bruta?: string): number {
    const numero = Number(bruta);
    if (!bruta || !Number.isInteger(numero) || numero < 1) {
      return TAMANHO_PADRAO;
    }
    return Math.min(numero, TAMANHO_MAXIMO);
  }
}
