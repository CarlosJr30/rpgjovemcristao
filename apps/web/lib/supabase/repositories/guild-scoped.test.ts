import { beforeEach, expect, test, vi } from 'vitest';
const mock = vi.hoisted(() => ({
  rpc: vi.fn(),
  owner: 'owner-a' as string | null,
  revision: 1,
  selection: null as string | null,
}));
vi.mock('../client', () => ({
  getSupabaseBrowserClient: () => ({ rpc: mock.rpc }),
}));
vi.mock('../online-sync', () => ({
  getCurrentOnlineUserId: () => mock.owner,
  getOnlineSessionRevision: () => mock.revision,
  canUseTravelerInCurrentSession: (actor: string) => actor === 'actor-a',
}));
vi.mock('../../guild-governance/selection', () => ({
  getGuildSelection: () => mock.selection,
  beginGuildWork: () => () => {},
}));
import { guildRepository } from './guild-repository';
import { EbdConflict, ebdRepository } from './guild-ebd-repository';
const a = '11111111-1111-4111-8111-111111111111',
  b = '22222222-2222-4222-8222-222222222222';
const context = (id: string, canManage = false) => ({
  guild: { id, name: id, status: 'active' },
  membership: {
    guild_id: id,
    traveler_id: 'actor-a',
    status: 'active',
    role: 'leader',
  },
  canManage,
});
beforeEach(() => {
  mock.rpc.mockReset();
  mock.owner = 'owner-a';
  mock.revision++;
  mock.selection = null;
});
test('two memberships require an explicit selection rather than the first row', async () => {
  mock.rpc.mockResolvedValue({
    data: { version: 1, guilds: [context(a), context(b)] },
    error: null,
  });
  await expect(guildRepository.getContext('actor-a')).rejects.toThrow(
    /explicitamente/,
  );
  expect((await guildRepository.getContext('actor-a', b))?.guild.id).toBe(b);
});
test('stored preference is validated against current membership and server capability wins over role label', async () => {
  mock.rpc.mockResolvedValue({
    data: { version: 1, guilds: [context(a)] },
    error: null,
  });
  mock.selection = b;
  await expect(guildRepository.getContext('actor-a')).rejects.toThrow(
    /participa/,
  );
  mock.selection = a;
  expect((await guildRepository.getContext('actor-a'))?.canManage).toBe(false);
});
test('foreign-avatar rows and stale account responses are discarded', async () => {
  mock.rpc.mockResolvedValue({
    data: {
      version: 1,
      guilds: [
        {
          ...context(a),
          membership: { ...context(a).membership, traveler_id: 'other' },
        },
      ],
    },
    error: null,
  });
  await expect(guildRepository.listContexts('actor-a')).rejects.toThrow(
    /inválidos/,
  );
  mock.rpc.mockImplementation(async () => {
    mock.owner = 'owner-b';
    mock.revision++;
    return { data: { version: 1, guilds: [context(a)] }, error: null };
  });
  await expect(guildRepository.listContexts('actor-a')).rejects.toThrow(
    /mudou/,
  );
});
test('scoped creation sends one existing intent without claims balances or economic data', async () => {
  mock.rpc.mockResolvedValue({
    data: { id: a, status: 'created' },
    error: null,
  });
  await expect(
    guildRepository.createScoped('actor-a', a, 'Comunidade', 'Descrição', b),
  ).resolves.toBe(a);
  expect(mock.rpc).toHaveBeenCalledWith('guild_scoped_command', {
    p_actor: 'actor-a',
    p_guild: a,
    p_action: 'create',
    p_id: a,
    p_request: b,
    p_data: { name: 'Comunidade', description: 'Descrição' },
  });
});
test('leave and removal include their exact community and member rather than broad avatar RPC', async () => {
  mock.rpc.mockResolvedValue({ data: { id: 'actor-a' }, error: null });
  await guildRepository.leaveScoped('actor-a', a, b);
  await guildRepository.removeScoped('member-b', 'actor-a', b, a);
  expect(mock.rpc).toHaveBeenNthCalledWith(
    1,
    'guild_scoped_command',
    expect.objectContaining({ p_guild: a, p_id: 'actor-a', p_action: 'leave' }),
  );
  expect(mock.rpc).toHaveBeenNthCalledWith(
    2,
    'guild_scoped_command',
    expect.objectContaining({
      p_guild: b,
      p_id: 'member-b',
      p_action: 'remove',
    }),
  );
});
test('late community responses are discarded after a selection change', async () => {
  mock.selection = a;
  mock.rpc.mockImplementation(async () => {
    mock.selection = b;
    return {
      data: { version: 1, guilds: [context(a), context(b)] },
      error: null,
    };
  });
  await expect(guildRepository.getContext('actor-a', a)).rejects.toThrow(
    /mudou/,
  );
});

test('a creation receipt for another community is rejected', async () => {
  mock.rpc.mockResolvedValue({ data: { id: b }, error: null });
  await expect(
    guildRepository.createScoped('actor-a', a, 'Comunidade', 'Descrição', b),
  ).rejects.toThrow(/recibo/);
});

test('EBD read rejects a workspace from a different selected community', async () => {
  mock.rpc.mockResolvedValue({
    data: {
      version: 1,
      guildId: b,
      lessons: [],
      activities: [],
      answers: [],
      attendance: [],
      members: [],
      teachers: [],
      history: [],
      rewards: [],
    },
    error: null,
  });
  await expect(ebdRepository.load('actor-a', 0, a)).rejects.toThrow(
    /indisponível/,
  );
});
test('EBD command binds selected Guild and preserves conflict handling', async () => {
  mock.rpc.mockResolvedValue({ data: null, error: { code: '40001' } });
  await expect(
    ebdRepository.command('actor-a', 'state', b, 2, { state: 'published' }, a),
  ).rejects.toThrow(/Outra atualização/);
  expect(mock.rpc).toHaveBeenCalledWith(
    'guild_scoped_ebd_command',
    expect.objectContaining({
      p_actor: 'actor-a',
      p_guild: a,
      p_id: b,
      p_revision: 2,
    }),
  );
});

test('non-retryable EBD revision conflict preserves the editor conflict path', async () => {
  mock.rpc.mockResolvedValue({ data: null, error: { code: 'PT409' } });
  await expect(
    ebdRepository.command(
      'actor-a',
      'lesson',
      b,
      2,
      { title: 'Unsaved draft' },
      a,
    ),
  ).rejects.toBeInstanceOf(EbdConflict);
});
