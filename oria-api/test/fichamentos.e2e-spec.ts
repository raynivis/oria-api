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

const CONTEUDO_IA =
  '## Ideia central\n\nTexto gerado pela IA com bastante conteúdo repetido para passar do mínimo de duzentos caracteres exigido pelo schema de validação do fichamento.';

class LlmFalso {
  chamadas = 0;

  async completar(): Promise<{ conteudo: string }> {
    this.chamadas++;
    return { conteudo: CONTEUDO_IA };
  }
}

async function aguardarStatusPronto(
  app: INestApplication<App>,
  token: string,
  fichamentoId: string,
  timeoutMs = 20000,
): Promise<string> {
  const inicio = Date.now();
  while (Date.now() - inicio < timeoutMs) {
    const resposta = await request(app.getHttpServer())
      .get(`/api/v1/fichamentos/${fichamentoId}`)
      .set('Authorization', `Bearer ${token}`);
    if (resposta.body.statusGeracao !== 'pendente') {
      return resposta.body.statusGeracao as string;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Fichamento ${fichamentoId} não terminou em ${timeoutMs}ms`);
}

describe('Itens 2.1/2.4/2.5/2.6/2.9 — fichamentos (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let llmFalso: LlmFalso;
  let token: string;
  let secaoAId: string;
  let secaoBId: string;

  const http = () => request(app.getHttpServer());
  const autenticado = (t: string) => ({ Authorization: `Bearer ${t}` });

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
      titulo: 'Livro de fichamento e2e',
      autor: 'Autor e2e',
      arquivoPath: `/tmp/fichamento-e2e-${randomUUID()}.epub`,
      status: 'pronto',
    });
    const secoes = dataSource.getRepository(Section);
    const secaoA = await secoes.save({
      bookId: livro.id,
      ordem: 1,
      titulo: 'Seção A',
      nivel: 1,
      href: 'a.xhtml',
      textoCompleto: 'Texto completo da seção A, sobre educomunicação.',
    });
    const secaoB = await secoes.save({
      bookId: livro.id,
      ordem: 2,
      titulo: 'Seção B',
      nivel: 1,
      href: 'b.xhtml',
      textoCompleto: 'Texto completo da seção B, sem relação com o termo buscado.',
    });
    secaoAId = secaoA.id;
    secaoBId = secaoB.id;

    const registro = await http()
      .post('/api/v1/auth/registro')
      .send({ nome: 'Aluno', email: `fichamento-${randomUUID()}@teste.com`, senha: 'senha12345' })
      .expect(201);
    token = registro.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  let fichamentoAId: string;

  it('[2.4] geração síncrona devolve título do livro, título/id da seção e o trecho original', async () => {
    const resposta = await http()
      .post(`/api/v1/secoes/${secaoAId}/fichamento`)
      .set(autenticado(token))
      .send({
        trechoCfi: 'epubcfi(/6/4!/4/2)',
        trechoTexto: 'Um trecho qualquer sobre educomunicação.',
      })
      .expect(201);

    fichamentoAId = resposta.body.id;
    expect(resposta.body.tituloLivro).toBe('Livro de fichamento e2e');
    expect(resposta.body.tituloSecao).toBe('Seção A');
    expect(resposta.body.sectionId).toBe(secaoAId);
    expect(resposta.body.trechoTexto).toBe('Um trecho qualquer sobre educomunicação.');
    expect(resposta.body.statusGeracao).toBe('pronto');
    expect(resposta.body.conteudo).toBe(CONTEUDO_IA);
  });

  it('[2.6] listagem filtra por sectionId e por texto, e expõe criadoEm/trechoPreview', async () => {
    await http()
      .post(`/api/v1/secoes/${secaoBId}/fichamento`)
      .set(autenticado(token))
      .send({ trechoCfi: 'epubcfi(/6/6!/4/2)', trechoTexto: 'Trecho qualquer, sem relação.' })
      .expect(201);

    const porSecao = await http()
      .get(`/api/v1/me/fichamentos?sectionId=${secaoAId}`)
      .set(autenticado(token))
      .expect(200);
    expect(porSecao.body.every((f: { sectionId: string }) => f.sectionId === secaoAId)).toBe(true);
    expect(porSecao.body[0].criadoEm).toBeTruthy();
    expect(porSecao.body[0].trechoPreview).toBe('Um trecho qualquer sobre educomunicação.');

    const porTexto = await http()
      .get('/api/v1/me/fichamentos?texto=educomunicação')
      .set(autenticado(token))
      .expect(200);
    expect(porTexto.body.map((f: { id: string }) => f.id)).toContain(fichamentoAId);
    expect(
      porTexto.body.every((f: { sectionId: string }) => f.sectionId === secaoAId),
    ).toBe(true);
  });

  it('[2.9] exporta uma única ficha, diferente do exportador em massa', async () => {
    const unico = await http()
      .get(`/api/v1/fichamentos/${fichamentoAId}/exportar`)
      .set(autenticado(token))
      .expect(200);
    expect(unico.headers['content-type']).toContain('text/markdown');
    expect(unico.text).toContain('Seção A');
    expect(unico.text).not.toContain('Seção B');

    const emMassa = await http()
      .get('/api/v1/me/fichamentos/exportar')
      .set(autenticado(token))
      .expect(200);
    expect(emMassa.text).toContain('Seção A');
    expect(emMassa.text).toContain('Seção B');
  });

  it('[2.5] geração assíncrona: devolve pendente, enfileira, e GET /fichamentos/:id acompanha até pronto', async () => {
    const chamadasAntes = llmFalso.chamadas;

    const resposta = await http()
      .post(`/api/v1/secoes/${secaoAId}/fichamento/assincrono`)
      .set(autenticado(token))
      .send({ trechoCfi: 'epubcfi(/6/4!/4/99)', trechoTexto: 'Outro trecho qualquer.' })
      .expect(201);

    expect(resposta.body.statusGeracao).toBe('pendente');
    expect(resposta.body.conteudo).toBe('');

    const estadoFinal = await aguardarStatusPronto(app, token, resposta.body.id);
    expect(estadoFinal).toBe('pronto');
    expect(llmFalso.chamadas).toBeGreaterThan(chamadasAntes);

    const final = await http()
      .get(`/api/v1/fichamentos/${resposta.body.id}`)
      .set(autenticado(token))
      .expect(200);
    expect(final.body.conteudo).toBe(CONTEUDO_IA);
  });

  it('[2.5] a rota síncrona original continua com o mesmo formato de sempre (contrato aditivo)', async () => {
    const resposta = await http()
      .post(`/api/v1/secoes/${secaoAId}/fichamento`)
      .set(autenticado(token))
      .send({})
      .expect(201);

    expect(resposta.body.statusGeracao).toBe('pronto');
    expect(typeof resposta.body.conteudo).toBe('string');
    expect(resposta.body.conteudo.length).toBeGreaterThan(0);
  });
});
