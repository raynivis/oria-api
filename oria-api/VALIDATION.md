# Tutora Oria — o que a validação exige do backend

A metodologia é Design Science Research, com avaliação **formativa e artificial**
pelo quadro FEDS: sem participantes, conduzida pelos pesquisadores sobre o
artefato. O experimento com estudantes é trabalho futuro, com protocolo já
definido.

Três procedimentos:

| | O que mede | Produto |
|---|---|---|
| **A** | Saídas da Oria contra o mesmo modelo sem ela | Tabela por critério, contagem de alucinações, kappa |
| **B** | Usabilidade por inspeção heurística | Lista de problemas com severidade |
| **C** | Cobertura dos requisitos de ponta a ponta | Três cenários documentados |

Este documento trata só do que isso impõe ao código. Leia depois de
`IMPLEMENTATION.md`.

---

## 1. O que muda no plano original

A validação não usa telemetria de aluno. Ela avalia **saídas do modelo**, por
rubrica, às cegas. Três consequências:

**A Fase 6 deixa de ser crítica.** A telemetria de leitura foi justificada por
"o plano de avaliação não existe, colete tudo". Agora ele existe e não a usa.
Mantenha a Fase 6 enxuta — os eventos ainda servem ao experimento futuro e ao
Cenário C — mas o esforço sai dela.

**O registro de chamadas de LLM vira crítico.** Era instrumentação de custo;
agora é a fonte primária de dados e o Apêndice A do TCC. Precisa guardar entrada
completa, saída completa e parâmetros de geração. O `LlmCall` da Fase 4 não
basta.

**Surge um requisito que não existia: o modo linha de base.** O sistema precisa
executar a mesma tarefa *sem* o pipeline da Oria, para a comparação da Avaliação
A. É ferramenta de pesquisa, não funcionalidade do produto.

---

## 2. Determinismo e reprodutibilidade

Toda geração da Avaliação A roda com parâmetros fixos. O `LlmService` precisa
aceitá-los e repassá-los ao OpenRouter.

```ts
// payload enviado ao OpenRouter durante a validação
{
  model: process.env.VALIDACAO_MODELO,   // identificador exato, registrado
  temperature: 0,
  seed: Number(process.env.VALIDACAO_SEED),
  provider: {
    order: [process.env.VALIDACAO_PROVIDER],
    allow_fallbacks: false,              // sem redirecionamento entre provedores
  },
  messages: [...],
}
```

`allow_fallbacks: false` é o que impede o OpenRouter de rotear a mesma chamada
para outro provedor e produzir saída diferente. Sem isso a reprodutibilidade cai
por terra.

Variáveis novas:

```
VALIDACAO_MODELO=<identificador exato do modelo aberto>
VALIDACAO_PROVIDER=<nome do provedor fixado>
VALIDACAO_SEED=42
VALIDACAO_GIT_SHA=<preenchido pelo script, não à mão>
```

Mesmo assim, o determinismo não é garantido por todos os modelos. Isso já está
nas limitações do Capítulo 3; do lado do código, a consequência é que **cada
saída precisa ser persistida**, não regerada.

### Congelamento

Antes da geração, prompts e código ficam congelados. O script de geração grava o
SHA do commit e a `VERSAO` de cada template usado. Correções de interface vindas
da Avaliação B podem entrar depois, porque não alteram as saídas.

```bash
git tag validacao-v1 && git push --tags
```

---

## 3. Entidades de validação

Separadas das entidades de produto. Vivem em `src/validacao/`.

```ts
Execucao        id uuid, rotulo, gitSha, modelo, provider, seed,
                temperatura numeric, iniciadaEm, encerradaEm?

Tarefa          id uuid, codigo,            // 'S1-P1', 'S1-RESUMO', ...
                secaoId FK, tipo,           // 'pergunta_na_secao' | 'pergunta_ligacao'
                                            // | 'pergunta_fora' | 'resumo'
                                            // | 'ficha' | 'questoes'
                enunciado text, gabarito text?

Saida           id uuid, execucaoId FK, tarefaId FK,
                condicao: 'oria' | 'baseline',
                entradaCompleta text,       // prompt inteiro, como enviado
                saidaBruta text,
                promptVersao?, modelo, tokensIn, tokensOut,
                custo numeric, duracaoMs, criadoEm
                unique(execucaoId, tarefaId, condicao)

CodigoCego      id uuid, saidaId FK unique, codigo,  // 'A17'
                revelado bool default false

Pontuacao       id uuid, saidaId FK, avaliador: 'aluno' | 'orientador' | 'consenso',
                c1 int 0..2, c2 int 0..2, c3 int 0..2, c4 int 0..2,
                nivelBloom?, observacao?, criadoEm
                unique(saidaId, avaliador)
```

`entradaCompleta` guarda o prompt como foi enviado, não o template. É o que
permite a alguém reproduzir a chamada, e é o conteúdo do Apêndice A.

`Pontuacao` com `avaliador: 'consenso'` é a nota usada nos resultados. As duas
individuais ficam para o cálculo do kappa.

---

## 4. Modo linha de base

A diferença entre as condições, por tipo de tarefa:

| Tarefa | Baseline recebe | Oria recebe |
|---|---|---|
| Pergunta ao chat | Só a pergunta + instrução genérica de assistente | Chunks recuperados + prompt `dialogue` |
| Resumo | Pergunta + **texto da seção colado** | Fluxo normal do módulo |
| Ficha | Pedido + **trecho colado** | Fluxo normal do módulo |
| Questões | Pedido + **texto da seção colado** | Fluxo normal do módulo |

Nos três últimos, a baseline recebe o texto também — senão não conseguiria
cumprir a tarefa, e a comparação mediria apenas o acesso ao material. Ali o que
se mede é o prompt pedagógico e a estrutura do módulo. No chat, o que se mede é a
ancoragem no ebook.

Prompt genérico da baseline, fixo e registrado:

```ts
// src/validacao/baseline.prompt.ts
export const VERSAO = 1;
export const SISTEMA_BASELINE =
  'Você é um assistente útil. Responda à solicitação do usuário.';
```

Deliberadamente banal. Ele representa o aluno abrindo um chatbot genérico ao lado
do ebook, que é o cenário que a Oria precisa superar.

**Implemente como script, não endpoint.** Não é funcionalidade do produto, e um
endpoint de baseline em produção seria uma porta para contornar o pipeline
pedagógico.

---

## 5. Scripts

Em `scripts/validacao/`, invocáveis por `npm run validacao:<nome>`.

### `preparar-tarefas.ts`

Lê um YAML com as tarefas das duas seções e popula `Tarefa`. O YAML é escrito à
mão antes da geração e versionado — é o gabarito.

```yaml
secoes:
  - id: <uuid da seção>
    conceitosCentrais: [ "...", "...", "..." ]   # 5 a 8
    tarefas:
      - codigo: S1-P1
        tipo: pergunta_na_secao
        enunciado: "..."
        gabarito: "..."
      # 6 perguntas na seção, 2 de ligação, 2 fora,
      # 1 resumo, 3 fichas, 1 bateria de questões = 15
```

### `gerar-bateria.ts`

Cria uma `Execucao` e gera as 60 saídas: 15 tarefas × 2 seções × 2 condições.

- sequencial, não paralelo — provedor fixo costuma ter limite de taxa;
- em falha, retenta uma vez e depois registra o erro sem abortar a execução;
- grava `Saida` a cada resposta, nunca em lote ao final;
- ao terminar, imprime o resumo: total, falhas, custo, duração.

### `cegar.ts`

Embaralha as 60 saídas, remove formatação markdown, atribui código sequencial e
grava `CodigoCego`. A chave fica no banco com `revelado: false`.

Remover o markdown importa: a Oria produz saídas estruturadas, e manter a
formatação entregaria a condição de origem ao avaliador.

### `exportar-planilha.ts`

Gera `validacao/planilha-<avaliador>.xlsx` com uma linha por saída: código, texto
da saída, enunciado da tarefa, gabarito, e colunas vazias para C1 a C4, nível de
Bloom e observação. Uma planilha por avaliador.

### `importar-pontuacoes.ts`

Lê as planilhas preenchidas e popula `Pontuacao`. Valida que toda saída foi
pontuada e que as notas estão em 0..2.

### `calcular-kappa.ts`

Kappa de Cohen por critério, entre aluno e orientador. Imprime o valor e a faixa
de Landis e Koch.

```
C1 fidelidade        κ = 0,72  (substancial)
C2 cobertura         κ = 0,58  (moderada)
C3 adequação         κ = 0,44  (moderada)
C4 do módulo         κ = 0,81  (quase perfeita)
```

Kappa abaixo de 0,41 em qualquer critério é sinal de rubrica ambígua: revise e
repontue antes de interpretar.

### `revelar.ts`

Marca `CodigoCego.revelado = true`. **Só rodar depois do consenso registrado.**
O script deve recusar se houver saída sem `Pontuacao` de consenso.

### `consolidar.ts`

Produz, em `validacao/resultados/`:

- `medias-por-criterio.csv` — média e desvio por critério e condição;
- `alucinacoes.csv` — saídas com C1 = 0 em cada condição;
- `perguntas-fora.csv` — tratamento das 4 perguntas fora do conteúdo;
- `bloom.csv` — distribuição dos níveis das questões geradas;
- `criterios-sucesso.md` — cada critério com atingido ou não;
- `apendice-a.md` — todas as chamadas com entrada, saída, tokens e data.

Opcional: teste de Wilcoxon pareado por tarefa, apresentado como exploratório.

---

## 6. Critérios de sucesso

Fixados antes da geração. O `consolidar.ts` os verifica automaticamente.

| Critério | Limiar |
|---|---|
| Saídas com C1 = 0 na Oria | menor que a baseline **e** no máximo 10% do total |
| Média de C3 (adequação pedagógica) | Oria maior que baseline |
| Média de C2 (cobertura) | Oria não menor que baseline |
| Reconhecimento de limite | pelo menos 3 das 4 perguntas fora do conteúdo |
| Kappa por critério | pelo menos 0,41 |

No TCC, declarar que os limiares são decisão da equipe, não valores da
literatura.

