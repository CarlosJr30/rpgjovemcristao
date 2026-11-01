import { getSession } from '../supabase/auth';
import {
  getCurrentOnlineUserId,
  getOnlineSessionRevision,
} from '../supabase/online-sync';
export async function governanceAction<T>(
  data: Record<string, unknown>,
  owner?: string,
): Promise<T> {
  const revision = getOnlineSessionRevision();
  const session = owner ? await getSession() : null;
  if (
    owner &&
    (!session ||
      session.user.id !== owner ||
      owner !== getCurrentOnlineUserId())
  )
    throw Error('Session changed');
  const r = await fetch('/api/guild-governance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(data),
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
    credentials: 'same-origin',
  });
  const value = await r.json();
  if (
    owner &&
    (revision !== getOnlineSessionRevision() ||
      owner !== getCurrentOnlineUserId())
  )
    throw Error('Session changed');
  if (!r.ok)
    throw Error(
      'Não foi possível confirmar esta operação. Confira sua permissão e os dados.',
    );
  if (data.action === 'command' && typeof window !== 'undefined')
    window.dispatchEvent(new Event('rpg:governance-updated'));
  return value.data as T;
}
