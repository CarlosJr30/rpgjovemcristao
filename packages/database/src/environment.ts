import { z } from 'zod';

const databaseUrl = z.url({ protocol: /^postgres(ql)?$/ });

/** Validação sob demanda; nunca inclui o valor recebido na mensagem de erro. */
export function readDatabaseEnvironment(environment: {
  DATABASE_URL?: string;
}) {
  const result = databaseUrl.safeParse(environment.DATABASE_URL);
  if (!result.success) {
    throw new Error(
      'DATABASE_URL ausente ou inválida. Configure uma URL PostgreSQL no servidor.',
    );
  }
  return { url: result.data };
}
