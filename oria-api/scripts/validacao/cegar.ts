import { In } from 'typeorm';
import { CodigoCego } from '../../src/validacao/entities/codigo-cego.entity';
import { Saida } from '../../src/validacao/entities/saida.entity';
import { criarContextoValidacao, executarScript } from './_contexto';

/** Fisher-Yates — não precisa de semente: o embaralhamento em si não faz parte do que é reproduzido. */
function embaralhar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function lerArgumentos(): { execucaoId: string; prefixo: string } {
  const args = process.argv.slice(2);
  const execucaoArg = args.find((a) => a.startsWith('--execucao='));
  const prefixoArg = args.find((a) => a.startsWith('--prefixo='));
  if (!execucaoArg) {
    throw new Error('Uso: npm run validacao:cegar -- --execucao=<uuid> [--prefixo=A]');
  }
  return {
    execucaoId: execucaoArg.split('=')[1],
    prefixo: prefixoArg ? prefixoArg.split('=')[1] : 'A',
  };
}

executarScript(async () => {
  const { execucaoId, prefixo } = lerArgumentos();
  const ctx = await criarContextoValidacao();

  try {
    const saidasRepository = ctx.dataSource.getRepository(Saida);
    const codigosRepository = ctx.dataSource.getRepository(CodigoCego);

    const saidas = await saidasRepository.find({ where: { execucaoId } });
    if (saidas.length === 0) {
      throw new Error(`Nenhuma saída encontrada para a execução ${execucaoId}.`);
    }

    const jaCegas = await codigosRepository.find({
      where: { saidaId: In(saidas.map((s) => s.id)) },
    });
    const idsJaCegos = new Set(jaCegas.map((c) => c.saidaId));
    const pendentes = saidas.filter((s) => !idsJaCegos.has(s.id));

    if (pendentes.length === 0) {
      console.log('Todas as saídas desta execução já têm código cego.');
      return;
    }

    const existentes = await codigosRepository.count();
    const embaralhadas = embaralhar(pendentes);

    const novos = embaralhadas.map((saida, indice) =>
      codigosRepository.create({
        saidaId: saida.id,
        codigo: `${prefixo}${existentes + indice + 1}`,
        revelado: false,
      }),
    );
    await codigosRepository.save(novos);

    console.log(
      `${novos.length} saídas cegadas (códigos ${novos[0].codigo}..${novos.at(-1)!.codigo}). ` +
        `${jaCegas.length} já estavam cegadas antes.`,
    );
  } finally {
    await ctx.close();
  }
});
