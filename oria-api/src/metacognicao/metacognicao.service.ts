import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Section } from '../catalog/entities/section.entity';
import { RegistrarMetacognicaoDto } from './dto/registrar-metacognicao.dto';
import { MetacognicaoSaidaDto } from './dto/metacognicao-saida.dto';
import { Metacognicao } from './entities/metacognicao.entity';
import { montarObservacao, sinalizaIlusao } from './ilusao-conhecimento';

interface SituacaoDeQuestoes {
  temDados: boolean;
  questoesFaltando: number;
}

@Injectable()
export class MetacognicaoService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Metacognicao)
    private readonly metacognicoesRepository: Repository<Metacognicao>,
    @InjectRepository(Section)
    private readonly sectionsRepository: Repository<Section>,
    private readonly configService: ConfigService,
  ) {}

  async registrar(
    userId: string,
    sectionId: string,
    dto: RegistrarMetacognicaoDto,
  ): Promise<MetacognicaoSaidaDto> {
    const secao = await this.sectionsRepository.findOneBy({ id: sectionId });
    if (!secao) {
      throw new NotFoundException('Seção não encontrada.');
    }

    const mediaPassos = await this.mediaPassosDaSecao(userId, sectionId);
    const confiancaMin = this.configService.get<number>('METACOG_CONFIANCA_MIN')!;
    const passosMin = this.configService.get<number>('METACOG_PASSOS_MIN')!;
    const sinalizou = sinalizaIlusao(dto.confianca, mediaPassos, confiancaMin, passosMin);

    const metacognicao = await this.metacognicoesRepository.save(
      this.metacognicoesRepository.create({
        userId,
        sectionId,
        oQueAprendi: dto.oQueAprendi,
        oQueDuvido: dto.oQueDuvido,
        confianca: dto.confianca,
        sinalizouIlusao: sinalizou,
        observacaoIa: sinalizou
          ? montarObservacao(dto.confianca, mediaPassos, secao.titulo)
          : null,
      }),
    );

    const situacao = await this.situacaoDeQuestoesDaSecao(userId, sectionId);
    return this.paraSaida(metacognicao, secao.titulo, situacao);
  }

  async listarDaSecao(userId: string, sectionId: string): Promise<MetacognicaoSaidaDto[]> {
    const secao = await this.sectionsRepository.findOneBy({ id: sectionId });
    if (!secao) {
      throw new NotFoundException('Seção não encontrada.');
    }
    const registros = await this.metacognicoesRepository.find({
      where: { userId, sectionId },
      order: { criadoEm: 'DESC' },
    });
    const situacao = await this.situacaoDeQuestoesDaSecao(userId, sectionId);
    return registros.map((r) => this.paraSaida(r, secao.titulo, situacao));
  }

  async listarMinhas(userId: string): Promise<MetacognicaoSaidaDto[]> {
    const registros = await this.metacognicoesRepository.find({
      where: { userId },
      order: { criadoEm: 'DESC' },
    });
    if (registros.length === 0) {
      return [];
    }
    const secoes = await this.sectionsRepository.findBy({
      id: In(registros.map((r) => r.sectionId)),
    });
    const titulos = new Map(secoes.map((s) => [s.id, s.titulo]));

    const situacoesPorSecao = new Map<string, SituacaoDeQuestoes>();
    for (const sectionId of new Set(registros.map((r) => r.sectionId))) {
      situacoesPorSecao.set(sectionId, await this.situacaoDeQuestoesDaSecao(userId, sectionId));
    }

    return registros.map((r) =>
      this.paraSaida(r, titulos.get(r.sectionId) ?? '', situacoesPorSecao.get(r.sectionId)!),
    );
  }

  /**
   * Média de passos nas tentativas encerradas (resolvida ou abandonada) das
   * questões da seção. Tentativa em andamento não entra: o passo ainda pode
   * mudar. Sem tentativa encerrada, a média é 0 — não há ilusão a detectar.
   */
  private async mediaPassosDaSecao(userId: string, sectionId: string): Promise<number> {
    const [linha] = (await this.dataSource.query(
      `SELECT AVG(t."nPassos")::float AS media
         FROM attempts t
         JOIN questions q ON q.id = t."questionId"
         JOIN question_sets qs ON qs.id = q."setId"
        WHERE t."userId" = $1
          AND qs."sectionId" = $2
          AND t.estado IN ('resolvida', 'abandonada')`,
      [userId, sectionId],
    )) as Array<{ media: number | null }>;

    return linha.media ?? 0;
  }

  /**
   * Itens 3.1/3.6: conta total e concluídas só na rodada (QuestionSet) mais
   * recente da seção — uma rodada antiga já superada não deveria contar como
   * "pendente". Sem nenhuma rodada gerada ainda, `temDados` é `false` e
   * `questoesFaltando` é `0` (não há o que faltar, ainda não existe rodada).
   */
  private async situacaoDeQuestoesDaSecao(
    userId: string,
    sectionId: string,
  ): Promise<SituacaoDeQuestoes> {
    const [ultimoSet] = (await this.dataSource.query(
      `SELECT id FROM question_sets
        WHERE "userId" = $1 AND "sectionId" = $2
        ORDER BY "criadoEm" DESC
        LIMIT 1`,
      [userId, sectionId],
    )) as Array<{ id: string }>;

    if (!ultimoSet) {
      return { temDados: false, questoesFaltando: 0 };
    }

    const [contagem] = (await this.dataSource.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (
                WHERE EXISTS (
                  SELECT 1 FROM attempts a
                   WHERE a."questionId" = q.id
                     AND a."userId" = $2
                     AND a.estado IN ('resolvida', 'abandonada')
                )
              )::int AS concluidas
         FROM questions q
        WHERE q."setId" = $1`,
      [ultimoSet.id, userId],
    )) as Array<{ total: number; concluidas: number }>;

    const concluidas = contagem.concluidas;
    return {
      temDados: concluidas > 0,
      questoesFaltando: Math.max(contagem.total - concluidas, 0),
    };
  }

  private paraSaida(
    metacognicao: Metacognicao,
    tituloSecao: string,
    situacao: SituacaoDeQuestoes,
  ): MetacognicaoSaidaDto {
    return {
      id: metacognicao.id,
      sectionId: metacognicao.sectionId,
      tituloSecao,
      oQueAprendi: metacognicao.oQueAprendi,
      oQueDuvido: metacognicao.oQueDuvido,
      confianca: metacognicao.confianca,
      observacaoIa: metacognicao.observacaoIa ?? null,
      sinalizouIlusao: metacognicao.sinalizouIlusao,
      criadoEm: metacognicao.criadoEm,
      semDadosDeComparacao: !situacao.temDados,
      questoesFaltando: situacao.questoesFaltando,
    };
  }
}
