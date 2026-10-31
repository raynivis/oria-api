# Backend da Tutora Oria — pacote de implementação

Sete arquivos para começar a implementar com o Claude Code.

| Arquivo | O que é |
|---|---|
| `CLAUDE.md` | Contexto permanente. O Claude Code lê automaticamente. |
| `IMPLEMENTATION.md` | Onze fases, com entidades, endpoints e critérios de aceite. |
| `PROMPTS.md` | Os seis templates de prompt, com schemas de validação. |
| `VALIDATION.md` | O que a validação do TCC exige do código, e as divergências com o plano. |
| `SCENARIOS.md` | Os quatro cenários de demonstração (Avaliação C), os 24 requisitos funcionais e a matriz de rastreabilidade. |
| `docker-compose.yml` | Postgres/pgvector, Redis, TEI e a API. |
| `embeddings.service.ts` | Cliente do TEI, pronto para copiar. |

## Como começar

```bash
nest new oria-api
cd oria-api
cp ../CLAUDE.md ../IMPLEMENTATION.md ../PROMPTS.md ../VALIDATION.md ../SCENARIOS.md .
cp ../docker-compose.yml .
mkdir -p src/embeddings && cp ../embeddings.service.ts src/embeddings/
```

Abra o Claude Code na raiz do projeto. Ele lê o `CLAUDE.md` sozinho. Depois:

```
Leia IMPLEMENTATION.md e execute a Fase 0. Antes de escrever código, me mostre o
plano de arquivos que você vai criar.
```

Uma fase por sessão. Ao final de cada uma, rode os testes e faça commit antes de
seguir.

## O que ainda não está definido

**Os livros do acervo.** Não bloqueia nada. A seção "Antes de tudo" do
`IMPLEMENTATION.md` explica a estratégia: um fixture EPUB sintético, gerado por
script, para os testes automatizados, e um EPUB qualquer de domínio público em
`acervo/` para desenvolvimento. Quando os títulos definitivos forem escolhidos,
basta colocá-los na pasta e rodar `npm run seed`. Nenhum código muda.

**O plano de avaliação.** Resolvido: a metodologia é DSR com avaliação formativa
artificial, sem participantes. O que ela exige do backend está em
`VALIDATION.md`; o roteiro de demonstração (Avaliação C), em `SCENARIOS.md`.
Duas consequências práticas: a telemetria da Fase 6 encolhe, e o registro de
chamadas de LLM da Fase 4 vira dado de pesquisa, com entrada e saída completas.
Quatro divergências entre a validação e o plano original já foram marcadas e
aplicadas em `SCENARIOS.md` — todas pendentes de confirmação com o orientador.

## Os modelos do OpenRouter

Cinco variáveis, uma por papel. A tabela ao final do `PROMPTS.md` indica a
exigência de cada um. O resumo: `hint` e `dialogue` são os que não admitem modelo
barato, porque é neles que o aluno tenta contornar as regras, e aderência a
instrução varia bastante entre gamas. Os demais rodam bem em modelos econômicos.

Comece o desenvolvimento com modelos gratuitos, que têm limite de cerca de 20
requisições por minuto. Para a sessão de teste com alunos, troque por modelos
pagos — o limite gratuito não sustenta uso simultâneo.

## A regra que mais se quebra sem perceber

O fluxo step-based. É fácil o código acabar retornando um campo de correção nos
passos intermediários, ou o modelo entregar a resposta na segunda dica. As duas
defesas estão previstas: o contador vem do banco e o schema tem
`entregouResolucao`, que o serviço rejeita quando vier `true` cedo demais.

Peça o teste e2e do critério de aceite da Fase 7 explicitamente. Ele é o que
impede a regressão que quebraria a seção 2.2 do TCC.
