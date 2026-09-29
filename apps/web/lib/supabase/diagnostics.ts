import { getSupabasePublicConfig, type SupabasePublicConfig } from './env';

export type SupabaseConnectionStatus =
  | Readonly<{ status: 'connected' }>
  | Readonly<{ status: 'error'; message: string }>;

export const checkSupabaseConnection = async (
  request: typeof fetch = fetch,
  config: SupabasePublicConfig = getSupabasePublicConfig(),
): Promise<SupabaseConnectionStatus> => {
  try {
    const response = await request(`${config.url}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        apikey: config.publishableKey,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { status: 'error', message: 'Supabase connection failed' };
    }

    return { status: 'connected' };
  } catch {
    return { status: 'error', message: 'Supabase connection failed' };
  }
};
