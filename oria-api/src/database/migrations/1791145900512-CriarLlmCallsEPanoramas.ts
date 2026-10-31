import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarLlmCallsEPanoramas1791145900512
  implements MigrationInterface
{
  name = 'CriarLlmCallsEPanoramas1791145900512';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "panoramas" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "sectionId" uuid NOT NULL, "niveis" jsonb NOT NULL, "tempoEstimadoMin" integer NOT NULL, "promptVersao" integer NOT NULL, "modelo" character varying NOT NULL, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_85ea88bd14242bce2cadf1920f0" UNIQUE ("sectionId"), CONSTRAINT "PK_ab78a7ca734fbce3d543e5a847f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "llm_calls" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "papel" character varying NOT NULL, "modelo" character varying NOT NULL, "promptVersao" integer NOT NULL, "entradaCompleta" text NOT NULL, "saidaBruta" text NOT NULL, "temperatura" numeric, "seed" integer, "provider" character varying, "tokensIn" integer NOT NULL, "tokensOut" integer NOT NULL, "custo" numeric NOT NULL, "duracaoMs" integer NOT NULL, "sucesso" boolean NOT NULL, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_927dd9d5a428274e38a05706af8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "panoramas" ADD CONSTRAINT "FK_panoramas_section" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "panoramas" DROP CONSTRAINT "FK_panoramas_section"`,
    );
    await queryRunner.query(`DROP TABLE "llm_calls"`);
    await queryRunner.query(`DROP TABLE "panoramas"`);
  }
}
