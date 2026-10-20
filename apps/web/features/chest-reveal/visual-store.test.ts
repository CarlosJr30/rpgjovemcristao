// @vitest-environment jsdom
import { beforeEach, expect, test, vi } from 'vitest';
import {
  OWNER,
  TRAVELER,
  receipt,
} from '../../../../tests/fixtures/chest-reveal';
import {
  bindReceipt,
  readVisual,
  saveCursor,
  startIntent,
} from './visual-store';
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
test('visual cursor is separated by account and Traveler, tracks presented index and summary but no loot', () => {
  const cursor = bindReceipt(OWNER, TRAVELER, receipt);
  saveCursor(OWNER, TRAVELER, { ...cursor, index: 1, seen: 2, summary: true });
  expect(bindReceipt(OWNER, TRAVELER, receipt)).toMatchObject({
    index: 1,
    seen: 2,
    summary: true,
  });
  expect(readVisual('other', TRAVELER).view).toBeNull();
  expect(readVisual(OWNER, 'other').view).toBeNull();
  expect(JSON.stringify(Object.values(localStorage))).not.toMatch(
    /armor|coins|reward|token|card/,
  );
  expect(bindReceipt(OWNER, TRAVELER, receipt, true)).toMatchObject({
    index: 0,
    seen: 0,
    summary: false,
  });
});
test('durable opening intent prevents fresh duplicate and receipt must match before intent is cleared', () => {
  const intent = startIntent(OWNER, TRAVELER, 'uncommon');
  expect(() => startIntent(OWNER, TRAVELER, 'common')).toThrow(/pendente/);
  expect(() => bindReceipt(OWNER, TRAVELER, receipt)).toThrow(/corresponde/);
  expect(readVisual(OWNER, TRAVELER).intent).toEqual(intent);
  bindReceipt(OWNER, TRAVELER, {
    ...receipt,
    operationKey: `open:${intent.operationId}`,
  });
  expect(readVisual(OWNER, TRAVELER).intent).toBeNull();
});
test('corrupt, unavailable or failed storage is explicit and never deletes previous bytes', () => {
  const cursor = bindReceipt(OWNER, TRAVELER, receipt);
  const k = localStorage.key(0)!;
  const raw = localStorage.getItem(k);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  expect(() => saveCursor(OWNER, TRAVELER, { ...cursor, seen: 1 })).toThrow(
    /salvar/,
  );
  expect(localStorage.getItem(k)).toBe(raw);
  vi.restoreAllMocks();
  localStorage.setItem(k, '{bad');
  expect(() => readVisual(OWNER, TRAVELER)).toThrow(/preservados/);
  expect(localStorage.getItem(k)).toBe('{bad');
});
test('a stale tab cannot overwrite a different receipt cursor', () => {
  const first = bindReceipt(OWNER, TRAVELER, receipt);
  bindReceipt(OWNER, TRAVELER, {
    ...receipt,
    id: '52345678-1234-4321-8234-123456789abc',
  });
  expect(() => saveCursor(OWNER, TRAVELER, first)).toThrow(/Outra/);
});
