import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import * as path from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configurarApp } from './../src/bootstrap';
import { Book } from './../src/catalog/entities/book.entity';
import { Section } from './../src/catalog/entities/section.entity';

const ADMIN_API_KEY = 'chave-admin-de-teste';
const FIXTURE_VALIDO = path.join(
  __dirname,
  'fixtures/livro-teste.epub',
);
const FIXTURE_CORROMPIDO = path.join(
  __dirname,
  'fixtures/livro-corrompido.epub',
);

async function aguardarJob(
  app: INestApplication<App>,
  jobId: string,
  timeoutMs = 60000,
): Promise<string> {
  const inicio = Date.now();

  while (Date.now() - inicio < timeoutMs) {
    const resposta = await request(app.getHttpServer())
      .get(`/api/v1/admin/jobs/${jobId}`)
      .set('x-admin-api-key', ADMIN_API_KEY);

    const estado = resposta.body.estado as string;
    if (estado === 'completed' || estado === 'failed') {
      return estado;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Job ${jobId} não terminou em ${timeoutMs}ms`);
}

describe('Fase 2 — ingestão de EPUB (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let booksRepository: Repository<Book>;
  let sectionsRepository: Repository<Section>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configurarApp(app);
    await app.init();

    dataSource = moduleFixture.get(DataSource);
    booksRepository = dataSource.getRepository(Book);
    sectionsRepository = dataSource.getRepository(Section);

    await dataSource.query(
      'TRUNCATE TABLE "chunks", "sections", "books" RESTART IDENTITY CASCADE',
    );
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  it('recusa ingestão sem a chave de admin', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/livros/ingerir')
      .send({ arquivoPath: FIXTURE_VALIDO })
      .expect(401);
  });

  it('ingere o fixture: 3 capítulos, 6 subseções, chunks com vetor', async () => {
    const enfileirado = await request(app.getHttpServer())
      .post('/api/v1/admin/livros/ingerir')
      .set('x-admin-api-key', ADMIN_API_KEY)
      .send({ arquivoPath: FIXTURE_VALIDO })
      .expect(201);

    const jobId = enfileirado.body.jobId as string;
    const estado = await aguardarJob(app, jobId);
    expect(estado).toBe('completed');

    const livro = await booksRepository.findOneByOrFail({
      arquivoPath: FIXTURE_VALIDO,
    });
    expect(livro.status).toBe('pronto');
    expect(livro.titulo).toBe('Livro de Teste da Oria');
    expect(livro.autor).toBe('Autoria de Teste');

    const secoes = await sectionsRepository.find({
      where: { bookId: livro.id },
    });
    expect(secoes).toHaveLength(9);

    const capitulos = secoes.filter((s) => s.parentId === null);
    expect(capitulos).toHaveLength(3);
    const subsecoes = secoes.filter((s) => s.parentId !== null);
    expect(subsecoes).toHaveLength(6);

    const chunksNulos = await dataSource.query(
      `SELECT count(*)::int AS total FROM chunks c
       JOIN sections s ON s."id" = c."sectionId"
       WHERE s."bookId" = $1 AND c.embedding IS NULL`,
      [livro.id],
    );
    expect(chunksNulos[0].total).toBe(0);

    const totalChunks = await dataSource.query(
      `SELECT count(*)::int AS total FROM chunks c
       JOIN sections s ON s."id" = c."sectionId"
       WHERE s."bookId" = $1`,
      [livro.id],
    );
    expect(totalChunks[0].total).toBeGreaterThan(0);

    for (const secao of secoes) {
      const chunksDaSecao: Array<{ texto: string }> = await dataSource.query(
        `SELECT texto FROM chunks WHERE "sectionId" = $1`,
        [secao.id],
      );
      for (const chunk of chunksDaSecao) {
        expect(secao.textoCompleto).toContain(chunk.texto.split('\n\n')[0]);
      }
    }
  }, 60000);

  it('reingerir o mesmo arquivo não duplica o livro', async () => {
    const enfileirado = await request(app.getHttpServer())
      .post('/api/v1/admin/livros/ingerir')
      .set('x-admin-api-key', ADMIN_API_KEY)
      .send({ arquivoPath: FIXTURE_VALIDO })
      .expect(201);

    const estado = await aguardarJob(app, enfileirado.body.jobId as string);
    expect(estado).toBe('completed');

    const livros = await booksRepository.find({
      where: { arquivoPath: FIXTURE_VALIDO },
    });
    expect(livros).toHaveLength(1);

    const secoes = await sectionsRepository.find({
      where: { bookId: livros[0].id },
    });
    expect(secoes).toHaveLength(9);
  }, 60000);

  it('EPUB corrompido marca status erro sem derrubar o worker', async () => {
    const enfileirado = await request(app.getHttpServer())
      .post('/api/v1/admin/livros/ingerir')
      .set('x-admin-api-key', ADMIN_API_KEY)
      .send({ arquivoPath: FIXTURE_CORROMPIDO })
      .expect(201);

    const estado = await aguardarJob(app, enfileirado.body.jobId as string);
    expect(estado).toBe('failed');

    const livro = await booksRepository.findOneByOrFail({
      arquivoPath: FIXTURE_CORROMPIDO,
    });
    expect(livro.status).toBe('erro');
    expect(livro.erroMensagem).toBeTruthy();

    // O worker continua respondendo a novos jobs depois da falha.
    const saudavel = await request(app.getHttpServer())
      .post('/api/v1/admin/livros/ingerir')
      .set('x-admin-api-key', ADMIN_API_KEY)
      .send({ arquivoPath: FIXTURE_VALIDO })
      .expect(201);
    const estadoSeguinte = await aguardarJob(
      app,
      saudavel.body.jobId as string,
    );
    expect(estadoSeguinte).toBe('completed');
  }, 90000);
});
