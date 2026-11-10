import type { EstadoTentativa } from '../entities/attempt.entity';
import type { ChunkMostrado, TipoPasso } from '../entities/attempt-step.entity';

/** Sem campo de veredito: `avaliacaoSuficiente` é interno e nunca sai daqui. */
export class TentativaSaidaDto {
  id: string;
  questaoId: string;
  estado: EstadoTentativa;
  nPassos: number;
  criadaEm: Date;
  encerradaEm: Date | null;
  passos: Array<{
    numero: number;
    tipo: TipoPasso;
    conteudo: string;
    criadoEm: Date;
    /** Item 3.9: aditivo — seção(ões) + posição do material mostrado nesse passo. */
    chunksMostrados: ChunkMostrado[];
  }>;
}
