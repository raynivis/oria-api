# Resultados brutos — Avaliação A (chave de cegamento aberta)

Extração só de leitura, feita em 2026-11-10, sobre o banco de desenvolvimento local (`docker compose exec db psql`, mesma instância usada pela bateria) e sobre o repositório em `feat/correcao-usabilidade`. Nenhuma chamada a LLM foi feita para produzir este documento; nenhum arquivo do repositório foi alterado além deste `.md`. Todos os valores abaixo vêm de registro existente (`validacao_execucoes`, `validacao_saidas`, `validacao_tarefas`, `validacao_codigos_cegos`, `llm_calls`, `chunks`/`sections`, e o código-fonte das versões de prompt efetivamente usadas). Onde o dado não existe, está escrito "não registrado" — nenhum valor foi estimado ou derivado por aproximação.

**Segunda extração:** as seções 8, 9 e 10 abaixo, e o índice de entradas/saídas em `validacao/saidas-brutas/`, foram produzidas em 2026-11-13, sobre o mesmo banco de desenvolvimento, na branch `feat/avaliacao` (as seções 1 a 7 acima continuam da extração original de 2026-11-10, em `feat/correcao-usabilidade`, e não foram reprocessadas, recalculadas nem corrigidas nesta segunda passagem).

## 1. Chave de cegamento e catálogo de tarefas

60 saídas, execução única `avaliacao-a` (id `32b5cef2-1e04-4145-a62e-d7d0b52bc34d`).

| codigo | condicao | secao | tipo_tarefa | id_tarefa | enunciado |
|---|---|---|---|---|---|
| A1 | com Oria | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta de ligação | C2-L1 | O Capítulo 1 cita o estudo TIC Educação 2020 do Cetic.br, segundo o qual a falta de dispositivos e o acesso precário à internet dificultaram o ensino remoto para 86% das escolas, e remete aos capítulos seguintes. Que dados desta seção detalham essa dificuldade? |
| A2 | com Oria | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta fora do ebook | C8-F1 | Quantas famílias praticam educação domiciliar nos Estados Unidos? |
| A3 | com Oria | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | resumo | C2-RESUMO | Fichamento (resumo) da seção completa do Capítulo 2. |
| A4 | linha de base | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta respondível | C8-P2 | Que números o capítulo apresenta sobre ataques violentos em escolas? |
| A5 | com Oria | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta fora do ebook | C2-F2 | Qual foi a taxa de evasão no ensino superior brasileiro durante a pandemia? |
| A6 | linha de base | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta fora do ebook | C2-F1 | Como as escolas de Portugal distribuíram equipamentos aos professores durante a pandemia? |
| A7 | com Oria | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta fora do ebook | C2-F1 | Como as escolas de Portugal distribuíram equipamentos aos professores durante a pandemia? |
| A8 | linha de base | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta respondível | C8-P5 | O que Morozov propõe diante da plataformização? |
| A9 | com Oria | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta fora do ebook | C8-F2 | O que prevê o Projeto de Lei das Fake News sobre a responsabilidade das plataformas? |
| A10 | com Oria | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta respondível | C8-P6 | Que relação o capítulo estabelece entre plataformização e desigualdade? |
| A11 | linha de base | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta respondível | C2-P6 | A que conclusão o capítulo chega sobre a infraestrutura disponível? |
| A12 | com Oria | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta de ligação | C8-L1 | Este capítulo afirma que a plataformização cria estudantes de primeira e segunda classes. Que dados de infraestrutura apresentados antes no livro sustentam essa afirmação? |
| A13 | com Oria | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta de ligação | C2-L2 | O Capítulo 1 informa que o trabalho de campo ocorreu entre 4 de novembro de 2021 e 12 de junho de 2022. Os dados de infraestrutura desta seção vêm do mesmo levantamento? |
| A14 | linha de base | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta respondível | C2-P5 | Que recursos a escola ofereceu aos docentes para o ensino remoto? |
| A15 | linha de base | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta de ligação | C2-L2 | O Capítulo 1 informa que o trabalho de campo ocorreu entre 4 de novembro de 2021 e 12 de junho de 2022. Os dados de infraestrutura desta seção vêm do mesmo levantamento? |
| A16 | com Oria | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | ficha de trecho | C8-FICHA3 | a plataformização da vida favorece a estratificação social, ao acentuar as desigualdades sociais vigentes, criando 'estudantes de primeira e segunda classes', com diferentes graus de acesso à internet e a conteúdos educativos. |
| A17 | linha de base | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta de ligação | C8-L1 | Este capítulo afirma que a plataformização cria estudantes de primeira e segunda classes. Que dados de infraestrutura apresentados antes no livro sustentam essa afirmação? |
| A18 | com Oria | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta respondível | C2-P3 | Como os docentes avaliaram a qualidade da conexão da escola? |
| A19 | linha de base | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | bateria de questões | C8-QUESTOES | Bateria de questões geradas sobre o Capítulo 8 (sem enunciado pré-definido). |
| A20 | linha de base | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta respondível | C2-P4 | Que parâmetros o CIEB define para uma escola de nível avançado? |
| A21 | linha de base | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta de ligação | C8-L2 | O capítulo cita o balanço de Citelli nas Sistematizações e Conclusões. Que fatores de crise esse balanço elenca? |
| A22 | com Oria | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta respondível | C2-P4 | Que parâmetros o CIEB define para uma escola de nível avançado? |
| A23 | com Oria | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | ficha de trecho | C2-FICHA2 | a velocidade média das escolas públicas brasileiras é de 0,39 Mbps por aluno(a). Contudo, tal velocidade, segundo a pesquisa, deveria ser de 1 Mbps por aluno(a). |
| A24 | com Oria | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta respondível | C8-P3 | Como o capítulo avalia a defesa da educação domiciliar no pós-pandemia? |
| A25 | com Oria | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta respondível | C8-P4 | Que explicação Telma Vinha oferece para o agravamento das violências extremistas? |
| A26 | linha de base | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | resumo | C2-RESUMO | Fichamento (resumo) da seção completa do Capítulo 2. |
| A27 | linha de base | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta respondível | C2-P1 | O que foi o Ensino Remoto Emergencial e quando começou? |
| A28 | com Oria | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | ficha de trecho | C2-FICHA1 | reside neste movimento a diferença entre ensinar o 'manuseio' e abrir o debate qualificado sobre o lugar dos objetos na vida societária: computador, celular e tablet não são apenas máquinas, mas expressões materiais do labor humano |
| A29 | linha de base | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | ficha de trecho | C8-FICHA1 | De ambiente privilegiado de aprendizagem e de desenvolvimento integral de estudantes, as salas de aula tornaram-se palcos de conflitos, intimidações e agressões. |
| A30 | linha de base | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | resumo | C8-RESUMO | Fichamento (resumo) da seção completa do Capítulo 8. |
| A31 | linha de base | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta fora do ebook | C8-F1 | Quantas famílias praticam educação domiciliar nos Estados Unidos? |
| A32 | com Oria | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta respondível | C8-P2 | Que números o capítulo apresenta sobre ataques violentos em escolas? |
| A33 | com Oria | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | bateria de questões | C2-QUESTOES | Bateria de questões geradas sobre o Capítulo 2 (sem enunciado pré-definido). |
| A34 | com Oria | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | ficha de trecho | C8-FICHA1 | De ambiente privilegiado de aprendizagem e de desenvolvimento integral de estudantes, as salas de aula tornaram-se palcos de conflitos, intimidações e agressões. |
| A35 | linha de base | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta de ligação | C2-L1 | O Capítulo 1 cita o estudo TIC Educação 2020 do Cetic.br, segundo o qual a falta de dispositivos e o acesso precário à internet dificultaram o ensino remoto para 86% das escolas, e remete aos capítulos seguintes. Que dados desta seção detalham essa dificuldade? |
| A36 | com Oria | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | bateria de questões | C8-QUESTOES | Bateria de questões geradas sobre o Capítulo 8 (sem enunciado pré-definido). |
| A37 | linha de base | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta respondível | C8-P1 | Quais são as duas questões que o capítulo escolhe discutir? |
| A38 | linha de base | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta respondível | C2-P2 | Quais equipamentos as escolas declararam ter para finalidades didático-pedagógicas? |
| A39 | com Oria | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | ficha de trecho | C8-FICHA2 | A verdadeira política de regulação algorítmica torna-se visível quando sua lógica é aplicada às redes de proteção do estado de bem-estar social |
| A40 | com Oria | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta respondível | C2-P2 | Quais equipamentos as escolas declararam ter para finalidades didático-pedagógicas? |
| A41 | com Oria | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | resumo | C8-RESUMO | Fichamento (resumo) da seção completa do Capítulo 8. |
| A42 | linha de base | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | ficha de trecho | C2-FICHA1 | reside neste movimento a diferença entre ensinar o 'manuseio' e abrir o debate qualificado sobre o lugar dos objetos na vida societária: computador, celular e tablet não são apenas máquinas, mas expressões materiais do labor humano |
| A43 | linha de base | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta respondível | C2-P3 | Como os docentes avaliaram a qualidade da conexão da escola? |
| A44 | com Oria | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta respondível | C2-P1 | O que foi o Ensino Remoto Emergencial e quando começou? |
| A45 | com Oria | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta respondível | C2-P5 | Que recursos a escola ofereceu aos docentes para o ensino remoto? |
| A46 | linha de base | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta respondível | C8-P6 | Que relação o capítulo estabelece entre plataformização e desigualdade? |
| A47 | com Oria | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta respondível | C2-P6 | A que conclusão o capítulo chega sobre a infraestrutura disponível? |
| A48 | com Oria | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta respondível | C8-P1 | Quais são as duas questões que o capítulo escolhe discutir? |
| A49 | linha de base | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta respondível | C8-P3 | Como o capítulo avalia a defesa da educação domiciliar no pós-pandemia? |
| A50 | linha de base | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | bateria de questões | C2-QUESTOES | Bateria de questões geradas sobre o Capítulo 2 (sem enunciado pré-definido). |
| A51 | linha de base | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta fora do ebook | C8-F2 | O que prevê o Projeto de Lei das Fake News sobre a responsabilidade das plataformas? |
| A52 | linha de base | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | ficha de trecho | C8-FICHA3 | a plataformização da vida favorece a estratificação social, ao acentuar as desigualdades sociais vigentes, criando 'estudantes de primeira e segunda classes', com diferentes graus de acesso à internet e a conteúdos educativos. |
| A53 | linha de base | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | ficha de trecho | C2-FICHA3 | nos deparamos com uma 'subimplantação' de recursos tecnológicos digitais, herdeiros da insuficiência histórica da maior parte das instituições educacionais |
| A54 | linha de base | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta respondível | C8-P4 | Que explicação Telma Vinha oferece para o agravamento das violências extremistas? |
| A55 | com Oria | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | ficha de trecho | C2-FICHA3 | nos deparamos com uma 'subimplantação' de recursos tecnológicos digitais, herdeiros da insuficiência histórica da maior parte das instituições educacionais |
| A56 | linha de base | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | ficha de trecho | C8-FICHA2 | A verdadeira política de regulação algorítmica torna-se visível quando sua lógica é aplicada às redes de proteção do estado de bem-estar social |
| A57 | linha de base | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | ficha de trecho | C2-FICHA2 | a velocidade média das escolas públicas brasileiras é de 0,39 Mbps por aluno(a). Contudo, tal velocidade, segundo a pesquisa, deveria ser de 1 Mbps por aluno(a). |
| A58 | com Oria | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta de ligação | C8-L2 | O capítulo cita o balanço de Citelli nas Sistematizações e Conclusões. Que fatores de crise esse balanço elenca? |
| A59 | com Oria | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | pergunta respondível | C8-P5 | O que Morozov propõe diante da plataformização? |
| A60 | linha de base | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | pergunta fora do ebook | C2-F2 | Qual foi a taxa de evasão no ensino superior brasileiro durante a pandemia? |

