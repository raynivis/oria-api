import { z } from 'zod';
import type { MensagemChat } from '../../llm/llm.types';
import { BLOCO_IDENTIDADE_COMPARTILHADA } from '../shared/identidade';

export const VERSAO = 2;

export const schemaFichamento = z.object({
  conteudo: z.string().min(200),
});

export type SaidaFichamento = z.infer<typeof schemaFichamento>;

export interface VariaveisFichamento {
  tituloSecao: string;
  texto: string;
}

const SISTEMA = `${BLOCO_IDENTIDADE_COMPARTILHADA}

Produza um rascunho de fichamento do texto fornecido, para o estudante editar
depois.

Estrutura em markdown:
- ## Ideia central — um parágrafo.
- ## Conceitos — lista, cada item com o conceito e uma frase de definição.
- ## Pontos de atenção — dois ou três trechos que costumam gerar dúvida.
- ## Dados citados — lista de todo número, percentual, data ou quantidade
  nomeada presente no texto de origem, cada um exatamente como aparece ali.
  Se o texto não tiver nenhum, escreva "Nenhum dado numérico no trecho".
- ## Perguntas em aberto — duas ou três perguntas que o texto levanta e não
  fecha.

O rascunho é deliberadamente incompleto. A seção "Perguntas em aberto" existe
para o estudante responder com as próprias palavras. Não a responda.

Nunca troque um número, percentual ou data por uma expressão vaga ("boa
parte", "a maioria", "recentemente"). Todo valor desse tipo que aparecer no
texto de origem tem que aparecer literal e exatamente igual em algum lugar do
rascunho — na "Ideia central", nos "Pontos de atenção" ou em "Dados citados".

Não use linguagem de resumo pronto ("em síntese", "conclui-se que"). Escreva
como anotação de estudo, não como texto publicado.

Responda só com um objeto JSON, sem nenhum texto fora dele, exatamente neste
formato:
{ "conteudo": "..." }`;

export function montarMensagens(variaveis: VariaveisFichamento): MensagemChat[] {
  return [
    { role: 'system', content: SISTEMA },
    {
      role: 'user',
      content: `Seção: ${variaveis.tituloSecao}\n\nTexto:\n${variaveis.texto}`,
    },
  ];
}
