# Tutora Oria — plano de implementação do backend

Execução em onze fases. Cada fase tem escopo fechado, critério de aceite
verificável e dependências explícitas. Leia `CLAUDE.md` antes de começar; as
cinco regras de lá valem para todas as fases.

Prompts dos papéis de LLM ficam em `PROMPTS.md`.

---

## Antes de tudo: o problema do acervo

O acervo definitivo ainda não existe. Isso **não bloqueia** a implementação,
desde que o desenvolvimento seja feito contra dois materiais de teste criados
agora:

**Fixture sintético** — `test/fixtures/livro-teste.epub`, gerado por script, com
três capítulos e duas subseções cada, texto curto e previsível. É contra ele que
os testes automatizados rodam. Precisa ser determinístico: teste que depende de
livro real de 400 páginas é lento e frágil.

Crie `scripts/gerar-fixture-epub.ts` que monta o EPUB programaticamente
(`container.xml`, OPF com spine, `nav.xhtml`, três XHTML de capítulo). Um EPUB
válido é um ZIP com `mimetype` não comprimido na primeira entrada.

**Livro real de desenvolvimento** — um EPUB qualquer, bem estruturado, para
testar volume e casos reais de marcação. Serve qualquer título de domínio
público. Não precisa ser o do teste com alunos, e não deve ser versionado no
repositório: coloque em `acervo/` e adicione ao `.gitignore`.

Quando os títulos definitivos forem decididos, basta colocá-los em `acervo/` e
rodar o seed. Nada de código muda.

---

## Fase 0 — Fundação

**Objetivo.** Ambiente completo no ar, sem regra de negócio.

Tarefas:

1. `nest new oria-api`, TypeScript estrito (`strict: true`, `strictNullChecks`).
2. `docker-compose.yml` com quatro serviços: `db` (pgvector/pgvector:pg16),
   `redis`, `embeddings` (ghcr.io/huggingface/text-embeddings-inference:cpu-1.5,
   modelo `intfloat/multilingual-e5-base`), `api`.
3. `init/01-extensions.sql` com `CREATE EXTENSION IF NOT EXISTS vector;`.
4. `ConfigModule` global com validação de env por Joi ou Zod. Aplicação não sobe
   com variável faltando.
5. `HealthController` em `GET /health`, verificando Postgres, Redis e TEI.
6. `EmbeddingsService` com `embedPassages()`, `embedQuery()` e validação de
   dimensão no `onModuleInit`.
7. Filtro global de exceções e `ValidationPipe` global com `whitelist: true`.

Variáveis de ambiente:

```
DATABASE_URL, REDIS_URL, EMBEDDINGS_URL, EMBEDDINGS_DIM=768
OPENROUTER_API_KEY, OPENROUTER_BASE_URL
LLM_DIALOGUE_MODEL, LLM_HINT_MODEL, LLM_FICHAMENTO_MODEL
LLM_PANORAMA_MODEL, LLM_QUESTIONS_MODEL, LLM_CONCEPTS_MODEL
JWT_SECRET, JWT_EXPIRES_IN=7d
ATTEMPT_MAX_STEPS=3
METACOG_CONFIANCA_MIN=70, METACOG_PASSOS_MIN=2.5
RETRIEVAL_LIMIAR=0.82, RETRIEVAL_TOP_K=6
ADMIN_API_KEY
```

`VALIDACAO_MODELO`, `VALIDACAO_PROVIDER` e `VALIDACAO_SEED` (ver `VALIDATION.md`
§2) não entram aqui: são consumidas só pelos scripts de `scripts/validacao/` da
Fase 10, não pelo boot da aplicação.

**Aceite.** `docker compose up` sobe tudo. `GET /health` retorna 200 com os três
serviços em `ok`. Derrubar o TEI faz o health acusar. Subir com
`EMBEDDINGS_DIM=384` derruba a API no boot com mensagem clara.

---

## Fase 1 — Autenticação e catálogo

**Objetivo.** Aluno se registra, faz login e lista o acervo.

Entidades:

