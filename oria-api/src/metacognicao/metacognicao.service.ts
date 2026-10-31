import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Section } from '../catalog/entities/section.entity';
import { RegistrarMetacognicaoDto } from './dto/registrar-metacognicao.dto';
import { MetacognicaoSaidaDto } from './dto/metacognicao-saida.dto';
import { Metacognicao } from './entities/metacognicao.entity';
import { montarObservacao, sinalizaIlusao } from './ilusao-conhecimento';

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

    return this.paraSaida(metacognicao, secao.titulo);
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
    return registros.map((r) => this.paraSaida(r, secao.titulo));
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
    return registros.map((r) => this.paraSaida(r, titulos.get(r.sectionId) ?? ''));
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

  private paraSaida(metacognicao: Metacognicao, tituloSecao: string): MetacognicaoSaidaDto {
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
    };
  }
}
