import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Section } from '../catalog/entities/section.entity';
import { LlmService } from '../llm/llm.service';
import { schemaConceitos } from '../prompts/templates/concepts';
import {
  ClassificacaoConceitosDto,
  ConceitoClassificadoDto,
  ConceitoSaidaDto,
} from './dto/conceitos-saida.dto';
import { Conceito } from './entities/conceito.entity';

/**
 * Abaixo deste tamanho a seção não tem texto próprio suficiente para extrair
 * conceitos com sentido. O papel `concepts` não é chamado e a seção é marcada
 * como extraída sem conceitos, senão o schema (mínimo de 1) faria a chamada falhar.
 */
const TAMANHO_MINIMO_PARA_CONCEITOS = 40;

interface LinhaClassificacao {
  conceitoId: string;
  nome: string;
  sectionId: string;
  tituloSecao: string;
  aRevisar: boolean;
}

/**
 * A extração roda sob demanda na primeira leitura da seção, não na ingestão:
 * ingestão que depende de LLM externo faria o livro cair em `erro` por queda
 * de rede e tornaria os e2e de ingestão não determinísticos. O resultado é
 * cacheado por seção, como o panorama.
 */
@Injectable()
export class ConceitosService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Conceito)
    private readonly conceitosRepository: Repository<Conceito>,
    private readonly llmService: LlmService,
  ) {}

  async listarDaSecao(sectionId: string): Promise<ConceitoSaidaDto[]> {
    await this.garantirExtraidos(sectionId);
    const conceitos = await this.conceitosRepository.find({
      where: { sectionId },
      order: { nome: 'ASC' },
    });
    return conceitos.map((c) => ({
      id: c.id,
      nome: c.nome,
      descricaoCurta: c.descricaoCurta,
    }));
  }

  /**
   * Dominado: todas as tentativas encerradas do conceito foram resolvidas com
   * 0 ou 1 passo. A revisar: alguma tentativa com 2 ou 3 passos, ou com
   * desistência. Conceito sem tentativa encerrada não aparece.
   */
  async classificarDoAluno(userId: string): Promise<ClassificacaoConceitosDto> {
    const linhas: LinhaClassificacao[] = await this.dataSource.query(
      `SELECT c.id AS "conceitoId",
              c.nome,
              c."sectionId",
              s.titulo AS "tituloSecao",
              BOOL_OR(t.estado = 'abandonada' OR t."nPassos" >= 2) AS "aRevisar"
         FROM attempts t
         JOIN questions q ON q.id = t."questionId"
         JOIN question_conceitos qc ON qc."questionId" = q.id
         JOIN conceitos c ON c.id = qc."conceitoId"
         JOIN sections s ON s.id = c."sectionId"
        WHERE t."userId" = $1
          AND t.estado IN ('resolvida', 'abandonada')
        GROUP BY c.id, c.nome, c."sectionId", s.titulo`,
      [userId],
    );

    const paraDto = (linha: LinhaClassificacao): ConceitoClassificadoDto => ({
      conceitoId: linha.conceitoId,
      nome: linha.nome,
      sectionId: linha.sectionId,
      tituloSecao: linha.tituloSecao,
    });

    return {
      dominados: linhas.filter((l) => !l.aRevisar).map(paraDto),
      aRevisar: linhas.filter((l) => l.aRevisar).map(paraDto),
    };
  }

  /** Lock na seção evita que duas leituras simultâneas extraiam conceitos duplicados. */
  async garantirExtraidos(sectionId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const secao = await manager.findOne(Section, {
        where: { id: sectionId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!secao) {
        throw new NotFoundException('Seção não encontrada.');
      }
      if (secao.conceitosExtraidosEm) {
        return;
      }

      const extraidos =
        secao.textoCompleto.trim().length >= TAMANHO_MINIMO_PARA_CONCEITOS
          ? (
              await this.llmService.completar(
                'concepts',
                { tituloSecao: secao.titulo, texto: secao.textoCompleto },
                schemaConceitos,
              )
            ).conceitos
          : [];

      if (extraidos.length > 0) {
        await manager.insert(
          Conceito,
          extraidos.map((conceito) => ({
            sectionId,
            nome: conceito.nome,
            descricaoCurta: conceito.descricaoCurta,
          })),
        );
      }

      await manager.update(Section, { id: sectionId }, {
        conceitosExtraidosEm: new Date(),
      });
    });
  }
}
