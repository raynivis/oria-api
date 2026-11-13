# Auditoria das tabelas da Avaliação A

Auditoria só de leitura das 4 tabelas que guardam os dados da Avaliação A, feita em
2026-11-13 sobre o banco de desenvolvimento local (`docker compose exec db psql`,
mesma instância usada pela bateria). Nenhuma chamada a LLM foi feita para produzir
este documento; nenhum outro arquivo do repositório foi alterado. Para cada tabela:
propósito, entidade TypeORM correspondente, esquema de colunas, chaves/índices, e
os resultados de verificações de integridade executadas diretamente contra os
dados atuais — não contra a documentação.

Estado das 4 tabelas no momento desta auditoria: 1 execução, 30 tarefas, 60
saídas, 60 códigos cegos. Idêntico ao que foi registrado em
`RESULTADOS-AVALIACAO-A.md` (2026-11-10); nada mudou nesses 3 dias.

---

## 1. `validacao_execucoes`

**Propósito:** uma linha por rodada da bateria (ou a calibração, rótulo
`'calibracao'`, que não entra nas 60 saídas da Avaliação A — ver nota 1.3).
Guarda os parâmetros fixos daquela rodada inteira: modelo, provider, seed,
temperatura, e o commit do repositório no momento da geração.

**Entidade:** [src/validacao/entities/execucao.entity.ts](../src/validacao/entities/execucao.entity.ts)

**Colunas:**

| Coluna | Tipo | Nulo | Default |
|---|---|---|---|
| `id` | uuid (PK) | não | `gen_random_uuid()` |
| `rotulo` | varchar | não | — |
| `gitSha` | varchar | não | — (capturado por `git rev-parse HEAD` na geração, nunca digitado à mão) |
| `modelo` | varchar | não | — |
| `provider` | varchar | não | — |
| `seed` | int | não | — |
| `temperatura` | numeric | não | — |
| `iniciadaEm` | timestamp sem fuso | não | `now()` |
| `encerradaEm` | timestamp com fuso | sim | — |

**Chaves/índices:** PK em `id`. Referenciada por `validacao_saidas.execucaoId`
(`ON DELETE CASCADE`).

**Estado atual:** 1 linha.

| id | rotulo | gitSha | modelo | provider | seed | temperatura | iniciadaEm | encerradaEm |
|---|---|---|---|---|---|---|---|---|
| `32b5cef2-1e04-4145-a62e-d7d0b52bc34d` | `avaliacao-a` | `8c51fefd4eed864d63e027694d1453491f5e8da9` | `nvidia/nemotron-3.5-lightning:free` | `Nvidia` | 42 | 0 | 2026-11-08 17:32:18 UTC | 2026-11-08 17:45:10 UTC |

O `gitSha` corresponde ao commit `8c51fefd4eed864d63e027694d1453491f5e8da9`, tag
`avaliacao-a-v1`, mensagem "feat(validacao): fecha gabarito da Avaliacao A",
2026-11-08 14:27:13 -0300.

**1.1. Integridade:** nenhuma — é uma única linha, sem espaço para
duplicidade/ambiguidade.

**1.2. Achado — `encerradaEm` não cobre o intervalo real de geração.**
`encerradaEm` (17:45:10) é anterior a 36 das 60 saídas, cujo `criadoEm` vai até
19:50:04 (ver seção 3). `scripts/validacao/gerar-bateria.ts` sempre faz
`execucoesRepository.save(execucoesRepository.create(...))` — uma linha nova a
cada execução do script, nunca reaproveita uma existente — e, ainda assim, só
existe 1 linha nesta tabela. Nenhum registro do banco ou do repositório explica
essa lacuna por si só.

**Explicação da autora (2026-11-13, fora do banco):** durante a coleta houve
troca de chave/provedor da OpenRouter em andamento, o que exigiu retomar parte
da geração depois do horário em que `encerradaEm` já tinha sido gravado —
daí o `criadoEm` de parte das saídas ficar à frente de `encerradaEm`. Esta
frase registra a explicação dada pela autora; não é algo deduzido dos dados
nem confirmável só por eles (a tabela não guarda qual chave/provedor OpenRouter
foi usado em cada tentativa, só o `provider` lógico fixo da execução,
`'Nvidia'`).