## 2. Parâmetros e custos por saída

Para todas as 60: `provider` = Nvidia, `seed` = 42, `temperatura` = 0 (constantes da execução, `validacao_execucoes`, não variam por saída). `tentativas_ate_sucesso`: ver nota (*) abaixo da tabela — não registrado.

| codigo | modelo | papel_prompt | versao_prompt | temperatura | seed | provider | tokens_entrada | tokens_saida | duracao_ms | custo | data_hora (UTC) | tentativas_ate_sucesso |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A1 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 3145 | 2790 | 41978 | 0 | 2026-11-08 17:38:43 UTC | não registrado (*) |
| A2 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 1460 | 822 | 6991 | 0 | 2026-11-08 19:22:15 UTC | não registrado (*) |
| A3 | nvidia/nemotron-3.5-lightning:free | fichamento | 1 | 0 | 42 | Nvidia | 7924 | 12673 | 135112 | 0 | 2026-11-08 19:21:30 UTC | não registrado (*) |
| A4 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 44 | 555 | 5218 | 0 | 2026-11-08 19:29:06 UTC | não registrado (*) |
| A5 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 3159 | 1117 | 9959 | 0 | 2026-11-08 17:33:14 UTC | não registrado (*) |
| A6 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 48 | 2212 | 26823 | 0 | 2026-11-08 17:33:04 UTC | não registrado (*) |
| A7 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 3040 | 998 | 19140 | 0 | 2026-11-08 17:32:37 UTC | não registrado (*) |
| A8 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 45 | 1180 | 10817 | 0 | 2026-11-08 19:30:34 UTC | não registrado (*) |
| A9 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 3252 | 1512 | 14804 | 0 | 2026-11-08 19:22:48 UTC | não registrado (*) |
| A10 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 2208 | 765 | 7250 | 0 | 2026-11-08 19:30:42 UTC | não registrado (*) |
| A11 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 48 | 369 | 3479 | 0 | 2026-11-08 19:17:57 UTC | não registrado (*) |
| A12 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 3055 | 2687 | 24864 | 0 | 2026-11-08 19:26:44 UTC | não registrado (*) |
| A13 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 2991 | 9572 | 104025 | 0 | 2026-11-08 17:40:45 UTC | não registrado (*) |
| A14 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 47 | 997 | 12528 | 0 | 2026-11-08 17:44:37 UTC | não registrado (*) |
| A15 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 84 | 825 | 8879 | 0 | 2026-11-08 17:40:54 UTC | não registrado (*) |
| A16 | nvidia/nemotron-3.5-lightning:free | fichamento | 1 | 0 | 42 | Nvidia | 497 | 6084 | 62669 | 0 | 2026-11-08 19:26:10 UTC | não registrado (*) |
| A17 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 67 | 786 | 7411 | 0 | 2026-11-08 19:26:51 UTC | não registrado (*) |
| A18 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 3022 | 3423 | 37415 | 0 | 2026-11-08 17:42:41 UTC | não registrado (*) |
| A19 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 7342 | 2217 | 20982 | 0 | 2026-11-08 19:34:10 UTC | não registrado (*) |
| A20 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 48 | 2438 | 25957 | 0 | 2026-11-08 17:43:37 UTC | não registrado (*) |
| A21 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 65 | 1476 | 11881 | 0 | 2026-11-08 19:27:32 UTC | não registrado (*) |
| A22 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 2464 | 2312 | 21343 | 0 | 2026-11-08 17:43:11 UTC | não registrado (*) |
| A23 | nvidia/nemotron-3.5-lightning:free | fichamento | 1 | 0 | 42 | Nvidia | 494 | 7321 | 86102 | 0 | 2026-11-08 17:35:48 UTC | não registrado (*) |
| A24 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 3142 | 2234 | 25085 | 0 | 2026-11-08 19:29:31 UTC | não registrado (*) |
| A25 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 3320 | 1277 | 10235 | 0 | 2026-11-08 19:29:47 UTC | não registrado (*) |
| A26 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 7518 | 2975 | 39150 | 0 | 2026-11-08 19:22:08 UTC | não registrado (*) |
| A27 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 47 | 1208 | 12877 | 0 | 2026-11-08 17:41:41 UTC | não registrado (*) |
| A28 | nvidia/nemotron-3.5-lightning:free | fichamento | 1 | 0 | 42 | Nvidia | 499 | 4289 | 41153 | 0 | 2026-11-08 17:34:10 UTC | não registrado (*) |
| A29 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 80 | 1111 | 11020 | 0 | 2026-11-08 19:24:06 UTC | não registrado (*) |
| A30 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 7343 | 6609 | 79453 | 0 | 2026-11-08 19:37:09 UTC | não registrado (*) |
| A31 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 45 | 1548 | 15783 | 0 | 2026-11-08 19:22:34 UTC | não registrado (*) |
| A32 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 4021 | 6443 | 57607 | 0 | 2026-11-08 19:29:01 UTC | não registrado (*) |
| A33 | nvidia/nemotron-3.5-lightning:free | questions | 1 | 0 | 42 | Nvidia | 8439 | 5245 | 50951 | 0 | 2026-11-08 19:18:47 UTC | não registrado (*) |
| A34 | nvidia/nemotron-3.5-lightning:free | fichamento | 1 | 0 | 42 | Nvidia | 480 | 4227 | 49324 | 0 | 2026-11-08 19:23:55 UTC | não registrado (*) |
| A35 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 99 | 2334 | 16765 | 0 | 2026-11-08 17:39:00 UTC | não registrado (*) |
| A36 | nvidia/nemotron-3.5-lightning:free | questions | 1 | 0 | 42 | Nvidia | 8237 | 19217 | 178706 | 0 | 2026-11-08 19:33:50 UTC | não registrado (*) |
| A37 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 46 | 337 | 3208 | 0 | 2026-11-08 19:28:03 UTC | não registrado (*) |
| A38 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 52 | 894 | 8101 | 0 | 2026-11-08 17:42:04 UTC | não registrado (*) |
| A39 | nvidia/nemotron-3.5-lightning:free | fichamento | 1 | 0 | 42 | Nvidia | 477 | 5467 | 50696 | 0 | 2026-11-08 19:24:56 UTC | não registrado (*) |
| A40 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 3028 | 1752 | 13973 | 0 | 2026-11-08 17:41:56 UTC | não registrado (*) |
| A41 | nvidia/nemotron-3.5-lightning:free | fichamento | 1 | 0 | 42 | Nvidia | 7743 | 10888 | 98358 | 0 | 2026-11-08 19:35:47 UTC | não registrado (*) |
| A42 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 93 | 1191 | 11676 | 0 | 2026-11-08 17:34:20 UTC | não registrado (*) |
| A43 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 47 | 961 | 7482 | 0 | 2026-11-08 17:42:49 UTC | não registrado (*) |
| A44 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 2466 | 4174 | 34822 | 0 | 2026-11-08 17:41:29 UTC | não registrado (*) |
| A45 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 3060 | 4763 | 48419 | 0 | 2026-11-08 17:44:23 UTC | não registrado (*) |
| A46 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 46 | 1061 | 11209 | 0 | 2026-11-08 19:50:04 UTC | não registrado (*) |
| A47 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 2985 | 6020 | 61350 | 0 | 2026-11-08 17:45:39 UTC | não registrado (*) |
| A48 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 2833 | 3451 | 27935 | 0 | 2026-11-08 19:27:59 UTC | não registrado (*) |
| A49 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 50 | 743 | 6294 | 0 | 2026-11-08 19:29:38 UTC | não registrado (*) |
| A50 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 7517 | 3244 | 27395 | 0 | 2026-11-08 19:19:15 UTC | não registrado (*) |
| A51 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 52 | 1881 | 16667 | 0 | 2026-11-08 19:23:05 UTC | não registrado (*) |
| A52 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 97 | 925 | 9098 | 0 | 2026-11-08 19:26:18 UTC | não registrado (*) |
| A53 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 79 | 1556 | 17781 | 0 | 2026-11-08 17:38:01 UTC | não registrado (*) |
| A54 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 52 | 779 | 6764 | 0 | 2026-11-08 19:29:54 UTC | não registrado (*) |
| A55 | nvidia/nemotron-3.5-lightning:free | fichamento | 1 | 0 | 42 | Nvidia | 485 | 11009 | 103595 | 0 | 2026-11-08 17:37:42 UTC | não registrado (*) |
| A56 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 77 | 1115 | 10569 | 0 | 2026-11-08 19:25:07 UTC | não registrado (*) |
| A57 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 88 | 1121 | 11785 | 0 | 2026-11-08 17:36:00 UTC | não registrado (*) |
| A58 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 2806 | 3647 | 28618 | 0 | 2026-11-08 19:27:18 UTC | não registrado (*) |
| A59 | nvidia/nemotron-3.5-lightning:free | dialogue | 1 | 0 | 42 | Nvidia | 1798 | 3230 | 28076 | 0 | 2026-11-08 19:30:24 UTC | não registrado (*) |
| A60 | nvidia/nemotron-3.5-lightning:free | baseline | 1 | 0 | 42 | Nvidia | 48 | 1323 | 14514 | 0 | 2026-11-08 17:33:28 UTC | não registrado (*) |

