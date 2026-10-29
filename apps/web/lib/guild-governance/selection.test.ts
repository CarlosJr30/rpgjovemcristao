// @vitest-environment jsdom
import { beforeEach, expect, test, vi } from 'vitest';
const state = vi.hoisted(() => ({
  owner: 'owner-a' as string | null,
  revision: 1,
}));
vi.mock('../supabase/online-sync', () => ({
  getCurrentOnlineUserId: () => state.owner,
  getOnlineSessionRevision: () => state.revision,
}));
import {
  getGuildSelection,
  selectGuild,
  restoreGuildSelection,
  beginGuildWork,
  isGuildBusy,
} from './selection';
import {
  beginGuildCreation,
  pendingGuildCreation,
  confirmGuildCreation,
} from './creation-intent';
const a = '11111111-1111-4111-8111-111111111111',
  b = '22222222-2222-4222-8222-222222222222';
beforeEach(() => {
  state.owner = 'owner-a';
  state.revision++;
  sessionStorage.clear();
});
test('selection is separate per account avatar and session revision', () => {
  selectGuild('actor-a', a);
  expect(getGuildSelection('actor-a')).toBe(a);
  expect(getGuildSelection('actor-b')).toBeNull();
  state.owner = 'owner-b';
  expect(getGuildSelection('actor-a')).toBeNull();
  selectGuild('actor-a', b);
  state.owner = 'owner-a';
  expect(getGuildSelection('actor-a')).toBe(a);
  state.revision++;
  expect(getGuildSelection('actor-a')).toBeNull();
});
test('reload can restore a preference but malformed values do not select a Guild', () => {
  selectGuild('actor-a', a);
  state.revision++;
  restoreGuildSelection('actor-a');
  expect(getGuildSelection('actor-a')).toBe(a);
  sessionStorage.setItem('rpg-guild-selection:owner-a:actor-b', 'forged-role');
  restoreGuildSelection('actor-b');
  expect(getGuildSelection('actor-b')).toBeNull();
});
test('anonymous navigation cannot set selection and arbitrary identifiers are rejected', () => {
  expect(() => selectGuild('actor-a', 'not-a-uuid')).toThrow();
  state.owner = null;
  expect(() => selectGuild('actor-a', a)).toThrow();
});
test('pending mutation prevents another command or context switch until its receipt settles', () => {
  selectGuild('actor-a', a);
  const finish = beginGuildWork('actor-a');
  expect(isGuildBusy('actor-a')).toBe(true);
  expect(() => selectGuild('actor-a', b)).toThrow(/confirmação/);
  expect(() => beginGuildWork('actor-a')).toThrow(/confirmação/);
  finish();
  selectGuild('actor-a', b);
  expect(isGuildBusy('actor-a')).toBe(false);
});
test('pending creation survives reconnect with one stable nonce and resource id', () => {
  const first = beginGuildCreation('actor-a', 'Comunidade A', 'Descrição');
  state.revision++;
  expect(pendingGuildCreation('actor-a')).toEqual(first);
  expect(beginGuildCreation('actor-a', 'Comunidade A', 'Descrição')).toEqual(
    first,
  );
  expect(() => beginGuildCreation('actor-a', 'Outra comunidade', '')).toThrow(
    /pendente/,
  );
  expect(pendingGuildCreation('actor-a')).toEqual(first);
});
test('pending creation cannot be inherited by another account or cleared by a wrong receipt', () => {
  const first = beginGuildCreation('actor-a', 'Comunidade A', 'Descrição');
  confirmGuildCreation('actor-a', b);
  expect(pendingGuildCreation('actor-a')).toEqual(first);
  state.owner = 'owner-b';
  expect(pendingGuildCreation('actor-a')).toBeNull();
  state.owner = 'owner-a';
  confirmGuildCreation('actor-a', first.id);
  expect(pendingGuildCreation('actor-a')).toBeNull();
});
test('corrupted pending intent fails closed instead of silently starting another creation', () => {
  sessionStorage.setItem('rpg-guild-creation:owner-a:actor-a', 'broken-json');
  expect(() => pendingGuildCreation('actor-a')).toThrow(/ilegível/);
  expect(() => beginGuildCreation('actor-a', 'Comunidade A', '')).toThrow();
});
