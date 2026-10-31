import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('llm_calls')
export class LlmCall {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  papel: string;

  @Column()
  modelo: string;

  @Column()
  promptVersao: number;

  /** Prompt como foi enviado — fonte primária da validação do TCC (VALIDATION.md). */
  @Column('text')
  entradaCompleta: string;

  /** Resposta como veio do modelo, antes de qualquer parsing. */
  @Column('text')
  saidaBruta: string;

  @Column('numeric', { nullable: true })
  temperatura?: number;

  @Column({ nullable: true })
  seed?: number;

  @Column({ nullable: true })
  provider?: string;

  @Column()
  tokensIn: number;

  @Column()
  tokensOut: number;

  @Column('numeric')
  custo: number;

  @Column()
  duracaoMs: number;

  @Column()
  sucesso: boolean;

  @CreateDateColumn()
  criadoEm: Date;
}
