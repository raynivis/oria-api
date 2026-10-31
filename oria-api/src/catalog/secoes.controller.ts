import { Controller, Get, Param } from '@nestjs/common';
import { SecaoSaidaDto } from './dto/secao-saida.dto';
import { SecoesService } from './secoes.service';

@Controller('secoes')
export class SecoesController {
  constructor(private readonly secoesService: SecoesService) {}

  @Get(':id')
  buscar(@Param('id') id: string): Promise<SecaoSaidaDto> {
    return this.secoesService.buscarComNavegacao(id);
  }
}
