import { faixaLandisKoch, kappaDeCohen } from '../../src/validacao/kappa';
import { Pontuacao } from '../../src/validacao/entities/pontuacao.entity';
import { Saida } from '../../src/validacao/entities/saida.entity';
import { criarContextoValidacao, executarScript } from './_contexto';

const CRITERIOS = [
  { chave: 'c1', rotulo: 'C1 fidelidade' },
  { chave: 'c2', rotulo: 'C2 cobertura' },
  { chave: 'c3', rotulo: 'C3 adequação' },
  { chave: 'c4', rotulo: 'C4 do módulo' },
] as const;

function lerExecucaoId(): string {
  const arg = process.argv.find((a) => a.startsWith('--execucao='));
  if (!arg) {
    throw new Error('Uso: npm run validacao:calcular-kappa -- --execucao=<uuid>');
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

    const pontuacoes = await ctx.dataSource.getRepository(Pontuacao).find({
      where: saidas.map((s) => ({ saidaId: s.id })),
    });

    const porSaida = new Map<string, Partial<Record<'aluno' | 'orientador', Pontuacao>>>();
    for (const p of pontuacoes) {
      if (p.avaliador !== 'aluno' && p.avaliador !== 'orientador') {
        continue;
      }
      const entrada = porSaida.get(p.saidaId) ?? {};
      entrada[p.avaliador] = p;
      porSaida.set(p.saidaId, entrada);
    }

    const comAmbos = [...porSaida.values()].filter((e) => e.aluno && e.orientador);
    const faltandoDupla = saidas.length - comAmbos.length;

    if (comAmbos.length === 0) {
      throw new Error(
        'Nenhuma saída tem pontuação de "aluno" e "orientador" ao mesmo tempo. ' +
          'Rode "npm run validacao:importar-pontuacoes" para os dois avaliadores primeiro.',
      );
    }

    console.log(`Kappa de Cohen — ${comAmbos.length} saídas pontuadas pelos dois avaliadores` +
      (faltandoDupla > 0 ? ` (${faltandoDupla} ainda faltam).` : '.'));
    console.log('');

    for (const { chave, rotulo } of CRITERIOS) {
      const pares: Array<[number, number]> = comAmbos.map((e) => [e.aluno![chave], e.orientador![chave]]);
      const kappa = kappaDeCohen(pares);
      console.log(`${rotulo.padEnd(16)} κ = ${kappa.toFixed(2)}  (${faixaLandisKoch(kappa)})`);
      if (kappa < 0.41) {
        console.warn(`  atenção: abaixo de 0,41 — revise a rubrica de ${rotulo} antes de interpretar.`);
      }
    }
  } finally {
    await ctx.close();
  }
});
