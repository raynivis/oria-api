export type PapelLlm =
  | 'panorama'
  | 'concepts'
  | 'fichamento'
  | 'questions'
  | 'hint'
  | 'avaliacao'
  | 'dialogue';

export interface MensagemChat {
  role: 'system' | 'user';
  content: string;
}

export interface OpcoesCompletar {
  /** Só usado durante a validação do TCC (VALIDATION.md). Ausente em uso normal. */
  temperature?: number;
  /** Idem. */
  seed?: number;
  /** Idem — nome do provedor fixado no OpenRouter, com allow_fallbacks: false. */
  provider?: string;
  /** Idem — sobrepõe o modelo resolvido pela env do papel (`VALIDACAO_MODELO`). */
  modelo?: string;
}
