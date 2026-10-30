import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mock = vi.hoisted(() => ({
  create: vi.fn(),
  user: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@supabase/supabase-js', () => ({ createClient: mock.create }));
import { handleMemberInvite } from './invites-server';
const base = 'https://rpgjovemcristao-web-inky.vercel.app',
  a = '10000000-0000-4000-8000-000000000001',
  g = '00000000-0000-4000-8000-000000000100',
  token = 'a'.repeat(64);
const req = (data: unknown, headers: Record<string, string> = {}) =>
  new Request(base + '/api/ebd-member-invites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: base,
      Authorization: 'Bearer synthetic',
      ...headers,
    },
    body: JSON.stringify(data),
  });
const create = () => ({
  action: 'create',
  actor: a,
  guildId: g,
  classId: null,
  days: 30,
  maxUses: 100,
  requestId: a,
});
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('APP_BASE_URL', base);
  vi.stubEnv('VERCEL_ENV', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fixture.invalid');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'synthetic-publishable-key',
  );
  mock.create.mockReturnValue({ auth: { getUser: mock.user }, rpc: mock.rpc });
  mock.user.mockResolvedValue({
    data: {
      user: { id: a, is_anonymous: false, user_metadata: { role: 'leader' } },
    },
    error: null,
  });
  mock.rpc.mockResolvedValue({
    data: {
      guildName: 'Comunidade',
      className: 'Classe',
      expiresAt: '2026-11-10T00:00:00.000Z',
    },
    error: null,
  });
});
afterEach(() => vi.unstubAllEnvs());
test('preview does not authenticate or expose internal identifiers and secrets', async () => {
  const r = await handleMemberInvite(req({ action: 'remember', token }));
  expect(r.status).toBe(200);
  expect(mock.user).not.toHaveBeenCalled();
  expect(await r.json()).toEqual({
    data: {
      guildName: 'Comunidade',
      className: 'Classe',
      expiresAt: '2026-11-10T00:00:00.000Z',
    },
  });
  expect(r.headers.get('set-cookie')).toContain('HttpOnly');
  expect(r.headers.get('set-cookie')).toContain('SameSite=Lax');
  expect(r.headers.get('set-cookie')).toContain('Secure');
  expect(r.headers.get('cache-control')).toBe('no-store');
});
test('foreign origin and malformed extra privilege are rejected before RPC', async () => {
  expect(
    (
      await handleMemberInvite(
        req(create(), { Origin: 'https://attacker.invalid' }),
      )
    ).status,
  ).toBe(403);
  expect(
    (await handleMemberInvite(req({ ...create(), role: 'leader' }))).status,
  ).toBe(400);
  expect(mock.rpc).not.toHaveBeenCalled();
});
test('bounds rejected before remote operation', async () => {
  for (const values of [
    { days: 31 },
    { maxUses: 101 },
    { days: 1.5 },
    { maxUses: 0 },
  ])
    expect(
      (await handleMemberInvite(req({ ...create(), ...values }))).status,
    ).toBe(400);
  expect(mock.rpc).not.toHaveBeenCalled();
});
test('normal verified login is mandatory and metadata is not a permission source', async () => {
  mock.user.mockResolvedValue({
    data: { user: { is_anonymous: true, user_metadata: { role: 'leader' } } },
    error: null,
  });
  expect((await handleMemberInvite(req(create()))).status).toBe(401);
  expect(mock.rpc).not.toHaveBeenCalled();
});
test('creation fixes origin and fragment and generates QR without external service', async () => {
  mock.rpc.mockResolvedValue({
    data: { id: a, token, expiresAt: '2026-11-01T00:00:00Z', replayed: false },
    error: null,
  });
  const r = await handleMemberInvite(
    req(create(), {
      host: 'attacker.invalid',
      'x-forwarded-host': 'attacker.invalid',
    }),
  );
  expect(r.status).toBe(200);
  const body = await r.json();
  expect(body.data.url).toBe(base + '/guilda/participar#' + token);
  expect(body.data.qr).toMatch(/^data:image\/png;base64,/);
  expect(body.data).not.toHaveProperty('token');
  expect(mock.rpc).toHaveBeenCalledWith(
    'ebd_member_invite_create',
    expect.objectContaining({
      p_guild: g,
      p_class: null,
      p_days: 30,
      p_uses: 100,
    }),
  );
});
test('creation replay does not reexpose token or QR', async () => {
  mock.rpc.mockResolvedValue({
    data: {
      id: a,
      token: null,
      expiresAt: '2026-11-01T00:00:00Z',
      replayed: true,
    },
    error: null,
  });
  const r = await handleMemberInvite(req(create()));
  expect(await r.json()).toEqual({
    data: { id: a, expiresAt: '2026-11-01T00:00:00Z', replayed: true },
  });
});
test('accept uses cookie and explicit actor without inventing authentication', async () => {
  mock.rpc.mockResolvedValue({ data: { enrolled: true }, error: null });
  const r = await handleMemberInvite(
    req(
      { action: 'accept', actor: a, requestId: g },
      { Cookie: 'rpg_member_invite=' + token },
    ),
  );
  expect(r.status).toBe(200);
  expect(mock.user).toHaveBeenCalledWith('synthetic');
  expect(mock.rpc).toHaveBeenCalledWith('ebd_member_invite_accept', {
    p_token: token,
    p_actor: a,
    p_request: g,
  });
});
test('missing or duplicate cookie cannot resolve or accept a token', async () => {
  expect((await handleMemberInvite(req({ action: 'preview' }))).status).toBe(
    404,
  );
  expect(
    (
      await handleMemberInvite(
        req(
          { action: 'preview' },
          { Cookie: `rpg_member_invite=${token}; rpg_member_invite=${token}` },
        ),
      )
    ).status,
  ).toBe(404);
  expect(mock.rpc).not.toHaveBeenCalled();
});
test('expired revoked exhausted and unauthorized result remains a rejection', async () => {
  mock.rpc.mockResolvedValue({ data: null, error: { code: 'P0002' } });
  expect(
    (await handleMemberInvite(req({ action: 'remember', token }))).status,
  ).toBe(404);
  mock.rpc.mockResolvedValue({ data: null, error: { code: '42501' } });
  expect((await handleMemberInvite(req(create()))).status).toBe(403);
});
test('Preview with production backend fails closed', async () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('VERCEL_URL', 'candidate.vercel.app');
  expect((await handleMemberInvite(req(create()))).status).toBe(503);
  expect(mock.rpc).not.toHaveBeenCalled();
});
