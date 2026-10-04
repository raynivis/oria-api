import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Section } from './section.entity';

export type BookStatus = 'pendente' | 'processando' | 'pronto' | 'erro';

@Entity('books')
export class Book {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  titulo: string;

  @Column()
  autor: string;

  @Column({ unique: true })
  arquivoPath: string;

  @Column({ nullable: true })
  isbn?: string;

  @Column({ type: 'varchar', default: 'pendente' })
  status: BookStatus;

  @Column({ nullable: true })
  erroMensagem?: string;

  @CreateDateColumn()
  criadoEm: Date;

  @OneToMany(() => Section, (secao) => secao.livro)
  secoes: Section[];
}