```ts
User      id uuid, nome, email unique, senhaHash, criadoEm
Book      id uuid, titulo, autor, arquivoPath, isbn?,
          status: 'pendente'|'processando'|'pronto'|'erro',
          erroMensagem?, criadoEm
Section   id uuid, bookId FK, parentId FK self?, ordem int,
          titulo, nivel int, href, textoCompleto text
```

`Section` é árvore por `parentId`. Índice composto em `(bookId, ordem)`.

Endpoints:

```
POST /api/v1/auth/registro      { nome, email, senha } -> { token, user }
POST /api/v1/auth/login         { email, senha } -> { token, user }
GET  /api/v1/me                 -> dados do aluno
GET  /api/v1/livros             -> lista, só status 'pronto'
GET  /api/v1/livros/:id         -> metadados
GET  /api/v1/livros/:id/sumario -> árvore aninhada de seções
GET  /api/v1/secoes/:id         -> { titulo, textoCompleto, livro, anterior, proxima }
```

JWT via `@nestjs/jwt` e `passport-jwt`. Guard global, com `@Public()` para
registro, login e health. Senha com `argon2` ou `bcrypt`.

O sumário retorna árvore montada em memória a partir da lista plana, não com
consulta recursiva. O acervo é pequeno.

**Aceite.** Registro, login e acesso autenticado funcionam. `/livros` sem token
retorna 401. `/livros/:id/sumario` devolve hierarquia aninhada correta para o
fixture, com três capítulos e duas subseções cada.

---

## Fase 2 — Ingestão de EPUB

**Objetivo.** Transformar EPUB em seções e chunks vetorizados. Nenhuma chamada de
LLM nesta fase.

Entidade:

```ts
Chunk     id uuid, sectionId FK, ordem int, texto text,
          embedding vector(768), ancoraCfi, tokens int
```

Índice: `CREATE INDEX ON chunk USING hnsw (embedding vector_cosine_ops);`

Pipeline, no worker BullMQ (`fila: ingestao`):

1. Descompactar o EPUB em diretório temporário.
2. Ler `META-INF/container.xml`, localizar o OPF.
3. Ler o `spine` (ordem de leitura) e o `manifest`.
4. Ler `nav.xhtml` (EPUB 3) ou `toc.ncx` (EPUB 2) e montar a árvore de `Section`
   com `parentId`, `ordem`, `nivel`, `href`. **A hierarquia vem do arquivo, não
   de heurística nem de LLM.**
5. Para cada seção, extrair texto do XHTML preservando parágrafos, com `cheerio`.
6. Chunking: agrupar parágrafos até ~500 tokens, **sem atravessar fronteira de
   seção**. Guardar `ancoraCfi` apontando para o elemento de origem.
7. `embedPassages()` em lotes de 32, gravar vetores.
8. `Book.status = 'pronto'`.

Endpoints:

```
POST /api/v1/admin/livros/ingerir   { arquivoPath } -> { jobId }
GET  /api/v1/admin/jobs/:jobId      -> status do processamento
```

Rota administrativa, protegida por `ADMIN_API_KEY` (chave de ambiente simples,
comparada direto, sem usuário/senha). Não há painel
docente no escopo; isso é ferramenta de operação.

Adicione `npm run seed`, que ingere tudo que estiver em `acervo/`.

**Aceite.** Ingerir o fixture cria 3 capítulos, 6 subseções e chunks com vetor
não nulo. Nenhum chunk contém texto de duas seções diferentes. Reingerir o mesmo
livro não duplica registros. EPUB corrompido marca `status = 'erro'` com
mensagem, sem derrubar o worker.

---

## Fase 3 — Recuperação

**Objetivo.** Busca semântica restrita, base de tudo que envolve LLM.

`RetrievalService.buscar(secaoId, consulta, opcoes)`:

- vetoriza a consulta com `embedQuery()`;
- busca por similaridade de cosseno **restrita à seção atual e às anteriores já
  lidas pelo aluno** — nunca ao livro inteiro;
- aplica `RETRIEVAL_LIMIAR`;
- retorna no máximo `RETRIEVAL_TOP_K` chunks, com score.

Se nenhum chunk passar do limiar, retorna lista vazia. **Isso não é erro**: é o
sinal que dispara a recusa da tutora. A regra 2 do `CLAUDE.md` depende disso.

