# Tutora Oria — cenários de demonstração

Avaliação C da metodologia. Cumpre a atividade de **demonstração** do DSR
(Peffers et al., 2007) e serve de roteiro para a inspeção heurística da
Avaliação B.

Executados pelo autor, com uma persona, documentando cada passo com captura de
tela, resultado esperado, resultado obtido, requisito atendido, tempo de resposta
e tokens.

Leia `VALIDATION.md` antes. Este documento detalha o procedimento e define a
tabela de rastreabilidade.

---

## Persona

Estudante de graduação em Sistemas de Informação, lendo um capítulo da
bibliografia da disciplina para a prova da semana seguinte. Tem pouco tempo,
conhece o tema superficialmente e precisa chegar à prova capaz de explicar os
conceitos, não apenas reconhecê-los.

A persona importa para a Avaliação B: a inspeção heurística julga a interface
sob a ótica de quem está com pressa e sob pressão, não de quem explora o sistema
com calma.

---

## Requisitos funcionais

Identificadores usados na rastreabilidade. Derivados das fases de
`IMPLEMENTATION.md`.

| RF | Requisito | Fase |
|---|---|---|
| RF01 | Cadastro e autenticação do aluno | 1 |
| RF02 | Listar o acervo disponível | 1 |
| RF03 | Navegar o sumário hierárquico do livro | 1 |
| RF04 | Ler o conteúdo de uma seção | 1 |
| RF05 | Gerar panorama da seção em quatro níveis | 4 |
| RF06 | Dialogar com a tutora, ancorado na seção | 8 |
| RF07 | Exibir trechos de origem em toda resposta | 8 |
| RF08 | Recusar resposta sem base no material | 8 |
| RF09 | Gerar fichamento da seção | 5 |
| RF10 | Gerar ficha a partir de trecho selecionado | 5 |
| RF11 | Editar fichamento com versionamento | 5 |
| RF12 | Consultar histórico de versões | 5 |
| RF13 | Exportar fichamento | 5 |
| RF14 | Listar fichamentos por livro | 5 |
| RF15 | Gerar bateria de questões da seção | 7 |
| RF16 | Pedir justificativa antes de qualquer veredito | 7 |
| RF17 | Fornecer dicas progressivas, sem entregar a resposta | 7 |
| RF18 | Liberar resolução apenas após três passos ou desistência | 7 |
| RF19 | Extrair conceitos por seção | 7 |
| RF20 | Classificar conceitos em dominados e a revisar | 7 |
| RF21 | Registrar reflexão e confiança do aluno | 9 |
| RF22 | Confrontar confiança declarada com apoio consumido | 9 |
| RF23 | Reportar erro em conteúdo gerado | 9 |
| RF24 | Registrar eventos de leitura | 6 |

---

## Cenário 1 — Estudar uma seção com dúvida

**Situação.** O aluno abre um capítulo que ainda não leu e usa a tutora para
esclarecer dúvidas durante a leitura.

**Módulos exercitados.** Catálogo, panorama, chat contextual, citação, recusa,
fichamento.

| Passo | Ação | Endpoint | Esperado | RF |
|---|---|---|---|---|
| 1 | Entrar com e-mail e senha | `POST /auth/login` | Token recebido, redireciona para a biblioteca | RF01 |
| 2 | Abrir a biblioteca | `GET /livros` | Acervo listado, com progresso por contagem de seções | RF02 |
| 3 | Abrir o livro e o sumário | `GET /livros/:id/sumario` | Árvore de capítulos e subseções, hierarquia visível | RF03 |
| 4 | Escolher a seção ainda não lida | `GET /secoes/:id/panorama` | Panorama em quatro níveis, do geral ao específico, antes do texto | RF05 |
| 5 | Começar a leitura | `GET /secoes/:id` | Texto da seção, coluna limitada, seção marcada como aberta | RF04, RF24 |
| 6 | Perguntar ao chat sobre um conceito da seção | `POST /sessoes` + `/mensagens` | Resposta ancorada, com ao menos um trecho citado | RF06, RF07 |
| 7 | Clicar na citação | — (front) | Leitor salta para o trecho e o destaca | RF07, RF24 |
| 8 | Pedir explicação mais simples | `POST /sessoes/:id/mensagens` | Nova resposta, ainda restrita ao material, com citação | RF06, RF07 |
| 9 | Perguntar algo que ligue a um capítulo anterior | `POST /sessoes/:id/mensagens` | Resposta usa chunks da seção atual **e** de seções anteriores já lidas | RF06, RF07 |
| 10 | Perguntar algo fora do conteúdo do livro | `POST /sessoes/:id/mensagens` | Recusa explícita, visualmente distinta, sem resposta de conhecimento geral | RF08 |
| 11 | Gerar o fichamento da seção | `POST /secoes/:id/fichamento` | Rascunho estruturado, com "Perguntas em aberto" não respondidas | RF09 |

