import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Book } from './book.entity';

@Entity('sections')
@Index(['livro', 'ordem'])
export class Section {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => Book, (livro) => livro.secoes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  livro: Book;

  @Column()
  bookId: string;

  @ManyToOne(() => Section, (secao) => secao.filhas, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId' })
  pai?: Section;

  @Column({ nullable: true })
  parentId?: string;

  @OneToMany(() => Section, (secao) => secao.pai)
  filhas?: Section[];

  @Column()
  ordem: number;

  @Column()
  titulo: string;

  @Column()
  nivel: number;

  @Column()
  href: string;

  @Column('text')
  textoCompleto: string;
}
