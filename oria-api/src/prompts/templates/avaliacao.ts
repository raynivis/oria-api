import { z } from 'zod';
import type { MensagemChat } from '../../llm/llm.types';

export const VERSAO = 1;

export const schemaAvaliacao = z.object({
  suficiente: z.boolean(),
});

export type SaidaAvaliacao = z.infer<typeof schemaAvaliacao>;

export interface VariaveisAvaliacao {
  enunciado: string;
  respostaReferencia: string;
  justificativa: string;
  chunks: string[];
}

/**
 * Juiz interno. O veredito grava no banco e nunca chega ao estudante: serve
 * só para decidir se a tentativa encerra ou segue para a próxima dica.
 * Papel fora do bloco de identidade compartilhado, porque nunca fala com o aluno.
 */
const SISTEMA = `Você avalia, para uso interno, se a justificativa de um estudante sustenta
uma resposta correta à questão, com base no material fornecido e na resposta de
referência.

Considere suficiente a justificativa que aponta o raciocínio central da resposta
de referência, mesmo com palavras diferentes. Considere insuficiente a que
erra o raciocínio, cita trecho que não sustenta a resposta, ou não responde.

Não escreva nenhum comentário. Responda só com um objeto JSON, sem nenhum texto
fora dele, exatamente neste formato:
{ "suficiente": true }  ou  { "suficiente": false }`;

export function montarMensagens(variaveis: VariaveisAvaliacao): MensagemChat[] {
  return [
    { role: 'system', content: SISTEMA },
    {
      role: 'user',
      content:
        `Questão: ${variaveis.enunciado}\n` +
        `Resposta de referência: ${variaveis.respostaReferencia}\n\n` +
        `Justificativa do estudante: ${variaveis.justificativa}\n\n` +
        `Material da seção:\n${variaveis.chunks.join('\n\n')}`,
    },
  ];
}
