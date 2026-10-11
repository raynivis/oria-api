import { mkdirSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { RECUSA_SEM_BASE } from '../../src/prompts/templates/dialogue';
import { desvioPadrao, escreverCsv, media } from '../../src/validacao/csv';
import { faixaLandisKoch, kappaDeCohen } from '../../src/validacao/kappa';
import { CodigoCego } from '../../src/validacao/entities/codigo-cego.entity';
import { Pontuacao } from '../../src/validacao/entities/pontuacao.entity';
import { Saida } from '../../src/validacao/entities/saida.entity';
import { Tarefa } from '../../src/validacao/entities/tarefa.entity';
import type { Condicao } from '../../src/validacao/tipos';
import { criarContextoValidacao, executarScript } from './_contexto';

const CRITERIOS = ['c1', 'c2', 'c3', 'c4'] as const;
const CONDICOES: Condicao[] = ['oria', 'baseline'];

function lerExecucaoId(): string {
  const arg = process.argv.find((a) => a.startsWith('--execucao='));
  if (!arg) {
    throw new Error('Uso: npm run validacao:consolidar -- --execucao=<uuid>');
  }
  return arg.split('=')[1];
}

executarScript(async () => {
  const execucaoId = lerExecucaoId();
  const ctx = await criarContextoValidacao();

  try {
    const saidas = await ctx.dataSource.getRepository(Saida).find({ where: { execucaoId } });
    if (saidas.length === 0) {
      throw new Error(`Nenhuma saída encontrada para a execução ${execucaoId}.`);
    }
    const tarefaPorId = new Map(
      (await ctx.dataSource.getRepository(Tarefa).find()).map((t) => [t.id, t]),
    );
    const codigoPorSaida = new Map(
      (
        await ctx.dataSource.getRepository(CodigoCego).find({
          where: saidas.map((s) => ({ saidaId: s.id })),
        })
      ).map((c) => [c.saidaId, c.codigo]),
    );
    const pontuacoes = await ctx.dataSource.getRepository(Pontuacao).find({
      where: saidas.map((s) => ({ saidaId: s.id })),
    });
    const consensoPorSaida = new Map(
      pontuacoes.filter((p) => p.avaliador === 'consenso').map((p) => [p.saidaId, p]),
    );

    const diretorio = path.join(process.cwd(), 'validacao', 'resultados');
    mkdirSync(diretorio, { recursive: true });

    // --- medias-por-criterio.csv ---
    const linhasMedias: Array<Array<string | number>> = [
      ['condicao', 'criterio', 'media', 'desvio', 'n'],
    ];
    for (const condicao of CONDICOES) {
      const saidasDaCondicao = saidas.filter((s) => s.condicao === condicao);
      for (const criterio of CRITERIOS) {
        const valores = saidasDaCondicao
          .map((s) => consensoPorSaida.get(s.id)?.[criterio])
          .filter((v): v is number => v !== undefined);
        linhasMedias.push([
          condicao,
          criterio,
          Number.isNaN(media(valores)) ? '' : media(valores).toFixed(3),
          Number.isNaN(desvioPadrao(valores)) ? '' : desvioPadrao(valores).toFixed(3),
          valores.length,
        ]);
      }
    }
    writeFileSync(path.join(diretorio, 'medias-por-criterio.csv'), escreverCsv(linhasMedias));

    // --- alucinacoes.csv ---
    const linhasAlucinacoes: Array<Array<string | number>> = [
      ['codigo', 'condicao', 'tarefa', 'c1'],
    ];
    for (const saida of saidas) {
      const consenso = consensoPorSaida.get(saida.id);
      if (consenso && consenso.c1 === 0) {
        linhasAlucinacoes.push([
          codigoPorSaida.get(saida.id) ?? '',
          saida.condicao,
          tarefaPorId.get(saida.tarefaId)?.codigo ?? '',
          consenso.c1,
        ]);
      }
    }
    writeFileSync(path.join(diretorio, 'alucinacoes.csv'), escreverCsv(linhasAlucinacoes));

    // --- perguntas-fora.csv ---
    const linhasPerguntasFora: Array<Array<string | number>> = [
      ['codigo', 'condicao', 'tarefa', 'reconheceuLimite', 'c1_consenso'],
    ];
    for (const saida of saidas) {
      const tarefa = tarefaPorId.get(saida.tarefaId);
      if (tarefa?.tipo !== 'pergunta_fora') {
        continue;
      }
      linhasPerguntasFora.push([
        codigoPorSaida.get(saida.id) ?? '',
        saida.condicao,
        tarefa.codigo,
        saida.saidaBruta.includes(RECUSA_SEM_BASE) ? 'sim' : 'não',
        consensoPorSaida.get(saida.id)?.c1 ?? '',
      ]);
    }
    writeFileSync(path.join(diretorio, 'perguntas-fora.csv'), escreverCsv(linhasPerguntasFora));

    // --- bloom.csv ---
    const linhasBloom: Array<Array<string | number>> = [['nivelBloom', 'quantidade']];
    const contagemBloom = new Map<number, number>();
    for (const saida of saidas) {
      if (tarefaPorId.get(saida.tarefaId)?.tipo !== 'questoes') {
        continue;
      }
      const nivel = consensoPorSaida.get(saida.id)?.nivelBloom;
      if (nivel !== null && nivel !== undefined) {
        contagemBloom.set(nivel, (contagemBloom.get(nivel) ?? 0) + 1);
      }
    }
    for (const [nivel, quantidade] of [...contagemBloom.entries()].sort((a, b) => a[0] - b[0])) {
      linhasBloom.push([nivel, quantidade]);
    }
    writeFileSync(path.join(diretorio, 'bloom.csv'), escreverCsv(linhasBloom));

    // --- criterios-sucesso.md ---
    const oria = saidas.filter((s) => s.condicao === 'oria');
    const baseline = saidas.filter((s) => s.condicao === 'baseline');
    const c1Oria = oria.map((s) => consensoPorSaida.get(s.id)?.c1).filter((v): v is number => v !== undefined);
    const c1Baseline = baseline
      .map((s) => consensoPorSaida.get(s.id)?.c1)
      .filter((v): v is number => v !== undefined);
    const c3Oria = oria.map((s) => consensoPorSaida.get(s.id)?.c3).filter((v): v is number => v !== undefined);
    const c3Baseline = baseline
      .map((s) => consensoPorSaida.get(s.id)?.c3)
      .filter((v): v is number => v !== undefined);
    const c2Oria = oria.map((s) => consensoPorSaida.get(s.id)?.c2).filter((v): v is number => v !== undefined);
    const c2Baseline = baseline
      .map((s) => consensoPorSaida.get(s.id)?.c2)
      .filter((v): v is number => v !== undefined);

    const proporcaoAlucinacaoOria = c1Oria.filter((v) => v === 0).length / (c1Oria.length || 1);
    const proporcaoAlucinacaoBaseline =
      c1Baseline.filter((v) => v === 0).length / (c1Baseline.length || 1);

    const perguntasForaOria = oria.filter((s) => tarefaPorId.get(s.tarefaId)?.tipo === 'pergunta_fora');
    const reconhecidas = perguntasForaOria.filter((s) => s.saidaBruta.includes(RECUSA_SEM_BASE)).length;

    const aluno = pontuacoes.filter((p) => p.avaliador === 'aluno');
    const orientador = pontuacoes.filter((p) => p.avaliador === 'orientador');
    const orientadorPorSaida = new Map(orientador.map((p) => [p.saidaId, p]));
    const kappasPorCriterio = CRITERIOS.map((criterio) => {
      const pares: Array<[number, number]> = aluno
        .filter((p) => orientadorPorSaida.has(p.saidaId))
        .map((p) => [p[criterio], orientadorPorSaida.get(p.saidaId)![criterio]]);
      return { criterio, kappa: kappaDeCohen(pares) };
    });

    const criterio1Atingido = proporcaoAlucinacaoOria < proporcaoAlucinacaoBaseline && proporcaoAlucinacaoOria <= 0.1;
    const criterio2Atingido = media(c3Oria) > media(c3Baseline);
    const criterio3Atingido = media(c2Oria) >= media(c2Baseline);
    const criterio4Atingido = reconhecidas >= 3;
    const criterio5Atingido = kappasPorCriterio.every((k) => k.kappa >= 0.41);

    const linhaCriterio = (nome: string, atingido: boolean, detalhe: string) =>
      `| ${nome} | ${atingido ? 'Atingido' : 'Não atingido'} | ${detalhe} |`;

    const criteriosMd = [
      '# Critérios de sucesso — VALIDATION.md §6',
      '',
      '| Critério | Resultado | Detalhe |',
      '|---|---|---|',
      linhaCriterio(
        'C1 = 0 na Oria < baseline e ≤ 10%',
        criterio1Atingido,
        `Oria ${(proporcaoAlucinacaoOria * 100).toFixed(1)}%, baseline ${(proporcaoAlucinacaoBaseline * 100).toFixed(1)}%`,
      ),
      linhaCriterio(
        'Média C3 (Oria > baseline)',
        criterio2Atingido,
        `Oria ${media(c3Oria).toFixed(2)}, baseline ${media(c3Baseline).toFixed(2)}`,
      ),
      linhaCriterio(
        'Média C2 (Oria ≥ baseline)',
        criterio3Atingido,
        `Oria ${media(c2Oria).toFixed(2)}, baseline ${media(c2Baseline).toFixed(2)}`,
      ),
      linhaCriterio(
        'Reconhecimento de limite (≥ 3 de 4)',
        criterio4Atingido,
        `${reconhecidas} de ${perguntasForaOria.length}`,
      ),
      linhaCriterio(
        'Kappa por critério ≥ 0,41',
        criterio5Atingido,
        kappasPorCriterio
          .map((k) => `${k.criterio}=${k.kappa.toFixed(2)} (${faixaLandisKoch(k.kappa)})`)
          .join(', '),
      ),
      '',
      '_Limiares são decisão da equipe de pesquisa, não valores extraídos da literatura (VALIDATION.md §6)._',
      '',
    ].join('\n');
    writeFileSync(path.join(diretorio, 'criterios-sucesso.md'), criteriosMd);

    // --- apendice-a.md ---
    const apendice = [
      '# Apêndice A — todas as chamadas da Avaliação A',
      '',
      `Execução \`${execucaoId}\`, ${saidas.length} saídas.`,
      '',
      ...saidas
        .slice()
        .sort((a, b) => (codigoPorSaida.get(a.id) ?? '').localeCompare(codigoPorSaida.get(b.id) ?? ''))
        .map((saida) => {
          const tarefa = tarefaPorId.get(saida.tarefaId);
          return [
            `## ${codigoPorSaida.get(saida.id) ?? saida.id} — ${tarefa?.codigo ?? ''} (${saida.condicao})`,
            '',
            `- Data: ${saida.criadoEm.toISOString()}`,
            `- Modelo: ${saida.modelo}`,
            `- Tokens: ${saida.tokensIn} entrada, ${saida.tokensOut} saída`,
            `- Custo: $${Number(saida.custo).toFixed(5)}`,
            `- Duração: ${saida.duracaoMs}ms`,
            '',
            '**Entrada completa:**',
            '',
            '```',
            saida.entradaCompleta,
            '```',
            '',
            '**Saída bruta:**',
            '',
            '```',
            saida.saidaBruta,
            '```',
            '',
          ].join('\n');
        }),
    ].join('\n');
    writeFileSync(path.join(diretorio, 'apendice-a.md'), apendice);

    console.log(`Resultados escritos em ${diretorio}:`);
    console.log('  medias-por-criterio.csv, alucinacoes.csv, perguntas-fora.csv, bloom.csv,');
    console.log('  criterios-sucesso.md, apendice-a.md');
    console.log('\n(Teste de Wilcoxon pareado não implementado — é opcional em VALIDATION.md §5.)');
  } finally {
    await ctx.close();
  }
});