Note que o quarto critério é exatamente o guardrail da regra 2 do `CLAUDE.md`: o
`encontrouBase: false` que a Fase 8 implementa é o que será medido. Se a recusa
não estiver funcionando, esse critério falha.

---

## 7. Avaliação C — o que o backend precisa expor

Cada passo dos três cenários é documentado com tempo de resposta e tokens. Isso
sai do `LlmCall`, mas precisa estar acessível durante a demonstração:

```
GET /api/v1/admin/metricas/ultimas-chamadas?limite=20
```

Rota administrativa, protegida pela mesma chave da ingestão. Retorna papel,
modelo, tokens, custo e duração das últimas chamadas, para o autor copiar para a
planilha de registro enquanto executa os cenários.

Crie também `docs/rastreabilidade.md`, ligando cada requisito funcional ao passo
de cenário que o demonstra. Requisito sem passo correspondente aparece como **não
demonstrado** — e é aí que está o problema da seção 9.

---

## 8. Três divergências a resolver antes de implementar

A validação foi escrita a partir de uma visão do produto que não bate em três
pontos com o que `IMPLEMENTATION.md` descreve. São decisões suas, não do código,
mas precisam ser tomadas antes da Fase 7.

### 8.1 O Cenário 3 pressupõe feedback imediato

O cenário diz: *"gerar as questões da seção → errar uma de propósito → ler o
feedback → gerar nova rodada e ver se o nível muda"*.

No fluxo step-based, errar **não** produz feedback. Produz um pedido de
justificativa, depois uma dica conceitual, depois uma dica localizada, e só então
a resolução. Essa é a regra 1 do `CLAUDE.md` e a base de VanLehn (2011) na seção
2.2 do TCC.

Duas saídas:

1. Reescrever o cenário para refletir o fluxo real: *"errar de propósito →
   receber o pedido de justificativa → responder → receber a dica conceitual →
   acertar na segunda tentativa"*. É o que demonstra o diferencial do sistema.
2. Abandonar o step-based, o que derrubaria a seção 2.2.

A primeira, claramente. O cenário atual demonstraria um sistema answer-based.

### 8.2 "Questões adaptativas" não existe no plano

O Cenário 3 fala em *"gerar nova rodada e ver se o nível muda"*, e a coluna de
módulos diz "questões adaptativas". O backend planejado tem dificuldade como
**parâmetro de entrada**, escolhido pelo aluno, não adaptação automática por
desempenho.

Implementar adaptação real significa: modelo de proficiência por conceito,
política de seleção de dificuldade, e validação de que a adaptação funciona.
É escopo de outro TCC.

Sugestão: trocar por *"gerar nova rodada sobre os conceitos que ficaram como 'a
revisar'"*. Isso usa a classificação de conceitos que já está planejada, é
honesto quanto ao que o sistema faz, e ainda demonstra personalização.

### 8.3 Três módulos ficariam como não demonstrados

Os cenários exercitam chat, resumo, fichamento, persistência e questões. Ficam de
fora: **panorama**, **metacognição** e **conceitos**.

Como a tabela de rastreabilidade marca requisito sem cenário como não
demonstrado, três funcionalidades planejadas apareceriam assim no TCC.

Duas saídas, não excludentes:

1. Estender o Cenário 1 com o panorama, que é natural: o aluno abre a seção, lê o
   panorama, depois estuda. É exatamente o uso previsto.
2. Acrescentar um Cenário 4 de fechamento: ao terminar a seção, o aluno registra
   o que aprendeu e sua confiança, recebe o confronto com os passos consumidos e
   vê os conceitos a revisar. Cobre metacognição e conceitos de uma vez.

A segunda opção também dá à Avaliação B mais superfície de interface para
inspecionar.

---

## 9. Ordem de execução

A validação acontece depois do código pronto, mas a instrumentação precisa entrar
durante.

| Quando | O quê |
|---|---|
| Fase 4 | `LlmCall` já com `entradaCompleta` e `saidaBruta` |
| Fase 4 | `LlmService` aceitando `temperature`, `seed` e `provider` |
| Depois da Fase 8 | Entidades de validação e scripts |
| Antes da geração | Resolver as divergências da seção 8 |
| Antes da geração | Congelar com `git tag`, escrever o YAML de tarefas |
| Geração | `preparar-tarefas` → `gerar-bateria` → `cegar` → `exportar-planilha` |
| Avaliação | Calibração com 6 saídas extras → pontuação independente |
| Análise | `importar-pontuacoes` → `calcular-kappa` → consenso → `revelar` → `consolidar` |

As seis saídas de calibração são geradas à parte e **não entram** nas 60. Gere-as
com uma `Execucao` de rótulo `calibracao`.

---

## 10. O que não implementar

O protocolo com participantes está no TCC como trabalho futuro, e o backend não
precisa de nada para ele além do que já existe. Não construa:

- coleta de consentimento ou TCLE;
- aplicação de SUS, escala de Paas ou teste de compreensão;
- designação de participantes a grupos AB/BA.

Se o experimento acontecer depois, a telemetria da Fase 6 já cobre a parte
instrumental.