(*) `validacao_saidas` não tem coluna de tentativas; `llm_calls` não tem FK para `validacao_saidas`/`validacao_tarefas`. A correlação por `entradaCompleta`+`modelo`+`promptVersao` foi tentada e descartada: `llm_calls` registra 320 chamadas no total, incluindo o mesmo modelo/papel usado em datas anteriores a esta execução (ex.: chamadas de `dialogue`/`fichamento`/`questions` com `nvidia/nemotron-3.5-lightning:free` já em 2026-10-25, antes de `iniciadaEm` desta execução, 2026-11-08), o que tornaria a contagem de tentativas ambígua — risco de contar chamada de outra execução (provavelmente a calibração do VALIDATION.md §9, cujas linhas de `validacao_execucoes`/`validacao_saidas` não existem mais) como retentativa desta. Ver observação 2.

Nota sobre custo: todas as 60 saídas têm `custo = 0`. O modelo usado (`nvidia/nemotron-3.5-lightning:free`) é de camada gratuita no OpenRouter — valor correto e esperado, não dado ausente.

## 3. Diagnóstico de recuperação

Só para as saídas com Oria que passaram por busca semântica (as 20 de pergunta — respondível, de ligação e fora do ebook). `similaridade_maxima`, `similaridade_minima` e `limiar_configurado` **não são persistidos em lugar nenhum**: `RetrievalService.buscar` devolve `{chunkId, sectionId, texto, ancoraCfi, score}`, mas `scripts/validacao/gerar-bateria.ts` (em `prepararChamada`) usa só `.texto` de cada chunk para montar o prompt — `score`, `chunkId` e o `limiar`/`topK` efetivamente usados são descartados antes de qualquer gravação. Não há como recuperar esses três valores do banco ou do repositório para esta execução; estão marcados "não registrado" abaixo, não calculados.

`n_chunks_recuperados` e `secoes_de_origem_dos_chunks` **são recuperáveis**: o prompt efetivamente enviado (`entradaCompleta`, JSON com as mensagens) preserva o texto literal de cada trecho numerado `[n]`. Cada um desses textos foi comparado por igualdade exata (`=`, não aproximação) com a coluna `chunks.texto`, achando exatamente 1 seção de origem por chunk em todos os casos (nenhuma ambiguidade, nenhum chunk sem correspondência).

| codigo | n_chunks_recuperados | similaridade_maxima | similaridade_minima | limiar_configurado | secoes_de_origem_dos_chunks |
|---|---|---|---|---|---|
| A1 | 6 | não registrado | não registrado | não registrado | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes; Capítulo 1 - O perfil docente no ensino remoto emergencial: aspectos funcionais e pedagógicos |
| A2 | 2 | não registrado | não registrado | não registrado | Capítulo 1 - O perfil docente no ensino remoto emergencial: aspectos funcionais e pedagógicos; Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida |
| A5 | 6 | não registrado | não registrado | não registrado | Apresentação e delimitações; Capítulo 1 - O perfil docente no ensino remoto emergencial: aspectos funcionais e pedagógicos; Front Matter / Elementos Pré-textuais / Páginas Iniciales; Nota preliminar |
| A7 | 6 | não registrado | não registrado | não registrado | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes; Apresentação e delimitações; Capítulo 1 - O perfil docente no ensino remoto emergencial: aspectos funcionais e pedagógicos |
| A9 | 5 | não registrado | não registrado | não registrado | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida; Front Matter / Elementos Pré-textuais / Páginas Iniciales; Capítulo 3 - Impactos da pandemia na educação básica: infraestrutura tecnológica e letramento digital; Capítulo 6 - Processos comunicacionais e pandemia: a variável do tempo |
| A10 | 4 | não registrado | não registrado | não registrado | Capítulo 6 - Processos comunicacionais e pandemia: a variável do tempo; Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida |
| A12 | 6 | não registrado | não registrado | não registrado | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida; Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes; Capítulo 3 - Impactos da pandemia na educação básica: infraestrutura tecnológica e letramento digital; Capítulo 7 - Pandemia, jornada pedagógica e os desafios do tempo: novos dispositivos de aprendizagem, estresse docente e precarização do trabalho |
| A13 | 6 | não registrado | não registrado | não registrado | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes; Apresentação e delimitações; Capítulo 1 - O perfil docente no ensino remoto emergencial: aspectos funcionais e pedagógicos |
| A18 | 6 | não registrado | não registrado | não registrado | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes; Apresentação e delimitações |
| A22 | 4 | não registrado | não registrado | não registrado | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes; Capítulo 1 - O perfil docente no ensino remoto emergencial: aspectos funcionais e pedagógicos |
| A24 | 6 | não registrado | não registrado | não registrado | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida; Capítulo 1 - O perfil docente no ensino remoto emergencial: aspectos funcionais e pedagógicos; Capítulo 4 - Ensino emergencial: um panorama da atuação das escolas durante a pandemia |
| A25 | 6 | não registrado | não registrado | não registrado | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida |
| A32 | 6 | não registrado | não registrado | não registrado | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida; Capítulo 6 - Processos comunicacionais e pandemia: a variável do tempo |
| A40 | 6 | não registrado | não registrado | não registrado | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes; Apresentação e delimitações |
| A44 | 5 | não registrado | não registrado | não registrado | Nota preliminar; Capítulo 1 - O perfil docente no ensino remoto emergencial: aspectos funcionais e pedagógicos; Apresentação e delimitações; Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes |
| A45 | 6 | não registrado | não registrado | não registrado | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes; Apresentação e delimitações |
| A47 | 6 | não registrado | não registrado | não registrado | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes |
| A48 | 6 | não registrado | não registrado | não registrado | Capítulo 7 - Pandemia, jornada pedagógica e os desafios do tempo: novos dispositivos de aprendizagem, estresse docente e precarização do trabalho; Capítulo 4 - Ensino emergencial: um panorama da atuação das escolas durante a pandemia |
| A58 | 6 | não registrado | não registrado | não registrado | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida; Apresentação e delimitações; Capítulo 7 - Pandemia, jornada pedagógica e os desafios do tempo: novos dispositivos de aprendizagem, estresse docente e precarização do trabalho; Capítulo 6 - Processos comunicacionais e pandemia: a variável do tempo |
| A59 | 3 | não registrado | não registrado | não registrado | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida |

