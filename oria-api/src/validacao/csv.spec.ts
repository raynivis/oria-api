import { desvioPadrao, escreverCsv, media } from './csv';

describe('escreverCsv', () => {
  it('junta campos com vírgula e linhas com quebra de linha', () => {
    expect(escreverCsv([['a', 'b'], [1, 2]])).toBe('a,b\n1,2\n');
  });

  it('escapa campos com vírgula, aspas ou quebra de linha', () => {
    const csv = escreverCsv([['tem, vírgula', 'tem "aspas"', 'tem\nquebra']]);
    expect(csv).toBe('"tem, vírgula","tem ""aspas""","tem\nquebra"\n');
  });
});

describe('media e desvioPadrao', () => {
  it('media de [1,2,3] é 2', () => {
    expect(media([1, 2, 3])).toBe(2);
  });

  it('lista vazia dá NaN em vez de dividir por zero', () => {
    expect(media([])).toBeNaN();
    expect(desvioPadrao([])).toBeNaN();
  });

  it('um único valor não tem desvio definido', () => {
    expect(desvioPadrao([5])).toBeNaN();
  });

  it('desvio padrão amostral de [2,4,4,4,5,5,7,9] é 2,138...', () => {
    expect(desvioPadrao([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.1380899, 5);
  });
});
