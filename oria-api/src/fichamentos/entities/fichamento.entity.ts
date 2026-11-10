import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Section } from '../../catalog/entities/section.entity';
import { FichamentoVersao } from './fichamento-versao.entity';

export type StatusGeracaoFichamento = 'pendente' | 'pronto' | 'erro';

/**
 * `trechoCfi` nulo = fichamento da seção inteira. Não nulo = ficha ancorada
 * num recorte (SCENARIOS.md, divergência 4). A unicidade do caso nulo é
 * garantida por um índice parcial na migration, não dá pra expressar aqui:
 * `UNIQUE (userId, sectionId, trechoCfi)` do Postgres trata NULL como valores
 * distintos entre si, então essa constraint sozinha não barraria dois
 * fichamentos de seção inteira para o mesmo aluno.
 */
@Entity('fichamentos')
@Index(['userId', 'sectionId'])
export class Fichamento {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  sectionId: string;

  /** Item 2.4 (correção de usabilidade): a `@ManyToOne` é só para carregar
   * título da seção/livro sem um segundo `findOne` manual — a FK já existia
   * no banco desde a migração original, não precisou de uma nova. */
  @ManyToOne(() => Section)
  @JoinColumn({ name: 'sectionId' })
  secao?: Section;

  @Column('text', { nullable: true })
  trechoCfi?: string | null;

  /** Item 2.4: o trecho original selecionado pelo aluno, antes só usado para
   * montar o prompt e descartado — agora persistido para a ficha carregar
   * procedência completa. Nulo quando a ficha é da seção inteira. */
  @Column('text', { nullable: true })
  trechoTexto?: string | null;

  /** Item 2.5: `'pronto'` por padrão para toda ficha já existente/gerada
   * sincronamente — só fica `'pendente'`/`'erro'` no fluxo assíncrono novo. */
  @Column({ type: 'varchar', default: 'pronto' })
  statusGeracao: StatusGeracaoFichamento;

  @Column('text', { nullable: true })
  erroMensagem?: string | null;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  @OneToMany(() => FichamentoVersao, (versao) => versao.fichamento)
  versoes?: FichamentoVersao[];
}
