import { z } from 'zod';
import type { MensagemChat } from '../../llm/llm.types';

export const VERSAO = 1;

export const schemaConceitos = z.object({
  conceitos: z
    .array(
      z.object({
        nome: z.string().max(80),
        descricaoCurta: z.string().max(300),
      }),
    )
    .min(1)
    .max(8),
});

export type SaidaConceitos = z.infer<typeof schemaConceitos>;

export interface VariaveisConcepts {
  tituloSecao: string;
  texto: string;
}

const SISTEMA = `Extraia os conceitos que esta seção introduz ou desenvolve.

Um conceito é uma noção que o estudante precisa dominar para acompanhar o texto,
não um tópico nem um exemplo. "Substituição de perguntas" é conceito;
"o experimento com estudantes de Michigan" não é.

Extraia entre 3 e 8 conceitos. Se a seção for curta ou introdutória, extraia
menos. Não force o número.

Para cada um, dê o nome como aparece no texto e uma descrição de uma frase, em
linguagem que o estudante entenda antes de ler.

Responda só com um objeto JSON, sem nenhum texto fora dele, exatamente neste
formato:
{ "conceitos": [ { "nome": "...", "descricaoCurta": "..." } ] }`;

export function montarMensagens(variaveis: VariaveisConcepts): MensagemChat[] {
  return [
    { role: 'system', content: SISTEMA },
    {
      role: 'user',
      content: `Seção: ${variaveis.tituloSecao}\n\nTexto:\n${variaveis.texto}`,
    },
  ];
}
