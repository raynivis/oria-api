import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarQuestoesETentativas1791322876891 implements MigrationInterface {
  name = 'CriarQuestoesETentativas1791322876891';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sections" ADD "conceitosExtraidosEm" TIMESTAMP WITH TIME ZONE`,
    );

    await queryRunner.query(
      `CREATE TABLE "conceitos" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "sectionId" uuid NOT NULL, "nome" character varying NOT NULL, "descricaoCurta" character varying NOT NULL, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_conceitos" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_conceitos_section" ON "conceitos" ("sectionId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "conceitos" ADD CONSTRAINT "FK_conceitos_section" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "question_sets" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid NOT NULL, "sectionId" uuid NOT NULL, "promptVersao" integer NOT NULL, "modelo" character varying NOT NULL, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_question_sets" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_question_sets_user_section" ON "question_sets" ("userId", "sectionId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_sets" ADD CONSTRAINT "FK_question_sets_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_sets" ADD CONSTRAINT "FK_question_sets_section" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "setId" uuid NOT NULL, "enunciado" text NOT NULL, "respostaReferencia" text NOT NULL, "chunksFonte" uuid array NOT NULL DEFAULT '{}', "ordem" integer NOT NULL, CONSTRAINT "PK_questions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_questions_set_ordem" ON "questions" ("setId", "ordem")`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_questions_set" FOREIGN KEY ("setId") REFERENCES "question_sets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "question_conceitos" ("questionId" uuid NOT NULL, "conceitoId" uuid NOT NULL, CONSTRAINT "PK_question_conceitos" PRIMARY KEY ("questionId", "conceitoId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_conceitos" ADD CONSTRAINT "FK_question_conceitos_question" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_conceitos" ADD CONSTRAINT "FK_question_conceitos_conceito" FOREIGN KEY ("conceitoId") REFERENCES "conceitos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "attempts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "questionId" uuid NOT NULL, "userId" uuid NOT NULL, "estado" character varying NOT NULL, "nPassos" integer NOT NULL DEFAULT 0, "respostaInicial" text NOT NULL, "criadaEm" TIMESTAMP NOT NULL DEFAULT now(), "encerradaEm" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_attempts" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attempts_user_question" ON "attempts" ("userId", "questionId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempts" ADD CONSTRAINT "FK_attempts_question" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempts" ADD CONSTRAINT "FK_attempts_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "attempt_steps" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "attemptId" uuid NOT NULL, "numero" integer NOT NULL, "tipo" character varying NOT NULL, "conteudo" text NOT NULL, "avaliacaoSuficiente" boolean, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_attempt_steps" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_attempt_steps_attempt_numero" ON "attempt_steps" ("attemptId", "numero")`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_steps" ADD CONSTRAINT "FK_attempt_steps_attempt" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "attempt_steps"`);
    await queryRunner.query(`DROP TABLE "attempts"`);
    await queryRunner.query(`DROP TABLE "question_conceitos"`);
    await queryRunner.query(`DROP TABLE "questions"`);
    await queryRunner.query(`DROP TABLE "question_sets"`);
    await queryRunner.query(`DROP TABLE "conceitos"`);
    await queryRunner.query(`ALTER TABLE "sections" DROP COLUMN "conceitosExtraidosEm"`);
  }
}
