import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Fichamento } from './fichamento.entity';

export type OrigemFichamentoVersao = 'ia' | 'aluno';

@Entity('fichamento_versoes')
@Index(['fichamentoId', 'numero'], { unique: true })
export class FichamentoVersao {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => Fichamento, (fichamento) => fichamento.versoes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fichamentoId' })
  fichamento?: Fichamento;

  @Column('uuid')
  fichamentoId: string;

  @Column()
  numero: number;

  @Column('text')
  conteudo: string;

  @Column({ type: 'varchar' })
  origem: OrigemFichamentoVersao;

  /** Ausente quando `origem = 'aluno'`: não houve chamada de LLM nessa versão. */
  @Column({ nullable: true })
  promptVersao?: number;

  @Column({ nullable: true })
  modelo?: string;

  @CreateDateColumn()
  criadoEm: Date;
}
