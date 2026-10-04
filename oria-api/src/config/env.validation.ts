import { z } from 'zod';

function numeroDeString(mensagem: string) {
  return z
    .string()
    .refine((valor) => !Number.isNaN(Number(valor)), mensagem)
    .transform(Number);
}

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: numeroDeString('PORT deve ser numérico').default(3000),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  EMBEDDINGS_URL: z.string().url(),
  EMBEDDINGS_DIM: numeroDeString('EMBEDDINGS_DIM deve ser numérico'),

  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_BASE_URL: z.string().url(),

  LLM_DIALOGUE_MODEL: z.string().min(1),
  LLM_HINT_MODEL: z.string().min(1),
  LLM_FICHAMENTO_MODEL: z.string().min(1),
  LLM_PANORAMA_MODEL: z.string().min(1),
  LLM_QUESTIONS_MODEL: z.string().min(1),
  LLM_CONCEPTS_MODEL: z.string().min(1),

  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default('7d'),

  ADMIN_API_KEY: z.string().min(1),

  ATTEMPT_MAX_STEPS: numeroDeString(
    'ATTEMPT_MAX_STEPS deve ser numérico',
  ).default(3),
  METACOG_CONFIANCA_MIN: numeroDeString(
    'METACOG_CONFIANCA_MIN deve ser numérico',
  ).default(70),
  METACOG_PASSOS_MIN: numeroDeString(
    'METACOG_PASSOS_MIN deve ser numérico',
  ).default(2.5),
  RETRIEVAL_LIMIAR: numeroDeString(
    'RETRIEVAL_LIMIAR deve ser numérico',
  ).default(0.72),
  RETRIEVAL_TOP_K: numeroDeString('RETRIEVAL_TOP_K deve ser numérico').default(
    6,
  ),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>): EnvConfig {
  const resultado = envSchema.safeParse(config);

  if (!resultado.success) {
    const mensagens = resultado.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Configuração de ambiente inválida. Confira o .env contra o .env.example:\n${mensagens}`,
    );
  }

  return resultado.data;
}
