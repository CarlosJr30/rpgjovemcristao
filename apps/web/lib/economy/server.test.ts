import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const { createClient, getUser, rpc } = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@supabase/supabase-js', () => ({ createClient }));
vi.mock('../supabase/env', () => ({
  getSupabasePublicConfig: () => ({
    url: 'https://synthetic.invalid',
    publishableKey: 'synthetic-public',
  }),
}));
import { createEconomyPort } from './server';
import { initialJourneyState } from './journey-authority';

beforeEach(() => {
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'synthetic-server-only');
  createClient.mockReset();
  getUser.mockReset();
  rpc.mockReset();
  createClient
    .mockReturnValueOnce({ auth: { getUser } })
    .mockReturnValueOnce({ rpc });
});
afterEach(() => vi.unstubAllEnvs());
test('verifies the supplied bearer with getUser instead of trusting session claims', async () => {
  getUser.mockResolvedValue({
    data: { user: { id: 'verified-subject', is_anonymous: false } },
    error: null,
  });
  expect(await createEconomyPort().authenticate('synthetic-bearer')).toEqual({
    id: 'verified-subject',
    anonymous: false,
  });
  expect(getUser).toHaveBeenCalledWith('synthetic-bearer');
  expect(createClient.mock.calls[0][1]).toBe('synthetic-public');
  expect(createClient.mock.calls[1][1]).toBe('synthetic-server-only');
  expect(createClient.mock.calls[1][2].auth.persistSession).toBe(false);
});
test('rejects invalid authentication even if a provider also returns user data', async () => {
  getUser.mockResolvedValue({
    data: { user: { id: 'untrusted' } },
    error: { message: 'invalid' },
  });
  expect(await createEconomyPort().authenticate('synthetic-bearer')).toBeNull();
});
test('fails closed when the server credential is absent', () => {
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
  expect(() => createEconomyPort()).toThrow();
  expect(rpc).not.toHaveBeenCalled();
});
test('binds database operations to the verified user and traveler without amounts', async () => {
  rpc.mockImplementation(async (name) => ({
    data: name === 'economy_protocol_version' ? 2 : { status: 'purchased' },
    error: null,
  }));
  await createEconomyPort().purchase(
    'verified-subject',
    'owned-traveler',
    'traveler-sword-common',
  );
  expect(rpc).toHaveBeenCalledWith('economy_authority', {
    p_user_id: 'verified-subject',
    p_traveler_id: 'owned-traveler',
    p_operation: 'purchase',
    p_payload: { itemId: 'traveler-sword-common' },
  });
});
test('does not reveal database diagnostics when a write is denied', async () => {
  rpc.mockResolvedValue({
    data: null,
    error: { message: 'sensitive diagnostics' },
  });
  await expect(
    createEconomyPort().purchase(
      'verified-subject',
      'other-traveler',
      'traveler-sword-common',
    ),
  ).rejects.toMatchObject({ status: 503 });
});

test.each([0, 1, null, undefined])(
  'refuses economic writes when the protocol is paused, absent or not yet cut over: %s',
  async (version) => {
    rpc.mockResolvedValue({ data: version, error: null });
    await expect(
      createEconomyPort().purchase(
        'subject',
        'traveler',
        'traveler-sword-common',
      ),
    ).rejects.toMatchObject({ status: 503 });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('economy_protocol_version');
  },
);

test('refuses writes when the protocol RPC does not exist, without calling legacy credit RPCs', async () => {
  rpc.mockResolvedValue({
    data: null,
    error: { code: '42883', message: 'function does not exist' },
  });
  await expect(
    createEconomyPort().purchase(
      'subject',
      'traveler',
      'traveler-sword-common',
    ),
  ).rejects.toMatchObject({ status: 503 });
  expect(rpc.mock.calls).toEqual([['economy_protocol_version']]);
});

test('recomputes a journey transition after a real optimistic-conflict response without changing its operation ID', async () => {
  let revision = 0,
    commits = 0;
  rpc.mockImplementation(async (name, args) => {
    if (name === 'economy_protocol_version') return { data: 2, error: null };
    if (args.p_operation === 'journey-context')
      return { data: { state: initialJourneyState(), revision }, error: null };
    commits++;
    if (commits === 1) {
      revision++;
      return { data: null, error: { code: '40001' } };
    }
    return { data: { progress: args.p_payload.state.progress }, error: null };
  });
  const p = createEconomyPort();
  await expect(
    p.journey!('subject', 'traveler', 'operation', {
      type: 'advance',
      step: 'explore',
    }),
  ).resolves.toMatchObject({ progress: { gardenStep: 'explore' } });
  const attempts = rpc.mock.calls.filter(
    ([, args]) => args?.p_operation === 'journey-commit',
  );
  expect(attempts).toHaveLength(2);
  expect(attempts.map(([, args]) => args.p_payload.operationId)).toEqual([
    'operation',
    'operation',
  ]);
  expect(attempts.map(([, args]) => args.p_payload.revision)).toEqual([0, 1]);
});
