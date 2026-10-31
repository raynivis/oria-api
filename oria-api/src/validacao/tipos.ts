/**
 * Entidades e tipos da Fase 10 (`VALIDATION.md`): instrumentação da Avaliação
 * A, separada do produto. Nada aqui é consumido pela API do aluno.
 */
export const TIPOS_TAREFA = [
  'pergunta_na_secao',
  'pergunta_ligacao',
  'pergunta_fora',
  'resumo',
  'ficha',
  'questoes',
] as const;
export type TipoTarefa = (typeof TIPOS_TAREFA)[number];

export const CONDICOES = ['oria', 'baseline'] as const;
export type Condicao = (typeof CONDICOES)[number];

export const AVALIADORES = ['aluno', 'orientador', 'consenso'] as const;
export type Avaliador = (typeof AVALIADORES)[number];
