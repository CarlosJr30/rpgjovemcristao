import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { isArenaPreview } from './arena-preview';
import { proxy } from '../proxy';
afterEach(() => vi.unstubAllEnvs());
describe('server-owned Preview isolation', () => {
  it('does not activate in Production even with the local demo switch', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('RPG_ARENA_DEMO', '1');
    expect(isArenaPreview()).toBe(false);
    expect(
      proxy(
        new NextRequest('https://example.test/api/economy', { method: 'POST' }),
      ).headers.get('x-middleware-next'),
    ).toBe('1');
  });
  it('cannot be enabled by a browser header in the ordinary local game', () => {
    vi.stubEnv('VERCEL_ENV', '');
    vi.stubEnv('RPG_ARENA_DEMO', '');
    expect(
      proxy(
        new NextRequest('https://example.test/journey', {
          headers: { 'x-vercel-env': 'preview' },
        }),
      ).headers.get('x-middleware-next'),
    ).toBe('1');
  });
  it('rejects persistent methods and economic routes in Preview before handlers', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    for (const [url, method] of [
      ['/api/economy', 'POST'],
      ['/api/economy', 'GET'],
      ['/arena-demo', 'POST'],
      ['/assets/test.png', 'DELETE'],
    ]) {
      expect(
        proxy(new NextRequest('https://example.test' + url, { method })).status,
      ).toBe(403);
    }
  });
  it('redirects legacy gameplay and authentication to the isolated demo', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    for (const path of ['/', '/journey/arena', '/journey/shop', '/auth']) {
      const response = proxy(new NextRequest('https://example.test' + path));
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'https://example.test/arena-demo',
      );
    }
  });
  it('allows only demo/local assets with a same-origin connection policy', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    for (const path of [
      '/arena-demo',
      '/_next/static/test.js',
      '/assets/test.png',
    ]) {
      const response = proxy(new NextRequest('https://example.test' + path));
      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(response.headers.get('Content-Security-Policy')).toContain(
        "connect-src 'self'",
      );
      expect(response.headers.get('X-Arena-Demo')).toBe('memory-only');
    }
  });
});
