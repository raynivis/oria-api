import { MigrationInterface, QueryRunner } from 'typeorm';

/** Item 3.9 (correção de usabilidade): "ver no texto" na dica — seção +
 * posição do material mostrado em cada passo. */
export class AdicionarChunksMostradosEmAttemptSteps1791750300000 implements MigrationInterface {
  name = 'AdicionarChunksMostradosEmAttemptSteps1791750300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attempt_steps" ADD COLUMN "chunksMostrados" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "attempt_steps" DROP COLUMN "chunksMostrados"`);
  }
}
