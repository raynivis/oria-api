import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Section } from '../../catalog/entities/section.entity';
import { User } from '../../users/entities/user.entity';

@Entity('metacognicoes')
@Index(['userId', 'sectionId'])
export class Metacognicao {
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

  @Column('text')
  oQueAprendi: string;

  @Column('text')
  oQueDuvido: string;

  @Column('int')
  confianca: number;

  /** Texto fixo, montado por template em código — nunca por LLM (regra da Fase 9). */
  @Column('text', { nullable: true })
  observacaoIa?: string | null;

  /**
   * Decisão gravada no momento do registro. Mudar `METACOG_CONFIANCA_MIN` ou
   * `METACOG_PASSOS_MIN` depois não altera registros já gravados.
   */
  @Column('boolean')
  sinalizouIlusao: boolean;

  @CreateDateColumn({ name: 'criadoEm' })
  criadoEm: Date;
}
