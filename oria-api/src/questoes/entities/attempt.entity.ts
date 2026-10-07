import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Question } from './question.entity';
import { AttemptStep } from './attempt-step.entity';

export type EstadoTentativa = 'aberta' | 'em_passos' | 'resolvida' | 'abandonada';

@Entity('attempts')
@Index(['userId', 'questionId'])
export class Attempt {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  questao?: Question;

  @Column('uuid')
  questionId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  usuario?: User;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar' })
  estado: EstadoTentativa;

  /** Dicas entregues pelo sistema, mantido pelo servidor. Nunca vem do cliente. */
  @Column('int', { default: 0 })
  nPassos: number;

  @Column('text')
  respostaInicial: string;

  @CreateDateColumn({ name: 'criadaEm' })
  criadaEm: Date;

  @Column({ type: 'timestamptz', nullable: true })
  encerradaEm?: Date | null;

  @OneToMany(() => AttemptStep, (passo) => passo.tentativa)
  passos?: AttemptStep[];
}
