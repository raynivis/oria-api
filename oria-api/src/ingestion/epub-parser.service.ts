import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { EPub } from 'epub2';
import type { TocElement } from 'epub2/lib/epub/const';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

interface ItemDeManifesto extends TocElement {
  properties?: string;
}

export interface SecaoExtraida {
  id: string;
  parentId: string | null;
  ordem: number;
  titulo: string;
  nivel: number;
  href: string;
  textoCompleto: string;
}

export interface LivroExtraido {
  titulo: string;
  autor: string;
  isbn?: string;
  secoes: SecaoExtraida[];
}

interface NoDaArvore {
  titulo: string;
  href: string;
}

@Injectable()
export class EpubParserService {
  async parse(caminhoArquivo: string): Promise<LivroExtraido> {
    const epub = await this.abrir(caminhoArquivo);

    const itemNav = Object.values(epub.manifest).find((item) =>
      ((item as ItemDeManifesto).properties ?? '').split(/\s+/).includes('nav'),
    );

    const nos = itemNav
      ? await this.lerArvoreEpub3(epub, itemNav.href!)
      : await this.lerArvoreEpub2(epub);

    const secoes = await this.preencherTextos(epub, nos);

    return {
      titulo: (epub.metadata.title || path.basename(caminhoArquivo)).trim(),
      autor: (epub.metadata.creator || 'Autor desconhecido').trim(),
      isbn: epub.metadata.ISBN || undefined,
      secoes,
    };
  }

  private abrir(caminhoArquivo: string): Promise<EPub> {
    return new Promise((resolve, reject) => {
      const epub = new EPub(caminhoArquivo);
      epub.on('end', () => resolve(epub));
      epub.on('error', (erro: Error) => reject(erro));
      epub.parse();
    });
  }

  private lerArquivoDoZip(epub: EPub, caminho: string): Promise<string> {
    return new Promise((resolve, reject) => {
      epub.zip.readFile(caminho, (erro, buffer) => {
        if (erro) {
          reject(erro instanceof Error ? erro : new Error(String(erro)));
          return;
        }
        resolve(buffer.toString('utf-8'));
      });
    });
  }

  private resolverHref(diretorioBase: string, href: string): string {
    const [caminhoRelativo, fragmento] = href.split('#');
    const resolvido = path.posix.normalize(
      path.posix.join(diretorioBase, caminhoRelativo),
    );
    return fragmento ? `${resolvido}#${fragmento}` : resolvido;
  }

  /** Monta a árvore de seções a partir do `nav.xhtml` (EPUB 3). */
  private async lerArvoreEpub3(
    epub: EPub,
    hrefNav: string,
  ): Promise<Array<SecaoExtraida & { arvore: NoDaArvore }>> {
    const conteudo = await this.lerArquivoDoZip(epub, hrefNav);
    const $ = cheerio.load(conteudo, { xmlMode: true });
    const diretorioNav = path.posix.dirname(hrefNav);

    const navToc = $('nav')
      .toArray()
      .find((el) => $(el).attr('epub:type') === 'toc');

    if (!navToc) {
      return [];
    }

    const resultado: Array<SecaoExtraida & { arvore: NoDaArvore }> = [];
    let ordem = 0;

    const caminhar = (
      listaOl: ReturnType<typeof $>,
      nivel: number,
      parentId: string | null,
    ) => {
      listaOl
        .children('li')
        .toArray()
        .forEach((li) => {
          const $li = $(li);
          const $link = $li.children('a').first();
          const href = $link.attr('href');
          const titulo = $link.text().trim();
          if (!href || !titulo) {
            return;
          }

          const id = randomUUID();
          resultado.push({
            id,
            parentId,
            ordem: ordem++,
            titulo,
            nivel,
            href: this.resolverHref(diretorioNav, href),
            textoCompleto: '',
            arvore: { titulo, href },
          });

          const subLista = $li.children('ol').first();
          if (subLista.length > 0) {
            caminhar(subLista, nivel + 1, id);
          }
        });
    };

    caminhar($(navToc).children('ol').first(), 1, null);
    return resultado;
  }