**Aceite.** Consulta sobre tema presente no fixture retorna chunks da seção
correta. Consulta sobre tema ausente retorna lista vazia. Chunks de seções
posteriores à atual nunca aparecem.

---

## Fase 4 — Camada LLM e panorama

**Objetivo.** Primeira integração com modelo, no papel mais simples.

`LlmService` expõe um método por papel, nunca por modelo:

```ts
completar<T>(papel: PapelLlm, variaveis: object, schema: ZodSchema<T>): Promise<T>
```

Responsabilidades:

- resolver o modelo pela env correspondente ao papel;
- montar o prompt a partir de `src/prompts/templates/<papel>.ts`;
- exigir saída estruturada e validar com Zod; em falha de schema, uma nova
  tentativa, depois erro;
- registrar em `LlmCall`: papel, modelo, versão do prompt, tokens de entrada e
  saída, custo, duração.

```ts
LlmCall   id, papel, modelo, promptVersao,
          entradaCompleta text, saidaBruta text,
          temperatura numeric?, seed int?, provider text?,
          tokensIn, tokensOut, custo numeric, duracaoMs,
          sucesso bool, criadoEm
```

`entradaCompleta` e `saidaBruta` guardam o prompt como foi enviado e a resposta
como veio. Não são log de depuração: são a fonte primária da validação do TCC e
o conteúdo do Apêndice A. Ver `VALIDATION.md`.

`LlmService.completar()` precisa aceitar `temperature`, `seed` e `provider` como
opcionais e repassá-los ao OpenRouter. Durante a validação eles são fixados; em
uso normal ficam ausentes.

Panorama:

```ts
Panorama  id, sectionId FK unique, niveis jsonb, tempoEstimadoMin int,
          promptVersao, modelo, criadoEm
```

```
GET /api/v1/secoes/:id/panorama
```

Gera na primeira chamada, cacheia para sempre. É por seção, não por aluno.

Formato de `niveis` (quatro itens, nesta ordem):

```json
[
  { "rotulo": "Ideia mais geral",  "titulo": "...", "texto": "..." },
  { "rotulo": "Mecanismo central", "titulo": "...", "texto": "..." },
  { "rotulo": "Consequência",      "titulo": "...", "texto": "..." },
  { "rotulo": "Casos específicos", "titulo": "...", "texto": "..." }
]
```

A ordem do geral ao específico é a diferenciação progressiva de Ausubel, via
Moreira (1999). Não é estilo: é o conteúdo teórico da tela.

**Aceite.** Primeira chamada gera e persiste; segunda vem do cache sem tocar no
LLM. Saída sempre com exatamente quatro níveis na ordem correta. `LlmCall`
registra a chamada com custo.

---

## Fase 5 — Fichamento

**Objetivo.** O artefato de estudo do aluno. É a contribuição principal do
sistema.

```ts
Fichamento        id, userId FK, sectionId FK, trechoCfi text?,
                  criadoEm, atualizadoEm
                  unique(userId, sectionId, trechoCfi), com índice parcial
                  garantindo no máximo um registro de trechoCfi nulo (a ficha
                  da seção inteira) por aluno e seção
FichamentoVersao  id, fichamentoId FK, numero int, conteudo text,
                  origem: 'ia'|'aluno', promptVersao?, modelo?, criadoEm
```

```
POST   /api/v1/secoes/:id/fichamento     { trechoCfi?, trechoTexto? } -> gera rascunho (versão 1, origem 'ia')
GET    /api/v1/fichamentos/:id           última versão + metadados
PATCH  /api/v1/fichamentos/:id           { conteudo } -> nova versão, origem 'aluno'
GET    /api/v1/fichamentos/:id/versoes   histórico completo
DELETE /api/v1/fichamentos/:id
GET    /api/v1/me/fichamentos            biblioteca pessoal, filtro por livro
GET    /api/v1/me/fichamentos/exportar   markdown (?formato=md) ou PDF
```

