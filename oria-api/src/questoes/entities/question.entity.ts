import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Conceito } from './conceito.entity';
import { QuestionSet } from './question-set.entity';

@Entity('questions')
@Index(['setId', 'ordem'])
export class Question {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => QuestionSet, (conjunto) => conjunto.questoes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'setId' })
  conjunto?: QuestionSet;

  @Column('uuid')
  setId: string;

  @Column('text')
  enunciado: string;

  /** Nunca sai na API durante as tentativas: só aparece na resolução. */
  @Column('text')
  respostaReferencia: string;

  @Column('uuid', { array: true, default: () => "'{}'" })
  chunksFonte: string[];

  @Column()
  ordem: number;

  @ManyToMany(() => Conceito)
  @JoinTable({
    name: 'question_conceitos',
    joinColumn: { name: 'questionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'conceitoId', referencedColumnName: 'id' },
  })
  conceitos?: Conceito[];
}
