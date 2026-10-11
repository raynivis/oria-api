import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import type { Avaliador } from '../tipos';
import { Saida } from './saida.entity';

/** `avaliador: 'consenso'` é a nota que entra nos resultados; as duas individuais alimentam o kappa. */
@Entity('validacao_pontuacoes')
@Index(['saidaId', 'avaliador'], { unique: true })
export class Pontuacao {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => Saida, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saidaId' })
  saida?: Saida;

  @Column('uuid')
  saidaId: string;

  @Column({ type: 'varchar' })
  avaliador: Avaliador;

  @Column('int')
  c1: number;

  @Column('int')
  c2: number;

  @Column('int')
  c3: number;

  @Column('int')
  c4: number;

  @Column('int', { nullable: true })
  nivelBloom?: number | null;

  @Column('text', { nullable: true })
  observacao?: string | null;

  @CreateDateColumn({ name: 'criadoEm' })
  criadoEm: Date;
}
