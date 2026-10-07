import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager, In } from 'typeorm';
import { Chunk } from '../catalog/entities/chunk.entity';
import { Section } from '../catalog/entities/section.entity';
import { LlmService } from '../llm/llm.service';
import {
  schemaAvaliacao,
} from '../prompts/templates/avaliacao';
import {
  schemaPassoIntermediario,
  schemaResolucao,
  TipoPassoSistema,
  VariaveisHint,
} from '../prompts/templates/hint';
import { IniciarTentativaDto } from './dto/iniciar-tentativa.dto';
import { PassoTentativaDto } from './dto/passo-tentativa.dto';
import { TentativaSaidaDto } from './dto/tentativa-saida.dto';
import { Attempt } from './entities/attempt.entity';
import { AttemptStep } from './entities/attempt-step.entity';
import { Question } from './entities/question.entity';

const FALLBACK_NEUTRO = 'Tente reformular sua resposta com base no que leu.';

/**
 * Máquina de estados do fluxo step-based (IMPLEMENTATION.md, Fase 7; CLAUDE.md,
 * regra 1). Nenhum caminho daqui devolve veredito ao estudante: o juiz
 * (`avaliacao`) decide o fluxo e grava o resultado no banco, e o texto do
 * passo nunca diz se a resposta está certa.
 */
@Injectable()
export class TentativasService {
  private readonly logger = new Logger(TentativasService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly llmService: LlmService,
    private readonly configService: ConfigService,
  ) {}

  async iniciar(
    userId: string,
    questaoId: string,
    dto: IniciarTentativaDto,
  ): Promise<TentativaSaidaDto> {
    return this.dataSource.transaction(async (manager) => {
      const questao = await this.carregarQuestaoDoAluno(manager, userId, questaoId);

      const tentativa = await manager.save(
        manager.create(Attempt, {
          questionId: questao.id,
          userId,
          estado: 'aberta',
          nPassos: 0,
          respostaInicial: dto.resposta,
        }),
      );

      const conteudo = await this.gerarPassoSistema(manager, {
        tipo: 'pedido_justificativa',
        questao,
        tentativa,
        trilha: [],
        numeroPasso: 1,
      });
      await manager.save(
        manager.create(AttemptStep, {
          attemptId: tentativa.id,
          numero: 1,
          tipo: 'pedido_justificativa',
          conteudo,
        }),
      );

      tentativa.nPassos = 1;
      await manager.save(tentativa);

      return this.montarSaida(manager, tentativa);
    });
  }

  async registrarPasso(
    userId: string,
    tentativaId: string,
    dto: PassoTentativaDto,
  ): Promise<TentativaSaidaDto> {
    return this.dataSource.transaction(async (manager) => {
      const tentativa = await this.carregarTentativaDoAluno(manager, userId, tentativaId);
      this.exigirAberta(tentativa);

      const questao = await this.carregarQuestao(manager, tentativa.questionId);
      const maximo = this.maximoPassos();

      if (dto.tipo === 'resolucao') {
        if (tentativa.nPassos < maximo) {
          throw new BadRequestException(
            `A resolução só fica disponível após ${maximo} passos ou com desistência.`,
          );
        }
        await this.encerrarComResolucao(manager, tentativa, questao, 'resolvida');
        return this.montarSaida(manager, tentativa);
      }

      const proximoNumero = (await this.carregarPassos(manager, tentativa.id)).length + 1;
      const suficiente = await this.avaliarJustificativa(manager, questao, dto.conteudo!);

      await manager.save(
        manager.create(AttemptStep, {
          attemptId: tentativa.id,
          numero: proximoNumero,
          tipo: 'justificativa_aluno',
          conteudo: dto.conteudo!,
          avaliacaoSuficiente: suficiente,
        }),
      );

      if (suficiente) {
        if (tentativa.nPassos >= maximo) {
          await this.adicionarResolucao(manager, tentativa, questao);
        }
        tentativa.estado = 'resolvida';
        tentativa.encerradaEm = new Date();
      } else {
        if (tentativa.nPassos < maximo) {
          await this.adicionarDica(manager, tentativa, questao);
          tentativa.nPassos += 1;
        }
        tentativa.estado = 'em_passos';
      }

      await manager.save(tentativa);
      return this.montarSaida(manager, tentativa);
    });
  }