## 4. Baterias de questões

As quatro saídas de tipo `questoes`. Contagens tiradas do conteúdo real de `saidaBruta` (JSON validado pelo esquema para as com Oria; texto livre para as de linha de base, sem esquema).

| codigo | n_questoes_geradas | tipos_de_questao | n_com_gabarito | n_com_conceitos_associados | n_com_trecho_fonte |
|---|---|---|---|---|---|
| A19 | 15 | discursivas (sem alternativas; organizadas em 4 blocos temáticos, não por tipo) | 0 | não aplicável — condição de linha de base não gera `conceitoIds` | 0 |
| A33 | 5 | discursivas de resposta construída (campo `tipo` não existe no esquema de geração; o prompt proíbe alternativas e V/F) | 5 | 5 | 5 |
| A36 | 5 | discursivas de resposta construída (idem A33) | 5 | 5 | 5 |
| A50 | 12 | 5 múltipla escolha + 5 verdadeiro/falso + 2 discursivas (classificação do próprio texto gerado, não de um campo estruturado) | 10 de 12 (itens 11 e 12, discursivos, não têm gabarito) | não aplicável — condição de linha de base não gera `conceitoIds` | não aplicável (ver nota) |

Notas:
- Contagem confirmada contra o registro: 15 (A19), 5 (A33), 5 (A36) e 12 (A50) — os mesmos números citados na tarefa.
- Quantidade imposta por: **nem o esquema, nem um limite rígido do prompt, para a linha de base** (sem instrução de quantidade em `montarMensagensBaseline`, o modelo escolheu livremente 15 e 12) — e **pelo prompt, não pelo esquema, para a condição com Oria**: `schemaQuestoes` só exige `.min(1)` (qualquer quantidade ≥ 1 passaria a validação); a quantidade 5 vem da instrução explícita `"Quantidade de questões: 5"`, montada em `questions.ts` a partir de `quantidade: 5` hardcoded em `scripts/validacao/gerar-bateria.ts` (chamada a `questionsTemplate.montarMensagens`). As duas saídas com Oria obedeceram exatamente a essa instrução (5 e 5).
- `n_com_trecho_fonte` da linha de base: não existe campo estruturado equivalente a `trechosFonte`. Em A50, 10 das 12 respostas do gabarito citam um trecho entre aspas como justificativa informal (não um campo separado); A19 não tem gabarito nem citação alguma.
- `tipos_de_questao`: não é um dado gravado pelo gerador em nenhuma das duas condições — o esquema `schemaQuestoes` não tem campo `tipo` por questão (a única classificação por tipo que o sistema grava, `nivelBloom`, é atribuída depois por avaliador em `validacao_pontuacoes`, não pelo gerador; ver observação 4). Os "tipos" acima, para A50, foram lidos diretamente dos cabeçalhos que o próprio texto gerado usa ("Questões de Múltipla Escolha", "Verdadeiro ou Falso", "Perguntas Aberta/Reflexiva").

## 5. Completude estrutural das fichas

As 16 saídas de resumo e de ficha de trecho (4 resumo + 12 ficha). Campos verificados por correspondência exata de texto (normalizada para acentos) contra os cabeçalhos markdown realmente presentes em `saidaBruta` — não por suposição do esquema. `tem_trecho_original` e `tem_identificacao_da_secao` referem-se ao que está gravado em `entradaCompleta` (a entrada enviada, preservada por saída): por construção de `prepararChamada`/`montarMensagens`/`montarMensagensBaseline`, toda entrada de resumo/ficha, nas duas condições, inclui literalmente `Seção: <título>` e `Texto:\n<trecho ou seção completa>` — por isso "sim" para as 16, verificado no código-fonte e com amostragem direta de `entradaCompleta` (ex.: A26).

| codigo | campos_presentes | campos_ausentes | tem_trecho_original | tem_identificacao_da_secao |
|---|---|---|---|---|
| A3 | Ideia central, Conceitos, Pontos de atenção, Perguntas em aberto | Dados citados | sim | sim |
| A16 | Ideia central, Conceitos, Pontos de atenção, Perguntas em aberto | Dados citados | sim | sim |
| A23 | Ideia central, Conceitos, Pontos de atenção, Perguntas em aberto | Dados citados | sim | sim |
| A26 | (nenhum dos 5 cabeçalhos do esquema com Oria) | Ideia central, Conceitos, Pontos de atenção, Dados citados, Perguntas em aberto | sim | sim |
| A28 | Ideia central, Conceitos, Pontos de atenção, Perguntas em aberto | Dados citados | sim | sim |
| A29 | (nenhum dos 5 cabeçalhos do esquema com Oria) | Ideia central, Conceitos, Pontos de atenção, Dados citados, Perguntas em aberto | sim | sim |
| A30 | (nenhum dos 5 cabeçalhos do esquema com Oria) | Ideia central, Conceitos, Pontos de atenção, Dados citados, Perguntas em aberto | sim | sim |
| A34 | Ideia central, Conceitos, Pontos de atenção, Perguntas em aberto | Dados citados | sim | sim |
| A39 | Ideia central, Conceitos, Pontos de atenção, Perguntas em aberto | Dados citados | sim | sim |
| A41 | Ideia central, Conceitos, Pontos de atenção, Perguntas em aberto | Dados citados | sim | sim |
| A42 | (nenhum dos 5 cabeçalhos do esquema com Oria) | Ideia central, Conceitos, Pontos de atenção, Dados citados, Perguntas em aberto | sim | sim |
| A52 | (nenhum dos 5 cabeçalhos do esquema com Oria) | Ideia central, Conceitos, Pontos de atenção, Dados citados, Perguntas em aberto | sim | sim |
| A53 | (nenhum dos 5 cabeçalhos do esquema com Oria) | Ideia central, Conceitos, Pontos de atenção, Dados citados, Perguntas em aberto | sim | sim |
| A55 | Ideia central, Conceitos, Pontos de atenção, Perguntas em aberto | Dados citados | sim | sim |
| A56 | (nenhum dos 5 cabeçalhos do esquema com Oria) | Ideia central, Conceitos, Pontos de atenção, Dados citados, Perguntas em aberto | sim | sim |
| A57 | (nenhum dos 5 cabeçalhos do esquema com Oria) | Ideia central, Conceitos, Pontos de atenção, Dados citados, Perguntas em aberto | sim | sim |

Nota: nenhuma das 8 saídas com Oria usa a seção "Dados citados" — correto e esperado, não uma falha de adesão ao prompt: a versão de prompt efetivamente usada nesta execução é `promptVersao = 1` (`git show 8c51fefd4eed864d63e027694d1453491f5e8da9:./src/prompts/templates/fichamento.ts`), que não tem essa seção — ela só foi adicionada depois, na `VERSAO = 2` do item [2.1] da correção de usabilidade de backend, em outro branch, posterior à bateria.
As 8 saídas de linha de base (A26, A29, A30, A42, A52, A53, A56, A57) não usam nenhum dos 5 cabeçalhos — esperado: `SISTEMA_BASELINE` não pede estrutura alguma.

## 6. Verificação de reprodutibilidade

