import { MigrationInterface, QueryRunner } from "typeorm";

export class CriarUsuariosLivrosSecoes1791140599678 implements MigrationInterface {
    name = 'CriarUsuariosLivrosSecoes1791140599678'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "nome" character varying NOT NULL, "email" character varying NOT NULL, "senhaHash" character varying NOT NULL, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "books" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "titulo" character varying NOT NULL, "autor" character varying NOT NULL, "arquivoPath" character varying NOT NULL, "isbn" character varying, "status" character varying NOT NULL DEFAULT 'pendente', "erroMensagem" character varying, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f3f2f25a099d24e12545b70b022" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sections" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "bookId" uuid NOT NULL, "parentId" uuid, "ordem" integer NOT NULL, "titulo" character varying NOT NULL, "nivel" integer NOT NULL, "href" character varying NOT NULL, "textoCompleto" text NOT NULL, CONSTRAINT "PK_f9749dd3bffd880a497d007e450" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_46d0b1ef40f4f6af77c044a3c8" ON "sections" ("bookId", "ordem") `);
        await queryRunner.query(`ALTER TABLE "sections" ADD CONSTRAINT "FK_8820054e247e5160985fc2dcaea" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sections" ADD CONSTRAINT "FK_8e7fcde70f17a43e54e98809192" FOREIGN KEY ("parentId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sections" DROP CONSTRAINT "FK_8e7fcde70f17a43e54e98809192"`);
        await queryRunner.query(`ALTER TABLE "sections" DROP CONSTRAINT "FK_8820054e247e5160985fc2dcaea"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_46d0b1ef40f4f6af77c044a3c8"`);
        await queryRunner.query(`DROP TABLE "sections"`);
        await queryRunner.query(`DROP TABLE "books"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
