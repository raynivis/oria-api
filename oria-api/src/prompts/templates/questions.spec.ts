import { montarMensagens, VERSAO } from './questions';

const CONCEITOS = [{ id: 'c1', nome: 'Conceito', descricaoCurta: 'Descrição' }];

describe('template questions (item 3.5)', () => {
  it('incrementou a VERSAO ao mudar o prompt', () => {
    expect(VERSAO).toBe(2);
  });

  it('sem secaoAnterior, não exige questão de ligação entre capítulos', () => {
    const [sistema, usuario] = montarMensagens({
      tituloSecao: 'Seção atual',
      texto: 'Texto da seção atual',
      conceitos: CONCEITOS,
      quantidade: 5,
    });

    expect(sistema.content).not.toMatch(/relacione a seção atual com a seção anterior/);
    expect(usuario.content).not.toMatch(/Seção anterior já lida/);
  });

  it('com secaoAnterior, exige ao menos uma questão de ligação e inclui o texto das duas seções', () => {
    const [sistema, usuario] = montarMensagens({
      tituloSecao: 'Seção atual',
      texto: 'Texto da seção atual',
      conceitos: CONCEITOS,
      quantidade: 5,
      secaoAnterior: { titulo: 'Seção anterior', texto: 'Texto da seção anterior' },
    });

    expect(sistema.content).toMatch(/relacione a seção atual com a seção anterior/);
    expect(usuario.content).toMatch(/Seção anterior já lida pelo aluno: Seção anterior/);
    expect(usuario.content).toMatch(/Texto da seção anterior/);
  });

  it('secaoAnterior null se comporta como ausente', () => {
    const [sistema, usuario] = montarMensagens({
      tituloSecao: 'Seção atual',
      texto: 'Texto da seção atual',
      conceitos: CONCEITOS,
      quantidade: 5,
      secaoAnterior: null,
    });

    expect(sistema.content).not.toMatch(/relacione a seção atual com a seção anterior/);
    expect(usuario.content).not.toMatch(/Seção anterior já lida/);
  });
});
