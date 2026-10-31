import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Session } from './session.entity';

export type PapelMensagem = 'aluno' | 'tutora';

@Entity('messages')
@Index(['sessionId', 'criadoEm'])
export class Message {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => Session, (sessao) => sessao.mensagens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  sessao?: Session;

  @Column('uuid')
  sessionId: string;

  @Column({ type: 'varchar' })
  papel: PapelMensagem;

  @Column('text')
  conteudo: string;

  @Column('uuid', { array: true, default: () => "'{}'" })
  chunksCitados: string[];

  /** Só preenchido nas mensagens da tutora: a mensagem do aluno não passa pela recuperação. */
  @Column({ type: 'boolean', nullable: true })
  encontrouBase?: boolean | null;

  @Column({ type: 'int', nullable: true })
  promptVersao?: number | null;

  @Column({ type: 'varchar', nullable: true })
  modelo?: string | null;

  @Column({ type: 'int', nullable: true })
  tokensIn?: number | null;

  @Column({ type: 'int', nullable: true })
  tokensOut?: number | null;

  @Column({ type: 'numeric', nullable: true })
  custo?: number | null;

  @CreateDateColumn({ name: 'criadoEm' })
  criadoEm: Date;
}
