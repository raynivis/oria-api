import { z } from 'zod';
import type { MensagemChat } from '../../llm/llm.types';
import { BLOCO_IDENTIDADE_COMPARTILHADA } from '../shared/identidade';

export const VERSAO = 1;

const ORDEM_ROTULOS = [
  'Ideia mais geral',
  'Mecanismo central',
  'Consequência',
  'Casos específicos',
] as const;

export const schemaPanorama = z
  .object({
    niveis: z
      .array(
        z.object({
          rotulo: z.enum(ORDEM_ROTULOS),
          titulo: z.string().max(60),
          texto: z.string(),
        }),
      )
      .length(4),
    tempoEstimadoMin: z.number().int().positive(),
  })
  .superRefine((valor, ctx) => {
    const recebida = valor.niveis.map((nivel) => nivel.rotulo);
    const correta = recebida.every(
      (rotulo, indice) => rotulo === ORDEM_ROTULOS[indice],
    );
    if (!correta) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Os níveis precisam vir na ordem: ${ORDEM_ROTULOS.join(' -> ')}.`,
        path: ['niveis'],
      });
    }
  });

export type SaidaPanorama = z.infer<typeof schemaPanorama>;

export interface VariaveisPanorama {
  tituloLivro: string;
  tituloSecao: string;
  textoSecao: string;
}

const SISTEMA = `${BLOCO_IDENTIDADE_COMPARTILHADA}

Você prepara um estudante para ler uma seção de livro didático que ele ainda não
leu.

Organize o conteúdo em quatro níveis, do mais geral ao mais específico. A ordem
importa: o estudante precisa ter o enquadramento antes do detalhe, para que os
conceitos novos encontrem onde se ancorar.

1. Ideia mais geral — o enquadramento, a condição de fundo de que a seção parte.
2. Mecanismo central — o movimento ou processo que a seção explica.
3. Consequência — o que decorre desse mecanismo.
4. Casos específicos — os exemplos concretos que o estudante vai encontrar.

Cada nível tem um título curto (até 6 palavras) e um texto de duas a três frases.
Não antecipe conclusões: prepare a leitura, não a substitua. Estime o tempo de
leitura da seção em minutos, considerando ritmo de leitura acadêmica.

Responda só com um objeto JSON, sem nenhum texto fora dele, exatamente neste
formato:
{
  "niveis": [
    { "rotulo": "Ideia mais geral", "titulo": "...", "texto": "..." },
    { "rotulo": "Mecanismo central", "titulo": "...", "texto": "..." },
    { "rotulo": "Consequência", "titulo": "...", "texto": "..." },
    { "rotulo": "Casos específicos", "titulo": "...", "texto": "..." }
  ],
  "tempoEstimadoMin": 0
}`;

export function montarMensagens(variaveis: VariaveisPanorama): MensagemChat[] {
  return [
    { role: 'system', content: SISTEMA },
    {
      role: 'user',
      content:
        `Livro: ${variaveis.tituloLivro}\n` +
        `Seção: ${variaveis.tituloSecao}\n\n` +
        `Texto completo da seção:\n${variaveis.textoSecao}`,
    },
  ];
}
