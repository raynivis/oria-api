import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
import type { ZodType } from 'zod';
import * as conceptsTemplate from '../prompts/templates/concepts';
import * as dialogueTemplate from '../prompts/templates/dialogue';
import * as fichamentoTemplate from '../prompts/templates/fichamento';
import * as hintTemplate from '../prompts/templates/hint';
import * as avaliacaoTemplate from '../prompts/templates/avaliacao';
import * as panoramaTemplate from '../prompts/templates/panorama';
import * as questionsTemplate from '../prompts/templates/questions';
import { LlmCall } from './entities/llm-call.entity';
import { MensagemChat, OpcoesCompletar, PapelLlm } from './llm.types';

interface ModuloTemplate {
  VERSAO: number;
  montarMensagens: (variaveis: never) => MensagemChat[];
}

const TEMPLATES: Partial<Record<PapelLlm, ModuloTemplate>> = {
  panorama: panoramaTemplate,
  fichamento: fichamentoTemplate,
  concepts: conceptsTemplate,
  questions: questionsTemplate,
  hint: hintTemplate,
  avaliacao: avaliacaoTemplate,
  dialogue: dialogueTemplate,
};

const ENV_POR_PAPEL: Record<PapelLlm, string> = {
  dialogue: 'LLM_DIALOGUE_MODEL',
  hint: 'LLM_HINT_MODEL',
  fichamento: 'LLM_FICHAMENTO_MODEL',
  panorama: 'LLM_PANORAMA_MODEL',
  questions: 'LLM_QUESTIONS_MODEL',
  concepts: 'LLM_CONCEPTS_MODEL',
  avaliacao: 'LLM_AVALIACAO_MODEL',
};

const MAXIMO_TENTATIVAS = 2;

type ResultadoTentativa<T> =
  | { sucesso: true; dados: T }
  | { sucesso: false; erro: string };

