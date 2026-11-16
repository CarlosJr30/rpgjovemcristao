import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { authDiagnostic, safeAuthError } from './auth-diagnostics';
import { getSupabaseBrowserClient } from './client';
import { authCallbackPath } from './auth-return';
import { verifiedGameAccess } from './adult-access';

export const signUp = async (
  email: string,
  password: string,
  displayName: string,
) => {
  const client = getSupabaseBrowserClient();
  const access = await client.rpc('phase1_enrollment_access');
  if (access.error || !verifiedGameAccess(access.data))
    throw new Error('Cadastro indisponível até haver verificação etária.');
  return client.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName.trim() },
      emailRedirectTo: `${window.location.origin}${authCallbackPath()}`,
    },
  });
};

export const signIn = async (email: string, password: string) => {
  authDiagnostic('signIn:start');
  const result = await getSupabaseBrowserClient().auth.signInWithPassword({
    email,
    password,
  });
  authDiagnostic('signIn:end', {
    error: safeAuthError(result.error),
    sessionPresent: Boolean(result.data.session),
    userPresent: Boolean(result.data.user),
  });
  return result;
};

export const signOut = async () => getSupabaseBrowserClient().auth.signOut();

export const getSession = async (): Promise<Session | null> => {
  authDiagnostic('getSession:start');
  const { data, error } = await getSupabaseBrowserClient().auth.getSession();
  authDiagnostic('getSession:end', {
    error: safeAuthError(error),
    sessionPresent: Boolean(data.session),
    userPresent: Boolean(data.session?.user),
  });
  if (error)
    throw new Error('Não foi possível verificar sua sessão.', {
      cause: error,
    });
  return data.session;
};

export const getAuthenticatedUser = async (): Promise<User | null> => {
  authDiagnostic('getUser:start');
  const { data, error } = await getSupabaseBrowserClient().auth.getUser();
  authDiagnostic('getUser:end', {
    error: safeAuthError(error),
    userPresent: Boolean(data.user),
  });
  if (error)
    throw new Error('Não foi possível validar sua conta.', { cause: error });
  return data.user;
};

export const onAuthStateChange = (
  listener: (event: AuthChangeEvent, session: Session | null) => void,
) =>
  getSupabaseBrowserClient().auth.onAuthStateChange((event, session) => {
    authDiagnostic('stateChange', {
      event,
      sessionPresent: Boolean(session),
      userPresent: Boolean(session?.user),
    });
    listener(event, session);
  }).data.subscription;

export const profileDisplayName = (user: User): string | null => {
  const value = user.user_metadata?.display_name;
  return typeof value === 'string' && value.trim().length >= 2
    ? value.trim().slice(0, 50)
    : null;
};
