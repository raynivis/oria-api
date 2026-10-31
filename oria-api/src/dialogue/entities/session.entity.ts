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
import { Section } from '../../catalog/entities/section.entity';
import { User } from '../../users/entities/user.entity';
import { Message } from './message.entity';

/** Nasce presa a uma seção: não existe chat global (IMPLEMENTATION.md, Fase 8). */
@Entity('sessions')
@Index(['userId', 'sectionId'])
export class Session {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  usuario?: User;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => Section, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sectionId' })
  secao?: Section;

  @Column('uuid')
  sectionId: string;

  @CreateDateColumn({ name: 'criadaEm' })
  criadaEm: Date;

  @Column({ type: 'timestamptz', nullable: true })
  encerradaEm?: Date | null;

  @OneToMany(() => Message, (mensagem) => mensagem.sessao)
  mensagens?: Message[];
}
