import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { EmbeddingsService } from './../src/embeddings/embeddings.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Sem os serviços de infraestrutura no ar, o boot real do
      // EmbeddingsService (validação de dimensão via chamada ao TEI) travaria
      // este teste. Ele é exercitado à parte em embeddings.service.spec.ts.
      .overrideProvider(EmbeddingsService)
      .useValue({ onModuleInit: async () => undefined })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  afterEach(async () => {
    await app.close();
  });
});
