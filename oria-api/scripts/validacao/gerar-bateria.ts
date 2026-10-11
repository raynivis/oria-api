import type { ZodType } from 'zod';
import { In } from 'typeorm';
import { Section } from '../../src/catalog/entities/section.entity';
import type { MensagemChat } from '../../src/llm/llm.types';
import { extrairJson } from '../../src/llm/extrair-json';
import * as fichamentoTemplate from '../../src/prompts/templates/fichamento';
import * as questionsTemplate from '../../src/prompts/templates/questions';
import * as dialogueTemplate from '../../src/prompts/templates/dialogue';
import { montarMensagensBaseline, VERSAO as VERSAO_BASELINE } from '../../src/validacao/baseline.prompt';
import { Execucao } from '../../src/validacao/entities/execucao.entity';
import { Saida } from '../../src/validacao/entities/saida.entity';
import { Tarefa } from '../../src/validacao/entities/tarefa.entity';
import type { Condicao } from '../../src/validacao/tipos';
import {
  ContextoValidacao,
  criarContextoValidacao,
  executarScript,
  lerParametrosGeracao,
  obterGitSha,
  ParametrosGeracao,
} from './_contexto';

const CONDICOES: Condicao[] = ['oria', 'baseline'];
const MAXIMO_TENTATIVAS = 2;

interface ChamadaPreparada {
  papel: string;
  promptVersao: number;
  mensagens: MensagemChat[];
  jsonMode: boolean;
  schema?: ZodType<unknown>;
  /** Recusa do produto sem chamar o LLM (regra 2 do CLAUDE.md) — replicada aqui, não simulada. */
  semChamada?: { saidaBruta: string };
}

function lerArgumentos(): { rotulo: string; codigos?: string[] } {
  const args = process.argv.slice(2);
  const rotuloArg = args.find((a) => a.startsWith('--rotulo='));
  const codigosArg = args.find((a) => a.startsWith('--codigos='));
  return {
    rotulo: rotuloArg ? rotuloArg.split('=')[1] : 'avaliacao-a',
    codigos: codigosArg ? codigosArg.split('=')[1].split(',').map((c) => c.trim()) : undefined,
  };
}

async function prepararChamada(
  ctx: ContextoValidacao,
  tarefa: Tarefa,
  secao: Section,
  condicao: Condicao,
): Promise<ChamadaPreparada> {
  if (tarefa.tipo === 'resumo' || tarefa.tipo === 'ficha') {
    // Para "ficha", o enunciado da tarefa É o trecho selecionado (não há campo próprio para isso).
    const texto = tarefa.tipo === 'resumo' ? secao.textoCompleto : tarefa.enunciado;
    if (condicao === 'oria') {
      return {
        papel: 'fichamento',
        promptVersao: fichamentoTemplate.VERSAO,
        mensagens: fichamentoTemplate.montarMensagens({ tituloSecao: secao.titulo, texto }),
        jsonMode: true,
        schema: fichamentoTemplate.schemaFichamento,
      };
    }
    const pedido =
      tarefa.tipo === 'resumo' ? 'Faça o fichamento desta seção.' : 'Faça a ficha deste trecho.';
    return {
      papel: 'baseline',
      promptVersao: VERSAO_BASELINE,
      mensagens: montarMensagensBaseline(pedido, texto),
      jsonMode: false,
    };
  }

  if (tarefa.tipo === 'questoes') {
    if (condicao === 'oria') {
      const conceitos = await ctx.conceitosService.listarDaSecao(secao.id);
      return {
        papel: 'questions',
        promptVersao: questionsTemplate.VERSAO,
        mensagens: questionsTemplate.montarMensagens({
          tituloSecao: secao.titulo,
          texto: secao.textoCompleto,
          conceitos,
          quantidade: 5,
        }),
        jsonMode: true,
        schema: questionsTemplate.schemaQuestoes,
      };
    }
    return {
      papel: 'baseline',
      promptVersao: VERSAO_BASELINE,
      mensagens: montarMensagensBaseline('Gere questões sobre esta seção.', secao.textoCompleto),
      jsonMode: false,
    };
  }

  // pergunta_na_secao | pergunta_ligacao | pergunta_fora
  if (condicao === 'baseline') {
    return {
      papel: 'baseline',
      promptVersao: VERSAO_BASELINE,
      mensagens: montarMensagensBaseline(tarefa.enunciado),
      jsonMode: false,
    };
  }

  const chunks = await ctx.retrievalService.buscar(secao.id, tarefa.enunciado);
  if (chunks.length === 0) {
    return {
      papel: 'dialogue',
      promptVersao: dialogueTemplate.VERSAO,
      mensagens: [],
      jsonMode: false,
      semChamada: { saidaBruta: dialogueTemplate.RECUSA_SEM_BASE },
    };
  }
  return {
    papel: 'dialogue',
    promptVersao: dialogueTemplate.VERSAO,
    mensagens: dialogueTemplate.montarMensagens({
      pergunta: tarefa.enunciado,
      historico: [],
      chunks: chunks.map((c) => c.texto),
    }),
    jsonMode: false,
  };
}

