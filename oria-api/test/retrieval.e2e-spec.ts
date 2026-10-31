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
import { RetrievalService } from './../src/retrieval/retrieval.service';

const ADMIN_API_KEY = 'chave-admin-de-teste';
const FIXTURE_VALIDO = path.join(__dirname, 'fixtures/livro-teste.epub');

describe('Fase 3 — recuperação (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let booksRepository: Repository<Book>;
  let sectionsRepository: Repository<Section>;
  let retrievalService: RetrievalService;

  let secoesPorTitulo: Map<string, Section>;

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
    retrievalService = moduleFixture.get(RetrievalService);

    const enfileirado = await request(app.getHttpServer())
      .post('/api/v1/admin/livros/ingerir')
      .set('x-admin-api-key', ADMIN_API_KEY)
      .send({ arquivoPath: FIXTURE_VALIDO })
      .expect(201);

    const jobId = enfileirado.body.jobId as string;
    const inicio = Date.now();
    let estado = '';
    while (Date.now() - inicio < 60000) {
      const resposta = await request(app.getHttpServer())
        .get(`/api/v1/admin/jobs/${jobId}`)
        .set('x-admin-api-key', ADMIN_API_KEY);
      estado = resposta.body.estado as string;
      if (estado === 'completed' || estado === 'failed') {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (estado !== 'completed') {
      throw new Error(`Ingestão do fixture não completou (estado: ${estado})`);
    }

    const livro = await booksRepository.findOneByOrFail({
      arquivoPath: FIXTURE_VALIDO,
    });
    const secoes = await sectionsRepository.find({
      where: { bookId: livro.id },
    });
    secoesPorTitulo = new Map(secoes.map((s) => [s.titulo, s]));
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  it('busca sobre tema presente retorna chunks da seção correta', async () => {
    const secao1_1 = secoesPorTitulo.get('Capítulo 1.1')!;

    const resultado = await retrievalService.buscar(
      secao1_1.id,
      'Como as plantas produzem energia a partir da luz do sol?',
    );

    expect(resultado.length).toBeGreaterThan(0);
    for (const chunk of resultado) {
      expect(chunk.sectionId).toBe(secao1_1.id);
      expect(chunk.score).toBeGreaterThanOrEqual(0.72);
    }
  }, 30000);

  it('busca sobre tema ausente do fixture retorna lista vazia', async () => {
    const secao3_2 = secoesPorTitulo.get('Capítulo 3.2')!;

    const resultado = await retrievalService.buscar(
      secao3_2.id,
      'Qual a melhor receita de bolo de chocolate com cobertura de brigadeiro?',
    );

    expect(resultado).toEqual([]);
  }, 30000);

  it('nunca retorna chunks de seções posteriores à atual', async () => {
    // Capítulo 1.1 é sobre fotossíntese; o tema de aprendizado de máquina só
    // aparece no Capítulo 3.1, que vem depois na ordem de leitura.
    const secao1_1 = secoesPorTitulo.get('Capítulo 1.1')!;

    const resultado = await retrievalService.buscar(
      secao1_1.id,
      'O que é aprendizado de máquina e como algoritmos aprendem padrões?',
    );

    expect(resultado).toEqual([]);
  }, 30000);

  it('seção posterior enxerga chunks de seções anteriores do mesmo livro', async () => {
    // Capítulo 3.1 (aprendizado de máquina) vem depois do Capítulo 1.1
    // (fotossíntese) na ordem de leitura — a pergunta sobre fotossíntese
    // ainda deve achar o chunk da seção 1.1.
    const secao1_1 = secoesPorTitulo.get('Capítulo 1.1')!;
    const secao3_1 = secoesPorTitulo.get('Capítulo 3.1')!;

    const resultado = await retrievalService.buscar(
      secao3_1.id,
      'Como as plantas produzem energia a partir da luz do sol?',
    );

    expect(resultado.length).toBeGreaterThan(0);
    expect(resultado.every((chunk) => chunk.sectionId === secao1_1.id)).toBe(
      true,
    );
  }, 30000);
});