Sem corpo, `POST .../fichamento` gera o fichamento da seção inteira — é o
"resumo" da Avaliação A e o passo 11 do Cenário 1 de `SCENARIOS.md`. Com
`trechoCfi`/`trechoTexto`, gera uma ficha ancorada naquele recorte: mesmo
endpoint, mesmo prompt `fichamento`, recebendo o trecho em vez do texto
completo da seção como entrada. É o que sustenta o Cenário 2 (fichas por
trecho) e a distinção de tarefas da Avaliação A (`SCENARIOS.md`, divergência 4).
Cada combinação de seção + trecho é um `Fichamento` separado, com sua própria
trilha de versões.

`PATCH` **nunca** faz update no conteúdo: sempre insere nova `FichamentoVersao`
com `numero = max + 1`. Um `UPDATE` aqui destrói o dado de pesquisa.

Inclua no DTO de saída as estatísticas de elaboração:

```json
{
  "caracteresIa": 1240,
  "caracteresAluno": 890,
  "proporcaoAluno": 0.418
}
```

Calculadas por diff entre a última versão de origem `ia` e a versão atual. É a
métrica de elaboração ativa do Capítulo 5, e sai de graça aqui.

**Aceite.** Três `PATCH` sucessivos produzem versões 2, 3 e 4, todas
recuperáveis. Nenhum `UPDATE` em `conteudo` existe no código. A exportação em
markdown abre corretamente. `proporcaoAluno` bate com contagem manual num caso
de teste. Gerar fichamento de dois trechos diferentes na mesma seção produz
dois `Fichamento` distintos, cada um com sua própria trilha de versões.

---

## Fase 6 — Telemetria

**Objetivo.** Instrumentar antes das telas que geram mais dado. Vem antes das
questões de propósito.

**Escopo reduzido.** A validação do TCC é formativa e artificial, sem
participantes (`VALIDATION.md`), e não consome telemetria de aluno. Implemente o
essencial: a entidade, o endpoint de lote e as consultas. O esforço maior fica
para o `LlmCall` da Fase 4, que é o que a validação de fato usa. Os eventos
continuam valendo para o Cenário C e para o experimento futuro.

```ts
ReadingEvent  id, userId FK, sectionId FK?, tipo, payload jsonb, criadoEm
```

Tipos: `abriu`, `fechou`, `rolou`, `abriu_panorama`, `gerou_fichamento`,
`editou_fichamento`, `respondeu`, `pediu_dica`, `desistiu`, `clicou_citacao`,
`registrou_metacognicao`.

```
POST /api/v1/eventos      { eventos: [...] }   recebe lote
GET  /api/v1/me/progresso  seções lidas, fichamentos, tentativas
```

O endpoint aceita lote porque o cliente acumula e envia a cada 30s. Idempotência
por `(userId, tipo, sectionId, criadoEm)` truncado ao segundo, para o caso de
reenvio.

Crie também `src/telemetry/consultas.sql` com as consultas de análise, úteis ao
experimento futuro:

- adesão: proporção de alunos com ao menos um fichamento;
- elaboração: proporção de fichamentos com origem `aluno`;
- razão média entre caracteres do aluno e da IA;
- média de passos antes da resolução;
- taxa de desistência sobre total de tentativas;
- uso por semana;
- divergência entre confiança declarada e passos consumidos;
- proporção de citações clicadas.

**Aceite.** Lote de 50 eventos grava em uma transação. Reenvio do mesmo lote não
duplica. As consultas rodam sem erro contra o banco de desenvolvimento.

---

## Fase 7 — Questões e fluxo step-based

**Objetivo.** O núcleo pedagógico. É a fase que sustenta a seção 2.2 do TCC.

```ts
Conceito         id, sectionId FK, nome, descricaoCurta, criadoEm
QuestionSet      id, sectionId FK, userId FK, promptVersao, modelo, criadoEm
Question         id, setId FK, enunciado, respostaReferencia,
                 chunksFonte uuid[], ordem
QuestionConceito questionId FK, conceitoId FK          (N:N)
Attempt          id, questionId FK, userId FK,
                 estado: 'aberta'|'em_passos'|'resolvida'|'abandonada',
                 nPassos int, respostaInicial, criadaEm, encerradaEm?
AttemptStep      id, attemptId FK, numero int,
                 tipo: 'pedido_justificativa'|'dica_conceitual'|
                       'dica_localizada'|'justificativa_aluno'|'resolucao',
                 conteudo, criadoEm
```

