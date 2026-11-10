import { beforeEach, expect, it, vi } from 'vitest';
const { rpc, state } = vi.hoisted(() => ({
  rpc: vi.fn(),
  state: { owner: 'owner' as string | null, session: 1, allowed: true },
}));
vi.mock('./client', () => ({ getSupabaseBrowserClient: () => ({ rpc }) }));
vi.mock('./online-sync', () => ({
  getCurrentOnlineUserId: () => state.owner,
  getOnlineSessionRevision: () => state.session,
  canUseTravelerInCurrentSession: () => state.allowed,
}));
import {
  equipmentAccessMessage,
  equipmentOperationError,
  readEquipmentAccess,
} from './equipment-access';
beforeEach(() => {
  vi.clearAllMocks();
  state.owner = 'owner';
  state.session = 1;
  state.allowed = true;
});
const response = (items: unknown, actor = 'actor') => ({
  data: { version: 1, actor, items },
  error: null,
});
it('distinguishes inventory possession from confirmed provenance returned by the server', async () => {
  const items = [
    { itemId: 'traveler-boots', sourceConfirmed: true, reason: null },
    {
      itemId: 'traveler-helmet-rare',
      sourceConfirmed: false,
      reason: 'acquisition-unconfirmed',
    },
  ];
  rpc.mockResolvedValue(response(items));
  expect(await readEquipmentAccess('actor')).toEqual(items);
  expect(rpc).toHaveBeenCalledExactlyOnceWith('get_equipment_access', {
    p_actor: 'actor',
  });
});
it.each([
  response([{ itemId: 'helmet', sourceConfirmed: true, reason: 'unexpected' }]),
  response([{ itemId: 'helmet', sourceConfirmed: false, reason: null }]),
  response([
    { itemId: 'helmet', sourceConfirmed: true, reason: null },
    { itemId: 'helmet', sourceConfirmed: true, reason: null },
  ]),
  response([], 'foreign'),
  { data: null, error: { code: 'PGRST202' } },
])(
  'never authorizes malformed, foreign or missing server evidence',
  async (value) => {
    rpc.mockResolvedValue(value);
    await expect(readEquipmentAccess('actor')).rejects.toThrow();
  },
);
it('discards an authorized answer when the session changes during the request', async () => {
  rpc.mockImplementation(async () => {
    state.session++;
    return response([
      { itemId: 'traveler-boots', sourceConfirmed: true, reason: null },
    ]);
  });
  await expect(readEquipmentAccess('actor')).rejects.toThrow('Retome');
});
it('does not query another account/avatar', async () => {
  state.allowed = false;
  await expect(readEquipmentAccess('foreign')).rejects.toThrow('Retome');
  expect(rpc).not.toHaveBeenCalled();
});
it.each([
  ['42501', 'Equipment policy disabled', 'temporariamente'],
  ['42501', 'Equipment slot denied', 'slot selecionado'],
  ['42501', 'Equipment denied', 'slot selecionado'],
  ['42501', 'Verified acquisition receipt required', 'Origem pendente'],
  ['42501', 'Verified economic provenance required', 'regularização'],
  ['42501', 'Item ownership denied', 'Mochila'],
  ['42501', 'Equipment level required', 'nível'],
  ['PT409', 'Battle in progress', 'combate'],
  ['PT409', 'Equipment changed; reload', 'outra aba'],
  [
    'PGRST202',
    'sensitive arbitrary server internals',
    'Não foi possível confirmar',
  ],
])(
  'explains known refusals without exposing arbitrary server text (%s/%s)',
  (code, message, expected) => {
    expect(equipmentOperationError({ code, message })).toContain(expected);
    expect(equipmentOperationError({ code, message })).not.toContain(
      'sensitive',
    );
  },
);
it('keeps a read/network failure distinct from a provenance refusal', () => {
  expect(equipmentAccessMessage(undefined)).toContain(
    'Autorização não confirmada',
  );
});
