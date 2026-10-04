import * as path from 'node:path';
import { EpubParserService } from './epub-parser.service';

describe('EpubParserService', () => {
  const service = new EpubParserService();
  const caminhoFixture = path.join(
    __dirname,
    '../../test/fixtures/livro-teste.epub',
  );

  it('extrai metadados, 3 capítulos e 2 subseções cada, com texto próprio', async () => {
    const livro = await service.parse(caminhoFixture);

    expect(livro.titulo).toBe('Livro de Teste da Oria');
    expect(livro.autor).toBe('Autoria de Teste');

    expect(livro.secoes).toHaveLength(9);

    const capitulos = livro.secoes.filter((s) => s.parentId === null);
    expect(capitulos).toHaveLength(3);
    expect(capitulos.map((c) => c.titulo)).toEqual([
      'Capítulo 1',
      'Capítulo 2',
      'Capítulo 3',
    ]);

    for (const capitulo of capitulos) {
      const filhas = livro.secoes.filter((s) => s.parentId === capitulo.id);
      expect(filhas).toHaveLength(2);
      for (const filha of filhas) {
        expect(filha.nivel).toBe(2);
        expect(filha.textoCompleto.length).toBeGreaterThan(0);
      }
    }

    const ordens = livro.secoes.map((s) => s.ordem);
    expect(new Set(ordens).size).toBe(ordens.length);
  });
});
