import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Section } from '../catalog/entities/section.entity';
import { LlmService, ResultadoTransmissao } from '../llm/llm.service';
import { RECUSA_SEM_BASE, TurnoHistorico } from '../prompts/templates/dialogue';
import { ChunkRecuperado, RetrievalService } from '../retrieval/retrieval.service';
import { CriarSessaoDto } from './dto/criar-sessao.dto';
import { MensagemSaidaDto, SessaoResumoDto, SessaoSaidaDto } from './dto/sessao-saida.dto';
import { Message } from './entities/message.entity';
import { Session } from './entities/session.entity';
import { EscritorSse } from './escritor-sse';
import { interpretarResposta } from './interpretacao';

const TURNOS_DE_HISTORICO = 6;
const TAMANHO_TRECHO_CITADO = 300;
const MENSAGEM_ERRO_GERACAO = 'Não foi possível gerar a resposta agora. Tente de novo.';

export interface ContextoEnvio {
  sessao: Session;
  pergunta: string;
  historico: TurnoHistorico[];
  chunks: ChunkRecuperado[];
  titulosPorSecao: Map<string, string>;
}

@Injectable()
export class DialogueService {
  private readonly logger = new Logger(DialogueService.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(Section)
    private readonly sectionsRepository: Repository<Section>,
    private readonly retrievalService: RetrievalService,
    private readonly llmService: LlmService,
  ) {}

  async criarSessao(userId: string, dto: CriarSessaoDto): Promise<SessaoSaidaDto> {
    const secao = await this.sectionsRepository.findOneBy({ id: dto.secaoId });
    if (!secao) {
      throw new NotFoundException('Seção não encontrada.');
    }

    const sessao = await this.sessionsRepository.save(
      this.sessionsRepository.create({ userId, sectionId: secao.id }),
    );
    return {
      id: sessao.id,
      sectionId: secao.id,
      tituloSecao: secao.titulo,
      criadaEm: sessao.criadaEm,
      mensagens: [],
    };
  }

  async obterSessao(userId: string, id: string): Promise<SessaoSaidaDto> {
    const sessao = await this.buscarDoAluno(userId, id);
    const secao = await this.sectionsRepository.findOneByOrFail({ id: sessao.sectionId });
    const mensagens = await this.messagesRepository.find({
      where: { sessionId: sessao.id },
      order: { criadoEm: 'ASC' },
    });

    return {
      id: sessao.id,
      sectionId: sessao.sectionId,
      tituloSecao: secao.titulo,
      criadaEm: sessao.criadaEm,
      mensagens: mensagens.map((m) => this.paraMensagemSaida(m)),
    };
  }

  async listarMinhas(userId: string): Promise<SessaoResumoDto[]> {
    const sessoes = await this.sessionsRepository.find({
      where: { userId },
      order: { criadaEm: 'DESC' },
    });
    const secoes = sessoes.length
      ? await this.sectionsRepository.findBy({ id: In(sessoes.map((s) => s.sectionId)) })
      : [];
    const titulos = new Map(secoes.map((s) => [s.id, s.titulo]));

    return sessoes.map((s) => ({
      id: s.id,
      sectionId: s.sectionId,
      tituloSecao: titulos.get(s.sectionId) ?? '',
      criadaEm: s.criadaEm,
    }));
  }

  /**
   * Tudo que pode falhar com erro HTTP comum acontece aqui, antes do stream
   * abrir: sessão alheia ou inexistente, e a recuperação. A mensagem do aluno
   * é gravada já aqui, para sobreviver mesmo se a resposta falhar.
   */
  async prepararEnvio(userId: string, sessaoId: string, conteudo: string): Promise<ContextoEnvio> {
    const sessao = await this.buscarDoAluno(userId, sessaoId);
    const chunks = await this.retrievalService.buscar(sessao.sectionId, conteudo);

    const historico = await this.messagesRepository.find({
      where: { sessionId: sessao.id },
      order: { criadoEm: 'DESC' },
      take: TURNOS_DE_HISTORICO,
    });

    await this.messagesRepository.save(
      this.messagesRepository.create({
        sessionId: sessao.id,
        papel: 'aluno',
        conteudo,
        chunksCitados: [],
      }),
    );

    const idsSecoes = [...new Set(chunks.map((c) => c.sectionId))];
    const secoes = idsSecoes.length
      ? await this.sectionsRepository.findBy({ id: In(idsSecoes) })
      : [];

    return {
      sessao,
      pergunta: conteudo,
      historico: historico.reverse().map((m) => ({ papel: m.papel, conteudo: m.conteudo })),
      chunks,
      titulosPorSecao: new Map(secoes.map((s) => [s.id, s.titulo])),
    };
  }

