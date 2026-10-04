import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarFichamentos1791147341508 implements MigrationInterface {
  name = 'CriarFichamentos1791147341508';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "fichamentos" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid NOT NULL, "sectionId" uuid NOT NULL, "trechoCfi" text, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), "atualizadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fichamentos_user_section_trecho" UNIQUE ("userId", "sectionId", "trechoCfi"), CONSTRAINT "PK_fichamentos" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fichamentos_user_section" ON "fichamentos" ("userId", "sectionId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_fichamentos_secao_inteira" ON "fichamentos" ("userId", "sectionId") WHERE "trechoCfi" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fichamentos" ADD CONSTRAINT "FK_fichamentos_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fichamentos" ADD CONSTRAINT "FK_fichamentos_section" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "fichamento_versoes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "fichamentoId" uuid NOT NULL, "numero" integer NOT NULL, "conteudo" text NOT NULL, "origem" character varying NOT NULL, "promptVersao" integer, "modelo" character varying, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fichamento_versoes" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_fichamento_versoes_fichamento_numero" ON "fichamento_versoes" ("fichamentoId", "numero")`,
    );
    await queryRunner.query(
      `ALTER TABLE "fichamento_versoes" ADD CONSTRAINT "FK_fichamento_versoes_fichamento" FOREIGN KEY ("fichamentoId") REFERENCES "fichamentos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "fichamento_versoes" DROP CONSTRAINT "FK_fichamento_versoes_fichamento"`,
    );
    await queryRunner.query(`DROP TABLE "fichamento_versoes"`);
    await queryRunner.query(
      `ALTER TABLE "fichamentos" DROP CONSTRAINT "FK_fichamentos_section"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fichamentos" DROP CONSTRAINT "FK_fichamentos_user"`,
    );
    await queryRunner.query(`DROP TABLE "fichamentos"`);
  }
}
