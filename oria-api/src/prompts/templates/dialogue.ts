import type { MensagemChat } from '../../llm/llm.types';
import { BLOCO_IDENTIDADE_COMPARTILHADA } from '../shared/identidade';

export const VERSAO = 1;

export const RECUSA_SEM_BASE = 'Não encontrei base para isso no material desta seção.';

/**
 * Saída em texto puro, não JSON: o stream entrega tokens à medida que chegam,
 * e JSON parcial não se valida. As citações viram marcadores `[n]` que apontam
 * para os trechos numerados na entrada; `interpretacao.ts` extrai os ids.
 */
const SISTEMA = `${BLOCO_IDENTIDADE_COMPARTILHADA}

O estudante está lendo e fez uma pergunta. Responda usando apenas os trechos
numerados fornecidos.

Ao responder:
- cite explicitamente de onde vem cada afirmação, com o número do trecho entre
  colchetes, por exemplo [1] ou [2][3];
- se a pergunta pedir um resumo do capítulo inteiro, ofereça em vez disso ajudar
  o estudante a construir o resumo dele — pergunte o que ele já entendeu;
- se a pergunta for sobre exercício em andamento, não a responda: lembre que a
  tutoria por passos está do outro lado;
- prefira devolver uma pergunta quando isso ajudar o estudante a chegar sozinho.

Se os trechos fornecidos não sustentarem uma resposta, diga exatamente:
"${RECUSA_SEM_BASE}" Não complete com conhecimento geral, não especule, não
ofereça uma resposta aproximada.

Máximo quatro parágrafos. Responda em texto corrido, sem JSON e sem cabeçalhos.`;

export interface TurnoHistorico {
  papel: 'aluno' | 'tutora';
  conteudo: string;
}

export interface VariaveisDialogue {
  pergunta: string;
  historico: TurnoHistorico[];
  chunks: string[];
}

export function montarMensagens(variaveis: VariaveisDialogue): MensagemChat[] {
  const trechos = variaveis.chunks
    .map((texto, indice) => `[${indice + 1}] ${texto}`)
    .join('\n\n');

  const historico =
    variaveis.historico.length === 0
      ? '(primeira pergunta da sessão)'
      : variaveis.historico
          .map((turno) => `${turno.papel === 'aluno' ? 'Estudante' : 'Oria'}: ${turno.conteudo}`)
          .join('\n');

  return [
    { role: 'system', content: SISTEMA },
    {
      role: 'user',
      content:
        `Histórico recente da sessão:\n${historico}\n\n` +
        `Trechos da seção:\n${trechos}\n\n` +
        `Pergunta do estudante: ${variaveis.pergunta}`,
    },
  ];
}
