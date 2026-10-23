import { getSession } from '../supabase/auth';

export async function guildInviteAction<T>(
  input: Record<string, string>,
): Promise<T> {
  const session = await getSession();
  if (!session?.access_token) throw Error('Entre em sua conta para continuar.');
  const response = await fetch('/api/guild-invites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(input),
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
  });
  const data = await response.json();
  if (!response.ok)
    throw Error(
      typeof data.error === 'string'
        ? data.error
        : 'Não foi possível verificar o convite.',
    );
  return data as T;
}
