import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Section } from './section.entity';

@Entity('chunks')
export class Chunk {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => Section, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sectionId' })
  secao: Section;

  @Column()
  sectionId: string;

  @Column()
  ordem: number;

  @Column('text')
  texto: string;

  /**
   * Vetor pgvector, `vector(768)` na coluna de verdade (ver migration). O
   * TypeORM não conhece o tipo nativamente, então mapeamos como string no
   * formato textual do pgvector (`"[0.01,-0.02,...]"`) e nunca o lemos de
   * volta como array em código — a busca por similaridade (Fase 3) roda em
   * SQL cru com os operadores do pgvector.
   */
  @Column({ type: 'vector' as 'text', length: 768 })
  embedding: string;

  @Column()
  ancoraCfi: string;

  @Column()
  tokens: number;
}
