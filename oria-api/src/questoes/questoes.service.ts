import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Chunk } from '../catalog/entities/chunk.entity';
import { Section } from '../catalog/entities/section.entity';
import { LlmService } from '../llm/llm.service';
import {
  VERSAO as VERSAO_QUESTOES,
  schemaQuestoes,
} from '../prompts/templates/questions';
import { ConceitosService } from './conceitos.service';
import { ConceitoSaidaDto } from './dto/conceitos-saida.dto';
import { ConjuntoResumoDto } from './dto/conjunto-resumo.dto';
import { ConjuntoSaidaDto } from './dto/conjunto-saida.dto';
import { Attempt } from './entities/attempt.entity';
import { Conceito } from './entities/conceito.entity';
import { QuestionSet } from './entities/question-set.entity';
import { Question } from './entities/question.entity';

const QUANTIDADE_DE_QUESTOES = 5;

@Injectable()
export class QuestoesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly conceitosService: ConceitosService,
    private readonly llmService: LlmService,
    private readonly configService: ConfigService,
    @InjectRepository(Section)
    private readonly sectionsRepository: Repository<Section>,
    @InjectRepository(Chunk)
    private readonly chunksRepository: Repository<Chunk>,
    @InjectRepository(QuestionSet)
    private readonly conjuntosRepository: Repository<QuestionSet>,
    @InjectRepository(Attempt)
    private readonly attemptsRepository: Repository<Attempt>,
  ) {}

  /**
   * Sem `conceitoIds`, usa todos os conceitos da seção. Com eles, restringe a
   * geração a um subconjunto — é o que sustenta "nova rodada sobre os conceitos
   * a revisar" (VALIDATION.md, 8.2). A escolha é de quem chama, não adaptação
   * automática.
   */
  async gerarConjunto(
    userId: string,
    sectionId: string,
    conceitoIds?: string[],
  ): Promise<ConjuntoSaidaDto> {
    const secao = await this.sectionsRepository.findOneBy({ id: sectionId });
    if (!secao) {
      throw new NotFoundException('Seção não encontrada.');
    }

    const todosConceitos = await this.conceitosService.listarDaSecao(sectionId);
    const conceitosSelecionados = conceitoIds?.length
      ? todosConceitos.filter((c) => conceitoIds.includes(c.id))
      : todosConceitos;

    if (conceitoIds?.length && conceitosSelecionados.length !== new Set(conceitoIds).size) {
      throw new BadRequestException('Algum conceitoId não pertence a esta seção.');
    }
    if (conceitosSelecionados.length === 0) {
      throw new BadRequestException(
        'Esta seção não tem conceitos extraídos para gerar questões.',
      );
    }

    const chunks = await this.chunksRepository.find({
      where: { sectionId },
      order: { ordem: 'ASC' },
    });

    const saida = await this.llmService.completar(
      'questions',
      {
        tituloSecao: secao.titulo,
        texto: secao.textoCompleto,
        conceitos: conceitosSelecionados.map((c) => ({
          id: c.id,
          nome: c.nome,
          descricaoCurta: c.descricaoCurta,
        })),
        quantidade: QUANTIDADE_DE_QUESTOES,
      },
      schemaQuestoes,
    );

    const validas = saida.questoes
      .map((questao) => ({
        ...questao,
        conceitoIds: this.resolverConceitoIds(questao.conceitoIds, conceitosSelecionados),
      }))
      .filter((questao) => questao.conceitoIds.length > 0);

    if (validas.length === 0) {
      throw new ServiceUnavailableException(
        'O modelo não produziu questões válidas. Tente gerar de novo.',
      );
    }

    const modelo = this.configService.get<string>('LLM_QUESTIONS_MODEL')!;

    const conjuntoId = await this.dataSource.transaction(async (manager) => {
      const conjunto = await manager.save(
        manager.create(QuestionSet, {
          userId,
          sectionId,
          promptVersao: VERSAO_QUESTOES,
          modelo,
        }),
      );

      const questoes = validas.map((questao, indice) =>
        manager.create(Question, {
          setId: conjunto.id,
          enunciado: questao.enunciado,
          respostaReferencia: questao.respostaReferencia,
          chunksFonte: this.resolverChunks(questao.trechosFonte, chunks),
          ordem: indice,
          conceitos: questao.conceitoIds.map(
            (id) => ({ id }) as Conceito,
          ),
        }),
      );
      await manager.save(questoes);

      return conjunto.id;
    });

    return this.obterConjunto(userId, conjuntoId);
  }

  async obterConjunto(userId: string, id: string): Promise<ConjuntoSaidaDto> {
    const conjunto = await this.conjuntosRepository.findOne({
      where: { id, userId },
      relations: ['questoes', 'questoes.conceitos'],
    });
    if (!conjunto) {
      throw new NotFoundException('Conjunto de questões não encontrado.');
    }

    const questoes = (conjunto.questoes ?? [])
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((questao) => ({
        id: questao.id,
        ordem: questao.ordem,
        enunciado: questao.enunciado,
        conceitos: (questao.conceitos ?? []).map((c) => ({ id: c.id, nome: c.nome })),
      }));

    return {
      id: conjunto.id,
      sectionId: conjunto.sectionId,
      criadoEm: conjunto.criadoEm,
      questoes,
    };
  }

  /**
   * Resolve os ids de conceito que o modelo devolveu contra os conceitos reais
   * da seção. Casamento exato primeiro; se não bater, tenta por prefixo — foi
   * visto na prática um modelo truncar o UUID pro primeiro segmento (ex.:
   * "f7d70af8" em vez do UUID completo). Id que não resolve de nenhuma forma
   * é descartado, não inventado.
   */
  private resolverConceitoIds(
    idsRetornados: string[],
    conceitosDaSecao: ConceitoSaidaDto[],
  ): string[] {
    const porIdExato = new Map(conceitosDaSecao.map((c) => [c.id, c.id]));
    const resolvidos = new Set<string>();

    for (const idRetornado of idsRetornados) {
      const exato = porIdExato.get(idRetornado);
      if (exato) {
        resolvidos.add(exato);
        continue;
      }
      const porPrefixo = conceitosDaSecao.find((c) => c.id.startsWith(idRetornado));
      if (porPrefixo) {
        resolvidos.add(porPrefixo.id);
      }
    }

    return [...resolvidos];
  }

  /**
   * Para a tela "minhas questões": todos os conjuntos do aluno, com o estado
   * de cada questão sem precisar de N chamadas extras. `pendente` é só pra
   * questão sem tentativa nenhuma; o resto reaproveita `EstadoTentativa` —
   * quando há mais de uma tentativa na mesma questão (o aluno tentou de novo
   * depois de abandonar, por exemplo), mostra a mais recente, pelo mesmo
   * critério de "versão atual" que `FichamentosService` usa.
   */
  async listarMeusConjuntos(userId: string, livroId?: string): Promise<ConjuntoResumoDto[]> {
    const conjuntos = await this.conjuntosRepository.find({
      where: { userId },
      relations: ['questoes'],
      order: { criadoEm: 'DESC' },
    });
    if (conjuntos.length === 0) {
      return [];
    }

    const secoes = await this.sectionsRepository.find({
      where: { id: In([...new Set(conjuntos.map((c) => c.sectionId))]) },
      relations: ['livro'],
    });
    const secaoPorId = new Map(secoes.map((s) => [s.id, s]));

    const filtrados = livroId
      ? conjuntos.filter((c) => secaoPorId.get(c.sectionId)?.bookId === livroId)
      : conjuntos;

    const questionIds = filtrados.flatMap((c) => (c.questoes ?? []).map((q) => q.id));
    const tentativas = questionIds.length
      ? await this.attemptsRepository.find({
          where: { userId, questionId: In(questionIds) },
          order: { criadaEm: 'DESC' },
        })
      : [];
    const tentativaMaisRecentePorQuestao = new Map<string, Attempt>();
    for (const tentativa of tentativas) {
      if (!tentativaMaisRecentePorQuestao.has(tentativa.questionId)) {
        tentativaMaisRecentePorQuestao.set(tentativa.questionId, tentativa);
      }
    }

    return filtrados.map((conjunto) => {
      const secao = secaoPorId.get(conjunto.sectionId)!;
      return {
        id: conjunto.id,
        sectionId: conjunto.sectionId,
        tituloSecao: secao.titulo,
        livroId: secao.bookId,
        tituloLivro: secao.livro.titulo,
        criadoEm: conjunto.criadoEm,
        questoes: (conjunto.questoes ?? [])
          .slice()
          .sort((a, b) => a.ordem - b.ordem)
          .map((questao) => {
            const tentativa = tentativaMaisRecentePorQuestao.get(questao.id);
            return {
              id: questao.id,
              enunciado: questao.enunciado,
              tentativaId: tentativa?.id ?? null,
              estado: tentativa?.estado ?? ('pendente' as const),
            };
          }),
      };
    });
  }

  /** Só vincula trecho a chunk se o texto do trecho estiver de fato num chunk da seção. */
  private resolverChunks(trechos: string[], chunks: Chunk[]): string[] {
    const normalizar = (texto: string) => texto.toLowerCase().replace(/\s+/g, ' ').trim();
    const ids = new Set<string>();

    for (const trecho of trechos) {
      const alvo = normalizar(trecho);
      if (alvo.length < 10) {
        continue;
      }
      const encontrado = chunks.find((chunk) => normalizar(chunk.texto).includes(alvo));
      if (encontrado) {
        ids.add(encontrado.id);
      }
    }

    return [...ids];
  }
}
