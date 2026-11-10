import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Section } from '../catalog/entities/section.entity';
import { LlmService } from '../llm/llm.service';
import { VERSAO as VERSAO_VOCABULARIO, schemaVocabulario } from '../prompts/templates/vocabulario';
import { ExplicarTermoDto } from './dto/explicar-termo.dto';
import { VocabularioSaidaDto } from './dto/vocabulario-saida.dto';

@Injectable()
export class VocabularioService {
  constructor(
    @InjectRepository(Section)
    private readonly sectionsRepository: Repository<Section>,
    private readonly llmService: LlmService,
    private readonly configService: ConfigService,
  ) {}

  /** Item 1.9: sem cache — cada seleção de termo é uma chamada nova, porque o
   * trecho em torno do termo muda a cada seleção do aluno. */
  async explicar(sectionId: string, dto: ExplicarTermoDto): Promise<VocabularioSaidaDto> {
    const secao = await this.sectionsRepository.findOneBy({ id: sectionId });
    if (!secao) {
      throw new NotFoundException('Seção não encontrada.');
    }

    const resultado = await this.llmService.completar(
      'vocabulario',
      { termo: dto.termo, trecho: dto.trecho, tituloSecao: secao.titulo },
      schemaVocabulario,
    );

    return {
      conteudo: resultado.conteudo,
      promptVersao: VERSAO_VOCABULARIO,
      modelo: this.configService.get<string>('LLM_VOCABULARY_MODEL')!,
    };
  }
}
