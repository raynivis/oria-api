import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { TipoTarefa } from '../tipos';

/**
 * O gabarito da Avaliação A, escrito à mão em YAML e populado por
 * `preparar-tarefas.ts`. `codigo` (ex.: "S1-P1") é a chave natural e idempotente.
 */
@Entity('validacao_tarefas')
@Index(['codigo'], { unique: true })
export class Tarefa {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  codigo: string;

  @Column('uuid')
  sectionId: string;

  @Column({ type: 'varchar' })
  tipo: TipoTarefa;

  @Column('text')
  enunciado: string;

  @Column('text', { nullable: true })
  gabarito?: string | null;
}
