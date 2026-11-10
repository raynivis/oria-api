import { MigrationInterface, QueryRunner } from 'typeorm';

/** Item 2.5 (correção de usabilidade): geração assíncrona via fila — todo
 * fichamento existente/gerado sincronamente já nasce `'pronto'`. */
export class AdicionarStatusGeracaoEmFichamentos1791750200000 implements MigrationInterface {
  name = 'AdicionarStatusGeracaoEmFichamentos1791750200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "fichamentos" ADD COLUMN "statusGeracao" character varying NOT NULL DEFAULT 'pronto'`,
    );
    await queryRunner.query(`ALTER TABLE "fichamentos" ADD COLUMN "erroMensagem" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "fichamentos" DROP COLUMN "erroMensagem"`);
    await queryRunner.query(`ALTER TABLE "fichamentos" DROP COLUMN "statusGeracao"`);
  }
}
