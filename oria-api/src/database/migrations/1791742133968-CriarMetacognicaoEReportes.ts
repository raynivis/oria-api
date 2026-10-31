import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarMetacognicaoEReportes1791742133968 implements MigrationInterface {
  name = 'CriarMetacognicaoEReportes1791742133968';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "metacognicoes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid NOT NULL, "sectionId" uuid NOT NULL, "oQueAprendi" text NOT NULL, "oQueDuvido" text NOT NULL, "confianca" integer NOT NULL, "observacaoIa" text, "sinalizouIlusao" boolean NOT NULL, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_metacognicoes" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_metacognicoes_user_section" ON "metacognicoes" ("userId", "sectionId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "metacognicoes" ADD CONSTRAINT "FK_metacognicoes_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "metacognicoes" ADD CONSTRAINT "FK_metacognicoes_section" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "error_reports" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid NOT NULL, "alvoTipo" character varying NOT NULL, "alvoId" uuid NOT NULL, "descricao" text NOT NULL, "status" character varying NOT NULL DEFAULT 'aberto', "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_error_reports" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "error_reports" ADD CONSTRAINT "FK_error_reports_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "error_reports"`);
    await queryRunner.query(`DROP TABLE "metacognicoes"`);
  }
}
