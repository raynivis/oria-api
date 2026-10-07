import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarSessoesEMensagens1791330000000 implements MigrationInterface {
  name = 'CriarSessoesEMensagens1791330000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid NOT NULL, "sectionId" uuid NOT NULL, "criadaEm" TIMESTAMP NOT NULL DEFAULT now(), "encerradaEm" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_sessions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_user_section" ON "sessions" ("userId", "sectionId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_sessions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_sessions_section" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "sessionId" uuid NOT NULL, "papel" character varying NOT NULL, "conteudo" text NOT NULL, "chunksCitados" uuid array NOT NULL DEFAULT '{}', "encontrouBase" boolean, "promptVersao" integer, "modelo" character varying, "tokensIn" integer, "tokensOut" integer, "custo" numeric, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_messages" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_session_criado" ON "messages" ("sessionId", "criadoEm")`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_session" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
  }
}
