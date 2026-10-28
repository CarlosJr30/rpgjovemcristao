import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mock = vi.hoisted(() => ({
  owner: 'owner-a',
  revision: 1,
  getSession: vi.fn(),
}));
vi.mock('../supabase/auth', () => ({ getSession: mock.getSession }));
vi.mock('../supabase/online-sync', () => ({
  getOnlineSessionRevision: () => mock.revision,
  getCurrentOnlineUserId: () => mock.owner,
}));
import { governanceAction } from './client';
beforeEach(() => {
  mock.owner = 'owner-a';
  mock.revision = 1;
  mock.getSession.mockResolvedValue({
    user: { id: mock.owner },
    access_token: 'synthetic-session',
  });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(Response.json({ data: { value: 'own' } })),
  );
});
afterEach(() => vi.unstubAllGlobals());
test('rejects a different account before requesting private governance data', async () => {
  mock.getSession.mockResolvedValue({
    user: { id: 'owner-b' },
    access_token: 'synthetic-other',
  });
  await expect(
    governanceAction({ action: 'workspace', offset: 0 }, 'owner-a'),
  ).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
});
test('discards an old account response after a session change', async () => {
  let resolve!: (r: Response) => void;
  vi.mocked(fetch).mockReturnValue(
    new Promise((r) => {
      resolve = r;
    }),
  );
  const pending = governanceAction(
    { action: 'workspace', offset: 0 },
    'owner-a',
  );
  await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
  mock.owner = 'owner-b';
  mock.revision++;
  resolve(Response.json({ data: { private: 'old account' } }));
  await expect(pending).rejects.toThrow('Session changed');
});
test('ordinary calls use own bearer same-origin cookie and no cache', async () => {
  await governanceAction({ action: 'status' }, 'owner-a');
  expect(fetch).toHaveBeenCalledWith(
    '/api/guild-governance',
    expect.objectContaining({
      credentials: 'same-origin',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers: expect.objectContaining({
        Authorization: 'Bearer synthetic-session',
      }),
    }),
  );
});
