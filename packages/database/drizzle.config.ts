import { defineConfig } from 'drizzle-kit';

// Somente preparação de geração local; nenhum comando de migration/push configurado.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  strict: true,
});
