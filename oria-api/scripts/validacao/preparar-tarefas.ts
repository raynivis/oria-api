import { readFileSync } from 'node:fs';
import * as yaml from 'js-yaml';
import { z } from 'zod';
import { Tarefa } from '../../src/validacao/entities/tarefa.entity';
import { TIPOS_TAREFA } from '../../src/validacao/tipos';
import { criarContextoValidacao, executarScript } from './_contexto';

const schemaTarefaYaml = z.object({
  codigo: z.string().min(1),
  tipo: z.enum(TIPOS_TAREFA),
  enunciado: z.string().min(1),
  gabarito: z.string().optional(),
});

const schemaYaml = z.object({
  secoes: z
    .array(
      z.object({
        id: z.string().uuid(),
        conceitosCentrais: z.array(z.string()).optional(),
        tarefas: z.array(schemaTarefaYaml).min(1),
      }),
    )
    .min(1),
});

executarScript(async () => {
  const caminho = process.argv[2];
  if (!caminho) {
    throw new Error('Uso: npm run validacao:preparar-tarefas -- <caminho-do-yaml>');
  }

  const bruto = yaml.load(readFileSync(caminho, 'utf8'));
  const analisado = schemaYaml.parse(bruto);

  const ctx = await criarContextoValidacao();
  try {
    const tarefasRepository = ctx.dataSource.getRepository(Tarefa);
    let criadas = 0;
    let atualizadas = 0;

    for (const secao of analisado.secoes) {
      for (const tarefa of secao.tarefas) {
        const existente = await tarefasRepository.findOneBy({ codigo: tarefa.codigo });
        const dados = {
          sectionId: secao.id,
          tipo: tarefa.tipo,
          enunciado: tarefa.enunciado,
          gabarito: tarefa.gabarito ?? null,
        };

        if (existente) {
          await tarefasRepository.update(existente.id, dados);
          atualizadas++;
        } else {
          await tarefasRepository.save(
            tarefasRepository.create({ codigo: tarefa.codigo, ...dados }),
          );
          criadas++;
        }
      }
    }

    console.log(`Tarefas: ${criadas} criadas, ${atualizadas} atualizadas (idempotente por "codigo").`);
  } finally {
    await ctx.close();
  }
});
