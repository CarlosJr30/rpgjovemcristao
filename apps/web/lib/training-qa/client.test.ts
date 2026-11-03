// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { decodeTraining, activeTraining, commandTraining } from './client';
import {
  setTraining,
  trainingNamespace,
  trainingSnapshot,
  type TrainingState,
} from './store';
const mock = vi.hoisted(() => ({
  rpc: vi.fn(),
  owner: vi.fn(),
  revision: vi.fn(),
}));
vi.mock('../supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ rpc: mock.rpc }),
}));
vi.mock('../supabase/online-sync', () => ({
  getCurrentOnlineUserId: mock.owner,
  getOnlineSessionRevision: mock.revision,
  canUseTravelerInCurrentSession: (id: string) =>
    id === '10000000-0000-4000-8000-000000000003',
}));
const actor = '10000000-0000-4000-8000-000000000003',
  owner = '00000000-0000-4000-8000-000000000003';
const state = (): TrainingState => ({
  version: 1,
  qaOnly: true,
  enabled: true,
  actor,
  activation: '00000000-0000-4000-8000-000000000101',
  expiresAt: '2099-01-01T00:00:00Z',
  coins: 10000,
  chests: 0,
  revision: 0,
  items: {},
  equipped: {},
  history: [],
});
beforeEach(() => {
  vi.clearAllMocks();
  mock.owner.mockReturnValue(owner);
  mock.revision.mockReturnValue(1);
  window.history.replaceState({}, '', '/journey/shop');
  setTraining(null);
});
afterEach(() => setTraining(null));
describe('isolated training client boundary', () => {
  it('disabled state never fabricates a budget', () => {
    expect(
      decodeTraining({ version: 1, qaOnly: true, enabled: false }),
    ).toBeNull();
    expect(trainingSnapshot()).toBeNull();
    expect(mock.rpc).not.toHaveBeenCalled();
  });
  it('rejects official responses or invalid balances', () => {
    expect(() => decodeTraining({ ...state(), qaOnly: false })).toThrow();
    expect(() => decodeTraining({ ...state(), coins: 10001 })).toThrow();
    expect(() => decodeTraining({ ...state(), coins: -1 })).toThrow();
  });
  it('rejects unknown items and wrong equipment slots', () => {
    expect(() =>
      decodeTraining({ ...state(), items: { 'unknown-card': 1 } }),
    ).toThrow();
    expect(() =>
      decodeTraining({
        ...state(),
        items: { 'traveler-sword-common': 1 },
        equipped: { shield: 'traveler-sword-common' },
      }),
    ).toThrow();
  });
  it('cannot issue any command before explicit mode selection', async () => {
    setTraining({ owner, actor, session: 1, state: state(), selected: false });
    await expect(
      commandTraining(
        actor,
        'purchase',
        { kind: 'chest', offer: 'common' },
        crypto.randomUUID(),
      ),
    ).rejects.toThrow();
    expect(mock.rpc).not.toHaveBeenCalled();
  });
  it('expiry and session rotation stop commands without falling through to canonical authority', async () => {
    setTraining({
      owner,
      actor,
      session: 1,
      state: { ...state(), expiresAt: '2000-01-01T00:00:00Z' },
      selected: true,
    });
    expect(() => activeTraining(actor)).toThrow();
    setTraining({ owner, actor, session: 1, state: state(), selected: true });
    mock.revision.mockReturnValue(2);
    await expect(
      commandTraining(
        actor,
        'purchase',
        { kind: 'chest', offer: 'common' },
        crypto.randomUUID(),
      ),
    ).rejects.toThrow();
    expect(mock.rpc).not.toHaveBeenCalled();
  });
  it('local QA journal and opening namespaces stay separate from ordinary saves', () => {
    const normal = trainingNamespace(actor);
    setTraining({ owner, actor, session: 1, state: state(), selected: true });
    expect(trainingNamespace(actor)).not.toBe(normal);
    expect(trainingNamespace('another-avatar')).toBe('');
    window.history.replaceState({}, '', '/journey/guild');
    expect(trainingNamespace(actor)).toBe('');
  });
  it('late response after mode exit does not reenter training or issue canonical writes', async () => {
    let finish!: (v: unknown) => void;
    mock.rpc.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    setTraining({ owner, actor, session: 1, state: state(), selected: true });
    const p = commandTraining(
      actor,
      'purchase',
      { kind: 'chest', offer: 'common' },
      crypto.randomUUID(),
    );
    setTraining(null);
    finish({ data: { version: 1, qaOnly: true }, error: null });
    await expect(p).rejects.toThrow('contexto mudou');
    expect(trainingSnapshot()).toBeNull();
    expect(mock.rpc).toHaveBeenCalledTimes(1);
    expect(mock.rpc.mock.calls[0][0]).toBe('command_training_qa');
  });
});
