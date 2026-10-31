import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Section } from '../catalog/entities/section.entity';
import { LlmService } from '../llm/llm.service';
import { VERSAO as VERSAO_PANORAMA, schemaPanorama } from '../prompts/templates/panorama';
import { PanoramaSaidaDto } from './dto/panorama-saida.dto';
import { Panorama } from './entities/panorama.entity';

const CODIGO_VIOLACAO_UNICIDADE_POSTGRES = '23505';

@Injectable()
export class PanoramaService {
  constructor(
    @InjectRepository(Panorama)
    private readonly panoramasRepository: Repository<Panorama>,
    @InjectRepository(Section)
    private readonly sectionsRepository: Repository<Section>,
    private readonly llmService: LlmService,
    private readonly configService: ConfigService,
  ) {}

  /** Gera na primeira chamada, cacheia para sempre. É por seção, não por aluno. */
  async obterOuGerar(sectionId: string): Promise<PanoramaSaidaDto> {
    const existente = await this.panoramasRepository.findOneBy({ sectionId });
    if (existente) {
      return this.paraSaida(existente);
    }

    const secao = await this.sectionsRepository.findOne({
      where: { id: sectionId },
      relations: ['livro'],
    });
    if (!secao) {
      throw new NotFoundException('Seção não encontrada.');
    }

    const resultado = await this.llmService.completar(
      'panorama',
      {
        tituloLivro: secao.livro.titulo,
        tituloSecao: secao.titulo,
        textoSecao: secao.textoCompleto,
      },
      schemaPanorama,
    );

    try {
      const panorama = await this.panoramasRepository.save(
        this.panoramasRepository.create({
          sectionId,
          niveis: resultado.niveis,
          tempoEstimadoMin: resultado.tempoEstimadoMin,
          promptVersao: VERSAO_PANORAMA,
          modelo: this.configService.get<string>('LLM_PANORAMA_MODEL')!,
        }),
      );
      return this.paraSaida(panorama);
    } catch (erro) {
      // Duas requisições concorrentes na primeira chamada da mesma seção:
      // a segunda esbarra no unique(sectionId) e só precisa devolver o que a
      // primeira já gravou, não falhar.
      if (this.ehViolacaoDeUnicidade(erro)) {
        const jaGravado = await this.panoramasRepository.findOneBy({ sectionId });
        if (jaGravado) {
          return this.paraSaida(jaGravado);
        }
      }
      throw erro;
    }
  }

  private ehViolacaoDeUnicidade(erro: unknown): boolean {
    return (
      typeof erro === 'object' &&
      erro !== null &&
      'driverError' in erro &&
      (erro as { driverError?: { code?: string } }).driverError?.code ===
        CODIGO_VIOLACAO_UNICIDADE_POSTGRES
    );
  }

  private paraSaida(panorama: Panorama): PanoramaSaidaDto {
    return {
      niveis: panorama.niveis,
      tempoEstimadoMin: panorama.tempoEstimadoMin,
    };
  }
}
