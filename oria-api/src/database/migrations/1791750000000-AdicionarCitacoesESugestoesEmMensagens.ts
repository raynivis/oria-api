import { MigrationInterface, QueryRunner } from 'typeorm';

/** Itens 1.1/1.11 (correção de usabilidade): sugestões acionáveis na recusa
 * e citações com seção de origem + posição, aditivas a `chunksCitados`. */
export class AdicionarCitacoesESugestoesEmMensagens1791750000000 implements MigrationInterface {
  name = 'AdicionarCitacoesESugestoesEmMensagens1791750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "messages" ADD COLUMN "citacoes" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD COLUMN "sugestoes" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "sugestoes"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "citacoes"`);
  }
}
