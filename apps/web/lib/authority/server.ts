import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from '../supabase/env';
import { AuthorityError, type AuthorityPort } from './service';

export function createAuthorityPort(): AuthorityPort {
  const config = getSupabasePublicConfig();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new AuthorityError(503);
  const options = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  };
  const verifier = createClient(config.url, config.publishableKey, options);
  const database = createClient(config.url, secret, options);
  return {
    async authenticate(token) {
      const { data, error } = await verifier.auth.getUser(token);
      return error || !data.user
        ? null
        : { id: data.user.id, anonymous: data.user.is_anonymous === true };
    },
    async call<T>(
      user: string,
      traveler: string,
      operation: string,
      payload: object = {},
    ) {
      const ready = await database.rpc('economy_protocol_version');
      if (ready.error || ready.data !== 3) throw new AuthorityError(503);
      const result = await database.rpc('arena_authority_v3', {
        p_user: user,
        p_traveler: traveler,
        p_operation: operation,
        p_payload: payload,
      });
      if (result.error)
        throw new AuthorityError(
          result.error.code === 'PT409' ||
            result.error.code === '40001' ||
            result.error.code === '23505'
            ? 409
            : result.error.code === '42501'
              ? 403
              : 503,
        );
      return result.data as T;
    },
  };
}
