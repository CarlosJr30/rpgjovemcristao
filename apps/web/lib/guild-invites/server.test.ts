import { beforeEach, expect, test, vi } from 'vitest';
const { getUser, rpc, createClient } = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@supabase/supabase-js', () => ({ createClient }));
import { handleGuildInvite } from './server';
import { inviteBaseURL } from './contracts';
const id = '11111111-1111-4111-8111-111111111111';
const token = 'a'.repeat(64);
function request(
  input: unknown,
  authorization = 'Bearer synthetic-test-token',
) {
  return new Request('https://untrusted-host.invalid/api/guild-invites', {
    method: 'POST',
    headers: {
      authorization,
      'content-type': 'application/json',
      host: 'untrusted-host.invalid',
      'x-forwarded-host': 'another-host.invalid',
    },
    body: JSON.stringify(input),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fixture.invalid');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'synthetic-public-key');
  vi.stubEnv('APP_BASE_URL', 'https://rpgjovemcristao-web-inky.vercel.app');
  createClient.mockReturnValue({ auth: { getUser }, rpc });
  getUser.mockResolvedValue({
    data: { user: { id, is_anonymous: false } },
    error: null,
  });
});
test('authenticates with getUser, uses configured origin rather than Host, and encodes QR locally', async () => {
  rpc.mockResolvedValue({
    data: { id, token, expires_at: '2026-10-26T00:00:00Z' },
    error: null,
  });
  const response = await handleGuildInvite(
    request({ action: 'create', travelerId: id }),
  );
  expect(response.status).toBe(200);
  expect(getUser).toHaveBeenCalledWith('synthetic-test-token');
  expect(rpc).toHaveBeenCalledWith('create_guild_link_invite', {
    p_leader_traveler_id: id,
  });
  const data = await response.json();
  expect(data.url).toBe(
    `https://rpgjovemcristao-web-inky.vercel.app/guilda/convite/${token}`,
  );
  expect(Buffer.from(data.qr.split(',')[1], 'base64').toString()).toContain(
    '<svg',
  );
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('referrer-policy')).toBe('no-referrer');
});
test('never calls RPC for missing, invalid or anonymous account sessions', async () => {
  expect(
    (await handleGuildInvite(request({ action: 'resolve', token }, ''))).status,
  ).toBe(401);
  getUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'invalid' },
  });
  expect(
    (await handleGuildInvite(request({ action: 'resolve', token }))).status,
  ).toBe(401);
  getUser.mockResolvedValue({
    data: { user: { id, is_anonymous: true } },
    error: null,
  });
  expect(
    (await handleGuildInvite(request({ action: 'resolve', token }))).status,
  ).toBe(401);
  expect(rpc).not.toHaveBeenCalled();
});
test('rejects malformed and oversized requests without processing credentials or RPC', async () => {
  for (const input of [
    { action: ['create'], travelerId: id },
    { action: 'revoke', travelerId: id },
    { action: 'create', travelerId: 'wrong' },
    { action: 'resolve', token: 'x'.repeat(4096) },
  ])
    expect((await handleGuildInvite(request(input))).status).toBe(400);
  expect(
    (await handleGuildInvite(request({ action: 'resolve', token: 'wrong' })))
      .status,
  ).toBe(404);
  expect(getUser).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
});
test('does not create an invite if server origin configuration is absent or invalid', async () => {
  vi.stubEnv('APP_BASE_URL', '');
  expect(
    (await handleGuildInvite(request({ action: 'create', travelerId: id })))
      .status,
  ).toBe(503);
  expect(rpc).not.toHaveBeenCalled();
  for (const invalid of [
    'http://real-game.com',
    'https://localhost',
    'https://test.invalid',
    'https://example.com',
    'https://real-game.com/path',
    'https://user:password@real-game.com',
  ])
    expect(() => inviteBaseURL(invalid, true)).toThrow();
  expect(inviteBaseURL('http://localhost:3000', false)).toBe(
    'http://localhost:3000',
  );
});
test('maps expired/revoked, unauthorized and unapplied migration errors without leaking details', async () => {
  for (const [code, expected] of [
    ['P0002', 404],
    ['42501', 403],
    ['PGRST202', 503],
  ] as const) {
    rpc.mockResolvedValue({
      data: null,
      error: { code, message: `private ${token}` },
    });
    const response = await handleGuildInvite(
      request({ action: 'resolve', token }),
    );
    expect(response.status).toBe(expected);
    expect(await response.text()).not.toContain(token);
  }
});
test('confirmation requests use the pending-request RPC rather than editing membership', async () => {
  rpc.mockResolvedValue({ data: id, error: null });
  expect(
    (
      await handleGuildInvite(
        request({ action: 'request', token, travelerId: id }),
      )
    ).status,
  ).toBe(200);
  expect(rpc).toHaveBeenCalledExactlyOnceWith('request_guild_link_invite', {
    p_token: token,
    p_traveler_id: id,
  });
});

test('pre-login preview exposes only name and expiry without using account credentials', async () => {
  rpc.mockResolvedValue({
    data: {
      guild_name: 'Guilda A',
      expires_at: '2026-10-26T00:00:00Z',
      guild_id: id,
      token,
      members: ['private'],
    },
    error: null,
  });
  const response = await handleGuildInvite(
    request({ action: 'preview', token }, ''),
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    data: { guild_name: 'Guilda A', expires_at: '2026-10-26T00:00:00Z' },
  });
  expect(rpc).toHaveBeenCalledExactlyOnceWith('preview_guild_link_invite', {
    p_token: token,
  });
  expect(getUser).not.toHaveBeenCalled();
  expect(createClient.mock.calls[0][2]).not.toHaveProperty('global');
  expect(response.headers.get('cache-control')).toBe('no-store');
});

test('preview cannot turn missing credentials into a mutation or return invalid/revoked details', async () => {
  for (const action of ['create', 'list', 'revoke', 'request', 'resolve'])
    expect(
      (
        await handleGuildInvite(
          request({ action, travelerId: id, inviteId: id, token }, ''),
        )
      ).status,
    ).toBe(401);
  expect(rpc).not.toHaveBeenCalled();
  expect(
    (
      await handleGuildInvite(
        request({ action: 'preview', token: 'wrong' }, ''),
      )
    ).status,
  ).toBe(404);
  rpc.mockResolvedValue({
    data: null,
    error: { code: 'P0002', message: token },
  });
  const response = await handleGuildInvite(
    request({ action: 'preview', token }, ''),
  );
  expect(response.status).toBe(404);
  expect(await response.text()).not.toContain(token);
});
