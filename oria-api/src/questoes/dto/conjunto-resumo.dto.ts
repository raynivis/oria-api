import type { EstadoTentativa } from '../entities/attempt.entity';

/** `pendente` não existe em `EstadoTentativa`: é o estado de uma questão sem tentativa nenhuma ainda. */
export type EstadoQuestaoNaLista = 'pendente' | EstadoTentativa;

export class QuestaoNaListaDto {
  id: string;
  enunciado: string;
  tentativaId: string | null;
  estado: EstadoQuestaoNaLista;
}

export class ConjuntoResumoDto {
  id: string;
  sectionId: string;
  tituloSecao: string;
  livroId: string;
  tituloLivro: string;
  criadoEm: Date;
  questoes: QuestaoNaListaDto[];
}
