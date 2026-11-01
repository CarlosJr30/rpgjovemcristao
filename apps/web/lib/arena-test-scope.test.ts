import { afterEach, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '../proxy';
import { isReleasedPath } from './release-scope';
import {
  isArenaTestAvailable,
  isArenaTestServerEnabled,
} from './arena-test-scope';

afterEach(() => vi.unstubAllEnvs());
const configure = () => {
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'https://wkdvdzfkbwvhyjmamrsg.supabase.co',
  );
  vi.stubEnv('NEXT_PUBLIC_ARENA_TEST_PRACTICE', '1');
  vi.stubEnv('VERCEL_ENV', 'preview');
};
test('only explicit TEST Preview opens the three practice paths; economic API stays closed', () => {
  configure();
  expect(isArenaTestServerEnabled()).toBe(true);
  for (const path of [
    '/journey/arena',
    '/journey/arena/deck',
    '/journey/arena/tower',
  ]) {
    expect(isReleasedPath(path)).toBe(true);
    expect(
      proxy(new NextRequest('https://example.vercel.app' + path)).status,
    ).toBe(200);
  }
  for (const path of [
    '/api/authority',
    '/journey/equipment',
    '/journey/shop',
    '/journey/arena/other',
  ]) {
    expect(isReleasedPath(path)).toBe(false);
    expect(
      proxy(new NextRequest('https://example.vercel.app' + path)).status,
    ).toBe(403);
  }
});
test.each(['production', 'development', ''])(
  'server rejects context %s even with a TEST bundle flag',
  (context) => {
    configure();
    vi.stubEnv('VERCEL_ENV', context);
    expect(isArenaTestServerEnabled()).toBe(false);
    expect(
      proxy(new NextRequest('https://example.vercel.app/journey/arena')).status,
    ).toBe(403);
  },
);
test('production backend or missing opt-in never enables practice', () => {
  configure();
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'https://wspafhlbtlpabypzymjo.supabase.co',
  );
  expect(isArenaTestAvailable()).toBe(false);
  expect(isReleasedPath('/journey/arena')).toBe(false);
  configure();
  vi.stubEnv('NEXT_PUBLIC_ARENA_TEST_PRACTICE', '');
  expect(isArenaTestServerEnabled()).toBe(false);
  expect(isReleasedPath('/journey/arena/tower')).toBe(false);
});
