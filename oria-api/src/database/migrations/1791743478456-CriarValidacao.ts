import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarValidacao1791743478456 implements MigrationInterface {
  name = 'CriarValidacao1791743478456';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "validacao_execucoes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "rotulo" character varying NOT NULL, "gitSha" character varying NOT NULL, "modelo" character varying NOT NULL, "provider" character varying NOT NULL, "seed" integer NOT NULL, "temperatura" numeric NOT NULL, "iniciadaEm" TIMESTAMP NOT NULL DEFAULT now(), "encerradaEm" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_validacao_execucoes" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "validacao_tarefas" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "codigo" character varying NOT NULL, "sectionId" uuid NOT NULL, "tipo" character varying NOT NULL, "enunciado" text NOT NULL, "gabarito" text, CONSTRAINT "PK_validacao_tarefas" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_validacao_tarefas_codigo" ON "validacao_tarefas" ("codigo")`,
    );
    await queryRunner.query(
      `ALTER TABLE "validacao_tarefas" ADD CONSTRAINT "FK_validacao_tarefas_section" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "validacao_saidas" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "execucaoId" uuid NOT NULL, "tarefaId" uuid NOT NULL, "condicao" character varying NOT NULL, "entradaCompleta" text NOT NULL, "saidaBruta" text NOT NULL, "promptVersao" integer, "modelo" character varying NOT NULL, "tokensIn" integer NOT NULL, "tokensOut" integer NOT NULL, "custo" numeric NOT NULL, "duracaoMs" integer NOT NULL, "sucesso" boolean NOT NULL DEFAULT true, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_validacao_saidas" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_validacao_saidas_execucao_tarefa_condicao" ON "validacao_saidas" ("execucaoId", "tarefaId", "condicao")`,
    );
    await queryRunner.query(
      `ALTER TABLE "validacao_saidas" ADD CONSTRAINT "FK_validacao_saidas_execucao" FOREIGN KEY ("execucaoId") REFERENCES "validacao_execucoes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "validacao_saidas" ADD CONSTRAINT "FK_validacao_saidas_tarefa" FOREIGN KEY ("tarefaId") REFERENCES "validacao_tarefas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "validacao_codigos_cegos" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "saidaId" uuid NOT NULL, "codigo" character varying NOT NULL, "revelado" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_validacao_codigos_cegos_saida" UNIQUE ("saidaId"), CONSTRAINT "UQ_validacao_codigos_cegos_codigo" UNIQUE ("codigo"), CONSTRAINT "PK_validacao_codigos_cegos" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "validacao_codigos_cegos" ADD CONSTRAINT "FK_validacao_codigos_cegos_saida" FOREIGN KEY ("saidaId") REFERENCES "validacao_saidas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "validacao_pontuacoes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "saidaId" uuid NOT NULL, "avaliador" character varying NOT NULL, "c1" integer NOT NULL, "c2" integer NOT NULL, "c3" integer NOT NULL, "c4" integer NOT NULL, "nivelBloom" integer, "observacao" text, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_validacao_pontuacoes" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_validacao_pontuacoes_saida_avaliador" ON "validacao_pontuacoes" ("saidaId", "avaliador")`,
    );
    await queryRunner.query(
      `ALTER TABLE "validacao_pontuacoes" ADD CONSTRAINT "FK_validacao_pontuacoes_saida" FOREIGN KEY ("saidaId") REFERENCES "validacao_saidas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "validacao_pontuacoes"`);
    await queryRunner.query(`DROP TABLE "validacao_codigos_cegos"`);
    await queryRunner.query(`DROP TABLE "validacao_saidas"`);
    await queryRunner.query(`DROP TABLE "validacao_tarefas"`);
    await queryRunner.query(`DROP TABLE "validacao_execucoes"`);
  }
}
