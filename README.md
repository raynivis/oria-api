# Tutora Oria — API

Backend de um tutor de leitura acadêmica para livros em EPUB. É o TCC (Trabalho
de Conclusão de Curso) de Sistemas de Informação da autora: o sistema acompanha
o aluno durante a leitura de um livro, gera panoramas e fichamentos da seção,
sustenta um chat ancorado no próprio texto do livro (com citação obrigatória e
recusa quando não há base) e conduz questões abertas por um fluxo **step-based**
(nunca revela se a resposta está certa de imediato — pede justificativa, depois
dá dicas progressivas).

Não é um chatbot acoplado a um leitor: cada escolha técnica deriva de uma base
pedagógica (VanLehn 2011 para o fluxo step-based; Flavell 1979 para a
metacognição) e está documentada em [`oria-api/CLAUDE.md`](oria-api/CLAUDE.md).

## Stack

| Camada | Escolha |
|---|---|
| Framework | NestJS 10, TypeScript estrito |
| ORM | TypeORM |
| Banco | Postgres 16 + pgvector |
| Fila | BullMQ sobre Redis |
| LLM | OpenRouter (API compatível com OpenAI) |
| Embeddings | TEI local, `intfloat/multilingual-e5-base`, 768 dimensões |
| EPUB | `epub2` + `cheerio` |
| Testes | Jest (unitários) + Supertest (e2e) |

## Estrutura do repositório

```
oria-api/              <- raiz do repositório (este README)
├── README.md
└── oria-api/           <- projeto NestJS; TODOS os comandos abaixo rodam aqui dentro
    ├── src/
    ├── test/
    ├── scripts/
    ├── docker-compose.yml
    ├── .env.example
    ├── CLAUDE.md        <- contexto permanente do projeto
    ├── IMPLEMENTATION.md <- plano de implementação por fases
    ├── PROMPTS.md        <- templates de prompt de cada módulo
    ├── VALIDATION.md      <- o que a validação do TCC exige do código
    └── SCENARIOS.md       <- roteiro de demonstração (cenários)
```

A pasta do projeto Nest está um nível abaixo da raiz do repositório — não
esqueça o `cd oria-api/oria-api` do passo 2 abaixo.

## Requisitos

- **Node.js 20+** e **npm 10+** (testado com Node 20.20.2 / npm 10.8.2)
- **Docker** e **Docker Compose** (sobem Postgres com pgvector, Redis e o
  servidor de embeddings TEI — não é preciso instalar nenhum deles localmente)
- Uma **chave de API da [OpenRouter](https://openrouter.ai/)** (tem modelos
  gratuitos — basta criar uma conta e gerar a chave)
- Git

## Instalação

1. Clonar o repositório e entrar na pasta do projeto Nest (**não** a raiz do
   repositório):

   ```bash
   git clone https://github.com/raynivis/oria-api.git
   cd oria-api/oria-api
   ```

2. Instalar as dependências:

   ```bash
   npm install
   ```

3. Copiar o arquivo de ambiente e preencher as variáveis (detalhes na seção
   abaixo):

   ```bash
   cp .env.example .env
   ```

4. Subir Postgres, Redis e o servidor de embeddings via Docker Compose:

   ```bash
   docker compose up -d
   ```

   A primeira subida demora alguns minutos — o container `embeddings` baixa o
   modelo. Acompanhe com `docker compose ps` até os três aparecerem
   `healthy`.

5. Rodar as migrations:

   ```bash
   npm run migration:run
   ```

6. Subir a API em modo desenvolvimento (recarrega sozinha a cada alteração):

   ```bash
   npm run start:dev
   ```

   A API fica disponível em `http://localhost:3000/api/v1`, com
   `GET /health` fora do prefixo.

7. (Opcional) Popular um livro de desenvolvimento: coloque um `.epub` na pasta
   `acervo/` (crie-a se não existir) e rode:

   ```bash
   npm run seed
   ```

### Testes

```bash
npm run test       # unitários
npm run test:e2e   # ponta a ponta (precisa do docker compose up rodando)
npm run lint
```

## Variáveis de ambiente (`.env`)

| Variável | Para quê |
|---|---|
| `DATABASE_URL`, `REDIS_URL`, `EMBEDDINGS_URL` | Apontam para os serviços subidos pelo `docker-compose.yml`. Os valores do `.env.example` já batem com as portas expostas (`5433`, `6380`, `8080`) — só mude se colidirem com algo já rodando na sua máquina. |
| `OPENROUTER_API_KEY` | Chave da sua conta OpenRouter. Obrigatória. |
| `LLM_DIALOGUE_MODEL`, `LLM_HINT_MODEL`, `LLM_FICHAMENTO_MODEL`, `LLM_PANORAMA_MODEL`, `LLM_QUESTIONS_MODEL`, `LLM_CONCEPTS_MODEL`, `LLM_AVALIACAO_MODEL` | Um modelo OpenRouter por papel (pode usar o mesmo modelo `:free` em todos para desenvolvimento). Ver `PROMPTS.md`. |
| `JWT_SECRET` | Qualquer string aleatória longa, para assinar os tokens de autenticação. |
| `ADMIN_API_KEY` | Chave para as rotas administrativas (ingestão de livros, métricas de validação). Qualquer string sua. |
| `CORS_ORIGIN` | Origem (ou lista separada por vírgula) do frontend que vai consumir a API. |
| `ATTEMPT_MAX_STEPS`, `METACOG_CONFIANCA_MIN`, `METACOG_PASSOS_MIN`, `RETRIEVAL_LIMIAR`, `RETRIEVAL_TOP_K` | Parâmetros pedagógicos e de recuperação; os valores padrão do `.env.example` já estão calibrados. |
| `VALIDACAO_MODELO`, `VALIDACAO_PROVIDER`, `VALIDACAO_SEED` | Só usadas pelos scripts de `scripts/validacao/` (avaliação do TCC) — podem ficar em branco para desenvolvimento comum. |

## Documentação adicional

- [`CLAUDE.md`](oria-api/CLAUDE.md) — contexto permanente do projeto e regras
  inegociáveis do domínio.
- [`IMPLEMENTATION.md`](oria-api/IMPLEMENTATION.md) — plano de implementação
  por fases.
- [`PROMPTS.md`](oria-api/PROMPTS.md) — templates de prompt usados por cada
  módulo.
- [`VALIDATION.md`](oria-api/VALIDATION.md) — metodologia de validação do TCC
  (DSR/FEDS) e o que ela exige do código.
- [`SCENARIOS.md`](oria-api/SCENARIOS.md) — roteiro dos cenários de
  demonstração.
