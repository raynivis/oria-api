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

/**
 * LLM substituído por um fake determinístico: o juiz decide pelo marcador
 * "CORRETA" na justificativa. Aqui se testa a máquina de estados e os guardrails,
 * não a qualidade do modelo — isso fica para a validação ao vivo.
 */
class LlmFalso {
  chamadas: string[] = [];
  falharHintIntermediario = false;

  async completar(
    papel: string,
    variaveis: Record<string, any>,
  ): Promise<Record<string, unknown>> {
    this.chamadas.push(papel);

    if (papel === 'concepts') {
      return {
        conceitos: [
          { nome: 'Substituição de perguntas', descricaoCurta: 'Troca de uma pergunta por outra.' },
          { nome: 'Ligação com o capítulo anterior', descricaoCurta: 'Relação entre seções.' },
          { nome: 'Conceito sem questão', descricaoCurta: 'Nenhuma questão o testa.' },
        ],
      };
    }

    if (papel === 'questions') {
      const conceitos = variaveis.conceitos as Array<{ id: string; nome: string }>;
      const porNome = (nome: string) => conceitos.find((c) => c.nome === nome)!.id;
      return {
        questoes: [
          {
            enunciado: 'Pergunta A',
            respostaReferencia: 'Resposta A',
            conceitoIds: [porNome('Substituição de perguntas')],
            trechosFonte: [],
          },
          {
            enunciado: 'Pergunta B',
            respostaReferencia: 'Resposta B',
            conceitoIds: [porNome('Ligação com o capítulo anterior')],
            trechosFonte: [],
          },
        ],
      };
    }

    if (papel === 'hint') {
      const tipo = variaveis.tipo as string;
      if (this.falharHintIntermediario && tipo !== 'resolucao') {
        throw new Error('falha simulada');
      }
      return { conteudo: `Texto do passo ${tipo}`, entregouResolucao: tipo === 'resolucao' };
    }

    if (papel === 'avaliacao') {
      return { suficiente: (variaveis.justificativa as string).includes('CORRETA') };
    }

    throw new Error(`Papel não previsto no fake: ${papel}`);
  }
}

function chaves(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    return valor.flatMap(chaves);
  }
  if (valor && typeof valor === 'object') {
    return Object.entries(valor).flatMap(([chave, filho]) => [chave, ...chaves(filho)]);
  }
  return [];
}

const SEM_VEREDITO = (corpo: unknown) =>
  expect(chaves(corpo).some((chave) => /corret|suficiente|avalia/i.test(chave))).toBe(false);

