import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Section } from '../catalog/entities/section.entity';
import { EventoDto } from './dto/registrar-eventos.dto';
import { ProgressoSaidaDto } from './dto/progresso-saida.dto';
import { ReadingEvent } from './entities/reading-event.entity';

@Injectable()
export class TelemetryService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Section)
    private readonly sectionsRepository: Repository<Section>,
  ) {}

  /**
   * Lote inteiro numa transação. `ON CONFLICT DO NOTHING` sobre a chave
   * (userId, tipo, sectionId, criadoEm) — com `criadoEm` truncado ao segundo —
   * faz reenvio do mesmo lote não duplicar nada.
   */
  async registrarLote(
    userId: string,
    eventos: EventoDto[],
  ): Promise<{ recebidos: number; gravados: number }> {
    const secaoIds = [
      ...new Set(eventos.map((e) => e.sectionId).filter((id): id is string => !!id)),
    ];
    if (secaoIds.length > 0) {
      const encontradas = await this.sectionsRepository.count({
        where: { id: In(secaoIds) },
      });
      if (encontradas !== secaoIds.length) {
        throw new BadRequestException('Algum sectionId do lote não existe.');
      }
    }

    const linhas = eventos.map((evento) => ({
      userId,
      sectionId: evento.sectionId ?? null,
      tipo: evento.tipo,
      payload: evento.payload ?? null,
      criadoEm: this.truncarAoSegundo(evento.criadoEm),
    }));

    const gravados = await this.dataSource.transaction(async (manager) => {
      const resultado = await manager
        .createQueryBuilder()
        .insert()
        .into(ReadingEvent)
        .values(linhas)
        .orIgnore()
        .returning('id')
        .execute();
      return resultado.raw.length;
    });

    return { recebidos: eventos.length, gravados };
  }

  async progresso(userId: string): Promise<ProgressoSaidaDto> {
    const [secoes] = (await this.dataSource.query(
      `SELECT COUNT(DISTINCT "sectionId")::int AS n
         FROM reading_events
        WHERE "userId" = $1 AND tipo = 'abriu'`,
      [userId],
    )) as Array<{ n: number }>;

    const [fichamentos] = (await this.dataSource.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (
                WHERE EXISTS (
                  SELECT 1 FROM fichamento_versoes v
                   WHERE v."fichamentoId" = f.id AND v.origem = 'aluno'
                )
              )::int AS "comEdicaoDoAluno"
         FROM fichamentos f
        WHERE f."userId" = $1`,
      [userId],
    )) as Array<{ total: number; comEdicaoDoAluno: number }>;

    return {
      secoesAbertas: secoes.n,
      fichamentos: {
        total: fichamentos.total,
        comEdicaoDoAluno: fichamentos.comEdicaoDoAluno,
      },
    };
  }

  private truncarAoSegundo(isoString: string): Date {
    const data = new Date(isoString);
    data.setMilliseconds(0);
    return data;
  }
}
