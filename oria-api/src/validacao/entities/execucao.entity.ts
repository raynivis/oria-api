import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/**
 * Uma rodada da bateria (ou a calibração, com `rotulo: 'calibracao'` —
 * VALIDATION.md §9 — que não entra nas 60 saídas da Avaliação A).
 */
@Entity('validacao_execucoes')
export class Execucao {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  rotulo: string;

  /** Capturado por `git rev-parse HEAD` no momento da geração, nunca digitado à mão. */
  @Column()
  gitSha: string;

  @Column()
  modelo: string;

  @Column()
  provider: string;

  @Column('int')
  seed: number;

  @Column('numeric')
  temperatura: number;

  @CreateDateColumn({ name: 'iniciadaEm' })
  iniciadaEm: Date;

  @Column({ type: 'timestamptz', nullable: true })
  encerradaEm?: Date | null;
}