O passo 10 é o que a Avaliação A mede no critério C4 das perguntas fora do
conteúdo. Vale capturar a tela com atenção: é a evidência visual do guardrail.

O passo 9 depende de o aluno ter lido a seção anterior na mesma conta. Se o banco
estiver limpo, leia duas seções antes de executar o cenário.

---

## Cenário 2 — Fichar trechos

**Situação.** O aluno seleciona passagens que considera importantes, gera fichas
e reescreve uma com as próprias palavras.

**Módulos exercitados.** Fichamento por trecho, versionamento, persistência,
exportação.

| Passo | Ação | Endpoint | Esperado | RF |
|---|---|---|---|---|
| 1 | Selecionar o primeiro trecho no leitor | — (front) | Menu de seleção oferece "Gerar ficha" | — |
| 2 | Gerar a ficha do trecho | `POST /secoes/:id/fichamento` com `trecho` | Ficha do trecho, não da seção inteira | RF10 |
| 3 | Repetir para o segundo e o terceiro trecho | idem | Três fichas distintas, cada uma ancorada em seu trecho | RF10 |
| 4 | Abrir uma das fichas para editar | `GET /fichamentos/:id` | Editor com marcação de origem: cinza para IA | RF11 |
| 5 | Reescrever um parágrafo com as próprias palavras | `PATCH /fichamentos/:id` | Nova versão criada; parágrafo editado passa a azul | RF11, RF24 |
| 6 | Conferir o histórico | `GET /fichamentos/:id/versoes` | Versões 1 e 2 recuperáveis, com origem registrada | RF12 |
| 7 | Sair do sistema e voltar | `POST /auth/login` | Sessão restaurada | RF01 |
| 8 | Abrir o painel de fichamentos | `GET /me/fichamentos` | As três fichas listadas, com selo de editada ou rascunho | RF14 |
| 9 | Filtrar por livro | `GET /me/fichamentos?livroId=` | Apenas as fichas do livro escolhido | RF14 |
| 10 | Exportar em markdown | `GET /me/fichamentos/exportar` | Arquivo baixado, legível fora do sistema | RF13 |

O passo 5 é o que materializa a lacuna 2 do Capítulo 2. A captura precisa mostrar
a diferença de cor entre o texto da IA e o do aluno: é a evidência de que o
artefato pertence ao estudante.

O passo 7 demonstra a persistência. Saia de fato, não apenas recarregue a página.

---

## Cenário 3 — Autoavaliar-se

**Situação.** O aluno testa o que entendeu e descobre que precisava de mais apoio
do que imaginava.

**Módulos exercitados.** Geração de questões, fluxo step-based, conceitos.

> **Reescrito em relação à versão original.** O roteiro anterior previa "errar uma
> de propósito, ler o feedback". No fluxo step-based, errar não produz feedback:
> produz pedido de justificativa, depois dica conceitual, depois dica localizada.
> O cenário original demonstraria um sistema *answer-based*, que é exatamente o
> que a seção 2.2 do TCC rejeita. Ver a seção "Divergências" ao final.

