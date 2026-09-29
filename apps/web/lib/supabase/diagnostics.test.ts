import { describe, expect, test, vi } from 'vitest';
import { checkSupabaseConnection } from './diagnostics';

const config = {
  url: 'https://project.supabase.co',
  publishableKey: 'public-test-key',
} as const;

describe('Supabase connection diagnostic', () => {
  test('checks the public Auth settings endpoint without requiring a table', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 200 }));

    await expect(checkSupabaseConnection(request, config)).resolves.toEqual({
      status: 'connected',
    });
    expect(request).toHaveBeenCalledWith(
      'https://project.supabase.co/auth/v1/settings',
      {
        method: 'GET',
        headers: { apikey: 'public-test-key' },
        cache: 'no-store',
      },
    );
  });

  test('returns a redacted error for rejected responses', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 401 }));

    await expect(checkSupabaseConnection(request, config)).resolves.toEqual({
      status: 'error',
      message: 'Supabase connection failed',
    });
  });

  test('returns a redacted error for network failures', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error('network detail'));

    await expect(checkSupabaseConnection(request, config)).resolves.toEqual({
      status: 'error',
      message: 'Supabase connection failed',
    });
  });
});
