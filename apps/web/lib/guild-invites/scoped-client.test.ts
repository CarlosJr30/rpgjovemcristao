// @vitest-environment jsdom
import { beforeEach, expect, test, vi } from 'vitest';
const mock = vi.hoisted(() => ({
  owner: 'owner-a',
  revision: 1,
  scope: '11111111-1111-4111-8111-111111111111',
  session: vi.fn(),
}));
vi.mock('../supabase/auth', () => ({ getSession: mock.session }));
vi.mock('../supabase/online-sync', () => ({
  getCurrentOnlineUserId: () => mock.owner,
  getOnlineSessionRevision: () => mock.revision,
}));
vi.mock('../guild-governance/selection', () => ({
  getGuildSelection: () => mock.scope,
  beginGuildWork: () => () => {},
}));
import { guildInviteAction } from './client';
const a = '11111111-1111-4111-8111-111111111111';
beforeEach(() => {
  sessionStorage.clear();
  mock.owner = 'owner-a';
  mock.revision++;
  mock.scope = a;
  mock.session.mockResolvedValue({
    access_token: 'synthetic-session',
    user: { id: 'owner-a' },
  });
  vi.unstubAllGlobals();
});
test('failed invitation delivery reuses one nonce without persisting its secret', async () => {
  const bodies: Record<string, string>[] = [];
  const fetcher = vi.fn(async (_url: unknown, options: RequestInit) => {
    const body = JSON.parse(String(options.body));
    bodies.push(body);
    if (bodies.length === 1) throw Error('Network interrupted');
    return Response.json({
      id: a,
      replayed: true,
      expires_at: '2026-11-01T00:00:00Z',
    });
  });
  vi.stubGlobal('fetch', fetcher);
  await expect(
    guildInviteAction({ action: 'create', travelerId: 'actor', guildId: a }),
  ).rejects.toThrow('Network interrupted');
  expect(sessionStorage.length).toBe(1);
  await guildInviteAction({
    action: 'create',
    travelerId: 'actor',
    guildId: a,
  });
  expect(bodies[0].requestId).toBe(bodies[1].requestId);
  expect(bodies[0]).not.toHaveProperty('token');
  expect(sessionStorage.length).toBe(0);
});
test('scope change discards a privileged response even if the old request succeeded', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      mock.scope = '22222222-2222-4222-8222-222222222222';
      return Response.json({ data: [] });
    }),
  );
  await expect(
    guildInviteAction({ action: 'list', travelerId: 'actor', guildId: a }),
  ).rejects.toThrow(/mudou/);
});
test('account change while awaiting a session prevents sending the old command', async () => {
  mock.session.mockImplementation(async () => {
    mock.owner = 'owner-b';
    mock.revision++;
    return { access_token: 'synthetic-session', user: { id: 'owner-a' } };
  });
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  await expect(
    guildInviteAction({ action: 'list', travelerId: 'actor', guildId: a }),
  ).rejects.toThrow(/mudou/);
  expect(fetcher).not.toHaveBeenCalled();
});
