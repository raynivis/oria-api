import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { configurarApp } from './../src/bootstrap';
import { Book } from './../src/catalog/entities/book.entity';
import { Section } from './../src/catalog/entities/section.entity';
import { LlmService } from './../src/llm/llm.service';

class LlmFalso {
  chamadas: Array<{ papel: string; variaveis: unknown }> = [];

  async completar(papel: string, variaveis: unknown): Promise<{ conteudo: string }> {
    this.chamadas.push({ papel, variaveis });
    return { conteudo: 'pista: o termo aparece ao lado de um exemplo no trecho.' };
  }
}

describe('Item 1.9 — vocabulário por contexto (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let llmFalso: LlmFalso;
  let tokenAluno: string;
  let secaoId: string;

  const http = () => request(app.getHttpServer());
  const autenticado = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    llmFalso = new LlmFalso();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LlmService)
      .useValue(llmFalso)
      .compile();

    app = moduleFixture.createNestApplication();
    configurarApp(app);
    await app.init();
    dataSource = moduleFixture.get(DataSource);

    const livro = await dataSource.getRepository(Book).save({
      titulo: 'Livro de vocabulário e2e',
      autor: 'Autor e2e',
      arquivoPath: `/tmp/vocabulario-e2e-${randomUUID()}.epub`,
      status: 'pronto',
    });
    const secao = await dataSource.getRepository(Section).save({
      bookId: livro.id,
      ordem: 1,
      titulo: 'Seção com jargão',
      nivel: 1,
      href: 'um.xhtml',
      textoCompleto: 'A educomunicação, por exemplo o rádio escolar, aproxima mídia e educação.',
    });
    secaoId = secao.id;

    const registro = await http()
      .post('/api/v1/auth/registro')
      .send({ nome: 'Aluno', email: `vocabulario-${randomUUID()}@teste.com`, senha: 'senha12345' })
      .expect(201);
    tokenAluno = registro.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('devolve pista de contexto, sem a definição pronta, sem exigir chamada anterior', async () => {
    const resposta = await http()
      .post(`/api/v1/secoes/${secaoId}/vocabulario`)
      .set(autenticado(tokenAluno))
      .send({
        termo: 'educomunicação',
        trecho: 'A educomunicação, por exemplo o rádio escolar, aproxima mídia e educação.',
      })
      .expect(201);

    expect(resposta.body.conteudo).toBe('pista: o termo aparece ao lado de um exemplo no trecho.');
    expect(resposta.body.promptVersao).toBe(1);
    expect(llmFalso.chamadas).toHaveLength(1);
    expect(llmFalso.chamadas[0].papel).toBe('vocabulario');
  });

  it('404 em seção inexistente', async () => {
    await http()
      .post(`/api/v1/secoes/${randomUUID()}/vocabulario`)
      .set(autenticado(tokenAluno))
      .send({ termo: 'x', trecho: 'y' })
      .expect(404);
  });

  it('400 com termo vazio', async () => {
    await http()
      .post(`/api/v1/secoes/${secaoId}/vocabulario`)
      .set(autenticado(tokenAluno))
      .send({ termo: '', trecho: 'y' })
      .expect(400);
  });

  it('401 sem token', async () => {
    await http()
      .post(`/api/v1/secoes/${secaoId}/vocabulario`)
      .send({ termo: 'x', trecho: 'y' })
      .expect(401);
  });
});
