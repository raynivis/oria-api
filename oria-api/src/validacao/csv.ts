function escaparCampo(valor: string | number): string {
  const texto = String(valor);
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function escreverCsv(linhas: Array<Array<string | number>>): string {
  return linhas.map((linha) => linha.map(escaparCampo).join(',')).join('\n') + '\n';
}

export function media(valores: number[]): number {
  return valores.length === 0 ? NaN : valores.reduce((a, b) => a + b, 0) / valores.length;
}

export function desvioPadrao(valores: number[]): number {
  if (valores.length < 2) {
    return NaN;
  }
  const m = media(valores);
  const variancia = valores.reduce((soma, v) => soma + (v - m) ** 2, 0) / (valores.length - 1);
  return Math.sqrt(variancia);
}
