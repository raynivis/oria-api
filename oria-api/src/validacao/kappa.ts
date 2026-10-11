/**
 * Kappa de Cohen entre dois avaliadores, para notas discretas (0, 1 ou 2).
 * `pares` é uma lista de [notaAvaliador1, notaAvaliador2] da mesma saída.
 */
export function kappaDeCohen(pares: Array<[number, number]>): number {
  if (pares.length === 0) {
    return NaN;
  }

  const categorias = [0, 1, 2];
  const n = pares.length;
  const concordancias = pares.filter(([a, b]) => a === b).length;
  const observada = concordancias / n;

  const porCategoriaA = new Map(categorias.map((c) => [c, 0]));
  const porCategoriaB = new Map(categorias.map((c) => [c, 0]));
  for (const [a, b] of pares) {
    porCategoriaA.set(a, (porCategoriaA.get(a) ?? 0) + 1);
    porCategoriaB.set(b, (porCategoriaB.get(b) ?? 0) + 1);
  }

  const esperada = categorias.reduce((soma, categoria) => {
    const proporcaoA = (porCategoriaA.get(categoria) ?? 0) / n;
    const proporcaoB = (porCategoriaB.get(categoria) ?? 0) / n;
    return soma + proporcaoA * proporcaoB;
  }, 0);

  if (esperada === 1) {
    return 1; // concordância total possível sem variação: convenção usual é kappa = 1.
  }

  return (observada - esperada) / (1 - esperada);
}

/** Landis & Koch (1977) — faixas usuais de interpretação do kappa. */
export function faixaLandisKoch(kappa: number): string {
  if (Number.isNaN(kappa)) return 'indefinida';
  if (kappa < 0) return 'sem concordância';
  if (kappa <= 0.2) return 'leve';
  if (kappa <= 0.4) return 'razoável';
  if (kappa <= 0.6) return 'moderada';
  if (kappa <= 0.8) return 'substancial';
  return 'quase perfeita';
}
