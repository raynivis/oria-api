-- Consultas de análise para o experimento futuro (IMPLEMENTATION.md, Fase 6).
-- Ainda não cobertas, por dependerem de tabelas das Fases 7–9 (tentativas,
-- passos, conceitos, metacognição): média de passos antes da resolução, taxa de
-- desistência, divergência entre confiança declarada e passos consumidos,
-- proporção de citações clicadas sobre as exibidas.

-- adesão: proporção de alunos com ao menos um fichamento
SELECT
  COUNT(DISTINCT f."userId")::float / NULLIF((SELECT COUNT(*) FROM users), 0) AS proporcao_adesao
FROM fichamentos f;

-- elaboração: proporção de fichamentos cuja versão atual tem origem 'aluno'
SELECT
  COUNT(*) FILTER (WHERE ultima.origem = 'aluno')::float / NULLIF(COUNT(*), 0) AS proporcao_elaboracao
FROM fichamentos f
JOIN LATERAL (
  SELECT v.origem
    FROM fichamento_versoes v
   WHERE v."fichamentoId" = f.id
   ORDER BY v.numero DESC
   LIMIT 1
) ultima ON TRUE;

-- razão média entre o comprimento da versão atual e o do rascunho da IA.
-- Aproximação por comprimento. A métrica exata (diff a nível de caractere) é
-- calculada em FichamentosService.calcularElaboracao.
SELECT
  AVG(length(atual.conteudo)::float / NULLIF(length(ia.conteudo), 0)) AS razao_media_comprimento
FROM fichamentos f
JOIN LATERAL (
  SELECT v.conteudo FROM fichamento_versoes v
   WHERE v."fichamentoId" = f.id AND v.origem = 'ia'
   ORDER BY v.numero DESC LIMIT 1
) ia ON TRUE
JOIN LATERAL (
  SELECT v.conteudo FROM fichamento_versoes v
   WHERE v."fichamentoId" = f.id
   ORDER BY v.numero DESC LIMIT 1
) atual ON TRUE;

-- uso por semana: eventos registrados por semana ISO
SELECT
  date_trunc('week', "criadoEm") AS semana,
  COUNT(*) AS eventos,
  COUNT(DISTINCT "userId") AS usuarios_ativos
FROM reading_events
GROUP BY 1
ORDER BY 1;