async function gerarSaida(
  ctx: ContextoValidacao,
  execucao: Execucao,
  tarefa: Tarefa,
  secao: Section,
  condicao: Condicao,
  parametros: ParametrosGeracao,
): Promise<Saida> {
  const preparada = await prepararChamada(ctx, tarefa, secao, condicao);
  const saidasRepository = ctx.dataSource.getRepository(Saida);

  if (preparada.semChamada) {
    return saidasRepository.save(
      saidasRepository.create({
        execucaoId: execucao.id,
        tarefaId: tarefa.id,
        condicao,
        entradaCompleta: '(recusa por recuperação vazia — nenhuma chamada ao LLM)',
        saidaBruta: preparada.semChamada.saidaBruta,
        promptVersao: preparada.promptVersao,
        modelo: parametros.modelo,
        tokensIn: 0,
        tokensOut: 0,
        custo: 0,
        duracaoMs: 0,
        sucesso: true,
      }),
    );
  }

  let ultimoResultado: Awaited<ReturnType<typeof ctx.llmService.completarParaValidacao>> | null =
    null;

  for (let tentativa = 1; tentativa <= MAXIMO_TENTATIVAS; tentativa++) {
    const resultado = await ctx.llmService.completarParaValidacao(
      preparada.papel,
      parametros.modelo,
      preparada.mensagens,
      preparada.promptVersao,
      { temperature: parametros.temperature, seed: parametros.seed, provider: parametros.provider },
      preparada.jsonMode,
    );
    ultimoResultado = resultado;

    const valido =
      resultado.sucesso && (!preparada.schema || validaSchema(preparada.schema, resultado.saidaBruta));
    if (valido) {
      break;
    }
    if (tentativa < MAXIMO_TENTATIVAS) {
      console.warn(`  tentativa ${tentativa} falhou para ${tarefa.codigo}/${condicao}, tentando de novo...`);
    }
  }

  const resultado = ultimoResultado!;
  const sucessoFinal =
    resultado.sucesso && (!preparada.schema || validaSchema(preparada.schema, resultado.saidaBruta));

  return saidasRepository.save(
    saidasRepository.create({
      execucaoId: execucao.id,
      tarefaId: tarefa.id,
      condicao,
      entradaCompleta: resultado.entradaCompleta,
      saidaBruta: resultado.saidaBruta,
      promptVersao: preparada.promptVersao,
      modelo: parametros.modelo,
      tokensIn: resultado.tokensIn,
      tokensOut: resultado.tokensOut,
      custo: resultado.custo,
      duracaoMs: resultado.duracaoMs,
      sucesso: sucessoFinal,
    }),
  );
}

function validaSchema(schema: ZodType<unknown>, saidaBruta: string): boolean {
  try {
    return schema.safeParse(extrairJson(saidaBruta)).success;
  } catch {
    return false;
  }
}

executarScript(async () => {
  const { rotulo, codigos } = lerArgumentos();
  const ctx = await criarContextoValidacao();

  try {
    const parametros = lerParametrosGeracao(ctx.configService);
    const gitSha = obterGitSha();

    const tarefasRepository = ctx.dataSource.getRepository(Tarefa);
    const sectionsRepository = ctx.dataSource.getRepository(Section);
    const execucoesRepository = ctx.dataSource.getRepository(Execucao);
    const saidasRepository = ctx.dataSource.getRepository(Saida);

    const tarefas = await tarefasRepository.find({
      where: codigos ? { codigo: In(codigos) } : {},
      order: { codigo: 'ASC' },
    });
    if (tarefas.length === 0) {
      throw new Error(
        'Nenhuma tarefa encontrada. Rode "npm run validacao:preparar-tarefas -- <yaml>" primeiro.',
      );
    }

    const execucao = await execucoesRepository.save(
      execucoesRepository.create({
        rotulo,
        gitSha,
        modelo: parametros.modelo,
        provider: parametros.provider,
        seed: parametros.seed,
        temperatura: parametros.temperature,
      }),
    );
    console.log(
      `Execução ${execucao.id} (rótulo "${rotulo}", commit ${gitSha.slice(0, 8)}, modelo ${parametros.modelo}).`,
    );
    console.log(`${tarefas.length} tarefas × ${CONDICOES.length} condições = ${tarefas.length * CONDICOES.length} saídas.`);

    let total = 0;
    let falhas = 0;
    let custoTotal = 0;
    const inicioBateria = Date.now();

    for (const tarefa of tarefas) {
      const secao = await sectionsRepository.findOneBy({ id: tarefa.sectionId });
      if (!secao) {
        console.warn(`  seção ${tarefa.sectionId} da tarefa ${tarefa.codigo} não existe mais; pulando.`);
        continue;
      }

      for (const condicao of CONDICOES) {
        const jaExiste = await saidasRepository.findOneBy({
          execucaoId: execucao.id,
          tarefaId: tarefa.id,
          condicao,
        });
        if (jaExiste) {
          console.log(`  ${tarefa.codigo}/${condicao}: já gerada, pulando.`);
          continue;
        }

        total++;
        const saida = await gerarSaida(ctx, execucao, tarefa, secao, condicao, parametros);
        custoTotal += Number(saida.custo);
        if (!saida.sucesso) {
          falhas++;
          console.error(`  ${tarefa.codigo}/${condicao}: FALHOU após ${MAXIMO_TENTATIVAS} tentativas.`);
        } else {
          console.log(`  ${tarefa.codigo}/${condicao}: ok (${saida.duracaoMs}ms, ${saida.tokensIn}+${saida.tokensOut} tokens).`);
        }
      }
    }

    await execucoesRepository.update(execucao.id, { encerradaEm: new Date() });

    console.log('\nResumo:');
    console.log(`  total gerado: ${total}`);
    console.log(`  falhas: ${falhas}`);
    console.log(`  custo: $${custoTotal.toFixed(4)}`);
    console.log(`  duração: ${((Date.now() - inicioBateria) / 1000).toFixed(1)}s`);
  } finally {
    await ctx.close();
  }
});
