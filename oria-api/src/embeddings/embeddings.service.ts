import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly url: string;
  private readonly dimensaoEsperada: number;

  constructor(private readonly configService: ConfigService) {
    this.url = this.configService.get<string>('EMBEDDINGS_URL')!;
    this.dimensaoEsperada = this.configService.get<number>('EMBEDDINGS_DIM')!;
  }

  async onModuleInit(): Promise<void> {
    const [vetor] = await this.embed(['passage: verificação de dimensão no boot']);

    if (!vetor || vetor.length !== this.dimensaoEsperada) {
      throw new Error(
        `EMBEDDINGS_DIM está configurado como ${this.dimensaoEsperada}, mas o ` +
          `servidor de embeddings em ${this.url} retornou vetores de dimensão ` +
          `${vetor?.length ?? 'indefinida'}. Ajuste EMBEDDINGS_DIM para bater com o modelo servido.`,
      );
    }

    this.logger.log(`EmbeddingsService validado: dimensão ${vetor.length}.`);
  }

  /** Vetoriza textos de documento. Aplica o prefixo "passage: " exigido pelo E5. */
  async embedPassages(textos: string[]): Promise<number[][]> {
    return this.embed(textos.map((texto) => `passage: ${texto}`));
  }

  /** Vetoriza uma consulta de busca. Aplica o prefixo "query: " exigido pelo E5. */
  async embedQuery(texto: string): Promise<number[]> {
    const [vetor] = await this.embed([`query: ${texto}`]);
    return vetor;
  }

  private async embed(entradas: string[]): Promise<number[][]> {
    const resposta = await axios.post<number[][]>(`${this.url}/embed`, {
      inputs: entradas,
    });
    return resposta.data;
  }
}
