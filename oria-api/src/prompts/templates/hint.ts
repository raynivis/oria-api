import { z } from 'zod';
import type { MensagemChat } from '../../llm/llm.types';
import { BLOCO_IDENTIDADE_COMPARTILHADA } from '../shared/identidade';

export const VERSAO = 1;

export type TipoPassoSistema =
  | 'pedido_justificativa'
  | 'dica_conceitual'
  | 'dica_localizada'
  | 'resolucao';

/**
 * Guardrail de código (PROMPTS.md, papel `hint`): em qualquer passo que não
 * seja a resolução, `entregouResolucao` precisa ser `false`. Se o modelo
 * entregar a resposta, o schema falha, o LlmService refaz uma vez e o serviço
 * cai no fallback neutro.
 */
export const schemaPassoIntermediario = z.object({
  conteudo: z.string().min(1),
  entregouResolucao: z.literal(false),
});

export const schemaResolucao = z.object({
  conteudo: z.string().min(1),
  entregouResolucao: z.boolean(),
});

export interface VariaveisHint {
  tipo: TipoPassoSistema;
  enunciado: string;
  respostaReferencia: string;
  respostaInicial: string;
  trilha: Array<{ tipo: string; conteudo: string }>;
  numeroPasso: number;
  chunks: string[];
  ultimaJustificativaSuficiente?: boolean;
}

const INSTRUCOES_POR_TIPO: Record<TipoPassoSistema, string> = {
  pedido_justificativa: `O estudante acabou de responder a uma questão. NÃO diga se está certo ou errado.
Não dê nenhum sinal, nem por tom, nem por escolha de palavras.

Peça que ele indique em que trecho do texto se apoiou para chegar a essa
resposta. Uma ou duas frases, direto.

Se a resposta dele estiver claramente vazia ou fora do assunto, ainda assim peça
a justificativa, sem comentar a qualidade.`,

  dica_conceitual: `O estudante já tentou e já justificou. Continue sem dizer se está certo.

Aponte o conceito envolvido na questão, sem aplicá-lo ao caso. Se a questão trata
de substituição de perguntas, nomeie o conceito e lembre o que ele significa, mas
não mostre onde ele aparece na questão.

Termine convidando a uma nova tentativa. Máximo três frases.`,

  dica_localizada: `Última dica antes da resolução. Ainda não dê a resposta.

Indique onde no texto está o apoio para responder: o trecho, o parágrafo, a parte
da seção. Pode citar uma frase curta do material.

Deixe o passo final de raciocínio para o estudante. Máximo três frases.`,

  resolucao: `Agora sim, apresente a resolução.

Comece pela resposta. Depois explique o raciocínio, em dois ou três parágrafos,
referenciando o texto.

Se a última resposta do estudante estava correta ou parcialmente correta, diga
isso e aponte o que faltava. Se estava incorreta, mostre onde o raciocínio se
desviou, sem julgamento.`,
};

function formatoSaida(tipo: TipoPassoSistema): string {
  const entregue = tipo === 'resolucao' ? 'true ou false' : 'false';
  return `Responda só com um objeto JSON, sem nenhum texto fora dele:
{ "conteudo": "...", "entregouResolucao": ${entregue} }`;
}

export function montarMensagens(variaveis: VariaveisHint): MensagemChat[] {
  const sistema = `${BLOCO_IDENTIDADE_COMPARTILHADA}

${INSTRUCOES_POR_TIPO[variaveis.tipo]}

${formatoSaida(variaveis.tipo)}`;

  const trilha =
    variaveis.trilha.length === 0
      ? '(nenhum passo anterior)'
      : variaveis.trilha
          .map((passo, indice) => `${indice + 1}. [${passo.tipo}] ${passo.conteudo}`)
          .join('\n');

  const avaliacao =
    variaveis.tipo === 'resolucao' && variaveis.ultimaJustificativaSuficiente !== undefined
      ? `\nÚltima justificativa do estudante, avaliada como ${
          variaveis.ultimaJustificativaSuficiente ? 'suficiente' : 'insuficiente'
        }.`
      : '';

  return [
    { role: 'system', content: sistema },
    {
      role: 'user',
      content:
        `Questão: ${variaveis.enunciado}\n` +
        `Resposta de referência (não revelar antes da resolução): ${variaveis.respostaReferencia}\n` +
        `Resposta inicial do estudante: ${variaveis.respostaInicial}\n` +
        `Passo atual: ${variaveis.numeroPasso}\n` +
        `Trilha de passos anteriores:\n${trilha}${avaliacao}\n\n` +
        `Material da seção:\n${variaveis.chunks.join('\n\n')}`,
    },
  ];
}
