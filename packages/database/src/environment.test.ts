import { expect, test } from 'vitest';
import { readDatabaseEnvironment } from './environment';

test.each([undefined, '', 'https://localhost/example', 'not-a-url'])(
  'rejeita configuração inválida sem refletir o valor: %s',
  (DATABASE_URL) => {
    expect(() => readDatabaseEnvironment({ DATABASE_URL })).toThrow(
      'DATABASE_URL ausente ou inválida. Configure uma URL PostgreSQL no servidor.',
    );
  },
);

test.each(['postgres://localhost/example', 'postgresql://localhost/example'])(
  'aceita URL PostgreSQL sem abrir conexão: %s',
  (DATABASE_URL) => {
    expect(readDatabaseEnvironment({ DATABASE_URL })).toEqual({
      url: DATABASE_URL,
    });
  },
);
