# Resultados brutos — Avaliação A (chave de cegamento aberta)

Extração só de leitura, feita em 2026-11-10, sobre o banco de desenvolvimento local (`docker compose exec db psql`, mesma instância usada pela bateria) e sobre o repositório em `feat/correcao-usabilidade`. Nenhuma chamada a LLM foi feita para produzir este documento; nenhum arquivo do repositório foi alterado além deste `.md`. Todos os valores abaixo vêm de registro existente (`validacao_execucoes`, `validacao_saidas`, `validacao_tarefas`, `validacao_codigos_cegos`, `llm_calls`, `chunks`/`sections`, e o código-fonte das versões de prompt efetivamente usadas). Onde o dado não existe, está escrito "não registrado" — nenhum valor foi estimado ou derivado por aproximação.

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
