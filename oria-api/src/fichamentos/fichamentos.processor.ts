import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { Section } from '../catalog/entities/section.entity';
import { LlmService } from '../llm/llm.service';
import { VERSAO as VERSAO_FICHAMENTO, schemaFichamento } from '../prompts/templates/fichamento';
import { Fichamento } from './entities/fichamento.entity';
import { FichamentoVersao } from './entities/fichamento-versao.entity';
import { FILA_FICHAMENTO, FichamentoJobData } from './fichamentos.constants';

/**
 * Item 2.5 (correção de usabilidade): a mesma chamada ao papel `fichamento`
 * de `FichamentosService.gerarOuObter`, só que fora da requisição HTTP — é o
 * que permite à geração passar de 180s sem o cliente desistir primeiro.
 */
@Processor(FILA_FICHAMENTO, { lockDuration: 5 * 60 * 1000 })
export class FichamentosProcessor extends WorkerHost {
  private readonly logger = new Logger(FichamentosProcessor.name);

  constructor(
    @InjectRepository(Fichamento)
    private readonly fichamentosRepository: Repository<Fichamento>,
    @InjectRepository(FichamentoVersao)
    private readonly versoesRepository: Repository<FichamentoVersao>,
    @InjectRepository(Section)
    private readonly sectionsRepository: Repository<Section>,
    private readonly llmService: LlmService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<FichamentoJobData>): Promise<void> {
    const fichamento = await this.fichamentosRepository.findOneByOrFail({
      id: job.data.fichamentoId,
    });

    try {
      const secao = await this.sectionsRepository.findOneByOrFail({ id: fichamento.sectionId });

      const resultado = await this.llmService.completar(
        'fichamento',
        {
          tituloSecao: secao.titulo,
          texto: fichamento.trechoTexto ?? secao.textoCompleto,
        },
        schemaFichamento,
      );

      await this.versoesRepository.save(
        this.versoesRepository.create({
          fichamentoId: fichamento.id,
          numero: 1,
          conteudo: resultado.conteudo,
          origem: 'ia',
          promptVersao: VERSAO_FICHAMENTO,
          modelo: this.configService.get<string>('LLM_FICHAMENTO_MODEL')!,
        }),
      );

      fichamento.statusGeracao = 'pronto';
      fichamento.erroMensagem = undefined;
      await this.fichamentosRepository.save(fichamento);
    } catch (erro) {
      const mensagem =
        erro instanceof Error ? erro.message : 'Erro desconhecido ao gerar o fichamento.';
      this.logger.error(`Falha ao gerar o fichamento ${fichamento.id}: ${mensagem}`);

      fichamento.statusGeracao = 'erro';
      fichamento.erroMensagem = mensagem;
      await this.fichamentosRepository.save(fichamento);

      throw erro;
    }
  }
}