  /** Monta a árvore de seções a partir do `toc.ncx` (EPUB 2). */
  private async lerArvoreEpub2(
    epub: EPub,
  ): Promise<Array<SecaoExtraida & { arvore: NoDaArvore }>> {
    const idNcx = epub.spine.toc?.id;
    const itemNcx = idNcx ? epub.manifest[idNcx] : undefined;
    if (!itemNcx?.href) {
      return [];
    }

    const conteudo = await this.lerArquivoDoZip(epub, itemNcx.href);
    const $ = cheerio.load(conteudo, { xmlMode: true });
    const diretorioNcx = path.posix.dirname(itemNcx.href);

    const resultado: Array<SecaoExtraida & { arvore: NoDaArvore }> = [];
    let ordem = 0;

    const caminhar = (
      pontosPai: ReturnType<typeof $>,
      nivel: number,
      parentId: string | null,
    ) => {
      pontosPai
        .children('navPoint')
        .toArray()
        .forEach((navPoint) => {
          const $ponto = $(navPoint);
          const titulo = $ponto
            .children('navLabel')
            .first()
            .children('text')
            .first()
            .text()
            .trim();
          const href = $ponto.children('content').first().attr('src');
          if (!href || !titulo) {
            return;
          }

          const id = randomUUID();
          resultado.push({
            id,
            parentId,
            ordem: ordem++,
            titulo,
            nivel,
            href: this.resolverHref(diretorioNcx, href),
            textoCompleto: '',
            arvore: { titulo, href },
          });

          caminhar($ponto, nivel + 1, id);
        });
    };

    caminhar($.root().find('navMap').first(), 1, null);
    return resultado;
  }

  private async preencherTextos(
    epub: EPub,
    nos: Array<SecaoExtraida & { arvore: NoDaArvore }>,
  ): Promise<SecaoExtraida[]> {
    const documentosPorArquivo = new Map<
      string,
      ReturnType<typeof cheerio.load>
    >();

    const obterDocumento = async (caminhoArquivo: string) => {
      let documento = documentosPorArquivo.get(caminhoArquivo);
      if (!documento) {
        const conteudo = await this.lerArquivoDoZip(epub, caminhoArquivo);
        documento = cheerio.load(conteudo, { xmlMode: true });
        documentosPorArquivo.set(caminhoArquivo, documento);
      }
      return documento;
    };

    const secoes: SecaoExtraida[] = [];

    for (const no of nos) {
      const [caminhoArquivo, fragmento] = no.href.split('#');
      const $ = await obterDocumento(caminhoArquivo);
      const alvo = fragmento ? $(`#${fragmento}`) : $('body');

      secoes.push({
        id: no.id,
        parentId: no.parentId,
        ordem: no.ordem,
        titulo: no.titulo,
        nivel: no.nivel,
        href: no.href,
        textoCompleto: this.extrairTextoProprio($, alvo),
      });
    }

    return secoes;
  }

  /**
   * Extrai o texto do elemento, preservando parágrafos, mas excluindo
   * qualquer `<section>` aninhada (que pertence a uma subseção filha, não a
   * esta).
   */
  private extrairTextoProprio(
    $: ReturnType<typeof cheerio.load>,
    alvo: ReturnType<typeof $>,
  ): string {
    const clone = alvo.clone();
    clone.find('section').remove();

    const paragrafos = clone
      .find('p')
      .toArray()
      .map((p) => $(p as AnyNode).text().trim())
      .filter((texto) => texto.length > 0);

    if (paragrafos.length > 0) {
      return paragrafos.join('\n\n');
    }

    return clone.text().replace(/\s+/g, ' ').trim();
  }
}