**1.3. Nota:** o comentário da entidade menciona um rótulo `'calibracao'` para
a calibração do `VALIDATION.md §9`. Essa calibração não tem mais linha nesta
tabela hoje (só a de `avaliacao-a` existe) — ver achado 4.2 para a evidência
indireta de que ela rodou antes desta execução.

---

## 2. `validacao_tarefas`

**Propósito:** o gabarito da Avaliação A — as tarefas em si (enunciado +
gabarito), escritas à mão em YAML (`scripts/validacao/dados/tarefas-avaliacao-a.yaml`)
e populadas por `preparar-tarefas.ts`. `codigo` (ex.: "C2-P1") é a chave
natural e idempotente — o mesmo `id` de tarefa é usado nas duas condições
(com Oria e linha de base) ao gerar as saídas.

**Entidade:** [src/validacao/entities/tarefa.entity.ts](../src/validacao/entities/tarefa.entity.ts)

**Colunas:**

| Coluna | Tipo | Nulo | Default |
|---|---|---|---|
| `id` | uuid (PK) | não | `gen_random_uuid()` |
| `codigo` | varchar (único) | não | — |
| `sectionId` | uuid (FK → `sections.id`) | não | — |
| `tipo` | varchar | não | — |
| `enunciado` | text | não | — |
| `gabarito` | text | sim | — |

**Chaves/índices:** PK em `id`; índice único em `codigo`; FK `sectionId` →
`sections(id)` (`ON DELETE CASCADE`). Referenciada por
`validacao_saidas.tarefaId` (`ON DELETE CASCADE`).

**Estado atual:** 30 linhas, 15 por capítulo (Capítulo 2 e Capítulo 8), assim
distribuídas por tipo em cada capítulo: 6 `pergunta_na_secao`, 3 `ficha`,
2 `pergunta_ligacao`, 2 `pergunta_fora`, 1 `resumo`, 1 `questoes`.

**2.1. Integridade:**
- `codigo` sem duplicatas (índice único garante; confirmado vazio).
- 0 tarefas com `enunciado` vazio.
- 0 tarefas com `gabarito` nulo ou vazio — as 30 têm gabarito preenchido.

**2.2. Nenhum achado fora do esperado.**

---

## 3. `validacao_saidas`

**Propósito:** um par (tarefa, condição) gerado numa execução — a saída em
si. `entradaCompleta` (o prompt exatamente como foi enviado) e `saidaBruta`
(a resposta como veio do modelo, antes de qualquer parsing) são a fonte
primária do Apêndice A do TCC, independentes de `llm_calls` (que também
grava a mesma chamada, regra 5 do CLAUDE.md, mas sem `condicao`/`tarefaId`).

**Entidade:** [src/validacao/entities/saida.entity.ts](../src/validacao/entities/saida.entity.ts)

**Colunas:**

| Coluna | Tipo | Nulo | Default |
|---|---|---|---|
| `id` | uuid (PK) | não | `gen_random_uuid()` |
| `execucaoId` | uuid (FK → `validacao_execucoes.id`) | não | — |
| `tarefaId` | uuid (FK → `validacao_tarefas.id`) | não | — |
| `condicao` | varchar (`'oria'` \| `'baseline'`) | não | — |
| `entradaCompleta` | text | não | — |
| `saidaBruta` | text | não | — |
| `promptVersao` | int | sim | — |
| `modelo` | varchar | não | — |
| `tokensIn` | int | não | — |
| `tokensOut` | int | não | — |
| `custo` | numeric | não | — |
| `duracaoMs` | int | não | — |
| `sucesso` | boolean | não | `true` |
| `criadoEm` | timestamp sem fuso | não | `now()` |

**Chaves/índices:** PK em `id`; índice único em
`(execucaoId, tarefaId, condicao)` (garante no máximo 1 saída por par
tarefa+condição por execução); FKs `execucaoId`/`tarefaId`
(`ON DELETE CASCADE` ambas). Referenciada por `validacao_codigos_cegos.saidaId`
e `validacao_pontuacoes.saidaId` (`ON DELETE CASCADE`).

