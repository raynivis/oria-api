import { OrigemFichamentoVersao } from '../entities/fichamento-versao.entity';

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
}
