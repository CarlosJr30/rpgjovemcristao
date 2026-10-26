import { beforeEach, expect, it, vi } from 'vitest';
const { state, rpc, reload } = vi.hoisted(() => ({
  state: { owner: 'account-a' as string | null, allowed: true, session: 1 },
  rpc: vi.fn(),
  reload: vi.fn(),
}));
vi.mock('./client', () => ({ getSupabaseBrowserClient: () => ({ rpc }) }));
vi.mock('./online-sync', () => ({
  getCurrentOnlineUserId: () => state.owner,
  getOnlineSessionRevision: () => state.session,
  canUseTravelerInCurrentSession: () => state.allowed,
  reloadOnlineTraveler: reload,
}));
import { changeOnlineEquipment } from './online-equipment';
beforeEach(() => {
  vi.clearAllMocks();
  state.owner = 'account-a';
  state.allowed = true;
  state.session = 1;
  rpc.mockResolvedValue({ error: null });
  reload.mockResolvedValue(true);
});
it('waits for the server before refreshing attributes/avatar; sends IDs and expected slot only', async () => {
  let finish!: (v: { error: null }) => void;
  rpc.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const pending = changeOnlineEquipment(
    'traveler-a',
    'boots',
    'traveler-boots',
    null,
  );
  expect(reload).not.toHaveBeenCalled();
  expect(rpc).toHaveBeenCalledWith('set_owned_equipment', {
    p_traveler_id: 'traveler-a',
    p_slot: 'boots',
    p_item_id: 'traveler-boots',
    p_expected_item_id: null,
  });
  await expect(
    changeOnlineEquipment('traveler-a', 'boots', null, 'traveler-boots'),
  ).rejects.toThrow('Aguarde');
  finish({ error: null });
  await pending;
  expect(reload).toHaveBeenCalledExactlyOnceWith('traveler-a');
});
it('unequips on the same RPC without an inventory removal or economic snapshot', async () => {
  await changeOnlineEquipment('traveler-a', 'boots', null, 'traveler-boots');
  expect(rpc).toHaveBeenCalledWith('set_owned_equipment', {
    p_traveler_id: 'traveler-a',
    p_slot: 'boots',
    p_item_id: null,
    p_expected_item_id: 'traveler-boots',
  });
});
it.each(['42501', '40001', 'PT409', 'PGRST202'])(
  'does not update cache on denied, stale or missing RPC (%s)',
  async (code) => {
    rpc.mockResolvedValueOnce({ error: { code } });
    await expect(
      changeOnlineEquipment('traveler-a', 'boots', null, 'traveler-boots'),
    ).rejects.toThrow();
    expect(reload).not.toHaveBeenCalled();
    await changeOnlineEquipment('traveler-a', 'boots', null, 'traveler-boots');
  },
);
it('retains uncertainty after a lost read; does not claim the server rejected a committed change', async () => {
  reload.mockResolvedValue(false);
  await expect(
    changeOnlineEquipment('traveler-a', 'boots', null, 'traveler-boots'),
  ).rejects.toThrow('leitura não foi confirmada');
});
it('refuses a foreign traveler or logged-out state before network', async () => {
  state.allowed = false;
  await expect(
    changeOnlineEquipment('foreign', 'boots', null, null),
  ).rejects.toThrow('conta');
  state.allowed = true;
  state.owner = null;
  await expect(
    changeOnlineEquipment('foreign', 'boots', null, null),
  ).rejects.toThrow('conta');
  expect(rpc).not.toHaveBeenCalled();
});
it('does not refresh across an account switch during the RPC', async () => {
  rpc.mockImplementationOnce(async () => {
    state.owner = 'account-b';
    return { error: null };
  });
  await expect(
    changeOnlineEquipment('traveler-a', 'boots', null, 'traveler-boots'),
  ).rejects.toThrow('sessão mudou');
  expect(reload).not.toHaveBeenCalled();
});
it('does not refresh after logout/login of the same account during the RPC', async () => {
  rpc.mockImplementationOnce(async () => {
    state.session += 2;
    return { error: null };
  });
  await expect(
    changeOnlineEquipment('traveler-a', 'boots', null, 'traveler-boots'),
  ).rejects.toThrow('sessão mudou');
  expect(reload).not.toHaveBeenCalled();
});
