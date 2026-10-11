import type { MensagemChat } from '../llm/llm.types';

/**
 * Prompt da condição "baseline" da Avaliação A (VALIDATION.md §4): o aluno
 * abrindo um chatbot genérico ao lado do ebook. Deliberadamente banal — é o
 * que a Oria precisa superar. Implementado como script, não endpoint: nunca é
 * alcançável pelo produto.
 */
export const VERSAO = 1;

export const SISTEMA_BASELINE = 'Você é um assistente útil. Responda à solicitação do usuário.';

/**
 * Para resumo/ficha/questões, a baseline recebe o texto colado junto do
 * pedido — senão não teria como cumprir a tarefa, e a comparação mediria só o
 * acesso ao material (VALIDATION.md §4).
 */
export function montarMensagensBaseline(
  enunciado: string,
  textoColado?: string,
): MensagemChat[] {
  const conteudo = textoColado ? `${enunciado}\n\nTexto:\n${textoColado}` : enunciado;
  return [
    { role: 'system', content: SISTEMA_BASELINE },
    { role: 'user', content: conteudo },
  ];
}
