import type { MensagemSaidaDto } from './sessao-saida.dto';

/** Item 1.8 (correção de usabilidade): histórico persiste entre sessões —
 * une mensagens de todas as sessões do aluno naquela seção, não só a mais
 * recente, porque `Session` não é única por `(userId, sectionId)`. */
export class HistoricoSecaoSaidaDto {
  sectionId: string;
  tituloSecao: string;
  total: number;
  pagina: number;
  tamanho: number;
  mensagens: MensagemSaidaDto[];
}
