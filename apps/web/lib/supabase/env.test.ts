import { describe, expect, test } from 'vitest';
import { validateSupabasePublicEnv } from './env';

describe('Supabase public environment', () => {
  test('accepts and normalizes the public configuration', () => {
    expect(
      validateSupabasePublicEnv({
        url: ' https://project.supabase.co/ ',
        publishableKey: ' public-test-key ',
      }),
    ).toEqual({
      url: 'https://project.supabase.co',
      publishableKey: 'public-test-key',
    });
  });

  test('rejects missing values without including either value in the error', () => {
    expect(() => validateSupabasePublicEnv({})).toThrow(
      'Supabase environment variables are missing',
    );
  });

  test('rejects an invalid URL without echoing it', () => {
    expect(() =>
      validateSupabasePublicEnv({
        url: 'not-a-url',
        publishableKey: 'public-test-key',
      }),
    ).toThrow('Supabase URL is invalid');
  });

  test('allows HTTP only for local Supabase development', () => {
    expect(
      validateSupabasePublicEnv({
        url: 'http://127.0.0.1:54321',
        publishableKey: 'public-test-key',
      }).url,
    ).toBe('http://127.0.0.1:54321');

    expect(() =>
      validateSupabasePublicEnv({
        url: 'http://project.supabase.co',
        publishableKey: 'public-test-key',
      }),
    ).toThrow('Supabase URL is invalid');
  });
});
