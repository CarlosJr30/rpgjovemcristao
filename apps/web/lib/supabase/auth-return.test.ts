// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest';
import {
  authCallbackPath,
  entryReturn,
  registrationDestination,
  safeEntryReturn,
} from './auth-return';

afterEach(() => window.history.replaceState({}, '', '/'));

test('keeps the clean leadership invitation destination without a token in the return URL', () => {
  const target='/guilda/lideranca/convite';
  window.history.replaceState({}, '', `/auth?next=${encodeURIComponent(target)}`);
  expect(entryReturn('/')).toBe(target);
  expect(registrationDestination()).toBe(`/journey/create?next=${encodeURIComponent(target)}`);
  expect(safeEntryReturn(target+'/arbitrary',window.location.origin)).toBeNull();
});

test('keeps an internal guild destination and its query without granting membership', () => {
  const target = '/journey/guild?code=test-invite';
  window.history.replaceState(
    {},
    '',
    `/auth?next=${encodeURIComponent(target)}`,
  );
  expect(entryReturn('/')).toBe(target);
  expect(registrationDestination()).toBe(
    `/journey/create?next=${encodeURIComponent(target)}`,
  );
  expect(authCallbackPath()).toBe(`/auth?next=${encodeURIComponent(target)}`);
});

test('keeps the agreed token route through registration and confirmation callback', () => {
  const path = `/guilda/convite/${'a'.repeat(64)}`;
  window.history.replaceState({}, '', `/auth?next=${encodeURIComponent(path)}`);
  expect(entryReturn('/')).toBe(path);
  expect(registrationDestination()).toBe(
    `/journey/create?next=${encodeURIComponent(path)}`,
  );
  expect(authCallbackPath()).toBe(`/auth?next=${encodeURIComponent(path)}`);
  expect(
    safeEntryReturn('/guilda/convite/invalid', window.location.origin),
  ).toBeNull();
});

test('refuses external, protocol-relative, auth-loop and malformed return paths', () => {
  for (const candidate of [
    'https://attacker.invalid/journey/guild',
    '//attacker.invalid/journey/guild',
    '/\\attacker.invalid/journey/guild',
    'javascript:alert(1)',
    '/auth',
    '/journey/../auth',
    '/journey/arena',
    '/journey/tower',
    '/journey/shop',
    null,
  ]) {
    expect(safeEntryReturn(candidate, window.location.origin)).toBeNull();
  }
  expect(entryReturn('/')).toBe('/');
  expect(registrationDestination()).toBe('/journey/create');
});
