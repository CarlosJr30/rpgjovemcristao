import { afterEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ rpc }) }));
import { createAuthorityPort } from './server';
afterEach(() => vi.unstubAllEnvs());
it('preserves HTTP 409 for persistent database conflicts instead of reporting server unavailable', async () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fixture.invalid');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'fixture-public');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fixture-server-only');
  rpc
    .mockResolvedValueOnce({ data: 3, error: null })
    .mockResolvedValueOnce({ data: null, error: { code: 'PT409' } });
  await expect(
    createAuthorityPort().call('owner', 'traveler', 'commit'),
  ).rejects.toMatchObject({ status: 409 });
});