A extração de conceitos roda na **ingestão** (estenda a Fase 2 quando chegar
aqui), uma chamada por seção, cacheada. O prompt de `questions` recebe a lista de
conceitos da seção e indica quais cada questão testa.

`conceitoIds` é opcional e restringe a geração a um subconjunto dos conceitos da
seção. Omitido, usa todos. É o que sustenta "gerar nova rodada sobre os
conceitos que ficaram como 'a revisar'" (`VALIDATION.md`, seção 8.2) — o cliente
consulta `/me/conceitos`, filtra os classificados como "a revisar" e repassa os
ids aqui. Não é adaptação automática por desempenho: dificuldade e foco
continuam sendo escolha explícita de quem chama o endpoint.

```
POST /api/v1/secoes/:id/questoes         { conceitoIds? } -> gera conjunto
GET  /api/v1/conjuntos/:id
POST /api/v1/questoes/:id/tentativas     { resposta } -> primeiro AttemptStep
POST /api/v1/tentativas/:id/passos       { tipo, conteudo? } -> próximo passo
GET  /api/v1/tentativas/:id              trilha completa
POST /api/v1/tentativas/:id/desistir     libera resolução
GET  /api/v1/secoes/:id/conceitos
GET  /api/v1/me/conceitos                dominados e a revisar
```

Máquina de estados, que o serviço deve impor:

| Passo | Tipo gerado | Papel LLM |
|---|---|---|
| 1 | `pedido_justificativa` | `hint` |
| 2 | `dica_conceitual` | `hint` |
| 3 | `dica_localizada` | `hint` |
| — | `resolucao` | `hint` |

Regras que o código precisa garantir:

- `POST /tentativas` **nunca** retorna acerto ou erro. Retorna o passo 1.
- A resolução só é gerada quando `nPassos >= ATTEMPT_MAX_STEPS` ou via
  `/desistir`. Tentar antes retorna 400.
- O contador vem de `count(AttemptStep)`, não do cliente.
- O DTO de saída dos passos intermediários **não contém** campo de correção.
  Nem `correto: null`. O campo não existe.

Classificação de conceitos, por consulta, sem LLM:

| Situação | Classificação |
|---|---|
| Questões do conceito resolvidas com 0 ou 1 passo | dominado |
| 2 ou 3 passos, ou desistência | a revisar |
| Sem tentativa registrada | não classificado, não aparece |

**Aceite.** Teste e2e percorre os cinco estados e verifica que nenhuma resposta
intermediária contém veredito. Pedir resolução no passo 2 retorna 400. Recarregar
a tentativa preserva o contador. Conceito sem tentativa não aparece em
`/me/conceitos`.

**Desvios registrados na implementação**

- **Juiz interno (papel `avaliacao`).** A especificação não dizia como
  "resolvida com 0 ou 1 passo" acontece sem veredito ao estudante. Decisão: um
  LLM compara a justificativa com a resposta de referência e grava o resultado
  em `attempt_steps.avaliacaoSuficiente`, que nunca sai na API. Prompt em
  `PROMPTS.md`, seção 7.
- **Quatro estados, não cinco.** O enum tem `aberta`, `em_passos`, `resolvida`
  e `abandonada`. O aceite menciona cinco; a contagem extra não tinha definição.
- **Extração de conceitos sob demanda.** Não roda na ingestão. Roda na primeira
  leitura de `/secoes/:id/conceitos` ou na geração de questões, com lock e cache
  por seção (`sections.conceitosExtraidosEm`). Motivo: ingestão que depende de
  LLM externo faria o livro cair em `erro` por queda de rede e tornaria os e2e
  de ingestão não determinísticos.
- **`nPassos` conta dicas entregues**, incluindo o pedido de justificativa inicial.
  Justificativas do estudante não contam. Mantido pelo servidor a cada passo.
- **Dificuldade não é parâmetro.** `POST /secoes/:id/questoes` aceita só
  `conceitoIds`, como especificado. Quantidade fixa em 5.
- **Classificação só considera tentativas encerradas** (`resolvida` ou
  `abandonada`). Tentativa em andamento não classifica o conceito ainda.

---

## Fase 8 — Diálogo com stream

**Objetivo.** A mediação conversacional, ancorada na seção.

