import { Controller, Get, Param } from '@nestjs/common';
import { LivroSaidaDto } from './dto/livro-saida.dto';
import { SumarioNoDto } from './dto/sumario-no.dto';
import { LivrosService } from './livros.service';

@Controller('livros')
export class LivrosController {
  constructor(private readonly livrosService: LivrosService) {}

  @Get()
  listar(): Promise<LivroSaidaDto[]> {
    return this.livrosService.listarProntos();
  }

  @Get(':id')
  buscar(@Param('id') id: string): Promise<LivroSaidaDto> {
    return this.livrosService.buscarProntoPorId(id);
  }

  @Get(':id/sumario')
  sumario(@Param('id') id: string): Promise<SumarioNoDto[]> {
    return this.livrosService.montarSumario(id);
  }
}
