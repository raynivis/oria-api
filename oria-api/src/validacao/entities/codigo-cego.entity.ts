import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Saida } from './saida.entity';

/** Produzido por `cegar.ts`: o `codigo` (ex.: "A17") é tudo que o avaliador vê. */
@Entity('validacao_codigos_cegos')
export class CodigoCego {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @OneToOne(() => Saida, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saidaId' })
  saida?: Saida;

  @Column('uuid', { unique: true })
  saidaId: string;

  @Column({ unique: true })
  codigo: string;

  @Column('boolean', { default: false })
  revelado: boolean;
}
