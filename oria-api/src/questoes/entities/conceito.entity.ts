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

@Entity('conceitos')
@Index(['sectionId'])
export class Conceito {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => Section, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sectionId' })
  secao?: Section;

  @Column('uuid')
  sectionId: string;

  @Column()
  nome: string;

  @Column()
  descricaoCurta: string;

  @CreateDateColumn()
  criadoEm: Date;
}
