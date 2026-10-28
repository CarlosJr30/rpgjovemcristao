import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mock = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@supabase/supabase-js', () => ({ createClient: mock.createClient }));
import { handleGovernance } from './server';
import {
  LEADERSHIP_COOKIE,
  LEADERSHIP_PATH,
  parseGovernanceStatus,
} from './contracts';
const base = 'https://rpgjovemcristao-web-inky.vercel.app',
  id = '11111111-1111-4111-8111-111111111111',
  nonce = '22222222-2222-4222-8222-222222222222',
  token = 'a'.repeat(64);
const preview = {
  id,
  kind: 'leadership',
  expiresAt: new Date(Date.now() + 2 * 86400000).toISOString(),
};
function request(data: unknown, extra: Record<string, string> = {}) {
  return new Request('https://untrusted.invalid/api/guild-governance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer synthetic-session',
      host: 'untrusted.invalid',
      'x-forwarded-host': 'attacker.invalid',
      ...extra,
    },
    body: JSON.stringify(data),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fixture.invalid');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'synthetic-public-key');
  vi.stubEnv('APP_BASE_URL', base);
  vi.stubEnv('VERCEL_ENV', '');
  mock.createClient.mockReturnValue({
    auth: { getUser: mock.getUser },
    rpc: mock.rpc,
  });
  mock.getUser.mockResolvedValue({
    data: {
      user: { id, is_anonymous: false, user_metadata: { role: 'admin' } },
    },
    error: null,
  });
  mock.rpc.mockResolvedValue({ data: preview, error: null });
});
afterEach(() => vi.unstubAllEnvs());
test('verifies normal account and leaves authorization to database rather than user metadata', async () => {
  await handleGovernance(request({ action: 'status' }));
  expect(mock.getUser).toHaveBeenCalledWith('synthetic-session');
  expect(mock.rpc).toHaveBeenCalledWith('guild_governance_status', {});
  expect(mock.createClient.mock.calls[0][2].global.headers.Authorization).toBe(
    'Bearer synthetic-session',
  );
});
test('missing bearer invalid account or anonymous account cannot reach privileged RPC', async () => {
  expect(
    (
      await handleGovernance(
        request({ action: 'status' }, { Authorization: '' }),
      )
    ).status,
  ).toBe(401);
  for (const value of [
    { data: { user: null }, error: null },
    { data: { user: { id, is_anonymous: true } }, error: null },
  ]) {
    mock.getUser.mockResolvedValue(value);
    expect((await handleGovernance(request({ action: 'status' }))).status).toBe(
      401,
    );
  }
  expect(mock.rpc).not.toHaveBeenCalled();
});
test('leadership URL uses trusted origin and fragment with local PNG QR; raw token is not a standalone response field', async () => {
  mock.rpc.mockResolvedValue({ data: { ...preview, token }, error: null });
  const r = await handleGovernance(
    request({
      action: 'command',
      kind: 'issue_leadership',
      id,
      requestId: nonce,
      data: {
        recipientEmail: 'synthetic@fixtures.invalid',
        expiresInDays: 7,
        reason: 'Synthetic fixture authorization',
      },
    }),
  );
  const j = await r.json();
  expect(j.data.url).toBe(base + LEADERSHIP_PATH + '#' + token);
  expect(j.data.token).toBeUndefined();
  expect(new URL(j.data.url).pathname).not.toContain(token);
  expect(new URL(j.data.url).search).toBe('');
  expect(j.data.qr).toMatch(/^data:image\/png;base64,/);
  expect(
    Buffer.from(j.data.qr.split(',')[1], 'base64')
      .subarray(0, 8)
      .toString('hex'),
  ).toBe('89504e470d0a1a0a');
  expect(r.headers.get('cache-control')).toBe('no-store');
  expect(r.headers.get('referrer-policy')).toBe('no-referrer');
});
test('idempotent replay cannot recover a raw invitation token', async () => {
  mock.rpc.mockResolvedValue({
    data: { ...preview, token: null, replayed: true },
    error: null,
  });
  const r = await handleGovernance(
    request({
      action: 'command',
      kind: 'issue_leadership',
      id,
      requestId: nonce,
      data: {},
    }),
  );
  const j = await r.json();
  expect(j.data.token).toBeUndefined();
  expect(j.data.url).toBeUndefined();
  expect(j.data.qr).toBeUndefined();
});
test('public presentation uses only a valid preview and stores host-only HttpOnly SameSite cookie', async () => {
  const r = await handleGovernance(
    request({ action: 'remember', token }, { origin: base, Authorization: '' }),
  );
  expect(r.status).toBe(200);
  expect(mock.getUser).not.toHaveBeenCalled();
  expect(mock.rpc).toHaveBeenCalledWith('guild_leadership_preview', {
    p_token: token,
  });
  const c = r.headers.get('set-cookie')!;
  expect(c).toContain('HttpOnly');
  expect(c).toContain('SameSite=Lax');
  expect(c).toContain('Secure');
  expect(c).not.toContain('Domain=');
  expect(await r.text()).not.toContain(token);
});
test('remember rejects absent or foreign Origin before any database or account lookup', async () => {
  for (const origin of ['', 'https://attacker.invalid'])
    expect(
      (
        await handleGovernance(
          request({ action: 'remember', token }, { origin }),
        )
      ).status,
    ).toBe(403);
  expect(mock.rpc).not.toHaveBeenCalled();
  expect(mock.createClient).not.toHaveBeenCalled();
});
test('preview cookie must be present once and must have token shape', async () => {
  for (const cookie of [
    '',
    LEADERSHIP_COOKIE + '=bad',
    `${LEADERSHIP_COOKIE}=${token}; ${LEADERSHIP_COOKIE}=${token}`,
  ])
    expect(
      (
        await handleGovernance(
          request({ action: 'preview' }, { cookie, Authorization: '' }),
        )
      ).status,
    ).toBe(404);
  expect(mock.rpc).not.toHaveBeenCalled();
});
test('accept verifies account passes cookie token and avatar to server and clears cookie', async () => {
  mock.rpc.mockResolvedValue({ data: { id, status: 'accepted' }, error: null });
  const r = await handleGovernance(
    request(
      { action: 'accept', id, requestId: nonce, travelerId: id },
      { cookie: `${LEADERSHIP_COOKIE}=${token}` },
    ),
  );
  expect(r.status).toBe(200);
  expect(mock.getUser).toHaveBeenCalled();
  expect(mock.rpc).toHaveBeenCalledWith('guild_governance_command', {
    p_action: 'accept_leadership',
    p_id: id,
    p_request: nonce,
    p_data: { token, travelerId: id },
  });
  expect(r.headers.get('set-cookie')).toContain('Max-Age=0');
  expect(await r.text()).not.toContain(token);
});
test.each([
  'bootstrap_admin',
  'execute_sql',
  'grant_xp',
  'transfer_leadership',
])('does not expose unreviewed command %s', async (kind) => {
  expect(
    (
      await handleGovernance(
        request({ action: 'command', kind, id, requestId: nonce, data: {} }),
      )
    ).status,
  ).toBe(400);
  expect(mock.rpc).not.toHaveBeenCalled();
});
test('accept cannot inject raw token or administrator fields into its transport', async () => {
  expect(
    (
      await handleGovernance(
        request({
          action: 'accept',
          id,
          requestId: nonce,
          travelerId: id,
          token,
          administrator: true,
        }),
      )
    ).status,
  ).toBe(400);
  expect(mock.rpc).not.toHaveBeenCalled();
});
test('oversized malformed and unexpected requests are rejected without calling backend', async () => {
  for (const data of [
    [],
    { action: 'status', role: 'admin' },
    { action: 'workspace', offset: -1 },
    { action: 'workspace', offset: 1.5 },
    {
      action: 'command',
      kind: 'set_admin',
      id: 'bad',
      requestId: nonce,
      data: {},
    },
    { action: 'remember', token: 'a'.repeat(9000) },
  ])
    expect((await handleGovernance(request(data))).status).toBe(400);
  expect(mock.rpc).not.toHaveBeenCalled();
});
test.each([
  ['42501', 403],
  ['P0002', 404],
  ['55000', 409],
  ['22023', 400],
])('maps %s without exposing backend details', async (code, status) => {
  mock.rpc.mockResolvedValue({
    data: null,
    error: { code, message: 'private fixture message ' + token },
  });
  const r = await handleGovernance(request({ action: 'status' }));
  expect(r.status).toBe(status);
  expect(await r.text()).not.toContain(token);
});
test('Preview requires TEST backend and uses platform deployment origin rather than production APP_BASE_URL', async () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('VERCEL_URL', 'reviewed-preview.vercel.app');
  expect((await handleGovernance(request({ action: 'status' }))).status).toBe(
    503,
  );
  expect(mock.createClient).not.toHaveBeenCalled();
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'https://wkdvdzfkbwvhyjmamrsg.supabase.co',
  );
  const r = await handleGovernance(
    request(
      { action: 'remember', token },
      { origin: 'https://reviewed-preview.vercel.app', Authorization: '' },
    ),
  );
  expect(r.status).toBe(200);
});
test('retained production deployment origin is accepted only from trusted platform configuration', async () => {
  vi.stubEnv('VERCEL_ENV', 'production');
  vi.stubEnv('VERCEL_URL', 'reviewed-production.vercel.app');
  expect(
    (
      await handleGovernance(
        request(
          { action: 'remember', token },
          { origin: 'https://reviewed-production.vercel.app' },
        ),
      )
    ).status,
  ).toBe(200);
  expect(
    (
      await handleGovernance(
        request(
          { action: 'remember', token },
          { origin: 'https://other-project.vercel.app' },
        ),
      )
    ).status,
  ).toBe(403);
});
test('status parser rejects malformed scopes fake admin and economic activation', () => {
  const valid = {
    version: 1,
    administrator: false,
    permissions: [],
    leadership: 'none',
    multiGuildReady: false,
    canCreateAdditionalGuilds: false,
    economicRewardsEnabled: false,
  };
  expect(parseGovernanceStatus(valid)).toEqual(valid);
  for (const x of [
    { ...valid, administrator: true },
    { ...valid, permissions: ['service_role'] },
    { ...valid, economicRewardsEnabled: true },
    { ...valid, multiGuildReady: true },
  ])
    expect(() => parseGovernanceStatus(x)).toThrow();
});
