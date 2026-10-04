import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { existsSync, readdirSync } from 'node:fs';
import * as path from 'node:path';
import { AppModule } from '../src/app.module';
import { IngestionService } from '../src/ingestion/ingestion.service';

async function seed(): Promise<void> {
  const diretorioAcervo = path.join(__dirname, '../acervo');

  const arquivos = existsSync(diretorioAcervo)
    ? readdirSync(diretorioAcervo).filter((nome) =>
        nome.toLowerCase().endsWith('.epub'),
      )
    : [];

  if (arquivos.length === 0) {
    console.log('Nenhum EPUB encontrado em acervo/. Nada para ingerir.');
    return;
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const ingestionService = app.get(IngestionService);

    for (const arquivo of arquivos) {
      const caminho = path.join(diretorioAcervo, arquivo);
      const { jobId } = await ingestionService.enfileirar(caminho);
      console.log(`Enfileirado: ${arquivo} -> job ${jobId}`);
    }
  } finally {
    await app.close();
  }
}

seed().catch((erro: unknown) => {
  console.error(erro);
  process.exit(1);
});
