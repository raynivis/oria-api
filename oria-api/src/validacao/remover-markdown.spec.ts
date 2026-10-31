import { removerMarkdown } from './remover-markdown';

describe('removerMarkdown', () => {
  it('remove cabeçalhos, negrito, itálico e marcadores de lista', () => {
    const texto = '## Ideia central\n\nUm texto em **negrito** e em *itálico*.\n\n- primeiro item\n- segundo item';
    const limpo = removerMarkdown(texto);
    expect(limpo).not.toMatch(/[#*]/);
    expect(limpo).toContain('Ideia central');
    expect(limpo).toContain('negrito');
    expect(limpo).toContain('itálico');
    expect(limpo).toContain('— primeiro item');
  });

  it('remove blocos e trechos de código, mantendo o conteúdo', () => {
    const limpo = removerMarkdown('Texto com `código inline` e:\n\n```ts\nconst x = 1;\n```');
    expect(limpo).not.toContain('`');
    expect(limpo).not.toContain('```');
    expect(limpo).toContain('código inline');
    expect(limpo).toContain('const x = 1;');
  });

  it('não mexe em texto já sem formatação', () => {
    const texto = 'Um parágrafo comum, sem nenhuma marcação especial.';
    expect(removerMarkdown(texto)).toBe(texto);
  });
});
