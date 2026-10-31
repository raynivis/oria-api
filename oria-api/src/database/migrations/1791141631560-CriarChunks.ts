import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarChunks1791141631560 implements MigrationInterface {
  name = 'CriarChunks1791141631560';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chunks" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "sectionId" uuid NOT NULL, "ordem" integer NOT NULL, "texto" text NOT NULL, "embedding" vector(768) NOT NULL, "ancoraCfi" character varying NOT NULL, "tokens" integer NOT NULL, CONSTRAINT "PK_a306e60b8fdf6e7de1be4be1e6a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "chunks" ADD CONSTRAINT "FK_1a8f969977cff0a8b16abf86720" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chunks_embedding_hnsw" ON "chunks" USING hnsw (embedding vector_cosine_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_chunks_embedding_hnsw"`);
    await queryRunner.query(
      `ALTER TABLE "chunks" DROP CONSTRAINT "FK_1a8f969977cff0a8b16abf86720"`,
    );
    await queryRunner.query(`DROP TABLE "chunks"`);
  }
}
