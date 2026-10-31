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
import { Question } from './question.entity';

@Entity('question_sets')
@Index(['userId', 'sectionId'])
export class QuestionSet {
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

  @Column()
  promptVersao: number;

  @Column()
  modelo: string;

  @CreateDateColumn()
  criadoEm: Date;

  @OneToMany(() => Question, (questao) => questao.conjunto)
  questoes?: Question[];
}
