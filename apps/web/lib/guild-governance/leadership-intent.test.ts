// @vitest-environment jsdom
import { beforeEach, expect, test } from 'vitest';
import { clearLeadershipIntent, leadershipIntent } from './leadership-intent';
beforeEach(() => sessionStorage.clear());
test('retry and reload reuse identifiers without storing recipient reason or secret', async () => {
  const data = {
    email: 'qa@controlled.test',
    reason: 'private administrative reason',
    days: 7,
  };
  const a = await leadershipIntent('a', data);
  expect(await leadershipIntent('a', data)).toEqual(a);
  const stored = sessionStorage.getItem('rpg:leadership-intent:a')!;
  expect(stored).not.toContain(data.email);
  expect(stored).not.toContain(data.reason);
  expect(Object.keys(JSON.parse(stored)).sort()).toEqual([
    'hash',
    'id',
    'requestId',
  ]);
});
test('changed payload cannot silently create another invitation', async () => {
  const a = await leadershipIntent('a', { days: 7 });
  await expect(leadershipIntent('a', { days: 6 })).rejects.toThrow('pending');
  clearLeadershipIntent('a', 'wrong');
  expect(await leadershipIntent('a', { days: 7 })).toEqual(a);
  clearLeadershipIntent('a', a.id);
  expect((await leadershipIntent('a', { days: 6 })).id).not.toBe(a.id);
});
test('corrupt pending storage fails closed', async () => {
  sessionStorage.setItem('rpg:leadership-intent:a', '{"id":"invalid"}');
  await expect(leadershipIntent('a', {})).rejects.toThrow();
});
