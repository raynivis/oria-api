# Tutora Oria — contexto do projeto

API de um tutor de leitura acadêmica para livros em EPUB. TCC de Sistemas de
Informação. NestJS + TypeORM + Postgres/pgvector + Redis, LLMs via OpenRouter,
embeddings locais via TEI.

Este arquivo é contexto permanente. O plano de execução está em
`IMPLEMENTATION.md`, os prompts em `PROMPTS.md`, o que a validação do TCC exige
do código em `VALIDATION.md` e o roteiro de demonstração (Avaliação C) em
`SCENARIOS.md`.

---

## O que este sistema é, e o que ele não pode ser

A Oria não é um chatbot acoplado a um leitor. Cada decisão técnica aqui deriva de
uma base pedagógica, e violá-la quebra o trabalho acadêmico inteiro, não só o
código. As cinco regras abaixo são inegociáveis.

**1. O tutor é step-based, nunca answer-based.**
Ao responder uma questão, o aluno jamais recebe "certo" ou "errado" de imediato.
Recebe um pedido de justificativa, depois uma dica conceitual, depois uma dica
localizada. Só após 3 passos (`ATTEMPT_MAX_STEPS`) a resolução é liberada. O
contador vive no banco, em `AttemptStep`, nunca no prompt nem no cliente.
Base: VanLehn (2011).

**2. Toda resposta da tutora é restrita ao material e carrega citação.**
O contexto do LLM contém apenas chunks recuperados do livro. Se a busca não
retornar chunk acima do limiar de similaridade, a resposta é uma recusa explícita
(`encontrou_base: false`), nunca conhecimento geral do modelo. Toda resposta
devolve `chunks_citados[]` com âncora CFI.
Base: Salminen et al. (2024), Yan et al. (2024).

**3. O fichamento pertence ao aluno e é versionado.**
`PATCH` nunca sobrescreve: cria nova `FichamentoVersao` com `origem = 'aluno'`. A
distinção entre texto da IA e texto do aluno é dado de pesquisa, não detalhe de
UI — alimenta a métrica de elaboração ativa do Capítulo 5.

**4. Nada de dado inventado.**
Se o banco não produz a informação, a API não a retorna. Vale especialmente para
conceitos: conceito sem tentativa registrada não entra em "dominado" nem em "a
revisar".

**5. Toda chamada de LLM é registrada por inteiro.**
Entrada completa, saída, modelo, versão de prompt, parâmetros, tokens, custo e
duração. Esses registros são a fonte primária da validação do TCC e compõem o
Apêndice A. Não é instrumentação opcional: é dado de pesquisa.
Base: metodologia DSR/FEDS, ver `VALIDATION.md`.

---

## Stack

| Camada | Escolha |
|---|---|
| Framework | NestJS 10, TypeScript estrito |
| ORM | TypeORM |
| Banco | Postgres 16 + pgvector |
| Fila | BullMQ sobre Redis |
| LLM | OpenRouter (OpenAI-compatible) |
| Embeddings | TEI local, `intfloat/multilingual-e5-base`, 768 dim |
| EPUB | `epub2` + `cheerio` |
| Validação | `class-validator` + `class-transformer` |
| Testes | Jest (unit) + Supertest (e2e) |

## Comandos

```bash
docker compose up -d          # sobe db, redis, embeddings
npm run start:dev             # API em watch
npm run migration:generate -- src/database/migrations/NomeDaMigration
npm run migration:run
npm run test                  # unit
npm run test:e2e              # e2e
npm run lint
npm run seed                  # popula acervo de desenvolvimento
```

## Convenções

- Idioma: código, nomes de variáveis e commits em português, exceto termos
  técnicos consagrados (`chunk`, `embedding`, `prompt`, `payload`).
- Todo endpoint tem DTO de entrada com `class-validator` e DTO de saída
  explícito. Nunca retornar entidade do TypeORM diretamente.
- Nenhum módulo chama o OpenRouter direto. Tudo passa por `LlmService`, que
  registra em `LlmCall` entrada completa, saída, modelo, versão de prompt,
  tokens e custo (regra 5).
- Prompts ficam em `src/prompts/templates/*.ts`, com constante `VERSAO` exportada.
  Toda saída gerada grava a versão usada.
- Migrations sempre versionadas. Nunca `synchronize: true`, nem em dev.
- Erros de domínio usam exceções do Nest (`BadRequestException`, etc.), com
  mensagem em português.

## Armadilhas conhecidas

