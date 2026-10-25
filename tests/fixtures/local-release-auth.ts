import type { BrowserContext } from '@playwright/test';

/** Synthetic API responses only; foreign traffic is aborted, never forwarded. */
export async function mockLocalReleaseAuth(
  context: BrowserContext,
  origin: string,
) {
  if (origin !== 'http://127.0.0.1:3199')
    throw new Error('Loopback fixture required');
  const date = '2026-10-24T12:00:00.000Z';
  const travelerId = '10000000-0000-4000-8000-000000000003';
  const user = {
    id: '00000000-0000-4000-8000-000000000003',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'local-only@fixture.invalid',
    user_metadata: {},
    created_at: date,
  };
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const session = {
    access_token: `${encode({ alg: 'HS256' })}.${encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.synthetic`,
    refresh_token: 'local-synthetic-only',
    expires_in: 3600,
    token_type: 'bearer',
    user,
  };
  await context.route(
    (url) => url.origin !== origin,
    async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      if (url.origin === origin) return route.continue();
      if (url.origin !== 'https://fixture.invalid') return route.abort();
      if (url.pathname.startsWith('/auth/v1/')) {
        return route.fulfill({
          json: url.pathname.endsWith('/user') ? user : session,
        });
      }
      const endpoint = url.pathname.split('/').at(-1);
      let data: unknown = [];
      const traveler = {
        id: travelerId,
        user_id: user.id,
        name: 'Local WebKit',
        body_type: 'female',
        skin_tone: 'medio',
        hair_style: 'curto',
        hair_color: 'castanho',
        avatar_variant: 'musgo',
        xp: 0,
        level: 1,
        is_active: true,
        created_at: date,
        updated_at: date,
      };
      if (endpoint === 'travelers')
        data = req.headers().accept?.includes('object') ? traveler : [traveler];
      if (endpoint === 'traveler_stats')
        data = {
          traveler_id: travelerId,
          base_life: 1,
          base_strength: 1,
          base_defense: 1,
          base_wisdom: 1,
        };
      if (endpoint === 'wallets') data = { traveler_id: travelerId, coins: 0 };
      if (endpoint === 'guild_members' || endpoint === 'guild_join_requests')
        data = null;
      if (endpoint === 'guild_ebd_workspace')
        data = {
          version: 1,
          guildId: 'local-fixture',
          leader: false,
          teacher: false,
          total: 0,
          lessons: [],
          activities: [],
          answers: [],
          attendance: [],
          members: [],
          teachers: [],
          history: [],
          rewards: [],
        };
      return route.fulfill({ json: data });
    },
  );
}