(a) **Sim, as 60 saídas vêm do mesmo modelo**: `nvidia/nemotron-3.5-lightning:free` (coluna `modelo` de `validacao_saidas`, único valor em todas as 60 linhas; mesmo valor em `validacao_execucoes.modelo`).

(b) **Sim**: `validacao_execucoes` (id `32b5cef2-1e04-4145-a62e-d7d0b52bc34d`) registra `temperatura = 0`, `seed = 42`, `provider = 'Nvidia'` para a execução inteira — não há coluna por saída para esses três campos, e nenhuma saída diverge porque o script (`scripts/validacao/gerar-bateria.ts`) usa os mesmos `parametros` (lidos uma vez, via `lerParametrosGeracao`) em todas as chamadas da bateria. `allow_fallbacks: false` não é gravado em nenhuma tabela, mas é um valor fixo no código: `src/llm/llm.service.ts:433` — `corpo.provider = { order: [opcoes.provider], allow_fallbacks: false }` — sempre que `opcoes.provider` é passado, o que `completarParaValidacao` sempre faz.

(c) **2026-11-08, 17:32:18 (iniciadaEm da execução) até pelo menos 2026-11-08, 19:50:04** (o `criadoEm` mais tardio entre as 60 saídas, A46). `encerradaEm` da execução está registrado como 17:45:10, **anterior** a boa parte dos `criadoEm` das saídas — ver observação 1.

(d) **Commit `8c51fefd4eed864d63e027694d1453491f5e8da9`**, tag `avaliacao-a-v1`, mensagem "feat(validacao): fecha gabarito da Avaliacao A", datado de 2026-11-08 14:27:13 -0300 — gravado em `validacao_execucoes.gitSha`, capturado por `git rev-parse HEAD` no momento da geração (comentário da entidade `Execucao`). Branch atual do repositório (`feat/correcao-usabilidade`) e `feat/avaliacao` contêm esse commit.

(e) **Sim**, a condição de linha de base recebe o texto da seção para resumo/ficha/questões — confirmado lendo `entradaCompleta` diretamente, não a documentação. Exemplo, saída A26 (linha de base, C2-RESUMO), início de `entradaCompleta`:
```
{"role":"system","content":"Você é um assistente útil. Responda à solicitação do usuário."},
{"role":"user","content":"Faça o fichamento desta seção.\n\nTexto:\n<texto completo do Capítulo 2>..."}
```
O campo que guarda a entrada enviada é `validacao_saidas.entradaCompleta` (texto, é o `JSON.stringify(mensagens)` efetivamente enviado ao modelo). O mecanismo é `montarMensagensBaseline(enunciado, textoColado)` em `src/validacao/baseline.prompt.ts`, chamado por `gerar-bateria.ts` com `textoColado = secao.textoCompleto` (resumo) ou `textoColado = tarefa.enunciado` (ficha, questões).

(f) Instrução genérica da condição de linha de base, transcrita exatamente como gravada em `src/validacao/baseline.prompt.ts` (`SISTEMA_BASELINE`) e repetida literalmente no campo `system` de `entradaCompleta` de toda saída de linha de base:

> Você é um assistente útil. Responda à solicitação do usuário.

## 7. Observações e inconsistências

1. **`encerradaEm` da execução é anterior a boa parte das saídas que ela contém.** `validacao_execucoes.encerradaEm = 2026-11-08 17:45:10 UTC`, mas 36 das 60 saídas têm `criadoEm` entre 19:17 e 19:50 do mesmo dia — depois do registro de encerramento. O código de `gerar-bateria.ts` cria uma linha nova de `Execucao` a cada chamada (não há reaproveitamento de uma execução existente), e só existe uma linha em `validacao_execucoes` hoje. Nenhum registro do banco ou do repositório explica essa lacuna de ~1h30 por si só. **Explicação da autora (2026-11-13, fora do banco):** houve troca de chave/provedor da OpenRouter durante a coleta, exigindo retomar parte da geração depois do horário em que `encerradaEm` já tinha sido gravado — por isso o `criadoEm` de parte das saídas fica à frente de `encerradaEm`. Registrada aqui como explicação dada pela autora, não como algo deduzido dos dados (a tabela não guarda qual chave/provedor OpenRouter foi usado em cada tentativa).

2. **`tentativas_ate_sucesso` não é recuperável com segurança.** `validacao_saidas` não tem essa coluna. `llm_calls` (320 linhas no total, 2026-10-04 a 2026-11-08) não tem FK para `validacao_saidas` nem `validacao_tarefas`. Uma correlação por `entradaCompleta`+`modelo`+`promptVersao` foi tentada e abandonada: o mesmo modelo (`nvidia/nemotron-3.5-lightning:free`) já aparece em `llm_calls` com papéis `dialogue`/`fichamento`/`questions` a partir de 2026-10-25, antes de `iniciadaEm` desta execução — provavelmente a calibração do VALIDATION.md §9, cujas linhas de `validacao_execucoes`/`validacao_saidas` não existem mais no banco (nenhuma segunda linha em `validacao_execucoes`). Contar tentativas por correspondência de texto arriscaria somar chamadas da calibração como retentativas da Avaliação A. Reportado como "não registrado" em vez de estimado.

3. **Diagnóstico de recuperação (similaridade, limiar) nunca é persistido por chamada**, para nenhuma das 20 saídas de pergunta com Oria. `RetrievalService.buscar` devolve `score` por chunk, mas `gerar-bateria.ts` descarta tudo exceto `.texto` antes de montar o prompt — não há como recuperar `similaridade_maxima`, `similaridade_minima` ou o `limiar_configurado` efetivo de 2026-11-08 a partir do estado atual do banco ou do `.env` (o `.env` de hoje não garante ser o mesmo valor vigente na execução). Gap de instrumentação da bateria, não corrigido.

4. **`validacao_pontuacoes` está vazia — 0 linhas no total, não só para a Avaliação A.** `revelado = false` para os 60 códigos (nenhum foi revelado). Isso contradiz, ao nível do banco, a premissa de que "as 60 saídas foram pontuadas por dois avaliadores e as divergências resolvidas por consenso": nenhuma pontuação de `aluno`, `orientador` ou `consenso` está registrada em `validacao_pontuacoes` para nenhuma das 60. O arquivo `validacao/avaliacao-a-consensual.pdf` existe no repositório (683 KB, modificado em 2026-11-10 — hoje), o que sugere que a consolidação do consenso foi feita por fora do pipeline do próprio app (`scripts/validacao/importar-pontuacoes.ts` não foi executado com sucesso sobre estes dados, ou foi executado e por algum motivo não persistiu). Nenhuma das 7 seções pedidas depende de nota ou de consenso, então isso não impediu esta extração — mas como o enunciado da tarefa descreve o consenso como já fechado, e o banco mostra o contrário, registro aqui sem resolver: a autora decide se o `importar-pontuacoes.ts` precisa rodar antes de qualquer análise que dependa de nota.

5. **Diacríticos inconsistentes em pelo menos uma saída.** A28 (com Oria, C2-FICHA1) grafou o cabeçalho "Pontos de atenção" sem acentuação ("Pontos de atencao") e perdeu acentos em outros trechos do mesmo texto ("tecnico", "relacoes", "criatividade"). Não afetou a contagem de campos da seção 5 (comparação feita com normalização de acentos), mas é uma variação de formatação da própria geração, não do pipeline — registrado, não corrigido.

6. **Nenhuma inconsistência estrutural encontrada nos códigos ou pares.** Verificado por consulta direta: nenhum código duplicado em `validacao_codigos_cegos`; nenhum código fora do padrão A1..A60; todas as 30 tarefas têm exatamente 2 saídas cegadas (uma por condição, nenhum par incompleto); nenhuma saída da execução ficou sem código cego; nenhuma saída tem `sucesso = false`. 60 códigos, 60 saídas, 30 tarefas × 2 condições, sem sobra nem falta.

7. **`gabarito` das 30 tarefas está preenchido** (nenhum nulo/vazio) — não solicitado por nenhuma seção acima, registrado aqui só porque foi verificado de passagem ao consultar `validacao_tarefas`.

8. **`llm_calls` guarda tráfego de outros papéis do produto além desta avaliação** (`avaliacao`=16, `concepts`=16, `hint`=31, `panorama`=47 linhas, nenhum deles pertencente ao desenho desta Avaliação A) — não é inconsistência, é o esperado de uma tabela única e cumulativa de evidência de pesquisa (regra 5 do CLAUDE.md), citado aqui só para justificar por que a correlação da observação 2 foi descartada.

## 8. O que `llm_calls` guarda além de `validacao_saidas`

