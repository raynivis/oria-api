import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import * as path from 'node:path';
import { Repository } from 'typeorm';
import { Book } from '../catalog/entities/book.entity';
import { FILA_INGESTAO, IngestaoJobData } from './ingestion.constants';

@Injectable()
export class IngestionService {
  constructor(
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
    @InjectQueue(FILA_INGESTAO)
    private readonly filaIngestao: Queue<IngestaoJobData>,
  ) {}

  async enfileirar(arquivoPath: string): Promise<{ jobId: string }> {
    let livro = await this.booksRepository.findOne({ where: { arquivoPath } });

    if (livro) {
      livro.status = 'processando';
      livro.erroMensagem = undefined;
      livro = await this.booksRepository.save(livro);
    } else {
      livro = await this.booksRepository.save(
        this.booksRepository.create({
          titulo: path.basename(arquivoPath, path.extname(arquivoPath)),
          autor: 'Desconhecido',
          arquivoPath,
          status: 'pendente',
        }),
      );
    }

    const job = await this.filaIngestao.add('ingerir', {
      bookId: livro.id,
    });

    return { jobId: job.id! };
  }

  async statusDoJob(jobId: string) {
    const job = await this.filaIngestao.getJob(jobId);
    if (!job) {
      throw new NotFoundException('Job não encontrado.');
    }

    const estado = await job.getState();

    return {
      jobId: job.id,
      estado,
      erro: job.failedReason ?? null,
    };
  }
}