- **Prefixos E5.** O modelo de embeddings exige `"query: "` antes da consulta e
  `"passage: "` antes do documento. Omitir não gera erro, só degrada a busca
  silenciosamente. `EmbeddingsService` encapsula isso em dois métodos; use-os.
- **Dimensão do vetor.** `EMBEDDINGS_DIM` precisa bater com o modelo servido. O
  `onModuleInit` valida no boot e derruba a aplicação se divergir.
- **Chunk não atravessa seção.** Chunk que cruza fronteira de capítulo produz
  citação incoerente.
- **`extrairTextoProprio` não pode remover `<section>` por nome de tag.**
  Editoras reais (ex.: EPUBs da SciELO Books) embrulham o capítulo inteiro
  num único `<section>` que não tem subseção nenhuma — remover todo
  `<section>` indiscriminadamente apaga o próprio conteúdo do capítulo, não só
  o de filhas. O fixture de teste nunca pegou esse caso porque lá só as
  subseções (não o capítulo-pai) usam `<section>`. A correção: remover apenas
  os ids de fragmento que correspondem a filhas reais na árvore de navegação
  (`idsDasFilhas` em `EpubParserService.preencherTextos`), nunca por nome de
  tag. Isso só apareceu ao ingerir o primeiro livro real do projeto — toda
  ingestão anterior tinha `textoCompleto` vazio sem erro nenhum, porque o bug
  não lança excessão, só devolve string vazia.
- **Ingestão de livro real precisa de `lockDuration` maior no BullMQ.** O
  fixture de teste é curto o bastante pra terminar bem dentro dos 30s padrão
  do BullMQ. Um livro real encadeia uma chamada ao serviço de embeddings por
  lote de trechos, seção após seção — minutos de processamento no total.
  `IngestionProcessor` usa `@Processor(FILA_INGESTAO, { lockDuration: 10 * 60 * 1000 })`.
  Sem isso, o job processa e grava tudo certo, mas o BullMQ marca o lock como
  expirado no meio do caminho e o endpoint `/admin/jobs/:jobId` nunca reporta
  `completed` (fica preso em `active`, com "Missing lock" no log) — os dados
  ficam corretos no banco, mas quem espera o job pelo endpoint trava.
- **Modelos pequenos truncam UUID.** No papel `questions`, o prompt pede pra
  ecoar o id do conceito (um UUID) em `conceitoIds`. Já foi visto, com um
  modelo `:free` pequeno, o modelo devolver só o primeiro segmento (ex.:
  `"f7d70af8"` em vez do UUID completo) — não é aleatório, é um padrão de
  truncamento consistente para tokens longos e opacos. `schemaQuestoes` não
  exige mais formato UUID (só string não vazia); `QuestoesService.
  resolverConceitoIds` casa primeiro por id exato, depois por prefixo contra
  os conceitos reais da seção, e descarta silenciosamente o que não resolve
  de nenhuma forma. Se outro papel algum dia tiver que ecoar um id de volta,
  esse é o padrão a repetir — não endurecer o schema esperando que o modelo
  seja preciso.
- **SSE com JWT.** `EventSource` não aceita header. O cliente consome o stream
  com `fetch` + `ReadableStream`. O endpoint de mensagens é `POST`, e o `@Sse()`
  do Nest só aceita GET, então o stream é escrito à mão com `text/event-stream`
  (`SessoesController.enviar`).
- **`epub2` não lê `nav.xhtml` (EPUB 3).** A lib só anda em `toc.ncx` (EPUB 2);
  `epub.toc`/`epub.ncx` ficam vazios em qualquer EPUB 3 puro, como o fixture da
  Fase 2. `EpubParserService` usa `epub2` só pra abrir o zip e ler
  manifest/spine; a árvore de `Section` é montada na mão com `cheerio`,
  andando no `nav.xhtml` (ou no `toc.ncx`, se não houver item com
  `properties="nav"` no manifesto).
- **Coluna `vector` e `migration:generate`.** O TypeORM não entende
  `USING hnsw`: toda vez que você gerar uma migration que mexe em qualquer
  tabela, ele tenta "corrigir" o índice HNSW do `chunk` de volta pra um índice
  comum, destruindo-o. Sempre revise a migration gerada e apague qualquer
  `DROP/CREATE INDEX` que toque em `IDX_chunks_embedding_hnsw` antes de rodar.
