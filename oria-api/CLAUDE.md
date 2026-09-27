# Tutora Oria — contexto do projeto

API de um tutor de leitura acadêmica para livros em EPUB. TCC de Sistemas de
Informação. NestJS + TypeORM + Postgres/pgvector + Redis, LLMs via OpenRouter,
embeddings locais via TEI.

Este arquivo é contexto permanente. O plano de execução está em
`IMPLEMENTATION.md`.

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

**5. Telemetria desde o primeiro endpoint.**
O plano de avaliação ainda não existe. Coletar é barato; não ter coletado é
irrecuperável. Todo evento relevante vai para `ReadingEvent`.

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
npm run migration:generate -- -n NomeDaMigration
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
  registra modelo, versão de prompt, tokens e custo.
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
- **SSE com JWT.** `EventSource` não aceita header. O cliente consome o stream
  com `fetch` + `ReadableStream`; o servidor usa `@Sse()`.
