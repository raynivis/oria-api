import { z } from 'zod';
import type { MensagemChat } from '../../llm/llm.types';
import { BLOCO_IDENTIDADE_COMPARTILHADA } from '../shared/identidade';

export const VERSAO = 1;

export const schemaQuestoes = z.object({
  questoes: z
    .array(
      z.object({
        enunciado: z.string(),
        respostaReferencia: z.string(),
        conceitoIds: z.array(z.string().uuid()).min(1),
        trechosFonte: z.array(z.string()),
      }),
    )
    .min(1),
});

export type SaidaQuestoes = z.infer<typeof schemaQuestoes>;

export interface ConceitoParaQuestao {
  id: string;
  nome: string;
  descricaoCurta: string;
}

export interface VariaveisQuestoes {
  tituloSecao: string;
  texto: string;
  conceitos: ConceitoParaQuestao[];
  quantidade: number;
}

const SISTEMA = `${BLOCO_IDENTIDADE_COMPARTILHADA}

Gere questões de resposta aberta sobre a seção.

Toda questão é de resposta construída. Nunca gere alternativas, múltipla escolha
ou verdadeiro/falso: o sistema avalia o raciocínio, não a seleção.

Cada questão deve:
- exigir que o estudante relacione ou explique, não que recupere uma definição;
- poder ser respondida com base apenas no texto fornecido;
- indicar quais conceitos da lista ela testa (um ou mais, pelo id);
- indicar os trechos do texto que sustentam a resposta.

Para cada questão, escreva também uma resposta de referência. Ela não será
mostrada ao estudante durante as tentativas, apenas na resolução final.

Evite perguntas que comecem com "o que é". Prefira "por que", "como se relaciona
com", "em que situação".

Responda só com um objeto JSON, sem nenhum texto fora dele, exatamente neste
formato:
{
  "questoes": [
    {
      "enunciado": "...",
      "respostaReferencia": "...",
      "conceitoIds": ["<id da lista>"],
      "trechosFonte": ["<trecho literal do texto>"]
    }
  ]
}`;

export function montarMensagens(variaveis: VariaveisQuestoes): MensagemChat[] {
  const listaConceitos = variaveis.conceitos
    .map((c) => `- id ${c.id}: ${c.nome} — ${c.descricaoCurta}`)
    .join('\n');

  return [
    { role: 'system', content: SISTEMA },
    {
      role: 'user',
      content:
        `Seção: ${variaveis.tituloSecao}\n` +
        `Quantidade de questões: ${variaveis.quantidade}\n\n` +
        `Conceitos da seção:\n${listaConceitos}\n\n` +
        `Texto:\n${variaveis.texto}`,
    },
  ];
}