- **`RETRIEVAL_LIMIAR` não é 0,72 com `multilingual-e5-base`.** Medido direto
  contra o TEI: pares *sem relação nenhuma* de assunto cosine-similarizam na
  faixa de 0,72–0,79 com esse modelo (é característica conhecida da família
  E5 — o "chão" de similaridade é alto). Com 0,72 a busca da Fase 3 vira
  sopa de letrinha, retornando qualquer seção para qualquer pergunta. Medidas
  reais: par correto ~0,87–0,91; par errado, no máximo ~0,79. `0.82` (o
  default atual) fica no meio do caminho. Se trocar de modelo de embeddings,
  remeça essa calibração — não assuma o mesmo limiar.
- **Seção sem texto próprio não gera chunk.** Um capítulo cujo corpo inteiro
  mora nas subseções (nada fora delas) teria só o título como `textoCompleto`
  — "Capítulo 1" sozinho embeda com similaridade alta para qualquer consulta
  (embedding de poucas palavras tende ao centro do espaço vetorial) e vira
  falso positivo. `IngestionProcessor` pula o chunking de seções com menos de
  `TAMANHO_MINIMO_PARA_CHUNK` (40) caracteres de texto próprio.
- **Modelo `:free` do OpenRouter pode sumir de um dia para o outro.** O
  catálogo de modelos gratuitos muda sem aviso — um slug que funcionava ontem
  pode responder 404 ("model unavailable for free") ou 429 (rate limit do
  provedor upstream) hoje. Antes de rodar qualquer coisa contra o OpenRouter
  de verdade, confirme o modelo em `GET https://openrouter.ai/api/v1/models`
  (filtre por `id` terminando em `:free`) em vez de confiar num slug fixo nos
  exemplos. `LlmService` grava toda tentativa em `LlmCall` mesmo quando falha
  (inclusive 404/429), então essas falhas não se perdem — mas também não
  tentam adivinhar outro modelo sozinhas.
- **`npm run start:dev` e `npm run test:e2e` não podem rodar juntos — e
  "parar o dev server" não é só matar o processo do `npm`.** Os dois
  consomem a mesma fila BullMQ no mesmo Redis; o worker do dev server pega os
  jobs de ingestão dos testes e o e2e falha ("failed" ou preso em "pendente").
  O pulo do gato: `nest start --watch` não roda a aplicação no mesmo processo
  do Nest CLI — ele sobe uma árvore `npm → nest.js → cmd.exe → node dist/main`,
  e é esse último `node dist/main`, filho do `cmd.exe`, quem de fato escuta a
  porta e consome a fila. Matar só o `npm`/`nest.js` (os processos "visíveis"
  por nome de script) deixa esse filho vivo, invisível por nome de comando, e
  o sintoma volta mesmo depois de "parar" o servidor. No PowerShell, sempre
  mate a árvore inteira de uma vez:
  ```powershell
  Get-CimInstance Win32_Process -Filter "Name='node.exe' OR Name='cmd.exe'" |
    Where-Object { $_.CommandLine -match 'start:dev|nest\.js. start|dist\\main|oria-api' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  ```
  Depois de qualquer "parada", confirme com
  `Get-CimInstance Win32_Process -Filter "Name='node.exe'"` que não sobrou
  nada antes de rodar o e2e ou subir um servidor novo — isso já se repetiu
  várias vezes numa única sessão por confiar só no filtro estreito.
- **Exportação de fichamentos em PDF não está implementada.** `IMPLEMENTATION.md`
  (Fase 5) previa markdown ou PDF em `GET /me/fichamentos/exportar`. Nenhum
  cenário de `SCENARIOS.md` exercita o PDF — só o markdown (Cenário 2, passo
  10). `?formato=pdf` responde `400` explicitamente em vez de simular ou
  falhar silenciosamente. Se a Avaliação C vier a pedir PDF, implementar aí.
- **`autoLoadEntities: true` não enxerga entidade nova sozinho.** O
  `DatabaseModule` usa `autoLoadEntities`, que só registra uma entidade na
  metadata do TypeORM em tempo de execução se ela aparecer em algum
  `TypeOrmModule.forFeature([...])` de algum módulo importado pelo `AppModule`.
  Criar o arquivo `*.entity.ts` e escrever a migration não basta — faltando o
  `forFeature`, qualquer `dataSource.getRepository(Entidade)` (inclusive nos
  scripts de `scripts/validacao/`, que não usam injeção de dependência) erra
  com "No metadata for ... was found", sem pista de qual módulo falta. O
  `data-source.ts` usado pelo `migration:generate`/`migration:run` é um
  `DataSource` separado, com glob `entities: [...**/*.entity{.ts,.js}]` — ele
  enxerga o arquivo e gera a migration normalmente, o que mascara o problema
  até alguém tentar usar a entidade em runtime.
