import { expect, test, vi } from 'vitest';

const { pool, end, drizzleMock } = vi.hoisted(() => {
  const end = vi.fn().mockResolvedValue(undefined);
  return {
    end,
    pool: vi.fn(function () {
      return { end };
    }),
    drizzleMock: vi.fn().mockReturnValue({}),
  };
});

vi.mock('server-only', () => ({}));
vi.mock('pg', () => ({ Pool: pool }));
vi.mock('drizzle-orm/node-postgres', () => ({ drizzle: drizzleMock }));

test('importar não cria pool; configuração inválida falha antes de tocar no driver', async () => {
  const { createDatabase } = await import('./index');
  expect(pool).not.toHaveBeenCalled();
  expect(() => createDatabase({})).toThrow('DATABASE_URL ausente ou inválida');
  expect(pool).not.toHaveBeenCalled();
});

test('constrói o adaptador sob demanda e permite encerrar seu pool', async () => {
  const { createDatabase } = await import('./index');
  const database = createDatabase({
    DATABASE_URL: 'postgresql://localhost/example',
  });
  expect(pool).toHaveBeenCalledOnce();
  expect(drizzleMock).toHaveBeenCalledOnce();
  await database.close();
  expect(end).toHaveBeenCalledOnce();
});
