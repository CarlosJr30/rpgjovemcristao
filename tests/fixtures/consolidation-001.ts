import { type BrowserContext } from '@playwright/test';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
} from '../../apps/web/features/journey/domain/traveler';
import { STORY_STEPS } from '../../apps/web/features/story/catalog';

// Synthetic SDK/Data API fixtures. No hosted Auth, real accounts or external network.
const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const travelerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export async function consolidationFixture(
  context: BrowserContext,
  options = { error: false, completed: false, legacy: false },
) {
  const player = createTraveler(
    'Lia',
    DEFAULT_APPEARANCE,
    travelerId,
    '2026-10-19T12:00:00Z',
  );
  player.progress.gardenCompleted = options.legacy;
  player.progress.gardenStep = options.legacy ? 'done' : 'opening';
  const hero = {
    id: travelerId,
    user_id: userId,
    name: 'Lia',
    body_type: 'male',
    skin_tone: 'medio',
    hair_style: 'curto',
    hair_color: null,
    avatar_variant: 'musgo',
    xp: 0,
    level: 1,
    is_active: true,
    journey_progress: player.progress,
    created_at: player.createdAt,
    updated_at: player.createdAt,
  };
  const user = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    is_anonymous: false,
    email: 'fixture@example.invalid',
    user_metadata: { display_name: 'Lia' },
    created_at: player.createdAt,
  };
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const session = {
    access_token: `${encode({ alg: 'HS256' })}.${encode({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.synthetic`,
    refresh_token: 'synthetic-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    user,
  };
  const records = options.completed
    ? [
        {
          traveler_id: travelerId,
          story_id: 'creation',
          completed_steps: [...STORY_STEPS],
          video_completed: true,
          reward_receipt: 'synthetic:creation',
          completed_at: player.createdAt,
        },
      ]
    : [];
  const writes: string[] = [];
  await context.route('**/*', (route) =>
    ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort(),
  );
  await context.route('**/auth/v1/**', (route) =>
    route.fulfill({
      json: new URL(route.request().url()).pathname.endsWith('/user')
        ? user
        : session,
    }),
  );
  await context.route('**/rest/v1/**', async (route) => {
    const request = route.request();
    const endpoint = new URL(request.url()).pathname.split('/').at(-1);
    if (request.method() !== 'GET') writes.push(endpoint ?? 'unknown');
    if (endpoint === 'story_progress') {
      await route.fulfill(
        options.error
          ? { status: 404, json: { message: 'synthetic missing table' } }
          : { json: records },
      );
      return;
    }
    let body: unknown = null;
    if (endpoint === 'travelers')
      body = request.headers().accept?.includes('object') ? hero : [hero];
    if (endpoint === 'traveler_stats')
      body = {
        traveler_id: travelerId,
        base_life: 1,
        base_strength: 1,
        base_defense: 1,
        base_wisdom: 1,
      };
    if (endpoint === 'wallets') body = { traveler_id: travelerId, coins: 0 };
    if (
      [
        'inventory',
        'equipped_items',
        'traveler_chests',
        'chest_operations',
      ].includes(endpoint ?? '')
    )
      body = [];
    await route.fulfill({ json: body });
  });
  return writes;
}
