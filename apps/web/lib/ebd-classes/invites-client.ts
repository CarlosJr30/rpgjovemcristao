import { getSession } from '../supabase/auth';
import {
  getCurrentOnlineUserId,
  getOnlineSessionRevision,
} from '../supabase/online-sync';
import { guardGuildContext } from '../guild-governance/context-guard';
import { beginGuildWork } from '../guild-governance/selection';
export class MemberInviteRejected extends Error {}
export async function memberInviteAction<T>(
  data: Record<string, unknown>,
  owner?: string,
): Promise<T> {
  const revision = getOnlineSessionRevision();
  const verifyScope =
    typeof data.guildId === 'string' && typeof data.actor === 'string'
      ? guardGuildContext(data.actor, data.guildId)
      : () => {};
  const session = owner ? await getSession() : null;
  const verify = () => {
    verifyScope();
    if (
      owner &&
      (!session ||
        session.user.id !== owner ||
        owner !== getCurrentOnlineUserId() ||
        revision !== getOnlineSessionRevision())
    )
      throw Error('A conta ou a Guilda mudou. Atualize a consulta.');
  };
  verify();
  const finish =
    owner &&
    typeof data.actor === 'string' &&
    ['create', 'revoke', 'accept'].includes(String(data.action))
      ? beginGuildWork(data.actor)
      : () => {};
  try {
    const response = await fetch('/api/ebd-member-invites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(data),
      credentials: 'same-origin',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    });
    const result = await response.json();
    verify();
    if (!response.ok)
      throw new (
        [400, 401, 403, 404, 409].includes(response.status)
          ? MemberInviteRejected
          : Error
      )(
        typeof result.error === 'string'
          ? result.error
          : 'Operação indisponível.',
      );
    return result.data as T;
  } finally {
    finish();
  }
}
