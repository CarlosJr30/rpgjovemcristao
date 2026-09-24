import 'server-only';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { readDatabaseEnvironment } from './environment';
import * as schema from './schema';

/** Não é chamada pelo bootstrap. Pool só conecta quando uma consulta é executada. */
export function createDatabase(environment: { DATABASE_URL?: string }) {
  const { url } = readDatabaseEnvironment(environment);
  const pool = new Pool({ connectionString: url, max: 5 });
  return { db: drizzle(pool, { schema }), close: () => pool.end() };
}
