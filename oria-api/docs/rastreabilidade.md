# Rastreabilidade — requisitos funcionais × cenários

Matriz pedida em `VALIDATION.md` §7 e `SCENARIOS.md` ("Rastreabilidade"): cada
requisito funcional ligado ao passo de cenário que o demonstra. Requisito sem
passo correspondente apareceria como **não demonstrado** — não é o caso aqui:
os quatro cenários, já ajustados pelas divergências descritas em
`SCENARIOS.md` ("Divergências em relação ao roteiro original"), cobrem os 24.

| RF | Requisito | Cenário/passo | Situação |
|---|---|---|---|
| RF01 | Cadastro e autenticação do aluno | C1/1, C2/7 | Demonstrado |
| RF02 | Listar o acervo disponível | C1/2 | Demonstrado |
| RF03 | Navegar o sumário hierárquico do livro | C1/3 | Demonstrado |
| RF04 | Ler o conteúdo de uma seção | C1/5 | Demonstrado |
| RF05 | Gerar panorama da seção em quatro níveis | C1/4 | Demonstrado |
| RF06 | Dialogar com a tutora, ancorado na seção | C1/6, C1/8, C1/9 | Demonstrado |
| RF07 | Exibir trechos de origem em toda resposta | C1/6, C1/7, C1/8, C1/9 | Demonstrado |
| RF08 | Recusar resposta sem base no material | C1/10 | Demonstrado |
| RF09 | Gerar fichamento da seção | C1/11 | Demonstrado |
| RF10 | Gerar ficha a partir de trecho selecionado | C2/2, C2/3 | Demonstrado |
| RF11 | Editar fichamento com versionamento | C2/4, C2/5 | Demonstrado |
| RF12 | Consultar histórico de versões | C2/6 | Demonstrado |
| RF13 | Exportar fichamento | C2/10 | Demonstrado |
| RF14 | Listar fichamentos por livro | C2/8, C2/9 | Demonstrado |
| RF15 | Gerar bateria de questões da seção | C3/1, C3/12 | Demonstrado |
| RF16 | Pedir justificativa antes de qualquer veredito | C3/2, C3/3, C3/4, C3/9 | Demonstrado |
| RF17 | Fornecer dicas progressivas, sem entregar a resposta | C3/5, C3/6, C3/9 | Demonstrado |
| RF18 | Liberar resolução apenas após três passos ou desistência | C3/7, C3/8, C3/9 | Demonstrado |
| RF19 | Extrair conceitos por seção | C3/10 | Demonstrado |
| RF20 | Classificar conceitos em dominados e a revisar | C3/11, C3/12, C4/6, C4/7 | Demonstrado |
| RF21 | Registrar reflexão e confiança do aluno | C4/1, C4/2, C4/3, C4/4 | Demonstrado |
| RF22 | Confrontar confiança declarada com apoio consumido | C4/5 | Demonstrado |
| RF23 | Reportar erro em conteúdo gerado | C4/8 | Demonstrado |
| RF24 | Registrar eventos de leitura | C1/5, C1/7, C2/5, C4/4 | Demonstrado |

24 de 24 requisitos demonstrados. Nenhum passo de interface pura (sem
endpoint, marcado "— (front)" em `SCENARIOS.md`) conta como evidência de
requisito aqui — cada célula acima aponta para pelo menos um passo com
endpoint de API por trás.

Esta tabela é gerada a partir das tabelas de passos dos quatro cenários em
`SCENARIOS.md`. Se um cenário mudar, regenere esta matriz a partir dele —
nunca edite os dois documentos de forma independente.
