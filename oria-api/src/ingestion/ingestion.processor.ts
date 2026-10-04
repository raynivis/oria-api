import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { Book } from '../catalog/entities/book.entity';
import { Chunk } from '../catalog/entities/chunk.entity';
import { Section } from '../catalog/entities/section.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { ChunkingService } from './chunking.service';
import { EpubParserService } from './epub-parser.service';
import { FILA_INGESTAO, IngestaoJobData } from './ingestion.constants';

const TAMANHO_LOTE_EMBEDDINGS = 32;

@Processor(FILA_INGESTAO)
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
    @InjectRepository(Section)
    private readonly sectionsRepository: Repository<Section>,
    @InjectRepository(Chunk)
    private readonly chunksRepository: Repository<Chunk>,
    private readonly epubParserService: EpubParserService,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingsService: EmbeddingsService,
  ) {
    super();
  }

  async process(job: Job<IngestaoJobData>): Promise<void> {
    const livro = await this.booksRepository.findOneByOrFail({
      id: job.data.bookId,
    });

    try {
      const extraido = await this.epubParserService.parse(livro.arquivoPath);

      await this.sectionsRepository.delete({ bookId: livro.id });

      const secoes = extraido.secoes.map((secao) =>
        this.sectionsRepository.create({
          id: secao.id,
          bookId: livro.id,
          parentId: secao.parentId ?? undefined,
          ordem: secao.ordem,
          titulo: secao.titulo,
          nivel: secao.nivel,
          href: secao.href,
          textoCompleto: secao.textoCompleto,
        }),
      );
      await this.sectionsRepository.save(secoes);

      for (const secao of extraido.secoes) {
        await this.gerarChunksDaSecao(secao.id, secao.href, secao.textoCompleto);
      }

      livro.titulo = extraido.titulo;
      livro.autor = extraido.autor;
      livro.isbn = extraido.isbn;
      livro.status = 'pronto';
      livro.erroMensagem = undefined;
      await this.booksRepository.save(livro);
    } catch (erro) {
      const mensagem =
        erro instanceof Error ? erro.message : 'Erro desconhecido na ingestão.';
      this.logger.error(
        `Falha ao ingerir o livro ${livro.id} (${livro.arquivoPath}): ${mensagem}`,
      );

      livro.status = 'erro';
      livro.erroMensagem = mensagem;
      await this.booksRepository.save(livro);

      throw erro;
    }
  }

  private async gerarChunksDaSecao(
    sectionId: string,
    ancoraCfi: string,
    textoCompleto: string,
  ): Promise<void> {
    const trechos = this.chunkingService.dividir(textoCompleto);
    if (trechos.length === 0) {
      return;
    }

    for (
      let inicio = 0;
      inicio < trechos.length;
      inicio += TAMANHO_LOTE_EMBEDDINGS
    ) {
      const lote = trechos.slice(inicio, inicio + TAMANHO_LOTE_EMBEDDINGS);
      const vetores = await this.embeddingsService.embedPassages(
        lote.map((trecho) => trecho.texto),
      );

      const chunks = lote.map((trecho, indice) =>
        this.chunksRepository.create({
          sectionId,
          ordem: inicio + indice,
          texto: trecho.texto,
          embedding: `[${vetores[indice].join(',')}]`,
          ancoraCfi,
          tokens: trecho.tokens,
        }),
      );
      await this.chunksRepository.save(chunks);
    }
  }
}
