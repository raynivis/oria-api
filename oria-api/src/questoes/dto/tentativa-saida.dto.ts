import type { EstadoTentativa } from '../entities/attempt.entity';
import type { TipoPasso } from '../entities/attempt-step.entity';

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
  }>;
}
