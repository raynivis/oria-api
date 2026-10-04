import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { IngerirLivroDto } from './dto/ingerir-livro.dto';
import { AdminApiKeyGuard } from './guards/admin-api-key.guard';
import { IngestionService } from './ingestion.service';

@Public()
@UseGuards(AdminApiKeyGuard)
@Controller('admin')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('livros/ingerir')
  ingerir(@Body() dados: IngerirLivroDto): Promise<{ jobId: string }> {
    return this.ingestionService.enfileirar(dados.arquivoPath);
  }

  @Get('jobs/:jobId')
  statusDoJob(@Param('jobId') jobId: string) {
    return this.ingestionService.statusDoJob(jobId);
  }
}
