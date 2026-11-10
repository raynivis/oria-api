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
  /** Item 1.1 (correção de usabilidade): último recurso antes de recusar —
   * ignora o limite "só a seção atual e as anteriores" e busca no livro
   * inteiro. Nunca usado por padrão; quem chama decide explicitamente,
   * depois de a busca restrita já ter vindo vazia. */
  ignorarLimiteDeOrdem?: boolean;
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

    // Item 1.1: a restrição "s.ordem <= $3" só é relaxada quando o chamador
    // pede explicitamente (`ignorarLimiteDeOrdem`), como último recurso antes
    // de recusar — a regra "nunca ao livro inteiro" continua valendo por
    // padrão para toda chamada que não passar essa opção (inclusive a
    // validação, que nunca passa).
    const linhas: LinhaBusca[] = opcoes?.ignorarLimiteDeOrdem
      ? await this.chunksRepository.query(
          `SELECT c.id AS "chunkId", c."sectionId", c.texto, c."ancoraCfi",
                  (1 - (c.embedding <=> $1::vector))::float8 AS score
           FROM chunks c
           JOIN sections s ON s.id = c."sectionId"
           WHERE s."bookId" = $2
             AND (1 - (c.embedding <=> $1::vector)) >= $3
           ORDER BY score DESC
           LIMIT $4`,
          [vetorLiteral, secaoAtual.bookId, limiar, topK],
        )
      : await this.chunksRepository.query(
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
