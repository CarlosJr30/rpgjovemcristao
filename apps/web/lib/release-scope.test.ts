import { expect, it } from 'vitest';
import { isReleasedPath } from './release-scope';
import { POST } from '../app/api/authority/route';
it.each([
  '/',
  '/auth',
  '/auth/recover',
  '/journey',
  '/journey/create',
  '/journey/hero',
  '/journey/backpack',
  '/journey/collection',
  '/journey/diary',
  '/journey/minigames/fuga-da-serpente',
  '/journey/phases/o-jardim-e-a-escolha',
  '/journey/worlds',
  '/journey/worlds/origins',
  '/journey/worlds/new-creation',
  '/journey/stories/creation',
  '/journey/stories/garden-choice',
  '/journey/guild',
  '/journey/guild/manage',
  '/journey/guild/ebd',
  '/api/guild-invites',
  '/guilda/convite/' + 'a'.repeat(64),
])('releases only reviewed route %s', (p) =>
  expect(isReleasedPath(p)).toBe(true),
);
it.each([
  '/journey/arena',
  '/journey/arena/tower',
  '/journey/arena/deck',
  '/journey/equipment',
  '/journey/shop',
  '/journey/stories/1',
  '/journey/minigames/invented',
  '/journey/worlds/invented',
  '/journey/intro',
  '/api/authority',
  '/journey/%61rena',
  '/journey/guild/../arena',
  '/journey/guild-extra',
])('rejects unreleased route %s', (p) => expect(isReleasedPath(p)).toBe(false));
it('denies a direct authenticated economy API call without constructing an authority client', async () => {
  const r = await POST(
    new Request('https://example.test/api/authority', {
      method: 'POST',
      headers: { Authorization: 'Bearer test' },
      body: JSON.stringify({ operation: 'start', mode: 'tower-v3' }),
    }),
  );
  expect(r.status).toBe(403);
  expect(r.headers.get('cache-control')).toBe('no-store');
});
