import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configurarApp } from './../src/bootstrap';
import { EmbeddingsService } from './../src/embeddings/embeddings.service';
import { Book } from './../src/catalog/entities/book.entity';
import { Section } from './../src/catalog/entities/section.entity';

describe('Fase 1 — autenticação e catálogo (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let booksRepository: Repository<Book>;
  let sectionsRepository: Repository<Section>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmbeddingsService)
      .useValue({ onModuleInit: async () => undefined })
      .compile();

    app = moduleFixture.createNestApplication();
    configurarApp(app);
    await app.init();

    dataSource = moduleFixture.get(DataSource);
    booksRepository = dataSource.getRepository(Book);
    sectionsRepository = dataSource.getRepository(Section);

    await dataSource.query(
      'TRUNCATE TABLE "sections", "books", "users" RESTART IDENTITY CASCADE',
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('registro e login', () => {
    const email = 'aluna.fase1@teste.com';
    const senha = 'senha-forte-123';

    it('registra um aluno novo e devolve token + user', async () => {
      const resposta = await request(app.getHttpServer())
        .post('/api/v1/auth/registro')
        .send({ nome: 'Aluna Teste', email, senha })
        .expect(201);

      expect(resposta.body.token).toEqual(expect.any(String));
      expect(resposta.body.user).toMatchObject({ nome: 'Aluna Teste', email });
      expect(resposta.body.user.senhaHash).toBeUndefined();
    });

    it('recusa registro com e-mail já cadastrado', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/registro')
        .send({ nome: 'Outra Pessoa', email, senha })
        .expect(409);
    });

    it('faz login com as credenciais corretas', async () => {
      const resposta = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, senha })
        .expect(200);

      expect(resposta.body.token).toEqual(expect.any(String));
      expect(resposta.body.user.email).toBe(email);
    });

    it('recusa login com senha errada', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, senha: 'senha-errada' })
        .expect(401);
    });

    it('GET /me exige token', async () => {
      await request(app.getHttpServer()).get('/api/v1/me').expect(401);
    });

    it('GET /me retorna os dados do aluno autenticado', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, senha });

      const token = login.body.token as string;

      const resposta = await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(resposta.body).toMatchObject({ email });
    });
  });

  describe('catálogo', () => {
    let token: string;
    let livroId: string;
    const idsPorTitulo = new Map<string, string>();

    beforeAll(async () => {
      const registro = await request(app.getHttpServer())
        .post('/api/v1/auth/registro')
        .send({
          nome: 'Aluno Catálogo',
          email: 'aluno.catalogo@teste.com',
          senha: 'senha-forte-123',
        });
      token = registro.body.token as string;

      const livroPronto = await booksRepository.save(
        booksRepository.create({
          titulo: 'Livro de Teste da Oria',
          autor: 'Autoria de Teste',
          arquivoPath: '/acervo/livro-teste.epub',
          status: 'pronto',
        }),
      );
      livroId = livroPronto.id;

      await booksRepository.save(
        booksRepository.create({
          titulo: 'Livro Ainda Processando',
          autor: 'Autoria de Teste',
          arquivoPath: '/acervo/outro.epub',
          status: 'processando',
        }),
      );

      let ordem = 0;
      for (let capitulo = 1; capitulo <= 3; capitulo += 1) {
        const capituloSalvo = await sectionsRepository.save(
          sectionsRepository.create({
            bookId: livroId,
            ordem: ordem++,
            titulo: `Capítulo ${capitulo}`,
            nivel: 1,
            href: `cap${capitulo}.xhtml`,
            textoCompleto: `Texto do capítulo ${capitulo}.`,
          }),
        );
        idsPorTitulo.set(capituloSalvo.titulo, capituloSalvo.id);

        for (let subsecao = 1; subsecao <= 2; subsecao += 1) {
          const subsecaoSalva = await sectionsRepository.save(
            sectionsRepository.create({
              bookId: livroId,
              parentId: capituloSalvo.id,
              ordem: ordem++,
              titulo: `Capítulo ${capitulo}.${subsecao}`,
              nivel: 2,
              href: `cap${capitulo}.xhtml#sub${subsecao}`,
              textoCompleto: `Texto da subseção ${capitulo}.${subsecao}.`,
            }),
          );
          idsPorTitulo.set(subsecaoSalva.titulo, subsecaoSalva.id);
        }
      }
    });

    it('/livros sem token retorna 401', async () => {
      await request(app.getHttpServer()).get('/api/v1/livros').expect(401);
    });

    it('/livros lista só os livros com status pronto', async () => {
      const resposta = await request(app.getHttpServer())
        .get('/api/v1/livros')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const titulos = (resposta.body as Array<{ titulo: string }>).map(
        (livro) => livro.titulo,
      );
      expect(titulos).toContain('Livro de Teste da Oria');
      expect(titulos).not.toContain('Livro Ainda Processando');
    });

    it('/livros/:id/sumario devolve a árvore com três capítulos e duas subseções cada', async () => {
      const resposta = await request(app.getHttpServer())
        .get(`/api/v1/livros/${livroId}/sumario`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const sumario = resposta.body as Array<{
        titulo: string;
        filhas: Array<{ titulo: string }>;
      }>;

      expect(sumario).toHaveLength(3);
      for (const capitulo of sumario) {
        expect(capitulo.filhas).toHaveLength(2);
      }
      expect(sumario.map((c) => c.titulo)).toEqual([
        'Capítulo 1',
        'Capítulo 2',
        'Capítulo 3',
      ]);
    });

    it('/secoes/:id devolve anterior e próxima na sequência de leitura', async () => {
      const idSecaoMeio = idsPorTitulo.get('Capítulo 1.2')!;

      const resposta = await request(app.getHttpServer())
        .get(`/api/v1/secoes/${idSecaoMeio}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(resposta.body.titulo).toBe('Capítulo 1.2');
      expect(resposta.body.anterior.titulo).toBe('Capítulo 1.1');
      expect(resposta.body.proxima.titulo).toBe('Capítulo 2');
    });
  });
});
