import { z } from 'zod';
import type { MensagemChat } from '../../llm/llm.types';
import { BLOCO_IDENTIDADE_COMPARTILHADA } from '../shared/identidade';

export const VERSAO = 1;

export const schemaVocabulario = z.object({
  conteudo: z.string().min(1),
});

export type SaidaVocabulario = z.infer<typeof schemaVocabulario>;

export interface VariaveisVocabulario {
  termo: string;
  trecho: string;
  tituloSecao: string;
}

const SISTEMA = `${BLOCO_IDENTIDADE_COMPARTILHADA}

O estudante selecionou um termo (1 a 3 palavras) dentro do trecho fornecido e
quer entender o que ele significa.

Ajude-o a DEDUZIR o significado pelas pistas do próprio trecho — nunca entregue
a definição pronta. Aponte onde no trecho está a pista (uma repetição, um
contraste, um exemplo, uma explicação ao lado) e devolva a responsabilidade de
concluir ao estudante, com uma pergunta ou um convite a tentar.

Use só o que está no trecho fornecido. Nunca recorra a conhecimento geral sobre
o termo, mesmo que tenha certeza do significado, e nunca cite fontes externas
ao livro.

Se o trecho não tiver pista suficiente para deduzir o termo, diga isso
explicitamente em vez de inventar uma pista que não existe.

Máximo três frases.

Responda só com um objeto JSON, sem nenhum texto fora dele, exatamente neste
formato:
{ "conteudo": "..." }`;

export function montarMensagens(variaveis: VariaveisVocabulario): MensagemChat[] {
  return [
    { role: 'system', content: SISTEMA },
    {
      role: 'user',
      content:
        `Seção: ${variaveis.tituloSecao}\n` +
        `Termo selecionado: ${variaveis.termo}\n\n` +
        `Trecho:\n${variaveis.trecho}`,
    },
  ];
}
