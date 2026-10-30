// @vitest-environment jsdom
import { beforeEach, expect, test, vi } from 'vitest';
const mock = vi.hoisted(() => ({
  owner: 'owner',
  revision: 1,
  session: vi.fn(),
  verify: vi.fn(),
  finish: vi.fn(),
}));
vi.mock('../supabase/auth', () => ({ getSession: mock.session }));
vi.mock('../supabase/online-sync', () => ({
  getCurrentOnlineUserId: () => mock.owner,
  getOnlineSessionRevision: () => mock.revision,
}));
vi.mock('../guild-governance/context-guard', () => ({
  guardGuildContext: () => mock.verify,
}));
vi.mock('../guild-governance/selection', () => ({
  beginGuildWork: () => mock.finish,
}));
import { memberInviteAction, MemberInviteRejected } from './invites-client';
beforeEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
  mock.owner = 'owner';
  mock.revision++;
  mock.session.mockResolvedValue({
    user: { id: 'owner' },
    access_token: 'synthetic',
  });
});
test('account change before sending cannot use prior authenticated identity', async () => {
  mock.session.mockImplementation(async () => {
    mock.owner = 'other';
    return { user: { id: 'owner' }, access_token: 'synthetic' };
  });
  const f = vi.fn();
  vi.stubGlobal('fetch', f);
  await expect(
    memberInviteAction(
      { action: 'list', actor: 'actor', guildId: 'guild' },
      'owner',
    ),
  ).rejects.toThrow(/mudou/);
  expect(f).not.toHaveBeenCalled();
});
test('a late response from another session is discarded', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      mock.revision++;
      return Response.json({ data: [] });
    }),
  );
  await expect(
    memberInviteAction(
      { action: 'list', actor: 'actor', guildId: 'guild' },
      'owner',
    ),
  ).rejects.toThrow(/mudou/);
});
test('definitive rejection differs from unknown delivery so UI can preserve its nonce safely', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ error: 'Denied' }, { status: 403 })),
  );
  await expect(
    memberInviteAction({ action: 'create', actor: 'actor' }, 'owner'),
  ).rejects.toBeInstanceOf(MemberInviteRejected);
  expect(mock.finish).toHaveBeenCalledOnce();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ error: 'Unknown' }, { status: 503 })),
  );
  const unknownDelivery = memberInviteAction(
    { action: 'create', actor: 'actor' },
    'owner',
  );
  await expect(unknownDelivery).rejects.toThrow('Unknown');
  await expect(unknownDelivery).rejects.not.toBeInstanceOf(
    MemberInviteRejected,
  );
});
test('anonymous preview never borrows a player session', async () => {
  const f = vi.fn(async () => Response.json({ data: { guildName: 'Safe' } }));
  vi.stubGlobal('fetch', f);
  await memberInviteAction({ action: 'preview' });
  expect(mock.session).not.toHaveBeenCalled();
  expect(f.mock.calls[0]?.length).toBe(2);
  const init = (f.mock.calls as unknown as [string, RequestInit][])[0][1];
  expect(init.headers).not.toHaveProperty('Authorization');
});
