import { Controller, Get, Param } from '@nestjs/common';
import { PanoramaSaidaDto } from './dto/panorama-saida.dto';
import { PanoramaService } from './panorama.service';

@Controller('secoes')
export class PanoramaController {
  constructor(private readonly panoramaService: PanoramaService) {}

  @Get(':id/panorama')
  obter(@Param('id') id: string): Promise<PanoramaSaidaDto> {
    return this.panoramaService.obterOuGerar(id);
  }
}
