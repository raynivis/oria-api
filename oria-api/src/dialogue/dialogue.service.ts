import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Section } from '../catalog/entities/section.entity';
import { LlmService, ResultadoTransmissao } from '../llm/llm.service';
import { RECUSA_SEM_BASE, TurnoHistorico } from '../prompts/templates/dialogue';
import { ChunkRecuperado, RetrievalService } from '../retrieval/retrieval.service';
import { CitacaoPersistida, SugestaoRecusa } from './dialogue.types';
import { CriarSessaoDto } from './dto/criar-sessao.dto';
import { HistoricoSecaoSaidaDto } from './dto/historico-secao-saida.dto';
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
  /** Item 1.1: só não-vazio quando `chunks` ficou vazio mesmo depois do
   * fallback de busca no livro inteiro — é o que acompanha a recusa. */
  sugestoes: SugestaoRecusa[];
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
   * Item 1.8: histórico da seção, não da sessão — une mensagens de todas as
   * sessões do aluno naquela seção (pode ter mais de uma ao longo do tempo),
   * paginado, em ordem cronológica.
   */
  async historicoDaSecao(
    userId: string,
    sectionId: string,
    pagina: number,
    tamanho: number,
  ): Promise<HistoricoSecaoSaidaDto> {
    const secao = await this.sectionsRepository.findOneBy({ id: sectionId });
    if (!secao) {
      throw new NotFoundException('Seção não encontrada.');
    }

    const sessoes = await this.sessionsRepository.find({ where: { userId, sectionId } });
    const idsSessoes = sessoes.map((s) => s.id);

    if (idsSessoes.length === 0) {
      return { sectionId, tituloSecao: secao.titulo, total: 0, pagina, tamanho, mensagens: [] };
    }

    const [mensagens, total] = await this.messagesRepository.findAndCount({
      where: { sessionId: In(idsSessoes) },
      order: { criadoEm: 'ASC' },
      skip: (pagina - 1) * tamanho,
      take: tamanho,
    });

    return {
      sectionId,
      tituloSecao: secao.titulo,
      total,
      pagina,
      tamanho,
      mensagens: mensagens.map((m) => this.paraMensagemSaida(m)),
    };
  }

  /**
   * Tudo que pode falhar com erro HTTP comum acontece aqui, antes do stream
   * abrir: sessão alheia ou inexistente, e a recuperação. A mensagem do aluno
   * é gravada já aqui, para sobreviver mesmo se a resposta falhar.
   */
  async prepararEnvio(userId: string, sessaoId: string, conteudo: string): Promise<ContextoEnvio> {
    const sessao = await this.buscarDoAluno(userId, sessaoId);
    let chunks = await this.retrievalService.buscar(sessao.sectionId, conteudo);

    // Item 1.1: antes de recusar, repete a busca no livro inteiro (não só na
    // seção aberta) — só como último recurso, quando a busca restrita não
    // achou nada. Se essa segunda busca achar algo, a resposta cita a seção
    // de origem normalmente (via `titulosPorSecao`/`citacoes`), não precisa
    // de tratamento especial daqui em diante.
    if (chunks.length === 0) {
      chunks = await this.retrievalService.buscar(sessao.sectionId, conteudo, {
        ignorarLimiteDeOrdem: true,
      });
    }

    let sugestoes: SugestaoRecusa[] = [];
    if (chunks.length === 0) {
      const secaoAtual = await this.sectionsRepository.findOneByOrFail({ id: sessao.sectionId });
      sugestoes = await this.montarSugestoesRecusa(secaoAtual);
    }

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
      sugestoes,
    };
  }

  /** Item 1.1: sempre sugere procurar em outras seções e deduzir pelo
   * contexto; sugere abrir o glossário só se o livro tiver uma seção cujo
   * título indique isso — nenhuma outra heurística de "seção de glossário"
   * existe no catálogo hoje, então é só correspondência de título. */
  private async montarSugestoesRecusa(secaoAtual: Section): Promise<SugestaoRecusa[]> {
    const secoesDoLivro = await this.sectionsRepository.find({
      where: { bookId: secaoAtual.bookId },
      order: { ordem: 'ASC' },
    });
    const secaoGlossario = secoesDoLivro.find((s) => /gloss[áa]rio/i.test(s.titulo));

    const sugestoes: SugestaoRecusa[] = [
      {
        tipo: 'buscar_outras_secoes',
        descricao: 'Procure esse assunto em outras seções do livro — ele pode estar tratado em outro capítulo.',
      },
    ];
    if (secaoGlossario) {
      sugestoes.push({
        tipo: 'abrir_glossario',
        descricao: 'Consulte o glossário do livro.',
        sectionId: secaoGlossario.id,
      });
    }
    sugestoes.push({
      tipo: 'inferir_pelo_contexto',
      descricao: 'Tente deduzir pelo que já leu até aqui e volte a perguntar se não conseguir.',
    });
    return sugestoes;
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
        citacoes: [],
        sugestoes: contexto.sugestoes,
        encontrouBase: false,
      });
      escritor.token(RECUSA_SEM_BASE);
      escritor.fim(mensagem.id, false, contexto.sugestoes);
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

    const citacoesPersistidas: CitacaoPersistida[] = [];
    for (const chunkId of chunksCitados) {
      const chunk = contexto.chunks.find((c) => c.chunkId === chunkId)!;
      const citacao: CitacaoPersistida = {
        chunkId,
        sectionId: chunk.sectionId,
        trecho: chunk.texto.slice(0, TAMANHO_TRECHO_CITADO),
        ancoraCfi: chunk.ancoraCfi,
        secaoTitulo: contexto.titulosPorSecao.get(chunk.sectionId) ?? '',
      };
      citacoesPersistidas.push(citacao);
      escritor.citacao(citacao);
    }

    const mensagem = await this.salvarMensagemTutora(sessaoId, resultado.texto, {
      chunksCitados,
      citacoes: citacoesPersistidas,
      sugestoes: [],
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
    dados: Partial<Message> & {
      chunksCitados: string[];
      citacoes: CitacaoPersistida[];
      sugestoes: SugestaoRecusa[];
      encontrouBase: boolean;
    },
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
      citacoes: mensagem.citacoes ?? [],
      encontrouBase: mensagem.encontrouBase ?? null,
      criadoEm: mensagem.criadoEm,
    };
  }
}
