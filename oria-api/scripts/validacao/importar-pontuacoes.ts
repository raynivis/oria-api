import * as ExcelJS from 'exceljs';
import { CodigoCego } from '../../src/validacao/entities/codigo-cego.entity';
import { Pontuacao } from '../../src/validacao/entities/pontuacao.entity';
import { Saida } from '../../src/validacao/entities/saida.entity';
import type { Avaliador } from '../../src/validacao/tipos';
import { criarContextoValidacao, executarScript } from './_contexto';

interface LinhaPlanilha {
  codigo: string;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  nivelBloom: number | null;
  observacao: string | null;
}

function lerArgumentos(): { arquivo: string; avaliador: Avaliador; execucaoId: string } {
  const args = process.argv.slice(2);
  const arquivoArg = args.find((a) => a.startsWith('--arquivo='));
  const avaliadorArg = args.find((a) => a.startsWith('--avaliador='));
  const execucaoArg = args.find((a) => a.startsWith('--execucao='));
  if (!arquivoArg || !avaliadorArg || !execucaoArg) {
    throw new Error(
      'Uso: npm run validacao:importar-pontuacoes -- --arquivo=<xlsx> --avaliador=<aluno|orientador|consenso> --execucao=<uuid>',
    );
  }
  return {
    arquivo: arquivoArg.split('=')[1],
    avaliador: avaliadorArg.split('=')[1] as Avaliador,
    execucaoId: execucaoArg.split('=')[1],
  };
}

function lerNota(valor: ExcelJS.CellValue, coluna: string, codigo: string): number {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 0 || numero > 2) {
    throw new Error(`${codigo}: ${coluna} precisa ser um inteiro entre 0 e 2 (veio "${valor}").`);
  }
  return numero;
}

function lerLinhas(planilha: ExcelJS.Worksheet): LinhaPlanilha[] {
  const linhas: LinhaPlanilha[] = [];
  planilha.eachRow((linha, numeroLinha) => {
    if (numeroLinha === 1) {
      return; // cabeçalho
    }
    const codigo = String(linha.getCell(1).value ?? '').trim();
    if (!codigo) {
      return; // linha em branco ao final
    }
    const nivelBloom = linha.getCell(9).value;
    const observacao = linha.getCell(10).value;
    linhas.push({
      codigo,
      c1: lerNota(linha.getCell(5).value, 'C1', codigo),
      c2: lerNota(linha.getCell(6).value, 'C2', codigo),
      c3: lerNota(linha.getCell(7).value, 'C3', codigo),
      c4: lerNota(linha.getCell(8).value, 'C4', codigo),
      nivelBloom: nivelBloom ? Number(nivelBloom) : null,
      observacao: observacao ? String(observacao) : null,
    });
  });
  return linhas;
}

executarScript(async () => {
  const { arquivo, avaliador, execucaoId } = lerArgumentos();
  const ctx = await criarContextoValidacao();

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(arquivo);
    const planilha = workbook.getWorksheet('Pontuação');
    if (!planilha) {
      throw new Error(`Aba "Pontuação" não encontrada em ${arquivo}.`);
    }

    const saidasRepository = ctx.dataSource.getRepository(Saida);
    const codigosRepository = ctx.dataSource.getRepository(CodigoCego);
    const pontuacoesRepository = ctx.dataSource.getRepository(Pontuacao);

    const saidasDaExecucao = await saidasRepository.find({ where: { execucaoId } });
    if (saidasDaExecucao.length === 0) {
      throw new Error(`Nenhuma saída encontrada para a execução ${execucaoId}.`);
    }
    const codigosDaExecucao = await codigosRepository.find({
      where: saidasDaExecucao.map((s) => ({ saidaId: s.id })),
    });
    const saidaIdPorCodigo = new Map(codigosDaExecucao.map((c) => [c.codigo, c.saidaId]));

    const linhas = lerLinhas(planilha);
    let importadas = 0;
    const codigosVistos = new Set<string>();

    for (const linha of linhas) {
      const saidaId = saidaIdPorCodigo.get(linha.codigo);
      if (!saidaId) {
        throw new Error(`Código "${linha.codigo}" não pertence à execução ${execucaoId}.`);
      }

      const dados = {
        saidaId,
        avaliador,
        c1: linha.c1,
        c2: linha.c2,
        c3: linha.c3,
        c4: linha.c4,
        nivelBloom: linha.nivelBloom,
        observacao: linha.observacao,
      };
      const existente = await pontuacoesRepository.findOneBy({ saidaId, avaliador });
      if (existente) {
        await pontuacoesRepository.update(existente.id, dados);
      } else {
        await pontuacoesRepository.save(pontuacoesRepository.create(dados));
      }

      codigosVistos.add(linha.codigo);
      importadas++;
    }

    const faltando = [...saidaIdPorCodigo.keys()].filter((codigo) => !codigosVistos.has(codigo));
    if (faltando.length > 0) {
      throw new Error(
        `${faltando.length} saída(s) sem pontuação na planilha: ${faltando.sort().join(', ')}.`,
      );
    }

    console.log(
      `${importadas} pontuações importadas para o avaliador "${avaliador}" (execução ${execucaoId}).`,
    );
  } finally {
    await ctx.close();
  }
});
