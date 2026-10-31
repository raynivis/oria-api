import { OrigemFichamentoVersao } from '../entities/fichamento-versao.entity';

export class FichamentoResumoDto {
  id: string;
  sectionId: string;
  tituloSecao: string;
  livroId: string;
  tituloLivro: string;
  trechoCfi: string | null;
  origemVersaoAtual: OrigemFichamentoVersao;
  editado: boolean;
  atualizadoEm: Date;
}
