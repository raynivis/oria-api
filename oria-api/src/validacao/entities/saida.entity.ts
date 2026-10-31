import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import type { Condicao } from '../tipos';
import { Execucao } from './execucao.entity';
import { Tarefa } from './tarefa.entity';

/**
 * Um par (tarefa, condição) gerado numa execução. `entradaCompleta`/`saidaBruta`
 * são a fonte do Apêndice A — independentes de `LlmCall`, que também grava a
 * chamada (regra 5 do CLAUDE.md), mas não carrega `condicao`/`tarefaId`.
 */
@Entity('validacao_saidas')
@Index(['execucaoId', 'tarefaId', 'condicao'], { unique: true })
export class Saida {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => Execucao, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'execucaoId' })
  execucao?: Execucao;

  @Column('uuid')
  execucaoId: string;

  @ManyToOne(() => Tarefa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tarefaId' })
  tarefa?: Tarefa;

  @Column('uuid')
  tarefaId: string;

  @Column({ type: 'varchar' })
  condicao: Condicao;

  @Column('text')
  entradaCompleta: string;

  @Column('text')
  saidaBruta: string;

  @Column('int', { nullable: true })
  promptVersao?: number | null;

  @Column()
  modelo: string;

  @Column('int')
  tokensIn: number;

  @Column('int')
  tokensOut: number;

  @Column('numeric')
  custo: number;

  @Column('int')
  duracaoMs: number;

  /** Falsa quando a chamada falhou mesmo após a retentativa do script — fica registrado, não derruba a bateria. */
  @Column('boolean', { default: true })
  sucesso: boolean;

  @CreateDateColumn({ name: 'criadoEm' })
  criadoEm: Date;
}
