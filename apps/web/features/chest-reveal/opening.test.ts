// @vitest-environment jsdom
import { beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ open: vi.fn(), operation: vi.fn() }));
vi.mock('../../lib/supabase/repositories/chest-repository', () => ({
  chestRepository: mocks,
}));
import { requestChestOpening } from './opening';
import { readVisual, bindReceipt } from './visual-store';
import {
  OWNER,
  TRAVELER,
  chestRow,
} from '../../../../tests/fixtures/chest-reveal';
beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
  let tail = Promise.resolve<unknown>(undefined);
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: (_k: string, _o: object, fn: () => Promise<unknown>) => {
        const p = tail.then(fn);
        tail = p.catch(() => undefined);
        return p;
      },
    },
  });
  mocks.open.mockResolvedValue({ ignored: 'not a receipt' });
  mocks.operation.mockImplementation(async (_t: string, key: string) => ({
    ...chestRow,
    operation_key: key,
  }));
});
test('opening uses existing RPC exactly once; duplicate tabs are serialized; response alone is not displayed', async () => {
  const calls = await Promise.allSettled([
    requestChestOpening(OWNER, TRAVELER, 'uncommon'),
    requestChestOpening(OWNER, TRAVELER, 'uncommon'),
  ]);
  expect(calls.map((c) => c.status)).toEqual(['fulfilled', 'rejected']);
  expect(mocks.open).toHaveBeenCalledTimes(1);
  expect(mocks.open.mock.calls[0]).toEqual([
    TRAVELER,
    'uncommon',
    readVisual(OWNER, TRAVELER).intent!.operationId,
  ]);
  if (calls[0].status === 'fulfilled')
    bindReceipt(OWNER, TRAVELER, calls[0].value);
});
test('uncertain result stays pending across reload and explicit retry consults same ID without a new grant', async () => {
  mocks.operation.mockResolvedValueOnce(null);
  await expect(
    requestChestOpening(OWNER, TRAVELER, 'uncommon'),
  ).rejects.toThrow(/pendente/);
  const id = readVisual(OWNER, TRAVELER).intent!.operationId;
  const confirmed = await requestChestOpening(
    OWNER,
    TRAVELER,
    'uncommon',
    true,
  );
  expect(confirmed.operationKey).toBe(`open:${id}`);
  expect(mocks.open).toHaveBeenCalledTimes(1);
});
test('network error preserves intent; explicit resend uses identical operation, no browser reward or RNG', async () => {
  mocks.open.mockRejectedValueOnce(new Error('network'));
  await expect(
    requestChestOpening(OWNER, TRAVELER, 'uncommon'),
  ).rejects.toThrow('network');
  const first = mocks.open.mock.calls[0];
  mocks.operation.mockResolvedValueOnce(null);
  await requestChestOpening(OWNER, TRAVELER, 'uncommon', true);
  expect(mocks.open.mock.calls[1]).toEqual(first);
});
test('no storage or cross-tab coordination means no economic request', async () => {
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: undefined,
  });
  await expect(requestChestOpening(OWNER, TRAVELER, 'common')).rejects.toThrow(
    /coordenação/,
  );
  expect(mocks.open).not.toHaveBeenCalled();
});
