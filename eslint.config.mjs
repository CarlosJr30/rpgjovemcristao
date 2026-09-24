import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const restricted = (patterns) => ['error', { patterns }];

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  { settings: { next: { rootDir: 'apps/web/' } } },
  globalIgnores([
    '**/.next/**',
    '**/node_modules/**',
    '.npm-cache/**',
    'playwright-report/**',
    'test-results/**',
    '**/next-env.d.ts',
  ]),
  {
    files: ['packages/{shared,game-engine}/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restricted([
        'react',
        'react/*',
        'next',
        'next/*',
        'pg',
        'drizzle-orm',
        'drizzle-orm/*',
        '@rpg/database',
        '@rpg/database/*',
        '@rpg/ui',
        '@rpg/ui/*',
        '**/apps/**',
        '**/database/**',
        '**/ui/**',
      ]),
    },
  },
  {
    files: ['packages/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restricted([
        'react',
        'react/*',
        'next',
        'next/*',
        'pg',
        'drizzle-orm',
        'drizzle-orm/*',
        '@rpg/database',
        '@rpg/database/*',
        '@rpg/ui',
        '@rpg/ui/*',
        '@rpg/game-engine',
        '@rpg/game-engine/*',
        '**/apps/**',
        '**/database/**',
        '**/ui/**',
        '**/game-engine/**',
      ]),
    },
  },
  {
    files: ['packages/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restricted([
        'next',
        'next/*',
        'pg',
        'drizzle-orm',
        'drizzle-orm/*',
        '@rpg/database',
        '@rpg/database/*',
        '@rpg/game-engine',
        '@rpg/game-engine/*',
        '**/apps/**',
        '**/database/**',
        '**/game-engine/**',
      ]),
    },
  },
]);
