import * as cheerio from 'cheerio';
import * as path from 'node:path';
import { EpubParserService } from './epub-parser.service';

type ServicoComPrivados = {
  extrairTextoProprio(
    $: ReturnType<typeof cheerio.load>,
    alvo: ReturnType<ReturnType<typeof cheerio.load>>,
    idsDasFilhas: string[],
  ): string;
};

describe('EpubParserService', () => {
  const service = new EpubParserService();
  const servicoPrivado = service as unknown as ServicoComPrivados;
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

  describe('extrairTextoProprio', () => {
    it('não apaga o texto quando o capítulo inteiro vem embrulhado num único <section> sem subseções', () => {
      // Padrão real de EPUBs da SciELO Books: todo o corpo do capítulo é um
      // único <section>, sem nenhuma subseção endereçável por fragmento.
      // Remover qualquer <section> indiscriminadamente apagaria o capítulo
      // inteiro — foi exatamente o bug encontrado ao ingerir um livro real.
      const $ = cheerio.load(
        '<html><body><section class="chapter"><h1>Nota preliminar</h1><p>Texto real do parágrafo.</p></section></body></html>',
        { xmlMode: true },
      );

      const texto = servicoPrivado.extrairTextoProprio($, $('body'), []);

      expect(texto).toContain('Texto real do parágrafo.');
    });

    it('remove o texto das subseções filhas pelo id do fragmento, preservando o texto próprio do pai', () => {
      const $ = cheerio.load(
        '<html><body><h1>Capítulo 1</h1><p>Introdução do capítulo.</p>' +
          '<section id="sub1"><p>Texto da subseção 1.</p></section>' +
          '<section id="sub2"><p>Texto da subseção 2.</p></section></body></html>',
        { xmlMode: true },
      );

      const texto = servicoPrivado.extrairTextoProprio($, $('body'), ['sub1', 'sub2']);

      expect(texto).toContain('Introdução do capítulo.');
      expect(texto).not.toContain('subseção 1');
      expect(texto).not.toContain('subseção 2');
    });
  });
});