  /**
   * Nunca lança: falhas viram evento `erro` no stream. Só a recusa dispensa o LLM.
   */
  async executarEnvio(
    contexto: ContextoEnvio,
    escritor: EscritorSse,
    sinal: AbortSignal,
  ): Promise<void> {
    const sessaoId = contexto.sessao.id;

    if (contexto.chunks.length === 0) {
      const mensagem = await this.salvarMensagemTutora(sessaoId, RECUSA_SEM_BASE, {
        chunksCitados: [],
        encontrouBase: false,
      });
      escritor.token(RECUSA_SEM_BASE);
      escritor.fim(mensagem.id, false);
      return;
    }

    let resultado: ResultadoTransmissao;
    try {
      resultado = await this.llmService.transmitir(
        'dialogue',
        {
          pergunta: contexto.pergunta,
          historico: contexto.historico,
          chunks: contexto.chunks.map((c) => c.texto),
        },
        (fatia) => escritor.token(fatia),
        sinal,
      );
    } catch (erro) {
      if (!sinal.aborted) {
        this.logger.error(
          `Falha ao transmitir a resposta da sessão ${sessaoId}: ${
            erro instanceof Error ? erro.message : String(erro)
          }`,
        );
        escritor.erro(MENSAGEM_ERRO_GERACAO);
      }
      return;
    }

    if (resultado.texto.trim() === '') {
      escritor.erro(MENSAGEM_ERRO_GERACAO);
      return;
    }

    const { encontrouBase, chunksCitados } = interpretarResposta(
      resultado.texto,
      contexto.chunks.map((c) => c.chunkId),
    );

    for (const chunkId of chunksCitados) {
      const chunk = contexto.chunks.find((c) => c.chunkId === chunkId)!;
      escritor.citacao({
        chunkId,
        trecho: chunk.texto.slice(0, TAMANHO_TRECHO_CITADO),
        ancoraCfi: chunk.ancoraCfi,
        secaoTitulo: contexto.titulosPorSecao.get(chunk.sectionId) ?? '',
      });
    }

    const mensagem = await this.salvarMensagemTutora(sessaoId, resultado.texto, {
      chunksCitados,
      encontrouBase,
      promptVersao: resultado.promptVersao,
      modelo: resultado.modelo,
      tokensIn: resultado.tokensIn,
      tokensOut: resultado.tokensOut,
      custo: resultado.custo,
    });
    escritor.fim(mensagem.id, encontrouBase);
  }

  private async salvarMensagemTutora(
    sessionId: string,
    conteudo: string,
    dados: Partial<Message> & { chunksCitados: string[]; encontrouBase: boolean },
  ): Promise<Message> {
    return this.messagesRepository.save(
      this.messagesRepository.create({ sessionId, papel: 'tutora', conteudo, ...dados }),
    );
  }

  private async buscarDoAluno(userId: string, id: string): Promise<Session> {
    const sessao = await this.sessionsRepository.findOneBy({ id, userId });
    if (!sessao) {
      throw new NotFoundException('Sessão não encontrada.');
    }
    return sessao;
  }

  private paraMensagemSaida(mensagem: Message): MensagemSaidaDto {
    return {
      id: mensagem.id,
      papel: mensagem.papel,
      conteudo: mensagem.conteudo,
      chunksCitados: mensagem.chunksCitados,
      encontrouBase: mensagem.encontrouBase ?? null,
      criadoEm: mensagem.criadoEm,
    };
  }
}
