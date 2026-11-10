import { montarMensagens, VERSAO } from './fichamento';

describe('template fichamento (item 2.1)', () => {
  it('incrementou a VERSAO ao mudar o prompt', () => {
    expect(VERSAO).toBe(2);
  });

  it('exige preservar números/percentuais/datas literalmente e inclui "Dados citados"', () => {
    const [sistema] = montarMensagens({ tituloSecao: 'S', texto: 'T' });

    expect(sistema.content).toMatch(/## Dados citados/);
    expect(sistema.content).toMatch(/Nunca troque um número, percentual ou data/);
  });
});
