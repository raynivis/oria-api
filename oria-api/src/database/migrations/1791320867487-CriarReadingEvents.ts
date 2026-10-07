import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarReadingEvents1791320867487 implements MigrationInterface {
  name = 'CriarReadingEvents1791320867487';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "reading_events" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid NOT NULL, "sectionId" uuid, "tipo" character varying NOT NULL, "payload" jsonb, "criadoEm" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_reading_events" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_reading_events_idempotencia" ON "reading_events" ("userId", "tipo", "sectionId", "criadoEm") NULLS NOT DISTINCT`,
    );
    await queryRunner.query(
      `ALTER TABLE "reading_events" ADD CONSTRAINT "FK_reading_events_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reading_events" ADD CONSTRAINT "FK_reading_events_section" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reading_events" DROP CONSTRAINT "FK_reading_events_section"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reading_events" DROP CONSTRAINT "FK_reading_events_user"`,
    );
    await queryRunner.query(`DROP TABLE "reading_events"`);
  }
}
