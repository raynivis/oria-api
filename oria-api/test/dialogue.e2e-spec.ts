import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { configurarApp } from './../src/bootstrap';
import { Book } from './../src/catalog/entities/book.entity';
import { Chunk } from './../src/catalog/entities/chunk.entity';
import { Section } from './../src/catalog/entities/section.entity';
import { EmbeddingsService } from './../src/embeddings/embeddings.service';
import { LlmService } from './../src/llm/llm.service';
import { RECUSA_SEM_BASE } from './../src/prompts/templates/dialogue';

/** Stream falso: cita o primeiro trecho numerado. A busca é real (TEI + pgvector). */
class LlmFalso {
  chamadas = 0;
  falhar = false;

  async transmitir(
    _papel: string,
    _variaveis: unknown,
    aoReceberFatia: (fatia: string) => void,
    sinal?: AbortSignal,
  ): Promise<{ texto: string; tokensIn: number; tokensOut: number; custo: number; promptVersao: number; modelo: string }> {
    this.chamadas++;
    if (this.falhar) {
      throw new Error('falha simulada no stream');
    }
    const partes = ['A evaporação ', 'leva a água ao ar [1]. ', 'Isso alimenta o ciclo.'];
    for (const parte of partes) {
      if (sinal?.aborted) {
        throw new Error('cancelado');
      }
      aoReceberFatia(parte);
    }
    return {
      texto: partes.join(''),
      tokensIn: 10,
      tokensOut: 20,
      custo: 0,
      promptVersao: 1,
      modelo: 'falso',
    };
  }
}

function eventos(texto: string): Array<{ evento: string; dados: Record<string, unknown> }> {
  return texto
    .split('\n\n')
    .filter((bloco) => bloco.trim() !== '')
    .map((bloco) => {
      const evento = /^event: (.+)$/m.exec(bloco)![1];
      const dados = JSON.parse(/^data: (.+)$/m.exec(bloco)![1]) as Record<string, unknown>;
      return { evento, dados };
    });
}

