// @vitest-environment jsdom
import { beforeEach, expect, test } from 'vitest';
import { inviteIntentKey, readInviteIntent } from './invite-intent';
beforeEach(() => sessionStorage.clear());
test('pending emission can be resumed after reload without storing the invitation secret', () => {
  const key = inviteIntentKey('owner', 'actor', 'guild', null),
    value = {
      requestId: '10000000-0000-4000-8000-000000000001',
      days: 30,
      maxUses: 100,
    };
  expect(readInviteIntent(key)).toBeNull();
  sessionStorage.setItem(key, JSON.stringify(value));
  expect(readInviteIntent(key)).toEqual(value);
  expect(sessionStorage.getItem(key)).not.toContain('token');
});
test('another owner avatar Guild or class cannot inherit a pending emission', () => {
  const keys = [
    inviteIntentKey('a', 'actor', 'guild', null),
    inviteIntentKey('b', 'actor', 'guild', null),
    inviteIntentKey('a', 'other', 'guild', null),
    inviteIntentKey('a', 'actor', 'other', null),
    inviteIntentKey('a', 'actor', 'guild', 'class'),
  ];
  expect(new Set(keys).size).toBe(5);
});
test('corrupt out of bounds or secret-bearing browser state fails closed', () => {
  for (const x of [
    { requestId: 'invalid', days: 7, maxUses: 1 },
    { requestId: '10000000-0000-4000-8000-000000000001', days: 31, maxUses: 1 },
    {
      requestId: '10000000-0000-4000-8000-000000000001',
      days: 7,
      maxUses: 1,
      token: 'secret',
    },
  ]) {
    sessionStorage.setItem('key', JSON.stringify(x));
    expect(() => readInviteIntent('key')).toThrow();
  }
});
