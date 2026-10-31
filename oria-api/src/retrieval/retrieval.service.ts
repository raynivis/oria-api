import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { Section } from '../catalog/entities/section.entity';
import { Chunk } from '../catalog/entities/chunk.entity';

export interface OpcoesBusca {
  limiar?: number;
  topK?: number;
}

export interface ChunkRecuperado {
  chunkId: string;
  sectionId: string;
  texto: string;
  ancoraCfi: string;
  score: number;
}

interface LinhaBusca {
  chunkId: string;
  sectionId: string;
  texto: string;
  ancoraCfi: string;
  score: string;
}

@Injectable()
export class RetrievalService {
  constructor(
    @InjectRepository(Section)
    private readonly sectionsRepository: Repository<Section>,
    @InjectRepository(Chunk)
    private readonly chunksRepository: Repository<Chunk>,
    private readonly embeddingsService: EmbeddingsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Busca semântica restrita à seção informada e às anteriores a ela (pela
   * ordem de leitura do livro) — nunca ao livro inteiro. Lista vazia não é
   * erro: é o sinal que dispara a recusa da tutora (regra 2 do CLAUDE.md).
   */
  async buscar(
    sectionId: string,
    consulta: string,
    opcoes?: OpcoesBusca,
  ): Promise<ChunkRecuperado[]> {
    const secaoAtual = await this.sectionsRepository.findOneBy({
      id: sectionId,
    });
    if (!secaoAtual) {
      throw new NotFoundException('Seção não encontrada.');
    }

    const limiar =
      opcoes?.limiar ?? this.configService.get<number>('RETRIEVAL_LIMIAR')!;
    const topK =
      opcoes?.topK ?? this.configService.get<number>('RETRIEVAL_TOP_K')!;

    const vetorConsulta = await this.embeddingsService.embedQuery(consulta);
    const vetorLiteral = `[${vetorConsulta.join(',')}]`;

    const linhas: LinhaBusca[] = await this.chunksRepository.query(
      `SELECT c.id AS "chunkId", c."sectionId", c.texto, c."ancoraCfi",
              (1 - (c.embedding <=> $1::vector))::float8 AS score
       FROM chunks c
       JOIN sections s ON s.id = c."sectionId"
       WHERE s."bookId" = $2
         AND s.ordem <= $3
         AND (1 - (c.embedding <=> $1::vector)) >= $4
       ORDER BY score DESC
       LIMIT $5`,
      [vetorLiteral, secaoAtual.bookId, secaoAtual.ordem, limiar, topK],
    );

    return linhas.map((linha) => ({
      chunkId: linha.chunkId,
      sectionId: linha.sectionId,
      texto: linha.texto,
      ancoraCfi: linha.ancoraCfi,
      score: Number(linha.score),
    }));
  }
}