describe('Fase 7 — questões e fluxo step-based (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let llmFalso: LlmFalso;
  let tokenAluno: string;
  let tokenOutroAluno: string;
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
      titulo: 'Livro de questões e2e',
      autor: 'Autor e2e',
      arquivoPath: `/tmp/questoes-e2e-${randomUUID()}.epub`,
      status: 'pronto',
    });
    const secao = await dataSource.getRepository(Section).save({
      bookId: livro.id,
      ordem: 1,
      titulo: 'Seção de questões',
      nivel: 1,
      href: 'secao.xhtml',
      textoCompleto:
        'Este é um texto de seção suficientemente longo para que a extração de conceitos seja chamada pelo serviço, com conteúdo sobre substituição de perguntas e ligação com o capítulo anterior.',
    });
    secaoId = secao.id;

    const registro = await http()
      .post('/api/v1/auth/registro')
      .send({ nome: 'Aluno', email: `questoes-${randomUUID()}@teste.com`, senha: 'senha12345' })
      .expect(201);
    tokenAluno = registro.body.token;

    const outro = await http()
      .post('/api/v1/auth/registro')
      .send({ nome: 'Outro', email: `outro-${randomUUID()}@teste.com`, senha: 'senha12345' })
      .expect(201);
    tokenOutroAluno = outro.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  let conjuntoId: string;
  let questaoA: string;
  let questaoB: string;
  let tentativaA: string;
  let tentativaBAberta: string;
  let tentativaBDesistida: string;

  it('gera o conjunto de questões sem expor a resposta de referência', async () => {
    const resposta = await http()
      .post(`/api/v1/secoes/${secaoId}/questoes`)
      .set(autenticado(tokenAluno))
      .send({})
      .expect(201);

    conjuntoId = resposta.body.id;
    expect(resposta.body.questoes).toHaveLength(2);
    expect(JSON.stringify(resposta.body)).not.toContain('respostaReferencia');
    expect(JSON.stringify(resposta.body)).not.toContain('Resposta A');

    questaoA = resposta.body.questoes.find((q: { enunciado: string }) => q.enunciado === 'Pergunta A').id;
    questaoB = resposta.body.questoes.find((q: { enunciado: string }) => q.enunciado === 'Pergunta B').id;
  });

  it('extrai conceitos uma única vez por seção (cache)', async () => {
    await http()
      .post(`/api/v1/secoes/${secaoId}/questoes`)
      .set(autenticado(tokenAluno))
      .send({})
      .expect(201);

    expect(llmFalso.chamadas.filter((p) => p === 'concepts')).toHaveLength(1);

    const conceitos = await http()
      .get(`/api/v1/secoes/${secaoId}/conceitos`)
      .set(autenticado(tokenAluno))
      .expect(200);
    expect(conceitos.body).toHaveLength(3);
  });

  it('estado aberta: a primeira tentativa devolve só o pedido de justificativa, sem veredito', async () => {
    const resposta = await http()
      .post(`/api/v1/questoes/${questaoA}/tentativas`)
      .set(autenticado(tokenAluno))
      .send({ resposta: 'minha primeira resposta' })
      .expect(201);

    tentativaA = resposta.body.id;
    expect(resposta.body.estado).toBe('aberta');
    expect(resposta.body.nPassos).toBe(1);
    expect(resposta.body.passos).toEqual([
      expect.objectContaining({ numero: 1, tipo: 'pedido_justificativa' }),
    ]);
    SEM_VEREDITO(resposta.body);
  });

  it('resolvida com 1 passo: justificativa suficiente encerra sem resolução', async () => {
    const resposta = await http()
      .post(`/api/v1/tentativas/${tentativaA}/passos`)
      .set(autenticado(tokenAluno))
      .send({ tipo: 'justificativa_aluno', conteudo: 'CORRETA: está no trecho inicial' })
      .expect(201);

    expect(resposta.body.estado).toBe('resolvida');
    expect(resposta.body.nPassos).toBe(1);
    expect(resposta.body.encerradaEm).not.toBeNull();
    expect(resposta.body.passos.map((p: { tipo: string }) => p.tipo)).toEqual([
      'pedido_justificativa',
      'justificativa_aluno',
    ]);
    SEM_VEREDITO(resposta.body);
  });

  it('em_passos: justificativa insuficiente gera dica conceitual, sem veredito', async () => {
    const inicio = await http()
      .post(`/api/v1/questoes/${questaoB}/tentativas`)
      .set(autenticado(tokenAluno))
      .send({ resposta: 'segunda resposta' })
      .expect(201);
    tentativaBAberta = inicio.body.id;

    const resposta = await http()
      .post(`/api/v1/tentativas/${tentativaBAberta}/passos`)
      .set(autenticado(tokenAluno))
      .send({ tipo: 'justificativa_aluno', conteudo: 'acho que é isso' })
      .expect(201);

    expect(resposta.body.estado).toBe('em_passos');
    expect(resposta.body.nPassos).toBe(2);
    expect(resposta.body.passos.at(-1).tipo).toBe('dica_conceitual');
    SEM_VEREDITO(resposta.body);
  });

  it('pedir resolução antes do terceiro passo retorna 400', async () => {
    await http()
      .post(`/api/v1/tentativas/${tentativaBAberta}/passos`)
      .set(autenticado(tokenAluno))
      .send({ tipo: 'resolucao' })
      .expect(400);
  });

  it('terceiro passo: justificativa insuficiente gera dica localizada, e a resolução continua bloqueada', async () => {
    const resposta = await http()
      .post(`/api/v1/tentativas/${tentativaBAberta}/passos`)
      .set(autenticado(tokenAluno))
      .send({ tipo: 'justificativa_aluno', conteudo: 'ainda não tenho certeza' })
      .expect(201);

    expect(resposta.body.nPassos).toBe(3);
    expect(resposta.body.passos.at(-1).tipo).toBe('dica_localizada');
    expect(resposta.body.estado).toBe('em_passos');
  });

  it('recarregar a tentativa preserva o contador e a ordem da trilha', async () => {
    const resposta = await http()
      .get(`/api/v1/tentativas/${tentativaBAberta}`)
      .set(autenticado(tokenAluno))
      .expect(200);

    expect(resposta.body.nPassos).toBe(3);
    expect(resposta.body.passos.map((p: { numero: number }) => p.numero)).toEqual([1, 2, 3, 4, 5]);
    expect(resposta.body.passos.map((p: { tipo: string }) => p.tipo)).toEqual([
      'pedido_justificativa',
      'justificativa_aluno',
      'dica_conceitual',
      'justificativa_aluno',
      'dica_localizada',
    ]);
  });

  it('acertar depois do terceiro passo encerra com resolução comentada', async () => {
    const resposta = await http()
      .post(`/api/v1/tentativas/${tentativaBAberta}/passos`)
      .set(autenticado(tokenAluno))
      .send({ tipo: 'justificativa_aluno', conteudo: 'CORRETA: agora sim' })
      .expect(201);

    expect(resposta.body.estado).toBe('resolvida');
    expect(resposta.body.passos.at(-1).tipo).toBe('resolucao');
    expect(resposta.body.nPassos).toBe(3);
  });

  it('abandonada: desistir libera a resolução', async () => {
    const inicio = await http()
      .post(`/api/v1/questoes/${questaoB}/tentativas`)
      .set(autenticado(tokenAluno))
      .send({ resposta: 'terceira resposta' })
      .expect(201);
    tentativaBDesistida = inicio.body.id;

    const resposta = await http()
      .post(`/api/v1/tentativas/${tentativaBDesistida}/desistir`)
      .set(autenticado(tokenAluno))
      .expect(200);

    expect(resposta.body.estado).toBe('abandonada');
    expect(resposta.body.passos.at(-1).tipo).toBe('resolucao');
  });

  it('tentativa encerrada não aceita novos passos', async () => {
    await http()
      .post(`/api/v1/tentativas/${tentativaA}/passos`)
      .set(autenticado(tokenAluno))
      .send({ tipo: 'justificativa_aluno', conteudo: 'mais uma' })
      .expect(400);
  });

  it('tentativa de outro aluno não é acessível', async () => {
    await http()
      .get(`/api/v1/tentativas/${tentativaA}`)
      .set(autenticado(tokenOutroAluno))
      .expect(404);
  });

  it('/me/conceitos: dominado vem de 1 passo, a revisar de 3 passos ou desistência, sem tentativa não aparece', async () => {
    const resposta = await http()
      .get('/api/v1/me/conceitos')
      .set(autenticado(tokenAluno))
      .expect(200);

    const nomes = (lista: Array<{ nome: string }>) => lista.map((c) => c.nome);
    expect(nomes(resposta.body.dominados)).toEqual(['Substituição de perguntas']);
    expect(nomes(resposta.body.aRevisar)).toEqual(['Ligação com o capítulo anterior']);
    expect(JSON.stringify(resposta.body)).not.toContain('Conceito sem questão');
    SEM_VEREDITO(resposta.body);
  });

  it('falha do LLM num passo intermediário usa o fallback neutro e a tentativa segue', async () => {
    const inicio = await http()
      .post(`/api/v1/questoes/${questaoA}/tentativas`)
      .set(autenticado(tokenAluno))
      .send({ resposta: 'quarta resposta' })
      .expect(201);

    llmFalso.falharHintIntermediario = true;
    try {
      const resposta = await http()
        .post(`/api/v1/tentativas/${inicio.body.id}/passos`)
        .set(autenticado(tokenAluno))
        .send({ tipo: 'justificativa_aluno', conteudo: 'errada' })
        .expect(201);

      expect(resposta.body.estado).toBe('em_passos');
      expect(resposta.body.passos.at(-1)).toMatchObject({
        tipo: 'dica_conceitual',
        conteudo: 'Tente reformular sua resposta com base no que leu.',
      });
    } finally {
      llmFalso.falharHintIntermediario = false;
    }
  });

  it('conjunto e tentativas mantêm a ordem de criação e o id do conjunto', async () => {
    const resposta = await http()
      .get(`/api/v1/conjuntos/${conjuntoId}`)
      .set(autenticado(tokenAluno))
      .expect(200);
    expect(resposta.body.questoes.map((q: { ordem: number }) => q.ordem)).toEqual([0, 1]);
  });
});
