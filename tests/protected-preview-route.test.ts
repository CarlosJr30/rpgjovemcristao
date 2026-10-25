import { describe, expect, it, vi } from 'vitest';
import type { BrowserContext } from '@playwright/test';
import { authenticateProtectedPreview } from './fixtures/protected-preview-route';

describe('protected Preview browser test transport', () => {
  it('matches only the exact origin and preserves the response without following redirects', async () => {
    const register = vi.fn();
    await authenticateProtectedPreview(
      { route: register } as unknown as BrowserContext,
      'https://candidate.vercel.app',
      'synthetic-test-token',
    );
    const [matches, handle] = register.mock.calls[0];
    expect(
      matches(new URL('https://candidate.vercel.app/journey?_rsc=1')),
    ).toBe(true);
    expect(matches(new URL('https://other.vercel.app/'))).toBe(false);
    expect(matches(new URL('https://candidate.vercel.app.evil.invalid/'))).toBe(
      false,
    );
    expect(matches(new URL('https://test.supabase.co/'))).toBe(false);
    const response = { status: 302, body: 'unchanged' };
    const route = {
      request: () => ({ headers: () => ({ accept: 'text/x-component' }) }),
      fetch: vi.fn().mockResolvedValue(response),
      fulfill: vi.fn(),
    };
    await handle(route);
    expect(route.fetch).toHaveBeenCalledWith({
      headers: {
        accept: 'text/x-component',
        'x-vercel-trusted-oidc-idp-token': 'synthetic-test-token',
      },
      maxRedirects: 0,
    });
    expect(route.fulfill).toHaveBeenCalledWith({ response });
  });

  it.each([
    'http://candidate.vercel.app',
    'https://candidate.vercel.app/path',
    'https://candidate.vercel.app/',
    'https://test.supabase.co',
    'https://rpgjovemcristao-web-inky.vercel.app',
  ])('rejects an unsafe or non-Preview target: %s', async (origin) => {
    const register = vi.fn();
    await expect(
      authenticateProtectedPreview(
        { route: register } as unknown as BrowserContext,
        origin,
        'synthetic',
      ),
    ).rejects.toThrow();
    expect(register).not.toHaveBeenCalled();
  });

  it('requires a token without logging it', async () => {
    await expect(
      authenticateProtectedPreview(
        {} as BrowserContext,
        'https://candidate.vercel.app',
        '',
      ),
    ).rejects.toThrow();
  });
});
