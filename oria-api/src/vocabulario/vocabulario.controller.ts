import { Body, Controller, Param, Post } from '@nestjs/common';
import { ExplicarTermoDto } from './dto/explicar-termo.dto';
import { VocabularioSaidaDto } from './dto/vocabulario-saida.dto';
import { VocabularioService } from './vocabulario.service';

@Controller('secoes')
export class VocabularioController {
  constructor(private readonly vocabularioService: VocabularioService) {}

  @Post(':id/vocabulario')
  explicar(
    @Param('id') sectionId: string,
    @Body() dto: ExplicarTermoDto,
  ): Promise<VocabularioSaidaDto> {
    return this.vocabularioService.explicar(sectionId, dto);
  }
}