export interface ResultadoTransmissao {
  texto: string;
  tokensIn: number;
  tokensOut: number;
  custo: number;
  promptVersao: number;
  modelo: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(LlmCall)
    private readonly llmCallsRepository: Repository<LlmCall>,
  ) {}

  /**
   * Um método por papel, nunca por modelo. Resolve o modelo pela env do
   * papel, monta o prompt a partir de `src/prompts/templates/<papel>.ts`,
   * exige saída estruturada e valida com Zod — em falha de schema, tenta mais
   * uma vez, depois erra. Toda tentativa (sucesso ou não) grava um `LlmCall`
   * por inteiro: é dado de pesquisa, não log de depuração (CLAUDE.md regra 5).
   */
  async completar<T>(
    papel: PapelLlm,
    variaveis: object,
    schema: ZodType<T>,
    opcoes?: OpcoesCompletar,
  ): Promise<T> {
    const modelo = this.resolverModelo(papel);
    const template = this.carregarTemplate(papel);
    const mensagens = template.montarMensagens(variaveis as never);

    let ultimoErro = '';

    for (let tentativa = 1; tentativa <= MAXIMO_TENTATIVAS; tentativa++) {
      const resultado = await this.executarTentativa(
        papel,
        modelo,
        template.VERSAO,
        mensagens,
        schema,
        opcoes,
      );

      if (resultado.sucesso) {
        return resultado.dados;
      }

      ultimoErro = resultado.erro;
      if (tentativa < MAXIMO_TENTATIVAS) {
        this.logger.warn(
          `Tentativa ${tentativa} falhou para o papel "${papel}": ${ultimoErro}. Tentando de novo.`,
        );
      }
    }

    throw new Error(
      `Falha ao obter saída válida do papel "${papel}" após ${MAXIMO_TENTATIVAS} tentativas: ${ultimoErro}`,
    );
  }

  private async executarTentativa<T>(
    papel: PapelLlm,
    modelo: string,
    promptVersao: number,
    mensagens: MensagemChat[],
    schema: ZodType<T>,
    opcoes?: OpcoesCompletar,
  ): Promise<ResultadoTentativa<T>> {
    const entradaCompleta = JSON.stringify(mensagens);
    const inicio = Date.now();

    let saidaBruta = '';
    let tokensIn = 0;
    let tokensOut = 0;
    let custo = 0;
    let sucesso = false;
    let dados: T | undefined;
    let mensagemErro = '';

    try {
      const resposta = await this.chamarOpenRouter(modelo, mensagens, opcoes);
      saidaBruta = resposta.conteudo;
      tokensIn = resposta.tokensIn;
      tokensOut = resposta.tokensOut;
      custo = resposta.custo;

      const json = this.extrairJson(saidaBruta);
      const resultado = schema.safeParse(json);

      if (resultado.success) {
        sucesso = true;
        dados = resultado.data;
      } else {
        mensagemErro = `Saída fora do schema: ${resultado.error.message}`;
      }
    } catch (erro) {
      mensagemErro =
        erro instanceof Error ? erro.message : 'Erro desconhecido ao chamar o LLM.';
    }

    const duracaoMs = Date.now() - inicio;

    await this.llmCallsRepository.save(
      this.llmCallsRepository.create({
        papel,
        modelo,
        promptVersao,
        entradaCompleta,
        saidaBruta,
        temperatura: opcoes?.temperature,
        seed: opcoes?.seed,
        provider: opcoes?.provider,
        tokensIn,
        tokensOut,
        custo,
        duracaoMs,
        sucesso,
      }),
    );

    return sucesso ? { sucesso: true, dados: dados! } : { sucesso: false, erro: mensagemErro };
  }

  /**
   * Stream de texto puro (papel `dialogue`). Repassa cada fatia ao chamador
   * conforme chega e grava o `LlmCall` ao fim, com sucesso ou falha, inclusive
   * quando o chamador cancela pelo `signal`.
   */
  async transmitir(
    papel: PapelLlm,
    variaveis: object,
    aoReceberFatia: (fatia: string) => void,
    sinal?: AbortSignal,
  ): Promise<ResultadoTransmissao> {
    const modelo = this.resolverModelo(papel);
    const template = this.carregarTemplate(papel);
    const mensagens = template.montarMensagens(variaveis as never);
    const entradaCompleta = JSON.stringify(mensagens);
    const inicio = Date.now();

    let saidaBruta = '';
    let tokensIn = 0;
    let tokensOut = 0;
    let custo = 0;
    let sucesso = false;
    let mensagemErro = '';

    try {
      const baseUrl = this.configService.get<string>('OPENROUTER_BASE_URL');
      const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
      const resposta = await axios.post(
        `${baseUrl}/chat/completions`,
        {
          model: modelo,
          messages: mensagens,
          stream: true,
          usage: { include: true },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
          timeout: 60000,
          signal: sinal,
        },
      );

      await new Promise<void>((resolve, reject) => {
        const fluxo = resposta.data as NodeJS.ReadableStream;
        let pendente = '';

        const processarLinha = (linha: string) => {
          if (!linha.startsWith('data: ')) {
            return;
          }
          const carga = linha.slice('data: '.length).trim();
          if (carga === '[DONE]' || carga === '') {
            return;
          }
          const evento = JSON.parse(carga) as {
            error?: { message?: string };
            choices?: Array<{ delta?: { content?: string } }>;
            usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
          };
          if (evento.error) {
            throw new Error(evento.error.message ?? 'Erro no stream do OpenRouter.');
          }
          const fatia = evento.choices?.[0]?.delta?.content;
          if (fatia) {
            saidaBruta += fatia;
            aoReceberFatia(fatia);
          }
          if (evento.usage) {
            tokensIn = evento.usage.prompt_tokens ?? tokensIn;
            tokensOut = evento.usage.completion_tokens ?? tokensOut;
            custo = evento.usage.cost ?? custo;
          }
        };

        fluxo.on('data', (pedaco: Buffer) => {
          try {
            pendente += pedaco.toString('utf8');
            const linhas = pendente.split('\n');
            pendente = linhas.pop() ?? '';
            linhas.forEach(processarLinha);
          } catch (erro) {
            reject(erro);
          }
        });
        fluxo.on('end', () => {
          try {
            processarLinha(pendente);
            resolve();
          } catch (erro) {
            reject(erro);
          }
        });
        fluxo.on('error', reject);
      });

      sucesso = true;
    } catch (erro) {
      mensagemErro =
        erro instanceof Error ? erro.message : 'Erro desconhecido ao transmitir o LLM.';
    }

    await this.llmCallsRepository.save(
      this.llmCallsRepository.create({
        papel,
        modelo,
        promptVersao: template.VERSAO,
        entradaCompleta,
        saidaBruta,
        tokensIn,
        tokensOut,
        custo,
        duracaoMs: Date.now() - inicio,
        sucesso,
      }),
    );

    if (!sucesso) {
      throw new Error(mensagemErro);
    }

    return { texto: saidaBruta, tokensIn, tokensOut, custo, promptVersao: template.VERSAO, modelo };
  }

  private async chamarOpenRouter(
    modelo: string,
    mensagens: MensagemChat[],
    opcoes?: OpcoesCompletar,
  ): Promise<{
    conteudo: string;
    tokensIn: number;
    tokensOut: number;
    custo: number;
  }> {
    const baseUrl = this.configService.get<string>('OPENROUTER_BASE_URL');
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');

    const corpo: Record<string, unknown> = {
      model: modelo,
      messages: mensagens,
      response_format: { type: 'json_object' },
      usage: { include: true },
    };

    if (opcoes?.temperature !== undefined) {
      corpo.temperature = opcoes.temperature;
    }
    if (opcoes?.seed !== undefined) {
      corpo.seed = opcoes.seed;
    }
    if (opcoes?.provider !== undefined) {
      corpo.provider = { order: [opcoes.provider], allow_fallbacks: false };
    }

    const resposta = await axios.post(`${baseUrl}/chat/completions`, corpo, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });

    const dados = resposta.data as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
    };

    return {
      conteudo: dados.choices?.[0]?.message?.content ?? '',
      tokensIn: dados.usage?.prompt_tokens ?? 0,
      tokensOut: dados.usage?.completion_tokens ?? 0,
      custo: dados.usage?.cost ?? 0,
    };
  }

  private extrairJson(texto: string): unknown {
    const limpo = texto
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '');
    return JSON.parse(limpo);
  }

  private resolverModelo(papel: PapelLlm): string {
    return this.configService.get<string>(ENV_POR_PAPEL[papel])!;
  }

  private carregarTemplate(papel: PapelLlm): ModuloTemplate {
    const template = TEMPLATES[papel];
    if (!template) {
      throw new Error(`Nenhum template de prompt registrado para o papel "${papel}".`);
    }
    return template;
  }
}
