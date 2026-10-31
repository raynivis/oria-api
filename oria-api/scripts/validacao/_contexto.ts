import 'reflect-metadata';
import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { execSync } from 'node:child_process';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { ConceitosService } from '../../src/questoes/conceitos.service';
import { LlmService } from '../../src/llm/llm.service';
import { RetrievalService } from '../../src/retrieval/retrieval.service';

export interface ParametrosGeracao {
  modelo: string;
  provider: string;
  seed: number;
  temperature: number;
}

/** Falha cedo e com mensagem clara: gerar a bateria sem isso compromete a reprodutibilidade (VALIDATION.md §2). */
export function lerParametrosGeracao(configService: ConfigService): ParametrosGeracao {
  const modelo = configService.get<string>('VALIDACAO_MODELO');
  const provider = configService.get<string>('VALIDACAO_PROVIDER');
  const seed = configService.get<number>('VALIDACAO_SEED');

  const faltando = [
    !modelo && 'VALIDACAO_MODELO',
    !provider && 'VALIDACAO_PROVIDER',
    seed === undefined && 'VALIDACAO_SEED',
  ].filter(Boolean);

  if (faltando.length > 0) {
    throw new Error(
      `Faltam variáveis de ambiente para a validação: ${faltando.join(', ')}. ` +
        'Preencha-as no .env antes de rodar qualquer script de scripts/validacao/.',
    );
  }

  return { modelo: modelo!, provider: provider!, seed: seed!, temperature: 0 };
}

/** VALIDATION.md §2: "VALIDACAO_GIT_SHA=<preenchido pelo script, não à mão>" — nunca lido do .env. */
export function obterGitSha(): string {
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch {
    throw new Error(
      'Não foi possível obter o SHA do commit atual (git rev-parse HEAD falhou). ' +
        'A validação exige código congelado e identificado — rode dentro de um repositório git.',
    );
  }
}

export interface ContextoValidacao {
  app: INestApplicationContext;
  dataSource: DataSource;
  configService: ConfigService;
  llmService: LlmService;
  retrievalService: RetrievalService;
  conceitosService: ConceitosService;
  close: () => Promise<void>;
}

export async function criarContextoValidacao(): Promise<ContextoValidacao> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  return {
    app,
    dataSource: app.get(DataSource),
    configService: app.get(ConfigService),
    llmService: app.get(LlmService),
    retrievalService: app.get(RetrievalService),
    conceitosService: app.get(ConceitosService),
    close: () => app.close(),
  };
}

/** Todo script de scripts/validacao/ termina assim: erro vira saída não-zero, nunca stack trace cru. */
export function executarScript(rotina: () => Promise<void>): void {
  rotina().catch((erro: unknown) => {
    console.error(erro instanceof Error ? erro.message : erro);
    process.exit(1);
  });
}
