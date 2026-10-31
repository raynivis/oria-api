import { faixaLandisKoch, kappaDeCohen } from './kappa';

describe('kappaDeCohen', () => {
  it('concordância perfeita (com variação entre categorias) dá kappa = 1', () => {
    const pares: Array<[number, number]> = [
      [0, 0],
      [1, 1],
      [2, 2],
      [1, 1],
    ];
    expect(kappaDeCohen(pares)).toBe(1);
  });

  it('concordância no nível do acaso dá kappa = 0', () => {
    const pares: Array<[number, number]> = [
      [1, 1],
      [0, 0],
      [1, 0],
      [0, 1],
    ];
    expect(kappaDeCohen(pares)).toBeCloseTo(0, 10);
  });

  it('bate com o cálculo manual num caso de concordância parcial', () => {
    const pares: Array<[number, number]> = [
      [2, 2],
      [2, 2],
      [1, 1],
      [0, 0],
      [0, 1],
    ];
    // observada = 4/5 = 0.8; esperada = 0.08+0.08+0.16 = 0.32; kappa = 0.48/0.68 = 12/17
    expect(kappaDeCohen(pares)).toBeCloseTo(12 / 17, 10);
  });

  it('sem pares, devolve NaN em vez de dividir por zero', () => {
    expect(kappaDeCohen([])).toBeNaN();
  });
});

describe('faixaLandisKoch', () => {
  it.each([
    [-0.1, 'sem concordância'],
    [0.1, 'leve'],
    [0.3, 'razoável'],
    [0.5, 'moderada'],
    [0.7, 'substancial'],
    [0.9, 'quase perfeita'],
  ])('%s -> %s', (kappa, faixa) => {
    expect(faixaLandisKoch(kappa)).toBe(faixa);
  });

  it('NaN é indefinida', () => {
    expect(faixaLandisKoch(NaN)).toBe('indefinida');
  });
});