A observação 2 já estabeleceu que `llm_calls` não tem FK para `validacao_saidas`
nem para `validacao_tarefas`, e por isso `tentativas_ate_sucesso` não é
recuperável com segurança — isso está encerrado e não foi reaberto aqui. A
pergunta desta seção é outra: o que `llm_calls` guarda, por chamada, que
`validacao_saidas` não guarda.

**(a) Colunas de `llm_calls`** (lido direto do esquema, `\d llm_calls`):

| Coluna | Tipo | Nulo |
|---|---|---|
| `id` | uuid (PK) | não |
| `papel` | varchar | não |
| `modelo` | varchar | não |
| `promptVersao` | int | não |
| `entradaCompleta` | text | não |
| `saidaBruta` | text | não |
| `temperatura` | numeric | sim |
| `seed` | int | sim |
| `provider` | varchar | sim |
| `tokensIn` | int | não |
| `tokensOut` | int | não |
| `custo` | numeric | não |
| `duracaoMs` | int | não |
| `sucesso` | boolean | não |
| `criadoEm` | timestamp sem fuso | não |

**(b) Colunas sem equivalente em `validacao_saidas`:** `papel`, `temperatura`,
`seed`, `provider`. `validacao_saidas` não tem nenhuma dessas quatro colunas.
Com uma ressalva: `temperatura`, `seed` e `provider` **são** recuperáveis
indiretamente para as 60 saídas desta execução, porque são constantes da
execução inteira e estão em `validacao_execucoes` (seção 1 de
`AUDITORIA-TABELAS.md`) — não estão em `validacao_saidas`, mas não são
dados perdidos. `papel`, por outro lado, não tem equivalente em lugar
nenhum do esquema de validação: não é uma coluna de `validacao_saidas`, de
`validacao_tarefas` nem de `validacao_execucoes`. O valor usado na seção 2
de `RESULTADOS-AVALIACAO-A.md` foi derivado da combinação
(`condicao`, `tipo_tarefa`) pela lógica de `prepararChamada` em
`gerar-bateria.ts` — uma leitura determinística do código-fonte, não um
dado de banco.

**(c) Chamadas de `llm_calls` dentro da janela da execução, com o mesmo
modelo, por papel** — `modelo = 'nvidia/nemotron-3.5-lightning:free'` e
`criadoEm` entre `2026-11-08 17:32:18` (`iniciadaEm`) e `2026-11-08
19:50:04` (o `criadoEm` mais tardio entre as 60 saídas):

| papel | linhas |
|---|---|
| `avaliacao` | 2 |
| `baseline` | 66 |
| `dialogue` | 44 |
| `fichamento` | 20 |
| `hint` | 12 |
| `panorama` | 4 |
| `questions` | 8 |
| **total** | **156** |

Estas 156 linhas não estão pareadas com as 60 saídas — a observação 2 já
mostrou por que esse pareamento é ambíguo (o mesmo modelo é usado por
`llm_calls` fora desta execução, inclusive antes de `iniciadaEm`, então
mesmo restringindo à janela e ao modelo, `baseline` tem 66 linhas contra 30
saídas de linha de base, `dialogue` tem 44 contra 20 saídas de pergunta com
Oria, `fichamento` tem 20 contra 8, `questions` tem 8 contra 2 — mais linhas
do que saídas em todos os quatro papéis da bateria, e três papéis inteiros
que não pertencem a nenhuma tarefa desta avaliação (`avaliacao`, `hint`,
`panorama`, 18 linhas no total) também caem dentro da mesma janela de
tempo). Esta seção só informa o que existe; não estabelece correspondência
entre essas linhas e nenhuma saída específica.

## 9. Estado da tabela de pontuações (diagnóstico, sem execução)

**NÃO FOI EXECUTADO NENHUM IMPORTADOR OU SCRIPT DE ESCRITA PARA PRODUZIR
ESTA SEÇÃO.** Tudo abaixo vem da leitura do código de
`scripts/validacao/importar-pontuacoes.ts`, `scripts/validacao/revelar.ts`,
da entidade `Pontuacao`, e de uma leitura (sem escrita) dos arquivos
`.xlsx` já presentes em `validacao/`.

**(a) Formato de entrada esperado por `importar-pontuacoes.ts`:**
- Arquivo `.xlsx` (lido via `ExcelJS.Workbook().xlsx.readFile`).
- Precisa ter uma aba com o nome exato `"Pontuação"` — o script lança erro
  se não encontrar (`planilha.getWorksheet('Pontuação')`).
- Linha 1 é tratada como cabeçalho e ignorada.
- Para cada linha seguinte, por **posição de coluna** (não por nome de
  cabeçalho):
  - coluna 1 (`getCell(1)`): `codigo` — string, obrigatória; uma linha com
    essa célula vazia é tratada como fim da planilha e ignorada (permite
    linhas em branco ao final).
  - colunas 2 a 4: **não são lidas pelo importador** (no template gerado
    por `exportar-planilha.ts` são "Saída", "Enunciado da tarefa" e
    "Gabarito" — contexto para quem pontua, mas o importador as ignora).
  - coluna 5 (`getCell(5)`): C1 — obrigatória, inteiro entre 0 e 2
    (`lerNota` lança erro se não for).
  - coluna 6: C2 — mesma regra.
  - coluna 7: C3 — mesma regra.
  - coluna 8: C4 — mesma regra.
  - coluna 9: `nivelBloom` — opcional; vazio/falso vira `null`, senão
    `Number(valor)`.
  - coluna 10: `observacao` — opcional; vazio/falso vira `null`, senão
    `String(valor)`.
- `avaliador` (`'aluno' | 'orientador' | 'consenso'`) e a execução
  (`execucaoId`) **não vêm do arquivo** — são passados por linha de
  comando (`--avaliador=`, `--execucao=`), o mesmo valor aplicado a todas
  as linhas da planilha naquela execução do script.
- Ao final, o script exige que toda saída cegada da execução tenha
  recebido uma linha na planilha — se faltar alguma, lança erro listando
  os códigos faltantes, sem importar nada parcialmente (a falha é
  tudo-ou-nada só para essa chamada do script; linhas já salvas em
  chamadas anteriores do script, com outro avaliador, continuam valendo).

**(b) Colunas de `validacao_pontuacoes`** (`src/validacao/entities/pontuacao.entity.ts`):

| Coluna | Tipo | Nulo | Obrigatória para o importador gravar a linha |
|---|---|---|---|
| `id` | uuid (PK) | não | gerada automaticamente |
| `saidaId` | uuid (FK → `validacao_saidas.id`) | não | sim (resolvida a partir do código, via `validacao_codigos_cegos`) |
| `avaliador` | varchar | não | sim (vem do `--avaliador=`, não do arquivo) |
| `c1`, `c2`, `c3`, `c4` | int | não | sim (cada uma, 0–2) |
| `nivelBloom` | int | sim | não |
| `observacao` | text | sim | não |
| `criadoEm` | timestamp sem fuso | não | não (default `now()`, nunca passado explicitamente pelo script) |

Índice único em (`saidaId`, `avaliador`): uma segunda importação para o
mesmo avaliador e a mesma saída **atualiza** a linha existente
(`pontuacoesRepository.update`), não duplica.

**(c) Existe algum arquivo no repositório já nesse formato?** Não, nenhum
arquivo pronto para importar diretamente.
- `validacao/avaliacao-a-consensual.pdf` existe, mas é PDF — formato
  errado por completo, o importador só lê `.xlsx`.
- `validacao/planilha-aluno.xlsx` e `validacao/planilha-orientador.xlsx`
  existem, têm a aba `"Pontuação"` com o nome certo e exatamente as 60
  linhas na ordem certa (gerados por `exportar-planilha.ts`) — **mas as
  colunas C1–C4 das 60 linhas estão vazias nos dois arquivos**, conferido
  agora por leitura direta das células (0 de 60 linhas com C1 preenchido
  em cada um). Ou seja, o formato está certo, os dados de nota não estão
  neles.
- Para importar o avaliador `consenso` (o que falta para `revelar.ts`
  aceitar revelar pelo pipeline), seria preciso produzir um `.xlsx` novo
  com: aba chamada `"Pontuação"`; linha 1 de cabeçalho (livre, é
  ignorada); uma linha por código de A1 a A60, na coluna 1; C1–C4 nas
  colunas 5–8, inteiros 0–2, vindos da consolidação que hoje está só no
  PDF; opcionalmente nível de Bloom na coluna 9 e observação na coluna 10.
  As colunas 2–4 podem ficar vazias (o importador não as lê), mas
  preenchê-las com o conteúdo de `planilha-aluno.xlsx`/`-orientador.xlsx`
  deixaria o arquivo final mais fácil de auditar a olho.

