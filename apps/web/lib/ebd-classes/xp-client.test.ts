import { beforeEach, expect, it, vi } from 'vitest';
import {
  claimAttendanceXp,
  loadCommunityXpHistory,
  parseXpResult,
} from './xp-client';
const m = vi.hoisted(() => ({
  rpc: vi.fn(),
  refresh: vi.fn(),
  verify: vi.fn(),
  guard: vi.fn(),
}));
vi.mock('../supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ rpc: m.rpc }),
}));
vi.mock('../supabase/online-sync', () => ({ reloadOnlineTraveler: m.refresh }));
vi.mock('../guild-governance/context-guard', () => ({
  guardGuildContext: m.guard,
}));
const actor = '11111111-1111-4111-8111-111111111111',
  lesson = '22222222-2222-4222-8222-222222222222';
const receipt = {
  version: 1,
  status: 'credited',
  receiptId: '33333333-3333-4333-8333-333333333333',
  travelerId: actor,
  eventId: lesson,
  xp: 50,
  totalXp: 200,
  level: 2,
  weekStart: '2026-11-02T03:00:00Z',
  replayed: false,
  reviewPending: false,
};
beforeEach(() => {
  vi.clearAllMocks();
  m.verify.mockReset();
  m.guard.mockReset().mockImplementation(() => m.verify);
  m.refresh.mockResolvedValue(true);
  m.rpc.mockResolvedValue({ data: receipt, error: null });
});
it('sends only actor and lesson to fixed XP operation and reloads canonical hero after receipt', async () => {
  expect((await claimAttendanceXp(actor, 'guild', lesson)).result).toEqual(
    receipt,
  );
  expect(m.rpc).toHaveBeenCalledExactlyOnceWith('claim_ebd_attendance_xp', {
    p_actor: actor,
    p_lesson: lesson,
  });
  expect(m.refresh).toHaveBeenCalledExactlyOnceWith(actor);
});
it('returns duplicate receipt without inventing another grant', async () => {
  m.rpc.mockResolvedValue({
    data: { ...receipt, replayed: true },
    error: null,
  });
  expect(
    (await claimAttendanceXp(actor, 'guild', lesson)).result,
  ).toMatchObject({ replayed: true, xp: 50 });
  expect(m.rpc).toHaveBeenCalledTimes(1);
});
it('refuses a receipt for another lesson before refreshing hero', async () => {
  m.rpc.mockResolvedValue({
    data: { ...receipt, eventId: actor },
    error: null,
  });
  await expect(claimAttendanceXp(actor, 'guild', lesson)).rejects.toThrow(
    'outra aula',
  );
  expect(m.refresh).not.toHaveBeenCalled();
});
it('does not refresh or transfer another owned avatar receipt', async () => {
  m.rpc.mockResolvedValue({
    data: { ...receipt, travelerId: lesson, replayed: true },
    error: null,
  });
  expect(
    (await claimAttendanceXp(actor, 'guild', lesson)).result,
  ).toMatchObject({ travelerId: lesson });
  expect(m.refresh).not.toHaveBeenCalled();
});
it.each([
  'disabled',
  'suspended',
  'not-eligible',
  'legacy-reconciliation-required',
])(
  'non-credit status %s does not create a successful reward or update hero',
  async (status) => {
    m.rpc.mockResolvedValue({ data: { version: 1, status }, error: null });
    expect(
      (await claimAttendanceXp(actor, 'guild', lesson)).result.status,
    ).toBe(status);
    expect(m.refresh).not.toHaveBeenCalled();
  },
);
it.each([
  { xp: 500 },
  { level: 50 },
  { receiptId: 'bad' },
  { status: 'weekly-limit' },
  { totalXp: -1 },
    { totalXp: 0, level: 1 },
  { weekStart: 'bad' },
  { xp: '50' },
])('rejects invalid or inconsistent monetary receipt %j', (change) => {
  expect(() => parseXpResult({ ...receipt, ...change })).toThrow();
});
it('rejects response after account avatar or Guilda context changes', async () => {
  m.verify.mockImplementation(() => {
    throw Error('scope changed');
  });
  await expect(claimAttendanceXp(actor, 'guild', lesson)).rejects.toThrow(
    'scope changed',
  );
  expect(m.refresh).not.toHaveBeenCalled();
});
it('keeps confirmed receipt when only hydration fails, rather than announcing that the credit failed', async () => {
  m.refresh.mockRejectedValue(Error('offline'));
  expect(await claimAttendanceXp(actor, 'guild', lesson)).toEqual({
    result: receipt,
    refreshed: false,
  });
});
it('redacts transport error and does not update local XP optimistically', async () => {
  m.rpc.mockResolvedValue({
    data: null,
    error: { message: 'private diagnostic' },
  });
  await expect(claimAttendanceXp(actor, 'guild', lesson)).rejects.toThrow(
    'repetição é segura',
  );
  expect(m.refresh).not.toHaveBeenCalled();
});
it('loads only own protected history and validates every receipt', async () => {
  m.rpc.mockResolvedValue({
    data: { version: 1, receipts: [receipt], suspendedEvents: [lesson] },
    error: null,
  });
  expect((await loadCommunityXpHistory(actor, 'guild')).receipts).toEqual([
    receipt,
  ]);
  expect(m.rpc).toHaveBeenCalledExactlyOnceWith('get_community_xp_history', {
    p_actor: actor,
  });
});
it('rejects suspended status passed as an official history receipt', async () => {
  m.rpc.mockResolvedValue({
    data: {
      version: 1,
      receipts: [{ version: 1, status: 'suspended' }],
      suspendedEvents: [],
    },
    error: null,
  });
  await expect(loadCommunityXpHistory(actor, 'guild')).rejects.toThrow();
});
