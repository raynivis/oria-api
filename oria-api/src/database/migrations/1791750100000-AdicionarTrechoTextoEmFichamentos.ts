import { MigrationInterface, QueryRunner } from 'typeorm';

/** Item 2.4 (correção de usabilidade): persiste o trecho original que antes
 * só era usado para montar o prompt e descartado. */
export class AdicionarTrechoTextoEmFichamentos1791750100000 implements MigrationInterface {
  name = 'AdicionarTrechoTextoEmFichamentos1791750100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "fichamentos" ADD COLUMN "trechoTexto" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "fichamentos" DROP COLUMN "trechoTexto"`);
  }
}
