import type { PapelMensagem } from '../entities/message.entity';

export class MensagemSaidaDto {
  id: string;
  papel: PapelMensagem;
  conteudo: string;
  chunksCitados: string[];
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