describe('Fase 8 — diálogo com stream (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let llmFalso: LlmFalso;
  let tokenAluno: string;
  let tokenOutro: string;
  let secaoUmId: string;
  let secaoDoisId: string;
  let chunkEvaporacaoId: string;

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
    const embeddings = moduleFixture.get(EmbeddingsService);

    const livro = await dataSource.getRepository(Book).save({
      titulo: 'Livro de diálogo e2e',
      autor: 'Autor e2e',
      arquivoPath: `/tmp/dialogo-e2e-${randomUUID()}.epub`,
      status: 'pronto',
    });
    const secoes = dataSource.getRepository(Section);
    const secaoUm = await secoes.save({
      bookId: livro.id,
      ordem: 1,
      titulo: 'Seção Um',
      nivel: 1,
      href: 'um.xhtml',
      textoCompleto: 'texto da seção um',
    });
    const secaoDois = await secoes.save({
      bookId: livro.id,
      ordem: 2,
      titulo: 'Seção Dois',
      nivel: 1,
      href: 'dois.xhtml',
      textoCompleto: 'texto da seção dois',
    });
    secaoUmId = secaoUm.id;
    secaoDoisId = secaoDois.id;

    const textosSecaoUm = [
      'A evaporação transforma a água líquida em vapor, que sobe para a atmosfera.',
      'A condensação transforma o vapor em gotas que formam as nuvens.',
    ];
    const textosSecaoDois = ['A fotossíntese converte luz solar em energia química nas plantas.'];

    const vetoresUm = await embeddings.embedPassages(textosSecaoUm);
    const vetoresDois = await embeddings.embedPassages(textosSecaoDois);
    const chunks = dataSource.getRepository(Chunk);
    const [primeiro] = await chunks.save(
      textosSecaoUm.map((texto, indice) => ({
        sectionId: secaoUm.id,
        ordem: indice,
        texto,
        embedding: `[${vetoresUm[indice].join(',')}]`,
        ancoraCfi: `epubcfi(/6/4!/4/${indice + 2})`,
        tokens: 12,
      })),
    );
    chunkEvaporacaoId = primeiro.id;
    await chunks.save(
      textosSecaoDois.map((texto) => ({
        sectionId: secaoDois.id,
        ordem: 0,
        texto,
        embedding: `[${vetoresDois[0].join(',')}]`,
        ancoraCfi: 'epubcfi(/6/4!/4/2)',
        tokens: 12,
      })),
    );

    const registro = await http()
      .post('/api/v1/auth/registro')
      .send({ nome: 'Aluno', email: `dialogo-${randomUUID()}@teste.com`, senha: 'senha12345' })
      .expect(201);
    tokenAluno = registro.body.token;
    const outro = await http()
      .post('/api/v1/auth/registro')
      .send({ nome: 'Outro', email: `dialogo-outro-${randomUUID()}@teste.com`, senha: 'senha12345' })
      .expect(201);
    tokenOutro = outro.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  let sessaoId: string;

  it('cria sessão presa a uma seção', async () => {
    const resposta = await http()
      .post('/api/v1/sessoes')
      .set(autenticado(tokenAluno))
      .send({ secaoId: secaoUmId })
      .expect(201);
    sessaoId = resposta.body.id;
    expect(resposta.body.sectionId).toBe(secaoUmId);
  });

  it('pergunta com base no material: stream emite token, citação e fim nesta ordem', async () => {
    const resposta = await http()
      .post(`/api/v1/sessoes/${sessaoId}/mensagens`)
      .set(autenticado(tokenAluno))
      .send({ conteudo: 'Como a evaporação transforma a água?' })
      .expect(200);

    expect(resposta.headers['content-type']).toContain('text/event-stream');
    const lista = eventos(resposta.text);
    const nomes = lista.map((e) => e.evento);

    expect(nomes[0]).toBe('token');
    expect(nomes.indexOf('citacao')).toBeGreaterThan(nomes.indexOf('token'));
    expect(nomes.at(-1)).toBe('fim');

    const citacao = lista.find((e) => e.evento === 'citacao')!;
    expect(citacao.dados.chunkId).toBe(chunkEvaporacaoId);
    expect(citacao.dados.ancoraCfi).toBe('epubcfi(/6/4!/4/2)');
    expect(citacao.dados.secaoTitulo).toBe('Seção Um');

    expect(lista.at(-1)!.dados.encontrouBase).toBe(true);
  });

  it('a mensagem da tutora fica persistida com a citação e encontrouBase', async () => {
    const sessao = await http()
      .get(`/api/v1/sessoes/${sessaoId}`)
      .set(autenticado(tokenAluno))
      .expect(200);

    const tutora = sessao.body.mensagens.filter((m: { papel: string }) => m.papel === 'tutora').at(-1);
    expect(tutora.encontrouBase).toBe(true);
    expect(tutora.chunksCitados).toEqual([chunkEvaporacaoId]);
    expect(sessao.body.mensagens.map((m: { papel: string }) => m.papel)).toEqual(['aluno', 'tutora']);
  });

  it('pergunta fora do material: recusa explícita, sem chamar o LLM', async () => {
    const chamadasAntes = llmFalso.chamadas;

    const resposta = await http()
      .post(`/api/v1/sessoes/${sessaoId}/mensagens`)
      .set(autenticado(tokenAluno))
      .send({ conteudo: 'Quem foi Napoleão Bonaparte e quando governou a França?' })
      .expect(200);

    const lista = eventos(resposta.text);
    expect(lista.some((e) => e.evento === 'citacao')).toBe(false);
    expect(lista.find((e) => e.evento === 'token')!.dados.texto).toBe(RECUSA_SEM_BASE);
    expect(lista.at(-1)!.dados.encontrouBase).toBe(false);
    expect(llmFalso.chamadas).toBe(chamadasAntes);
  });

  it('pergunta que liga a um capítulo anterior cita chunk de seção já lida', async () => {
    const sessaoDois = await http()
      .post('/api/v1/sessoes')
      .set(autenticado(tokenAluno))
      .send({ secaoId: secaoDoisId })
      .expect(201);

    const resposta = await http()
      .post(`/api/v1/sessoes/${sessaoDois.body.id}/mensagens`)
      .set(autenticado(tokenAluno))
      .send({ conteudo: 'Como a evaporação transforma a água?' })
      .expect(200);

    const citacao = eventos(resposta.text).find((e) => e.evento === 'citacao')!;
    expect(citacao.dados.chunkId).toBe(chunkEvaporacaoId);
    expect(citacao.dados.secaoTitulo).toBe('Seção Um');
  });

  it('falha do LLM emite erro e fecha o stream, sem gravar resposta da tutora', async () => {
    llmFalso.falhar = true;
    try {
      const resposta = await http()
        .post(`/api/v1/sessoes/${sessaoId}/mensagens`)
        .set(autenticado(tokenAluno))
        .send({ conteudo: 'Como a evaporação transforma a água?' })
        .expect(200);

      const lista = eventos(resposta.text);
      expect(lista.at(-1)!.evento).toBe('erro');

      const sessao = await http()
        .get(`/api/v1/sessoes/${sessaoId}`)
        .set(autenticado(tokenAluno))
        .expect(200);
      expect(sessao.body.mensagens.at(-1).papel).toBe('aluno');
    } finally {
      llmFalso.falhar = false;
    }
  });

  it('sessão de outro aluno não é acessível', async () => {
    await http()
      .post(`/api/v1/sessoes/${sessaoId}/mensagens`)
      .set(autenticado(tokenOutro))
      .send({ conteudo: 'oi' })
      .expect(404);
    await http().get(`/api/v1/sessoes/${sessaoId}`).set(autenticado(tokenOutro)).expect(404);
  });

  it('/me/sessoes lista só as sessões do próprio aluno', async () => {
    const resposta = await http()
      .get('/api/v1/me/sessoes')
      .set(autenticado(tokenAluno))
      .expect(200);
    expect(resposta.body.map((s: { id: string }) => s.id)).toContain(sessaoId);

    const deOutro = await http()
      .get('/api/v1/me/sessoes')
      .set(autenticado(tokenOutro))
      .expect(200);
    expect(deOutro.body.map((s: { id: string }) => s.id)).not.toContain(sessaoId);
  });
});
