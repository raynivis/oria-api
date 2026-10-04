import { OrigemFichamentoVersao } from '../entities/fichamento-versao.entity';

export class FichamentoVersaoSaidaDto {
  numero: number;
  conteudo: string;
  origem: OrigemFichamentoVersao;
  promptVersao?: number;
  modelo?: string;
  criadoEm: Date;
}