```ts
Session  id, userId FK, sectionId FK, criadaEm, encerradaEm?
Message  id, sessionId FK, papel: 'aluno'|'tutora', conteudo,
         chunksCitados uuid[], encontrouBase bool,
         promptVersao?, modelo?, tokensIn?, tokensOut?, custo?, criadoEm
```

```
POST /api/v1/sessoes                { secaoId } -> sessão
POST /api/v1/sessoes/:id/mensagens  { conteudo } -> SSE
GET  /api/v1/sessoes/:id            histórico
GET  /api/v1/me/sessoes
```

A sessão nasce presa a `sectionId`. Não existe chat global: é o que diferencia a
Oria de um chatbot avulso.

O SSE emite três tipos de evento:

```
event: token     data: { "texto": "..." }
event: citacao   data: { "chunkId": "...", "trecho": "...", "ancoraCfi": "...", "secaoTitulo": "..." }
event: fim       data: { "messageId": "...", "encontrouBase": true }
```

Fluxo do handler:

1. `RetrievalService.buscar()` com a pergunta do aluno.
2. Se vier vazio: grava `Message` com `encontrouBase: false`, emite a recusa e
   encerra. **Não chama o LLM.** Economiza token e elimina a chance de o modelo
   responder do conhecimento geral.
3. Se vier com chunks: monta o prompt `dialogue` só com eles, faz streaming,
   emite `citacao` para cada chunk efetivamente referenciado.

**Aceite.** Pergunta sobre tema do fixture recebe resposta com ao menos uma
citação. Pergunta fora do material recebe recusa sem chamar o LLM — verificável
porque nenhum `LlmCall` é gravado. O stream fecha corretamente em caso de erro.

**Desvios registrados na implementação**

- **`POST` com stream, não `@Sse()`.** O decorator do Nest aceita só GET, e o
  endpoint de mensagens é POST. O stream é escrito à mão, com `text/event-stream`.
  Se o cliente fechar a conexão antes do fim, a chamada ao LLM é cancelada e o
  `LlmCall` fica com `sucesso = false` e a saída parcial.
- **Saída em texto puro, não JSON.** O schema `{resposta, chunksCitados, encontrouBase}`
  de `PROMPTS.md` não se valida em stream. As citações vêm dos marcadores `[n]`
  do texto. Ver `PROMPTS.md`, papel `dialogue`.
- **Evento `erro` adicionado.** Falha do LLM durante o stream emite `erro` e
  fecha o stream. Não grava mensagem da tutora. A mensagem do aluno já ficou
  salva antes, para não perder a pergunta.
- **`encontrouBase` é nulo nas mensagens do aluno.** Elas não passam pela
  recuperação, então o campo não se aplica a elas.
- **Recusa por recuperação vazia não chama o LLM.** Recusa que vem do modelo
  (quando os chunks não sustentam a resposta) chama o LLM normalmente e fica
  registrada em `LlmCall`.

---

## Fase 9 — Metacognição e reportes

**Objetivo.** Fechar o ciclo de monitoramento e o mecanismo de correção de erros.

```ts
Metacognicao  id, userId FK, sectionId FK, oQueAprendi text,
              oQueDuvido text, confianca int 0..100,
              observacaoIa text?, sinalizouIlusao bool, criadoEm
ErrorReport   id, userId FK, alvoTipo, alvoId, descricao,
              status: 'aberto'|'analisado'|'corrigido', criadoEm
```

```
POST /api/v1/secoes/:id/metacognicao
GET  /api/v1/secoes/:id/metacognicao
GET  /api/v1/me/metacognicao
POST /api/v1/reportes
GET  /api/v1/me/reportes
```

Detecção de ilusão de conhecimento, **determinística, sem LLM**:

```ts
const mediaPassos = await this.mediaPassosDaSecao(userId, sectionId);
const sinalizou =
  confianca >= Number(env.METACOG_CONFIANCA_MIN) &&
  mediaPassos >= Number(env.METACOG_PASSOS_MIN);
```

`sinalizouIlusao` grava a decisão no momento em que foi tomada. Se os limiares
mudarem depois, o histórico da coleta continua íntegro.

A observação é montada por template em código, não por modelo:

> Você declarou confiança de {confianca}%, mas precisou de {mediaPassos} passos
> em média nas questões desta seção. Vale reler {tituloSecao}.

Deixar a detecção de ilusão de conhecimento sujeita a alucinação seria ironia
cara.

`ErrorReport` é o Mecanismo de Correção de Erros de Siqueira et al. (2025). Sem
painel docente no escopo, o status é alterado direto no banco.

**Aceite.** Confiança 85 com média de 3 passos sinaliza; confiança 40 com a mesma
média não sinaliza. Alterar as envs não muda registros já gravados.

---

## Fase 10 — Instrumentação de validação

**Objetivo.** As entidades e scripts que a validação do TCC consome. Vem depois
das Fases 5, 7 e 8, porque a bateria da Avaliação A precisa de fichamento,
questões e diálogo todos gerando saída — não depende da Fase 9.

O conteúdo está em `VALIDATION.md`: entidades `Execucao`, `Tarefa`, `Saida`,
`CodigoCego` e `Pontuacao`, o modo linha de base e os sete scripts de
`scripts/validacao/`. O roteiro da Avaliação C — os quatro cenários, os 24
requisitos funcionais e a matriz de rastreabilidade — está em `SCENARIOS.md`.

**Antes da geração**, confirme com o orientador as quatro divergências marcadas
em `SCENARIOS.md` (seção "Divergências em relação ao roteiro original"): três já
vêm de `VALIDATION.md` §8 e foram aplicadas na reescrita dos cenários; a quarta
— `trechoCfi`/`trechoTexto` no endpoint de fichamento desta fase — é nova e
afeta a Fase 5, por isso já está refletida ali.

Inclua também a rota que a Avaliação C consome durante a demonstração:

```
GET /api/v1/admin/metricas/ultimas-chamadas?limite=20
```

Rota administrativa, protegida pela mesma chave da Fase 2. Retorna papel,
modelo, tokens, custo e duração das últimas `LlmCall`, para o autor registrar
tempo e tokens de cada passo dos cenários (`SCENARIOS.md`, seção "Registro por
passo").

**Aceite.** `npm run validacao:gerar-bateria` produz 60 saídas persistidas, com
entrada e saída completas. `npm run validacao:calcular-kappa` roda contra
pontuações de teste. `revelar.ts` recusa executar sem consenso registrado.
`GET /admin/metricas/ultimas-chamadas` retorna as últimas chamadas em ordem
decrescente de `criadoEm`, respeitando `limite`.

---

## Ordem e dependências

```
0 Fundação
└─ 1 Auth e catálogo
   └─ 2 Ingestão
      └─ 3 Recuperação
         ├─ 4 LLM e panorama
         │  └─ 5 Fichamento
         │     └─ 6 Telemetria
         │        ├─ 7 Questões e passos
         │        │  └─ 9 Metacognição
         │        └─ 8 Diálogo
```

A Fase 10 não cabe na árvore acima como um único ramo: ela precisa das Fases 5,
7 **e** 8 completas, não só da última da lista. A bateria da Avaliação A gera
saídas de `resumo`/`ficha` (Fase 5), `questoes` (Fase 7) e `pergunta_na_secao`/
`pergunta_ligacao`/`pergunta_fora` (Fase 8) — ela só roda depois que as três
convergirem. A Fase 9 não é pré-requisito dela.

Se o prazo apertar, as fases 0 a 6 já constituem um sistema defensável, que cobre
duas das três lacunas do Capítulo 2. A fase 7 é a que sustenta a seção 2.2 e é a
primeira que eu não cortaria.

---

## Como trabalhar cada fase com o Claude Code

Uma fase por sessão, nesta ordem:

1. Peça o plano da fase antes do código. Confira as entidades contra este
   documento.
2. Entidades e migration primeiro, depois serviço, depois controller, depois
   testes.
3. Ao final, rode `npm run lint && npm run test && npm run test:e2e` e só então
   passe para a próxima.
4. Commit por fase, mensagem em português, referenciando o número da fase.

Peça explicitamente os testes de cada critério de aceite. São eles que impedem
regressão nas cinco regras do `CLAUDE.md`, sobretudo a do step-based, que é a
mais fácil de quebrar sem perceber.
