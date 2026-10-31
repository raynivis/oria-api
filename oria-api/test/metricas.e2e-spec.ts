import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { configurarApp } from './../src/bootstrap';
import { LlmCall } from './../src/llm/entities/llm-call.entity';

const ADMIN_API_KEY = 'chave-admin-de-teste';

describe('Fase 10 — métricas administrativas (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configurarApp(app);
    await app.init();
    dataSource = moduleFixture.get(DataSource);

    const llmCalls = dataSource.getRepository(LlmCall);
    const base = Date.now();
    await llmCalls.save(
      Array.from({ length: 5 }, (_, i) => ({
        papel: `teste-metricas-${randomUUID()}`,
        modelo: 'modelo-de-teste',
        promptVersao: 1,
        entradaCompleta: '[]',
        saidaBruta: '{}',
        tokensIn: i,
        tokensOut: i * 2,
        custo: 0,
        duracaoMs: 100 + i,
        sucesso: true,
        criadoEm: new Date(base + i * 1000),
      })),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('exige a chave de administração', async () => {
    await http().get('/api/v1/admin/metricas/ultimas-chamadas').expect(401);
  });

  it('devolve as últimas chamadas em ordem decrescente de criadoEm', async () => {
    const resposta = await http()
      .get('/api/v1/admin/metricas/ultimas-chamadas?limite=3')
      .set('x-admin-api-key', ADMIN_API_KEY)
      .expect(200);

    expect(resposta.body).toHaveLength(3);
    const datas = resposta.body.map((c: { criadoEm: string }) => new Date(c.criadoEm).getTime());
    expect(datas).toEqual([...datas].sort((a, b) => b - a));
    expect(resposta.body[0]).toHaveProperty('papel');
    expect(resposta.body[0]).toHaveProperty('tokensIn');
    expect(resposta.body[0]).toHaveProperty('custo');
  });

  it('limite inválido cai no padrão de 20, e acima do máximo é limitado a 200', async () => {
    const comLimiteInvalido = await http()
      .get('/api/v1/admin/metricas/ultimas-chamadas?limite=abc')
      .set('x-admin-api-key', ADMIN_API_KEY)
      .expect(200);
    expect(comLimiteInvalido.body.length).toBeLessThanOrEqual(20);

    const comLimiteExcessivo = await http()
      .get('/api/v1/admin/metricas/ultimas-chamadas?limite=99999')
      .set('x-admin-api-key', ADMIN_API_KEY)
      .expect(200);
    expect(comLimiteExcessivo.body.length).toBeLessThanOrEqual(200);
  });
});