  async desistir(userId: string, tentativaId: string): Promise<TentativaSaidaDto> {
    return this.dataSource.transaction(async (manager) => {
      const tentativa = await this.carregarTentativaDoAluno(manager, userId, tentativaId);
      this.exigirAberta(tentativa);

      const questao = await this.carregarQuestao(manager, tentativa.questionId);
      await this.encerrarComResolucao(manager, tentativa, questao, 'abandonada');
      return this.montarSaida(manager, tentativa);
    });
  }

  async obter(userId: string, tentativaId: string): Promise<TentativaSaidaDto> {
    const tentativa = await this.dataSource.manager.findOne(Attempt, {
      where: { id: tentativaId, userId },
    });
    if (!tentativa) {
      throw new NotFoundException('Tentativa não encontrada.');
    }
    return this.montarSaida(this.dataSource.manager, tentativa);
  }

  private async encerrarComResolucao(
    manager: EntityManager,
    tentativa: Attempt,
    questao: Question,
    estadoFinal: 'resolvida' | 'abandonada',
  ): Promise<void> {
    await this.adicionarResolucao(manager, tentativa, questao);
    tentativa.estado = estadoFinal;
    tentativa.encerradaEm = new Date();
    await manager.save(tentativa);
  }

  private async adicionarDica(
    manager: EntityManager,
    tentativa: Attempt,
    questao: Question,
  ): Promise<void> {
    const tipo: TipoPassoSistema =
      tentativa.nPassos === 1 ? 'dica_conceitual' : 'dica_localizada';
    const conteudo = await this.gerarPassoSistema(manager, {
      tipo,
      questao,
      tentativa,
      trilha: await this.carregarPassos(manager, tentativa.id),
      numeroPasso: tentativa.nPassos + 1,
    });
    await this.persistirPasso(manager, tentativa.id, tipo, conteudo);
  }

  private async adicionarResolucao(
    manager: EntityManager,
    tentativa: Attempt,
    questao: Question,
  ): Promise<void> {
    const passos = await this.carregarPassos(manager, tentativa.id);
    const ultimaAvaliacao = [...passos]
      .reverse()
      .find((passo) => passo.avaliacaoSuficiente !== null && passo.avaliacaoSuficiente !== undefined);

    const conteudo = await this.gerarPassoSistema(manager, {
      tipo: 'resolucao',
      questao,
      tentativa,
      trilha: passos,
      numeroPasso: tentativa.nPassos + 1,
      ultimaJustificativaSuficiente: ultimaAvaliacao?.avaliacaoSuficiente ?? undefined,
    });
    await this.persistirPasso(manager, tentativa.id, 'resolucao', conteudo);
  }

  private async persistirPasso(
    manager: EntityManager,
    attemptId: string,
    tipo: TipoPassoSistema,
    conteudo: string,
  ): Promise<void> {
    const numero = (await this.carregarPassos(manager, attemptId)).length + 1;
    await manager.save(
      manager.create(AttemptStep, { attemptId, numero, tipo, conteudo }),
    );
  }

  /**
   * Falha de schema nos passos intermediários (guardrail de `entregouResolucao`)
   * já foi refeita uma vez pelo LlmService. Persistindo, usa o fallback neutro
   * e registra o incidente. A resolução não tem fallback: falhar a resolução
   * desfaz a transação em vez de entregar texto que não é a resolução.
   */
  private async gerarPassoSistema(
    manager: EntityManager,
    contexto: {
      tipo: TipoPassoSistema;
      questao: Question;
      tentativa: Attempt;
      trilha: Array<{ tipo: string; conteudo: string }>;
      numeroPasso: number;
      ultimaJustificativaSuficiente?: boolean;
    },
  ): Promise<string> {
    const chunks = await this.carregarChunks(manager, contexto.questao);
    const variaveis: VariaveisHint = {
      tipo: contexto.tipo,
      enunciado: contexto.questao.enunciado,
      respostaReferencia: contexto.questao.respostaReferencia,
      respostaInicial: contexto.tentativa.respostaInicial,
      trilha: contexto.trilha.map((passo) => ({ tipo: passo.tipo, conteudo: passo.conteudo })),
      numeroPasso: contexto.numeroPasso,
      chunks,
      ultimaJustificativaSuficiente: contexto.ultimaJustificativaSuficiente,
    };

    if (contexto.tipo === 'resolucao') {
      const saida = await this.llmService.completar('hint', variaveis, schemaResolucao);
      return saida.conteudo;
    }

    try {
      const saida = await this.llmService.completar(
        'hint',
        variaveis,
        schemaPassoIntermediario,
      );
      return saida.conteudo;
    } catch (erro) {
      this.logger.error(
        `Passo ${contexto.tipo} da tentativa ${contexto.tentativa.id} falhou após as tentativas do LLM; usando fallback neutro. ${
          erro instanceof Error ? erro.message : String(erro)
        }`,
      );
      return FALLBACK_NEUTRO;
    }
  }

