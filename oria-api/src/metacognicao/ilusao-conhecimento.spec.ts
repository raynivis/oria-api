import { montarObservacao, sinalizaIlusao } from './ilusao-conhecimento';

const CONFIANCA_MIN = 70;
const PASSOS_MIN = 2.5;

describe('sinalizaIlusao', () => {
  it('confiança 85 com média de 3 passos sinaliza', () => {
    expect(sinalizaIlusao(85, 3, CONFIANCA_MIN, PASSOS_MIN)).toBe(true);
  });

  it('confiança 40 com a mesma média de 3 passos não sinaliza', () => {
    expect(sinalizaIlusao(40, 3, CONFIANCA_MIN, PASSOS_MIN)).toBe(false);
  });

  it('confiança alta com poucos passos não sinaliza (sem ilusão: o aluno sabia mesmo)', () => {
    expect(sinalizaIlusao(85, 1, CONFIANCA_MIN, PASSOS_MIN)).toBe(false);
  });

  it('nos limiares exatos, sinaliza (comparação é >=, não >)', () => {
    expect(sinalizaIlusao(CONFIANCA_MIN, PASSOS_MIN, CONFIANCA_MIN, PASSOS_MIN)).toBe(true);
  });

  it('mudar os limiares não é feito aqui: a função sempre recebe os valores atuais', () => {
    expect(sinalizaIlusao(85, 3, 90, PASSOS_MIN)).toBe(false);
  });
});

describe('montarObservacao', () => {
  it('é texto fixo, com os valores interpolados, uma casa decimal na média', () => {
    const texto = montarObservacao(85, 3, 'Capítulo 1');
    expect(texto).toBe(
      'Você declarou confiança de 85%, mas precisou de 3.0 passos em média nas questões desta seção. Vale reler Capítulo 1.',
    );
  });
});
