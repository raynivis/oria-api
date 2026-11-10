import type { CitacaoPersistida } from '../dialogue.types';
import type { PapelMensagem } from '../entities/message.entity';

export class MensagemSaidaDto {
  id: string;
  papel: PapelMensagem;
  conteudo: string;
  chunksCitados: string[];
  /** Item 1.11: forma rica da citação (seção + posição), aditiva a `chunksCitados`. */
  citacoes: CitacaoPersistida[];
  encontrouBase: boolean | null;
  criadoEm: Date;
}

export class SessaoSaidaDto {
  id: string;
  sectionId: string;
  tituloSecao: string;
  criadaEm: Date;
  mensagens: MensagemSaidaDto[];
}

export class SessaoResumoDto {
  id: string;
  sectionId: string;
  tituloSecao: string;
  criadaEm: Date;
}
