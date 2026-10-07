import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Attempt } from './attempt.entity';

export type TipoPasso =
  | 'pedido_justificativa'
  | 'dica_conceitual'
  | 'dica_localizada'
  | 'justificativa_aluno'
  | 'resolucao';

@Entity('attempt_steps')
@Index(['attemptId', 'numero'], { unique: true })
export class AttemptStep {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => Attempt, (tentativa) => tentativa.passos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attemptId' })
  tentativa?: Attempt;

  @Column('uuid')
  attemptId: string;

  @Column()
  numero: number;

  @Column({ type: 'varchar' })
  tipo: TipoPasso;

  @Column('text')
  conteudo: string;

  /**
   * Veredito do juiz interno (papel `avaliacao`), só nos passos
   * `justificativa_aluno`. Nunca sai na API: serve para decidir o fluxo e para
   * a classificação de conceitos.
   */
  @Column({ type: 'boolean', nullable: true })
  avaliacaoSuficiente?: boolean | null;

  @CreateDateColumn({ name: 'criadoEm' })
  criadoEm: Date;
}
