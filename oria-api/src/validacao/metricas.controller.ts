import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../auth/decorators/public.decorator';
import { AdminApiKeyGuard } from '../ingestion/guards/admin-api-key.guard';
import { LlmCall } from '../llm/entities/llm-call.entity';
import { UltimaChamadaDto } from './dto/ultima-chamada.dto';

const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 200;

/**
 * Consumida durante a Avaliação C (SCENARIOS.md, "Registro por passo"): o autor
 * copia tempo e tokens daqui para a planilha de registro enquanto executa os
 * cenários. Mesma chave administrativa da Fase 2.
 */
@Public()
@UseGuards(AdminApiKeyGuard)
@Controller('admin')
export class MetricasController {
  constructor(
    @InjectRepository(LlmCall)
    private readonly llmCallsRepository: Repository<LlmCall>,
  ) {}

  @Get('metricas/ultimas-chamadas')
  async ultimasChamadas(@Query('limite') limiteBruto?: string): Promise<UltimaChamadaDto[]> {
    const chamadas = await this.llmCallsRepository.find({
      order: { criadoEm: 'DESC' },
      take: this.resolverLimite(limiteBruto),
    });

    return chamadas.map((chamada) => ({
      papel: chamada.papel,
      modelo: chamada.modelo,
      tokensIn: chamada.tokensIn,
      tokensOut: chamada.tokensOut,
      custo: Number(chamada.custo),
      duracaoMs: chamada.duracaoMs,
      sucesso: chamada.sucesso,
      criadoEm: chamada.criadoEm,
    }));
  }

  private resolverLimite(limiteBruto?: string): number {
    const numero = Number(limiteBruto);
    if (!limiteBruto || !Number.isInteger(numero) || numero < 1) {
      return LIMITE_PADRAO;
    }
    return Math.min(numero, LIMITE_MAXIMO);
  }
}
