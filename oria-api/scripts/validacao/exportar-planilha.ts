import * as ExcelJS from 'exceljs';
import { mkdirSync } from 'node:fs';
import * as path from 'node:path';
import { removerMarkdown } from '../../src/validacao/remover-markdown';
import { CodigoCego } from '../../src/validacao/entities/codigo-cego.entity';
import { Saida } from '../../src/validacao/entities/saida.entity';
import { Tarefa } from '../../src/validacao/entities/tarefa.entity';
import { criarContextoValidacao, executarScript } from './_contexto';

function lerArgumentos(): { execucaoId: string; avaliador: string } {
  const args = process.argv.slice(2);
  const execucaoArg = args.find((a) => a.startsWith('--execucao='));
  const avaliadorArg = args.find((a) => a.startsWith('--avaliador='));
  if (!execucaoArg || !avaliadorArg) {
    throw new Error(
      'Uso: npm run validacao:exportar-planilha -- --execucao=<uuid> --avaliador=<nome>',
    );
  }
  return { execucaoId: execucaoArg.split('=')[1], avaliador: avaliadorArg.split('=')[1] };
}

executarScript(async () => {
  const { execucaoId, avaliador } = lerArgumentos();
  const ctx = await criarContextoValidacao();

  try {
    const saidasRepository = ctx.dataSource.getRepository(Saida);
    const codigosRepository = ctx.dataSource.getRepository(CodigoCego);
    const tarefasRepository = ctx.dataSource.getRepository(Tarefa);

    const saidas = await saidasRepository.find({ where: { execucaoId } });
    if (saidas.length === 0) {
      throw new Error(`Nenhuma saída encontrada para a execução ${execucaoId}.`);
    }

    const codigos = await codigosRepository.find({
      where: saidas.map((s) => ({ saidaId: s.id })),
    });
    const codigoPorSaida = new Map(codigos.map((c) => [c.saidaId, c.codigo]));

    const semCodigo = saidas.filter((s) => !codigoPorSaida.has(s.id));
    if (semCodigo.length > 0) {
      throw new Error(
        `${semCodigo.length} saída(s) ainda sem código cego. Rode "npm run validacao:cegar -- --execucao=${execucaoId}" primeiro.`,
      );
    }

    const tarefaPorId = new Map((await tarefasRepository.find()).map((t) => [t.id, t]));

    const linhas = saidas
      .map((saida) => ({
        codigo: codigoPorSaida.get(saida.id)!,
        tarefa: tarefaPorId.get(saida.tarefaId)!,
        saida,
      }))
      .sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));

    const workbook = new ExcelJS.Workbook();
    const planilha = workbook.addWorksheet('Pontuação');
    planilha.columns = [
      { header: 'Código', key: 'codigo', width: 10 },
      { header: 'Saída', key: 'saida', width: 70 },
      { header: 'Enunciado da tarefa', key: 'enunciado', width: 50 },
      { header: 'Gabarito', key: 'gabarito', width: 40 },
      { header: 'C1', key: 'c1', width: 6 },
      { header: 'C2', key: 'c2', width: 6 },
      { header: 'C3', key: 'c3', width: 6 },
      { header: 'C4', key: 'c4', width: 6 },
      { header: 'Nível de Bloom', key: 'nivelBloom', width: 14 },
      { header: 'Observação', key: 'observacao', width: 40 },
    ];
    planilha.getRow(1).font = { bold: true };

    for (const linha of linhas) {
      planilha.addRow({
        codigo: linha.codigo,
        saida: removerMarkdown(linha.saida.saidaBruta),
        enunciado: linha.tarefa.enunciado,
        gabarito: linha.tarefa.gabarito ?? '',
        c1: '',
        c2: '',
        c3: '',
        c4: '',
        nivelBloom: '',
        observacao: '',
      });
    }
    for (const coluna of ['saida', 'enunciado', 'gabarito'] as const) {
      planilha.getColumn(coluna).alignment = { wrapText: true, vertical: 'top' };
    }

    const diretorio = path.join(process.cwd(), 'validacao');
    mkdirSync(diretorio, { recursive: true });
    const destino = path.join(diretorio, `planilha-${avaliador}.xlsx`);
    await workbook.xlsx.writeFile(destino);

    console.log(`${linhas.length} saídas exportadas para ${destino}.`);
  } finally {
    await ctx.close();
  }
});
