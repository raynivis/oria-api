import { MigrationInterface, QueryRunner } from 'typeorm';

export class ArquivoPathUnico1791142015178 implements MigrationInterface {
  name = 'ArquivoPathUnico1791142015178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "books" ADD CONSTRAINT "UQ_ee88da7d7c08d9d0474bb6f71c7" UNIQUE ("arquivoPath")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "books" DROP CONSTRAINT "UQ_ee88da7d7c08d9d0474bb6f71c7"`,
    );
  }
}
