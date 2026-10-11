/**
 * A Oria produz saídas estruturadas (cabeçalhos, listas); manter a formatação
 * entregaria a condição de origem ao avaliador cego (VALIDATION.md, `cegar.ts`).
 * Fica aqui, em vez de em `cegar.ts`, porque `CodigoCego` não guarda texto —
 * quem precisa do texto limpo é `exportar-planilha.ts`, no momento da leitura.
 */
export function removerMarkdown(texto: string): string {
  return texto
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '— ')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
