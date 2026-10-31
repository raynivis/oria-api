import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FichamentoVersao } from './fichamento-versao.entity';

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

  @Column('text', { nullable: true })
  trechoCfi?: string | null;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  @OneToMany(() => FichamentoVersao, (versao) => versao.fichamento)
  versoes?: FichamentoVersao[];
}