| Passo | Ação | Endpoint | Esperado | RF |
|---|---|---|---|---|
| 1 | Gerar as questões da seção | `POST /secoes/:id/questoes` | Cinco questões de resposta aberta, sem alternativas | RF15 |
| 2 | Responder a primeira corretamente | `POST /questoes/:id/tentativas` | **Nenhum veredito.** Pedido de justificativa | RF16 |
| 3 | Justificar com base no texto | `POST /tentativas/:id/passos` | Sistema aceita e encerra a tentativa com 1 passo | RF16 |
| 4 | Responder a segunda com erro deliberado | `POST /questoes/:id/tentativas` | Pedido de justificativa, sem indicar erro | RF16 |
| 5 | Justificar mesmo assim | `POST /tentativas/:id/passos` | Dica conceitual: nomeia o conceito, não resolve | RF17 |
| 6 | Tentar de novo, ainda incorreto | `POST /tentativas/:id/passos` | Dica localizada, com link para o trecho | RF17 |
| 7 | Verificar que a resolução não está disponível | — (front) | Botão de resolução ausente até aqui | RF18 |
| 8 | Acertar na terceira tentativa | `POST /tentativas/:id/passos` | Resolução comentada, agora sim com veredito | RF18 |
| 9 | Conferir a trilha completa | `GET /tentativas/:id` | Os três passos empilhados, na ordem | RF16, RF17, RF18 |
| 10 | Ver os conceitos da seção | `GET /secoes/:id/conceitos` | Conceitos extraídos na ingestão | RF19 |
| 11 | Ver a própria classificação | `GET /me/conceitos` | Conceito da questão 1 em dominados, o da 2 em a revisar | RF20 |
| 12 | Gerar nova rodada sobre os conceitos a revisar | `POST /secoes/:id/questoes` | Questões concentradas nos conceitos pendentes | RF15, RF20 |

Os passos 2 e 4 são os mais importantes do cenário inteiro. A captura precisa
deixar claro que **a mesma tela aparece para resposta certa e errada**: nenhuma
cor, nenhum ícone, nenhuma palavra que denuncie o resultado. É a demonstração
visual do step-based.

O passo 7 merece captura própria, mostrando a ausência do botão.

---

## Cenário 4 — Fechar a seção

**Situação.** Terminado o estudo, o aluno registra o que acha que aprendeu e
confronta sua percepção com o próprio desempenho.

**Módulos exercitados.** Metacognição, detecção de ilusão de conhecimento,
reporte de erro.

> **Cenário novo.** Sem ele, panorama, metacognição e conceitos ficariam como
> requisitos não demonstrados na tabela de rastreabilidade. Ver "Divergências".

| Passo | Ação | Endpoint | Esperado | RF |
|---|---|---|---|---|
| 1 | Abrir a tela de metacognição da seção | `GET /secoes/:id/metacognicao` | Formulário vazio, com as duas perguntas abertas | RF21 |
| 2 | Escrever o que acredita ter aprendido | — (front) | Campo aceita texto livre | RF21 |
| 3 | Escrever o que ainda gera dúvida | — (front) | Campo aceita texto livre | RF21 |
| 4 | Declarar confiança alta, acima de 70 | `POST /secoes/:id/metacognicao` | Registro gravado | RF21, RF24 |
| 5 | Ler a observação do sistema | idem, na resposta | Confronto entre confiança e passos consumidos no Cenário 3 | RF22 |
| 6 | Ver conceitos a revisar | `GET /me/conceitos` | Lista coerente com o desempenho do Cenário 3 | RF20 |
| 7 | Clicar em um conceito a revisar | — (front) | Leitor abre a seção onde o conceito é introduzido | RF20 |
| 8 | Reportar um problema em conteúdo gerado | `POST /reportes` | Reporte registrado, com confirmação | RF23 |

O passo 5 é a operacionalização da compreensão ilusória de Flavell (1979). Para
que a observação apareça, o Cenário 3 precisa ter consumido passos suficientes —
execute os quatro cenários na ordem, na mesma conta.

Se a confiança declarada for baixa, o sistema não sinaliza, e o passo 5 não
demonstra nada. Declare confiança alta de propósito.

---

## Registro por passo

Uma planilha, preenchida durante a execução.

