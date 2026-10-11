import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type StatusReporte = 'aberto' | 'analisado' | 'corrigido';

/** Mecanismo de Correção de Erros de Siqueira et al. (2025). Sem painel docente: status muda direto no banco. */
@Entity('error_reports')
export class ErrorReport {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  usuario?: User;

  @Column('uuid')
  userId: string;

  @Column()
  alvoTipo: string;

  @Column('uuid')
  alvoId: string;

  @Column('text')
  descricao: string;

  @Column({ type: 'varchar', default: 'aberto' })
  status: StatusReporte;

  @CreateDateColumn({ name: 'criadoEm' })
  criadoEm: Date;
}
