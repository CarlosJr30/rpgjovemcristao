import { beforeEach, describe, expect, test, vi } from 'vitest';

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock('@supabase/supabase-js', () => ({ createClient }));
vi.mock('./env', () => ({
  getSupabasePublicConfig: () => ({
    url: 'https://project.supabase.co',
    publishableKey: 'public-key',
  }),
}));

beforeEach(() => {
  vi.resetModules();
  createClient.mockReset();
  Object.assign(globalThis, {
    window: {
      localStorage: {
        getItem: vi.fn(() => null),
      },
    },
  });
});

describe('Supabase browser client', () => {
  test('shares one client with persistent browser auth enabled', async () => {
    const client = { auth: {} };
    createClient.mockReturnValue(client);
    const { getSupabaseBrowserClient } = await import('./client');

    expect(getSupabaseBrowserClient()).toBe(client);
    expect(getSupabaseBrowserClient()).toBe(client);
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'public-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        global: { fetch: expect.any(Function) },
      },
    );
  });
});