**(d) O importador escreve em alguma tabela além de `validacao_pontuacoes`?
Em especial, altera `revelado`?**

Não. Lendo `importar-pontuacoes.ts` de ponta a ponta: as únicas operações
de escrita são `pontuacoesRepository.update(...)` e
`pontuacoesRepository.save(pontuacoesRepository.create(...))` — ambas só
sobre `validacao_pontuacoes`. O script nunca importa `CodigoCego` para
escrita (só o usa, em `codigosRepository.find`, para resolver
`codigo → saidaId`, leitura). **Quem altera `revelado` é um script
diferente, `revelar.ts`**, que: (i) exige que exista pontuação com
`avaliador = 'consenso'` para todas as saídas da execução antes de fazer
qualquer coisa — se faltar uma, lança erro e não altera nada; (ii) só
então faz `codigosRepository.update({saidaId: In(...)}, {revelado: true})`
nas saídas daquela execução. `importar-pontuacoes.ts` e `revelar.ts` nunca
rodam dentro da mesma transação nem são chamados um pelo outro — são dois
scripts `npm run` separados.

Então, estritamente, **rodar `importar-pontuacoes.ts` agora não afeta
`revelado`** — isso só aconteceria se, depois, alguém também rodasse
`revelar.ts` com a execução já tendo consenso completo. Mas há um risco de
ordem dos fatos mesmo sem chegar a `revelar.ts`: `validacao_pontuacoes.criadoEm`
tem default `now()` e o script nunca passa esse campo explicitamente — uma
importação feita hoje (ou em qualquer data futura) grava `criadoEm` com a
data da importação, não a data em que a pontuação/consenso foi de fato
fechada (o PDF consensual existe desde 2026-11-10). Qualquer leitura futura
de `validacao_pontuacoes.criadoEm` leria essa data de importação como se
fosse a data do trabalho de avaliação, o que não seria verdade.

**Recomendação (diagnóstico, não executado):** se a autora quiser rodar o
importador sobre estes dados, o script precisaria de um ajuste para aceitar
a data real da consolidação (um `--data=` novo, por exemplo) e passá-la
explicitamente em `dados.criadoEm` nos dois pontos de escrita, em vez de
depender do default `now()` da coluna. Sem esse ajuste, `importar-pontuacoes.ts`
não deveria ser executado sobre estes dados — não porque altere `revelado`
(não altera), mas porque gravaria uma data de criação da pontuação que não
corresponde à data real, deixando o banco sugerir uma ordem dos fatos
diferente da que realmente ocorreu.

## 10. Índice das entradas e saídas brutas

As 60 saídas (entrada completa e saída bruta de `validacao_saidas`) estão
indexadas em `validacao/saidas-brutas/`, um arquivo por código, `A1.md` a
`A60.md`. Não entram no corpo deste documento por tamanho: só os tokens de
saída das 60 somam cerca de 195 mil (seção 2); o conteúdo integral
ultrapassaria 1 MB, o limite acima do qual o GitHub deixa de renderizar
Markdown.

**Por que a entrada é editada e a saída não:** não há licença para
redistribuir o livro usado na avaliação. Em `entradaCompleta`, toda
passagem de texto do livro — o texto integral da seção colado (tarefas de
resumo e de bateria de questões), o trecho selecionado pela autora como
alvo da tarefa (tarefas de ficha) e os trechos recuperados pela busca
semântica (tarefas de pergunta com Oria) — foi substituída por um marcador
`[TEXTO DO LIVRO REMOVIDO - <origem>, <n> caracteres, SHA-256 <hash>]`, com
`<n>` = `string.length` (unidades UTF-16) e `<hash>` = SHA-256 sobre os
bytes UTF-8 exatos do texto removido, antes de qualquer normalização. Tudo
o mais na entrada — instruções de sistema, enunciados escritos pela
autora, estrutura do JSON, numeração `[n]` dos trechos, aspas, ordem das
chaves, acentuação — ficou literal. `saidaBruta` **não foi tocada em
nenhuma saída**: é o objeto da avaliação (fidelidade ao material,
cobertura, adequação pedagógica), não reprodução do livro, e inclui até os
defeitos de grafia da própria geração (A28 perde acentos em parte do
texto, inclusive no cabeçalho "Pontos de atencao" — ver observação 5 —
e isso está preservado no arquivo tal como está no banco).

Rótulo de origem usado, por caso (dois dos três já estavam especificados
na tarefa; o do meio foi necessário porque o trecho de uma ficha não é
nem "a seção integral colada" nem "um chunk recuperado por busca", é um
trecho escolhido à mão pela autora como alvo da tarefa):
- `seção integral: <título>` — resumo e bateria de questões (texto = seção completa).
- `trecho selecionado (tarefa <id>), seção <título>` — ficha de trecho (texto = `enunciado` da tarefa, o trecho que a autora escolheu).
- `trecho recuperado, seção <título>` — pergunta com Oria (texto = cada chunk devolvido pela busca semântica, um marcador por trecho numerado).

### Tabela de índice

| codigo | condicao | tipo_tarefa | secao | arquivo | bytes entrada | bytes saída | substituições na entrada |
|---|---|---|---|---|---|---|---|
| A1 | com Oria | pergunta de ligação | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A1.md` | 3779 | 56 | 6 |
| A2 | com Oria | pergunta fora do ebook | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A2.md` | 2440 | 56 | 2 |
| A3 | com Oria | resumo | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A3.md` | 2063 | 3421 | 1 |
| A4 | linha de base | pergunta respondível | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A4.md` | 199 | 728 | 0 |
| A5 | com Oria | pergunta fora do ebook | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A5.md` | 3202 | 41 | 6 |
| A6 | linha de base | pergunta fora do ebook | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A6.md` | 219 | 3655 | 0 |
| A7 | com Oria | pergunta fora do ebook | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A7.md` | 3508 | 56 | 6 |
| A8 | linha de base | pergunta respondível | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A8.md` | 179 | 2149 | 0 |
| A9 | com Oria | pergunta fora do ebook | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A9.md` | 3154 | 56 | 5 |
| A10 | com Oria | pergunta respondível | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A10.md` | 2919 | 376 | 4 |
| A11 | linha de base | pergunta respondível | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A11.md` | 199 | 255 | 0 |
| A12 | com Oria | pergunta de ligação | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A12.md` | 3633 | 1627 | 6 |
| A13 | com Oria | pergunta de ligação | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A13.md` | 3407 | 652 | 6 |
| A14 | linha de base | pergunta respondível | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A14.md` | 194 | 1698 | 0 |
| A15 | linha de base | pergunta de ligação | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A15.md` | 302 | 451 | 0 |
| A16 | com Oria | ficha de trecho | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A16.md` | 2030 | 2120 | 1 |
| A17 | linha de base | pergunta de ligação | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A17.md` | 305 | 1348 | 0 |
| A18 | com Oria | pergunta respondível | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A18.md` | 3507 | 882 | 6 |
| A19 | linha de base | bateria de questões | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A19.md` | 406 | 3873 | 1 |
| A20 | linha de base | pergunta respondível | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A20.md` | 195 | 3195 | 0 |
| A21 | linha de base | pergunta de ligação | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A21.md` | 247 | 1779 | 0 |
| A22 | com Oria | pergunta respondível | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A22.md` | 3022 | 248 | 4 |
| A23 | com Oria | ficha de trecho | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A23.md` | 2090 | 1400 | 1 |
| A24 | com Oria | pergunta respondível | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A24.md` | 3433 | 1095 | 6 |
| A25 | com Oria | pergunta respondível | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A25.md` | 3442 | 642 | 6 |
| A26 | linha de base | resumo | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A26.md` | 435 | 4465 | 1 |
| A27 | linha de base | pergunta respondível | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A27.md` | 185 | 2230 | 0 |
| A28 | com Oria | ficha de trecho | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A28.md` | 2090 | 1830 | 1 |
| A29 | linha de base | ficha de trecho | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A29.md` | 426 | 986 | 1 |
| A30 | linha de base | resumo | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A30.md` | 405 | 8648 | 1 |
| A31 | linha de base | pergunta fora do ebook | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A31.md` | 197 | 1059 | 0 |
| A32 | com Oria | pergunta respondível | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A32.md` | 3407 | 1116 | 6 |
| A33 | com Oria | bateria de questões | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A33.md` | 3735 | 5587 | 1 |
| A34 | com Oria | ficha de trecho | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A34.md` | 2030 | 1998 | 1 |
| A35 | linha de base | pergunta de ligação | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A35.md` | 398 | 1660 | 0 |
| A36 | com Oria | bateria de questões | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A36.md` | 3782 | 8005 | 1 |
| A37 | linha de base | pergunta respondível | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A37.md` | 191 | 225 | 0 |
| A38 | linha de base | pergunta respondível | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A38.md` | 214 | 1791 | 0 |
| A39 | com Oria | ficha de trecho | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A39.md` | 2030 | 944 | 1 |
| A40 | com Oria | pergunta respondível | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A40.md` | 3531 | 530 | 6 |
| A41 | com Oria | resumo | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A41.md` | 2003 | 3044 | 1 |
| A42 | linha de base | ficha de trecho | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A42.md` | 456 | 1566 | 1 |
| A43 | linha de base | pergunta respondível | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A43.md` | 190 | 1652 | 0 |
| A44 | com Oria | pergunta respondível | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A44.md` | 2997 | 861 | 5 |
| A45 | com Oria | pergunta respondível | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A45.md` | 3419 | 723 | 6 |
| A46 | linha de base | pergunta respondível | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A46.md` | 205 | 1894 | 0 |
| A47 | com Oria | pergunta respondível | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A47.md` | 3608 | 1073 | 6 |
| A48 | com Oria | pergunta respondível | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A48.md` | 3576 | 56 | 6 |
| A49 | linha de base | pergunta respondível | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A49.md` | 204 | 647 | 0 |
| A50 | linha de base | bateria de questões | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A50.md` | 436 | 5258 | 1 |
| A51 | linha de base | pergunta fora do ebook | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A51.md` | 214 | 3446 | 0 |
| A52 | linha de base | ficha de trecho | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A52.md` | 426 | 1082 | 1 |
| A53 | linha de base | ficha de trecho | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A53.md` | 456 | 1791 | 1 |
| A54 | linha de base | pergunta respondível | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A54.md` | 213 | 657 | 0 |
| A55 | com Oria | ficha de trecho | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A55.md` | 2090 | 1381 | 1 |
| A56 | linha de base | ficha de trecho | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A56.md` | 426 | 1426 | 1 |
| A57 | linha de base | ficha de trecho | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A57.md` | 456 | 880 | 1 |
| A58 | com Oria | pergunta de ligação | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A58.md` | 3387 | 650 | 6 |
| A59 | com Oria | pergunta respondível | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida | `validacao/saidas-brutas/A59.md` | 2667 | 645 | 3 |
| A60 | linha de base | pergunta fora do ebook | Capítulo 2 - Infraestrutura tecnológica escolar no ensino remoto emergencial: alcance e limitações para os(as) docentes | `validacao/saidas-brutas/A60.md` | 205 | 1565 | 0 |

