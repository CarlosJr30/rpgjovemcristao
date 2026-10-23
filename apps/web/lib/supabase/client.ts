import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { authDiagnostic, safeAuthError } from './auth-diagnostics';
import type { Database } from './database.types';
import { getSupabasePublicConfig } from './env';

let browserClient: SupabaseClient<Database> | undefined;

const authFetch: typeof fetch = async (input, init) => {
  const requestUrl =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  const url = new URL(requestUrl, window.location.origin);
  const isAuthRequest = url.pathname.startsWith('/auth/v1/');
  const method =
    init?.method ?? (input instanceof Request ? input.method : 'GET');
  // Query strings may carry a confirmation callback or a limited invite token.
  const operation = `${method.toUpperCase()} ${url.pathname}`;

  if (isAuthRequest) authDiagnostic('request:start', { operation });
  try {
    const response = await fetch(input, init);
    let error: ReturnType<typeof safeAuthError> = null;
    if (isAuthRequest && !response.ok) {
      try {
        error = safeAuthError(await response.clone().json());
      } catch {
        // Non-JSON responses are still diagnosed by status below.
      }
    }
    if (isAuthRequest)
      authDiagnostic('request:end', {
        operation,
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        error,
      });
    return response;
  } catch (error) {
    if (isAuthRequest)
      authDiagnostic('request:failed', {
        operation,
        error: safeAuthError(error),
      });
    throw error;
  }
};

export const getSupabaseBrowserClient = (): SupabaseClient<Database> => {
  if (typeof window === 'undefined') {
    throw new Error('Supabase browser client is only available in the browser');
  }

  if (!browserClient) {
    const { url, publishableKey } = getSupabasePublicConfig();
    const projectRef = new URL(url).hostname.split('.')[0];
    const globalDiagnostic = globalThis as typeof globalThis & {
      __rpgSupabaseClientCount?: number;
    };
    globalDiagnostic.__rpgSupabaseClientCount =
      (globalDiagnostic.__rpgSupabaseClientCount ?? 0) + 1;
    authDiagnostic('client:create', {
      instance: globalDiagnostic.__rpgSupabaseClientCount,
      storageKey: `sb-${projectRef}-auth-token`,
    });
    browserClient = createClient<Database>(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: { fetch: authFetch },
    });
  }

  return browserClient;
};

export const hasPersistedSupabaseSession = (): boolean => {
  if (typeof window === 'undefined') return false;
  const { url } = getSupabasePublicConfig();
  const projectRef = new URL(url).hostname.split('.')[0];
  return window.localStorage.getItem(`sb-${projectRef}-auth-token`) !== null;
};
