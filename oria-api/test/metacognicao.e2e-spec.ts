import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { configurarApp } from './../src/bootstrap';
import { Attempt } from './../src/questoes/entities/attempt.entity';
import { Book } from './../src/catalog/entities/book.entity';
import { Question } from './../src/questoes/entities/question.entity';
import { QuestionSet } from './../src/questoes/entities/question-set.entity';
import { Section } from './../src/catalog/entities/section.entity';

describe('Fase 9 — metacognição e reportes (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let tokenAluno: string;
  let secaoId: string;

  const http = () => request(app.getHttpServer());
  const autenticado = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configurarApp(app);
    await app.init();
    dataSource = moduleFixture.get(DataSource);

    const registro = await http()
      .post('/api/v1/auth/registro')
      .send({ nome: 'Aluno', email: `metacog-${randomUUID()}@teste.com`, senha: 'senha12345' })
      .expect(201);
    tokenAluno = registro.body.token;
    const userId = registro.body.user.id as string;

    const livro = await dataSource.getRepository(Book).save({
      titulo: 'Livro de metacognição e2e',
      autor: 'Autor e2e',
      arquivoPath: `/tmp/metacog-e2e-${randomUUID()}.epub`,
      status: 'pronto',
    });
    const secao = await dataSource.getRepository(Section).save({
      bookId: livro.id,
      ordem: 1,
      titulo: 'Seção de metacognição',
      nivel: 1,
      href: 'secao.xhtml',
      textoCompleto: 'texto qualquer',
    });
    secaoId = secao.id;

    const conjunto = await dataSource.getRepository(QuestionSet).save({
      userId,
      sectionId: secao.id,
      promptVersao: 1,
      modelo: 'teste',
    });
    const questao = await dataSource.getRepository(Question).save({
      setId: conjunto.id,
      enunciado: 'Pergunta',
      respostaReferencia: 'Resposta',
      chunksFonte: [],
      ordem: 0,
    });
    // Duas tentativas encerradas com 3 e 3 passos: média = 3, igual ao aceite da fase.
    await dataSource.getRepository(Attempt).save([
      {
        questionId: questao.id,
        userId,
        estado: 'resolvida',
        nPassos: 3,
        respostaInicial: 'r1',
        encerradaEm: new Date(),
      },
      {
        questionId: questao.id,
        userId,
        estado: 'abandonada',
        nPassos: 3,
        respostaInicial: 'r2',
        encerradaEm: new Date(),
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET antes de qualquer registro devolve lista vazia', async () => {
    const resposta = await http()
      .get(`/api/v1/secoes/${secaoId}/metacognicao`)
      .set(autenticado(tokenAluno))
      .expect(200);
    expect(resposta.body).toEqual([]);
  });

  it('confiança 85 com média de 3 passos sinaliza ilusão e traz observação', async () => {
    const resposta = await http()
      .post(`/api/v1/secoes/${secaoId}/metacognicao`)
      .set(autenticado(tokenAluno))
      .send({ oQueAprendi: 'O ciclo da água', oQueDuvido: 'A condensação', confianca: 85 })
      .expect(201);

    expect(resposta.body.sinalizouIlusao).toBe(true);
    expect(resposta.body.observacaoIa).toContain('85%');
    expect(resposta.body.observacaoIa).toContain('3.0 passos');
    expect(resposta.body.observacaoIa).toContain('Seção de metacognição');
  });

  it('confiança 40 com a mesma média de passos não sinaliza', async () => {
    const resposta = await http()
      .post(`/api/v1/secoes/${secaoId}/metacognicao`)
      .set(autenticado(tokenAluno))
      .send({ oQueAprendi: 'x', oQueDuvido: 'y', confianca: 40 })
      .expect(201);

    expect(resposta.body.sinalizouIlusao).toBe(false);
    expect(resposta.body.observacaoIa).toBeNull();
  });

  it('GET da seção lista os dois registros, mais recente primeiro', async () => {
    const resposta = await http()
      .get(`/api/v1/secoes/${secaoId}/metacognicao`)
      .set(autenticado(tokenAluno))
      .expect(200);

    expect(resposta.body).toHaveLength(2);
    expect(resposta.body.map((r: { confianca: number }) => r.confianca)).toEqual([40, 85]);
  });

  it('GET /me/metacognicao traz os registros com o título da seção', async () => {
    const resposta = await http()
      .get('/api/v1/me/metacognicao')
      .set(autenticado(tokenAluno))
      .expect(200);

    expect(resposta.body).toHaveLength(2);
    expect(resposta.body[0].tituloSecao).toBe('Seção de metacognição');
  });

  it('404 para seção inexistente', async () => {
    await http()
      .post('/api/v1/secoes/00000000-0000-4000-8000-000000000000/metacognicao')
      .set(autenticado(tokenAluno))
      .send({ oQueAprendi: 'x', oQueDuvido: 'y', confianca: 50 })
      .expect(404);
  });

  it('cria e lista um reporte de erro', async () => {
    const criado = await http()
      .post('/api/v1/reportes')
      .set(autenticado(tokenAluno))
      .send({
        alvoTipo: 'fichamento',
        alvoId: '11111111-1111-4111-8111-111111111111',
        descricao: 'O rascunho citou um conceito que não está no texto.',
      })
      .expect(201);

    expect(criado.body.status).toBe('aberto');

    const lista = await http()
      .get('/api/v1/me/reportes')
      .set(autenticado(tokenAluno))
      .expect(200);
    expect(lista.body.map((r: { id: string }) => r.id)).toContain(criado.body.id);
  });
});