  private async avaliarJustificativa(
    manager: EntityManager,
    questao: Question,
    justificativa: string,
  ): Promise<boolean> {
    const chunks = await this.carregarChunks(manager, questao);
    const saida = await this.llmService.completar(
      'avaliacao',
      {
        enunciado: questao.enunciado,
        respostaReferencia: questao.respostaReferencia,
        justificativa,
        chunks,
      },
      schemaAvaliacao,
    );
    return saida.suficiente;
  }

  /** Material da questão: os chunks que a sustentam, ou o texto da seção se não houver vínculo. */
  private async carregarChunks(manager: EntityManager, questao: Question): Promise<string[]> {
    if (questao.chunksFonte.length > 0) {
      const chunks = await manager.find(Chunk, {
        where: { id: In(questao.chunksFonte) },
        order: { ordem: 'ASC' },
      });
      if (chunks.length > 0) {
        return chunks.map((chunk) => chunk.texto);
      }
    }

    const secao = await manager.findOneBy(Section, {
      id: questao.conjunto!.sectionId,
    });
    return secao ? [secao.textoCompleto] : [];
  }

  private exigirAberta(tentativa: Attempt): void {
    if (tentativa.estado !== 'aberta' && tentativa.estado !== 'em_passos') {
      throw new BadRequestException('Esta tentativa já foi encerrada.');
    }
  }

  private maximoPassos(): number {
    return this.configService.get<number>('ATTEMPT_MAX_STEPS') ?? 3;
  }

  private async carregarQuestaoDoAluno(
    manager: EntityManager,
    userId: string,
    questaoId: string,
  ): Promise<Question> {
    const questao = await manager.findOne(Question, {
      where: { id: questaoId },
      relations: ['conjunto'],
    });
    if (!questao || questao.conjunto?.userId !== userId) {
      throw new NotFoundException('Questão não encontrada.');
    }
    return questao;
  }

  private async carregarQuestao(manager: EntityManager, questaoId: string): Promise<Question> {
    return manager.findOneOrFail(Question, {
      where: { id: questaoId },
      relations: ['conjunto'],
    });
  }

  private async carregarTentativaDoAluno(
    manager: EntityManager,
    userId: string,
    tentativaId: string,
  ): Promise<Attempt> {
    const tentativa = await manager.findOne(Attempt, {
      where: { id: tentativaId, userId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!tentativa) {
      throw new NotFoundException('Tentativa não encontrada.');
    }
    return tentativa;
  }

  private carregarPassos(manager: EntityManager, attemptId: string): Promise<AttemptStep[]> {
    return manager.find(AttemptStep, {
      where: { attemptId },
      order: { numero: 'ASC' },
    });
  }

  private async montarSaida(
    manager: EntityManager,
    tentativa: Attempt,
  ): Promise<TentativaSaidaDto> {
    const passos = await this.carregarPassos(manager, tentativa.id);
    return {
      id: tentativa.id,
      questaoId: tentativa.questionId,
      estado: tentativa.estado,
      nPassos: tentativa.nPassos,
      criadaEm: tentativa.criadaEm,
      encerradaEm: tentativa.encerradaEm ?? null,
      passos: passos.map((passo) => ({
        numero: passo.numero,
        tipo: passo.tipo,
        conteudo: passo.conteudo,
        criadoEm: passo.criadoEm,
      })),
    };
  }
}