| Cenário | Passo | Esperado | Obtido | RF | Tempo (s) | Tokens | Captura |
|---|---|---|---|---|---|---|---|
| 1 | 1 | | | RF01 | | | `c1-p01.png` |

Tempo de resposta e tokens saem de:

```
GET /api/v1/admin/metricas/ultimas-chamadas?limite=20
```

Consulte após cada passo que envolva LLM. Os passos puramente de interface não
têm tempo nem tokens: deixe em branco, não zero.

Capturas em `validacao/cenarios/`, nomeadas `c<cenário>-p<passo>.png`. Toda tela
com saída de modelo precisa de captura; passos de navegação podem ser agrupados.

---

## Rastreabilidade

Gere ao final, em `docs/rastreabilidade.md`, a matriz requisito por cenário.
Requisito sem passo correspondente aparece como **não demonstrado**.

| RF | Cenário/passo | Situação |
|---|---|---|
| RF01 | C1/1, C2/7 | Demonstrado |
| RF02 | C1/2 | Demonstrado |
| ... | | |

Com os quatro cenários acima, os 24 requisitos ficam cobertos. Se algum for
cortado do escopo durante a implementação, remova-o da lista de RF em vez de
deixá-lo como não demonstrado — requisito que não existe não precisa de
demonstração, mas requisito planejado e não demonstrado chama atenção na banca.

---

## Procedimento

1. **Banco em estado conhecido.** Rode o seed e leia pelo menos uma seção
   anterior à do roteiro, para que o passo 9 do Cenário 1 tenha material.
2. **Mesma versão congelada** da Avaliação A, identificada pela tag git.
3. **Primeira passada sem registrar**, só para conhecer o fluxo. É também a
   primeira passada da Avaliação B.
4. **Segunda passada registrando** tudo: capturas, tempos, tokens, resultado
   obtido.
5. **Quando o obtido divergir do esperado**, registre a divergência em vez de
   repetir até dar certo. Divergência documentada é resultado; divergência
   escondida é problema.
6. **Os quatro cenários na ordem**, na mesma conta. O Cenário 4 depende do
   estado deixado pelo 3.

---

## Divergências em relação ao roteiro original

Quatro ajustes. Os três primeiros já estavam sinalizados em `VALIDATION.md`; o
quarto apareceu ao detalhar os passos. Todos precisam de confirmação com o
orientador, porque alteram o texto da metodologia.

**1. Cenário 3 reescrito.** O original previa feedback imediato após o erro, o
que contradiz o fluxo step-based de VanLehn (2011) descrito na seção 2.2. O
cenário agora percorre os três passos e demonstra que o sistema não entrega
veredito antes da hora.

**2. "Questões adaptativas" trocado por seleção por conceito.** O original dizia
"gerar nova rodada e ver se o nível muda". O sistema não adapta dificuldade por
desempenho: ele classifica conceitos em dominados e a revisar. O passo 12 do
Cenário 3 usa essa classificação, que é personalização real e já planejada.

**3. Cenário 4 acrescentado.** Sem ele, panorama, metacognição e conceitos
ficariam como não demonstrados. O panorama entrou também no passo 4 do Cenário 1,
onde é natural.

**4. "Resumo" e "ficha" precisam de distinção no backend.** A Avaliação A trata
"resumo da seção" e "fichas a partir de trechos escolhidos" como tarefas
diferentes. O backend planejado tem um único `POST /secoes/:id/fichamento`, que
gera para a seção inteira.

Proposta: o endpoint aceita um corpo opcional.

```ts
POST /secoes/:id/fichamento
{ trechoCfi?: string, trechoTexto?: string }
```

Sem corpo, gera o fichamento da seção inteira — é o "resumo" da Avaliação A e o
passo 11 do Cenário 1. Com trecho, gera a ficha daquele recorte — são as três
fichas do Cenário 2 e as três fichas por seção da Avaliação A.

É uma alteração pequena na Fase 5, mas precisa entrar antes da geração das
saídas, porque a Avaliação A depende das duas tarefas existirem separadamente.