**Total em disco de `validacao/saidas-brutas/`:** 236.311 bytes (~231 KiB), 60 arquivos, `.md`.

### Amostra transcrita por inteiro — A4 (linha de base, pergunta respondível, sem substituição)

Código escolhido: **A4** (linha de base, tarefa `C8-P2`, pergunta respondível). A entrada de uma pergunta de linha de base é só o enunciado escrito pela autora — sem texto colado do livro — então não há substituição alguma, e o arquivo abaixo é exatamente o que está gravado no banco, nos dois campos.

```
# A4

| Campo | Valor |
|---|---|
| Código | A4 |
| Condição | linha de base |
| Tarefa | C8-P2 |
| Tipo de tarefa | pergunta respondível |
| Seção | Capítulo 8 - Contexto pós-pandêmico: políticas públicas abaladas, cidadania comprometida |
| Modelo | nvidia/nemotron-3.5-lightning:free |
| Papel de prompt | baseline |
| Versão de prompt | 1 |
| Data e hora (UTC) | 2026-11-08 19:29:06 UTC |

Substituições de texto do livro na entrada: nenhuma substituição.

## Entrada completa

```json
[{"role":"system","content":"Você é um assistente útil. Responda à solicitação do usuário."},{"role":"user","content":"Que números o capítulo apresenta sobre ataques violentos em escolas?"}]
```

## Saída bruta

```
Para responder com precisão, preciso saber de qual capítulo, livro, artigo ou relatório você está se referindo. "Ataques violentos em escolas" pode aparecer em muitos tipos de fontes — estudos acadêmicos, relatórios de segurança, notas de política pública, etc — e cada um apresenta números diferentes (taxas, frequência, demografia, resultados de intervenções, etc.).

Se você me disser a fonte ou o título do capítulo, consigo dizer exatamente quais dados ou estatísticas ele contém.

Caso queira, também posso fornecer um panorama geral com números e tendências atuais sobre o tema, baseados em fontes confiáveis como organizações educacionais, de segurança ou de saúde pública. É só dizer!
```
```

### Verificações obrigatórias

**(a) 60 arquivos, A1 a A60, sem buraco nem sobra.** Confirmado:
`validacao/saidas-brutas/` tem exatamente 60 arquivos `.md`, nomeados
`A1.md`...`A60.md`; nenhum faltando, nenhum extra.

**(b) Comparação byte a byte para 5 códigos** — escolhidos para cobrir as
duas condições e os quatro papéis de prompt presentes na execução: `A1`
(com Oria, `dialogue`), `A6` (linha de base, `baseline`, sem substituição
— serve de controle), `A3` (com Oria, `fichamento`, resumo), `A26` (linha
de base, `fichamento` como papel derivado, resumo) e `A33` (com Oria,
`questions`). Dois testes independentes, para cada um:
- `saidaBruta` do arquivo contra `validacao_saidas."saidaBruta"` do banco:
  idêntica nos 5 (e, reconferido à parte, nos 60 — nenhuma divergência).
- `entradaCompleta` do arquivo: em vez de tentar reverter os marcadores
  (o que exigiria reescapar o texto restaurado para dentro de uma string
  JSON e arriscaria um falso negativo por diferença de escape, não por
  erro real), a verificação foi pela via contrária, mais forte — pegar o
  valor de `entradaCompleta` direto do banco, de novo, e aplicar a mesma
  função de redação usada para gerar o arquivo. O resultado precisa ser
  byte a byte igual ao que já está gravado no arquivo. Rodado para os 5
  códigos e, à parte, para os 60: **zero divergências** — toda entrada
  gravada é exatamente reprodutível a partir do valor atual do banco pela
  mesma transformação documentada acima.

**(c) Nenhuma saída com `sucesso = false`; as 60 têm `saidaBruta` não
vazia.** Confirmado contra os 60 registros: nenhuma com `sucesso = false`,
nenhuma com `saidaBruta` vazia ou nula. Nenhum arquivo precisou do texto
"vazio no banco".

**(d) Nenhum dos 60 arquivos contém texto do livro na entrada.** Busca por
uma sequência de 200 caracteres do meio de `textoCompleto`, por seção,
contra o texto de "Entrada completa" dos 60 arquivos (não o arquivo
inteiro — a saída nunca foi tocada e não faz parte desta verificação).
Testadas as 10 seções que efetivamente aparecem como origem de algum
marcador nesta execução (as 2 seções das tarefas de resumo/ficha/questões
e as 8 seções de onde vieram chunks recuperados nas perguntas com Oria):
Capítulo 1, Capítulo 2, Capítulo 3, Capítulo 4, Capítulo 6, Capítulo 7,
Capítulo 8, "Apresentação e delimitações", "Front Matter / Elementos
Pré-textuais / Páginas Iniciales" e "Nota preliminar". As 10 sequências
de teste (não transcritas aqui, por ser texto do livro) tiveram zero
ocorrências em todas as 60 entradas redigidas.

**(e) Nenhum marcador com hash vazio, reaproveitado por engano entre
textos diferentes, ou com contagem de caracteres zero.** 127 marcadores
no total, nos 60 arquivos. Nenhum hash vazio ou malformado; nenhum com
`<n> caracteres` igual a zero; 58 hashes distintos, e nenhum hash
apareceu associado a mais de um valor de `<n>` diferente (o que indicaria
dois textos diferentes colididos sob o mesmo hash por erro de geração) —
os casos em que o mesmo hash se repete são genuinamente o mesmo texto
substituído mais de uma vez (ex.: o texto integral de um capítulo é
removido tanto na saída de resumo quanto na de bateria de questões da
mesma condição, e o trecho de uma ficha é o mesmo nas duas condições,
com Oria e linha de base).

**Confirmação da regra 8:** os arquivos intermediários usados para montar
e verificar este índice (dumps de `entradaCompleta`/`saidaBruta`, listas
de marcadores) foram criados fora da árvore do repositório, em diretório
de trabalho temporário da sessão, e foram apagados ao final desta tarefa
— nenhum texto do livro foi escrito em nenhum arquivo dentro do
repositório além dos marcadores (hash + contagem de caracteres) nos 60
`.md` de `validacao/saidas-brutas/`.
