import { OrigemFichamentoVersao } from '../entities/fichamento-versao.entity';
import { StatusGeracaoFichamento } from '../entities/fichamento.entity';

export class FichamentoSaidaDto {
  id: string;
  sectionId: string;
  trechoCfi: string | null;
  numeroVersaoAtual: number;
  origemVersaoAtual: OrigemFichamentoVersao;
  conteudo: string;
  caracteresIa: number;
  caracteresAluno: number;
  proporcaoAluno: number;
  criadoEm: Date;
  atualizadoEm: Date;
  /** Itens aditivos abaixo — item 2.4 (procedência) e item 2.5 (status assíncrono). */
  tituloLivro: string;
  livroId: string;
  tituloSecao: string;
  trechoTexto: string | null;
  statusGeracao: StatusGeracaoFichamento;
  erroMensagem: string | null;
}
