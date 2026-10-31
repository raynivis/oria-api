import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

export interface NivelPanorama {
  rotulo: string;
  titulo: string;
  texto: string;
}

@Entity('panoramas')
export class Panorama {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column('uuid', { unique: true })
  sectionId: string;

  @Column('jsonb')
  niveis: NivelPanorama[];

  @Column()
  tempoEstimadoMin: number;

  @Column()
  promptVersao: number;

  @Column()
  modelo: string;

  @CreateDateColumn()
  criadoEm: Date;
}
