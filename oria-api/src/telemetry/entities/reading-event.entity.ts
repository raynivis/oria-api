import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { TipoEvento } from '../tipos-evento';

/**
 * `criadoEm` é o instante em que o evento aconteceu no cliente, não o do
 * recebimento: é ele que entra na chave de idempotência (ver migration).
 */
@Entity('reading_events')
@Index(
  ['userId', 'tipo', 'sectionId', 'criadoEm'],
  { unique: true },
)
export class ReadingEvent {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid', { nullable: true })
  sectionId?: string | null;

  @Column({ type: 'varchar' })
  tipo: TipoEvento;

  @Column('jsonb', { nullable: true })
  payload?: object | null;

  @Column({ type: 'timestamptz' })
  criadoEm: Date;
}
