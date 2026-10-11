import { In } from 'typeorm';
import { CodigoCego } from '../../src/validacao/entities/codigo-cego.entity';
import { Pontuacao } from '../../src/validacao/entities/pontuacao.entity';
import { Saida } from '../../src/validacao/entities/saida.entity';
import { criarContextoValidacao, executarScript } from './_contexto';

function lerExecucaoId(): string {
  const arg = process.argv.find((a) => a.startsWith('--execucao='));
  if (!arg) {
    throw new Error('Uso: npm run validacao:revelar -- --execucao=<uuid>');
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

    const consensos = await ctx.dataSource.getRepository(Pontuacao).find({
      where: { saidaId: In(saidas.map((s) => s.id)), avaliador: 'consenso' },
    });
    const comConsenso = new Set(consensos.map((p) => p.saidaId));
    const semConsenso = saidas.filter((s) => !comConsenso.has(s.id));

    if (semConsenso.length > 0) {
      throw new Error(
        `Recusado: ${semConsenso.length} de ${saidas.length} saída(s) ainda não têm pontuação de ` +
          'consenso. Registre o consenso (avaliador "consenso") para todas antes de revelar.',
      );
    }

    const codigosRepository = ctx.dataSource.getRepository(CodigoCego);
    const resultado = await codigosRepository.update(
      { saidaId: In(saidas.map((s) => s.id)) },
      { revelado: true },
    );

    console.log(
      `Consenso registrado para as ${saidas.length} saídas. ${resultado.affected ?? 0} código(s) revelado(s).`,
    );
  } finally {
    await ctx.close();
  }
});
