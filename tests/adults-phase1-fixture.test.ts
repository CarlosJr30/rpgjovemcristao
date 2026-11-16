import { expect, test, vi } from 'vitest';
import type { BrowserContext } from '@playwright/test';
import { mockLocalReleaseAuth } from './fixtures/local-release-auth';
test('offline UI simulator explicitly distinguishes verified and unknown age', async () => {
  for (const [adultVerified, allowed] of [
    [true, true],
    [false, false],
  ]) {
    const route = vi.fn();
    await mockLocalReleaseAuth(
      { route } as unknown as BrowserContext,
      'http://127.0.0.1:3199',
      { adultVerified },
    );
    const respond = route.mock.calls.at(-1)![1];
    const fulfill = vi.fn();
    await respond({
      request: () => ({
        url: () => 'https://fixture.invalid/rest/v1/rpc/phase1_game_access',
      }),
      fulfill,
    });
    expect(fulfill).toHaveBeenCalledWith({ json: { version: 1, allowed } });
  }
});
test('offline simulator keeps enrollment closed and refuses external origins', async () => {
  const route = vi.fn();
  await expect(
    mockLocalReleaseAuth(
      { route } as unknown as BrowserContext,
      'https://example.invalid',
    ),
  ).rejects.toThrow('Loopback fixture required');
  await mockLocalReleaseAuth(
    { route } as unknown as BrowserContext,
    'http://127.0.0.1:3199',
  );
  const respond = route.mock.calls.at(-1)![1];
  const fulfill = vi.fn();
  await respond({
    request: () => ({
      url: () => 'https://fixture.invalid/rest/v1/rpc/phase1_enrollment_access',
    }),
    fulfill,
  });
  expect(fulfill).toHaveBeenCalledWith({
    json: { version: 1, allowed: false },
  });
});
