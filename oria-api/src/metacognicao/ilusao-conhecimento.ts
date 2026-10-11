/**
 * Detecção de ilusão de conhecimento (Flavell, 1979), determinística e sem LLM
 * (IMPLEMENTATION.md, Fase 9). Confiança declarada alta + muitos passos
 * consumidos nas questões da seção é o sinal: o aluno achava que sabia mais
 * do que demonstrou.
 */
export function sinalizaIlusao(
  confianca: number,
  mediaPassos: number,
  confiancaMin: number,
  passosMin: number,
): boolean {
  return confianca >= confiancaMin && mediaPassos >= passosMin;
}

/** Template fixo em código — nunca gerado por modelo, para não alucinar a própria detecção. */
export function montarObservacao(
  confianca: number,
  mediaPassos: number,
  tituloSecao: string,
): string {
  return (
    `Você declarou confiança de ${confianca}%, mas precisou de ${mediaPassos.toFixed(1)} ` +
    `passos em média nas questões desta seção. Vale reler ${tituloSecao}.`
  );
}