**Estado atual:** 60 linhas — 30 `condicao='oria'`, 30 `condicao='baseline'`;
`criadoEm` entre 2026-11-08 17:32:37 e 2026-11-08 19:50:04; todas com
`execucaoId` = `32b5cef2-...` (1 execução distinta referenciada); 30
`tarefaId` distintos referenciados (as 30 de `validacao_tarefas`, cada uma
nas 2 condições).

**3.1. Integridade:**
- 0 linhas com `sucesso = false` — nenhuma falha registrada após as
  retentativas do script.
- Índice único `(execucaoId, tarefaId, condicao)` garante que não há saída
  duplicada para o mesmo par.
- 60 = 30 tarefas × 2 condições, sem sobra nem falta.

**3.2. Nenhum achado fora do esperado**, além do já descrito em 1.2
(intervalo de `criadoEm` maior que a janela `[iniciadaEm, encerradaEm]` da
execução que as contém).

---

## 4. `validacao_codigos_cegos`

**Propósito:** a chave de cegamento em si. Produzida por
`scripts/validacao/cegar.ts` (embaralhamento Fisher-Yates das saídas de uma
execução + atribuição de códigos sequenciais, ex.: "A17"). O `codigo` é tudo
que o avaliador vê — nunca a `condicao` ou o `saidaId` real.

**Entidade:** [src/validacao/entities/codigo-cego.entity.ts](../src/validacao/entities/codigo-cego.entity.ts)

**Colunas:**

| Coluna | Tipo | Nulo | Default |
|---|---|---|---|
| `id` | uuid (PK) | não | `gen_random_uuid()` |
| `saidaId` | uuid (FK → `validacao_saidas.id`, único) | não | — |
| `codigo` | varchar (único) | não | — |
| `revelado` | boolean | não | `false` |

**Chaves/índices:** PK em `id`; índice único em `saidaId` (garante no máximo
1 código por saída); índice único em `codigo` (garante que nenhum código se
repete); FK `saidaId` (`ON DELETE CASCADE`).

**Estado atual:** 60 linhas, códigos A1 a A60, todos com `revelado = false`.

**4.1. Integridade:**
- 0 códigos fora do padrão `A1`..`A60`.
- 0 códigos duplicados (índice único).
- 0 saídas da execução sem código cego correspondente (as 60 saídas da
  execução `avaliacao-a` têm, cada uma, exatamente 1 código).
- Nenhum par de tarefa incompleto: as 30 tarefas têm, cada uma, exatamente 2
  saídas cegadas (uma por condição) — confirmado por junção
  `validacao_tarefas` → `validacao_saidas` → `validacao_codigos_cegos`.

**4.2. Achado — nenhum código foi revelado, e não há pontuação registrada.**
`revelado = false` nos 60. `scripts/validacao/revelar.ts` só marca
`revelado = true` depois de confirmar que existe pontuação de consenso
(`validacao_pontuacoes` com `avaliador = 'consenso'`) para todas as saídas da
execução — e `validacao_pontuacoes` está vazia (0 linhas no total, não listada
entre as 4 tabelas pedidas aqui, mas é a tabela que `revelar.ts` olha para
decidir se revela). Ou seja: ao nível do banco, a chave nunca foi
formalmente "aberta" pelo próprio pipeline — a extração feita em
`RESULTADOS-AVALIACAO-A.md` leu os dados diretamente das tabelas, sem passar
por `revelar.ts`, a pedido explícito da autora. Mesmo achado já registrado na
observação 4 de `RESULTADOS-AVALIACAO-A.md`; repetido aqui porque é
diretamente relevante a esta tabela.

---

## Resumo das relações entre as 4 tabelas

```
validacao_execucoes (1 linha)
        │ execucaoId
        ▼
validacao_saidas (60 linhas) ◄───── tarefaId ───── validacao_tarefas (30 linhas)
        │ saidaId (único)
        ▼
validacao_codigos_cegos (60 linhas)
```

Nenhuma dessas 4 tabelas tem uma coluna ou tabela intermediária que exporte a
chave de cegamento para fora do banco — não existe arquivo de mapeamento
código↔condição em lugar nenhum do repositório ou do disco.
