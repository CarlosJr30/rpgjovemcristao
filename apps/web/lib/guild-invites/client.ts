import { getSession } from '../supabase/auth';
import {
  getCurrentOnlineUserId,
  getOnlineSessionRevision,
} from '../supabase/online-sync';
import {
  getGuildSelection,
  beginGuildWork,
} from '../guild-governance/selection';
import { INVITE_UUID } from './contracts';

export async function guildInviteAction<T>(
  input: Record<string, string>,
): Promise<T> {
  const revision = getOnlineSessionRevision(),
    owner = getCurrentOnlineUserId(),
    scope = input.guildId ? getGuildSelection(input.travelerId) : null;
  const session = await getSession();
  if (!session?.access_token) throw Error('Entre em sua conta para continuar.');
  const verify = () => {
    const current = input.guildId ? getGuildSelection(input.travelerId) : null;
    const sameScope =
      scope === null
        ? current === null || current === input.guildId
        : current === scope && scope === input.guildId;
    if (
      input.guildId &&
      (!owner ||
        session.user?.id !== owner ||
        owner !== getCurrentOnlineUserId() ||
        revision !== getOnlineSessionRevision() ||
        !sameScope)
    )
      throw Error('A conta ou a Guilda mudou. Atualize a consulta.');
  };
  verify();
  const payload = { ...input };
  let pendingKey: string | undefined;
  if (input.guildId && input.action === 'create') {
    pendingKey = `rpg-guild-invite-request:${owner}:${input.travelerId}:${input.guildId}`;
    const prior = sessionStorage.getItem(pendingKey);
    if (prior && !INVITE_UUID.test(prior))
      throw Error(
        'Confira a solicitação pendente antes de emitir outro convite.',
      );
    payload.requestId = prior ?? crypto.randomUUID();
    sessionStorage.setItem(pendingKey, payload.requestId);
  }
  const finish =
    input.guildId && ['create', 'revoke'].includes(input.action)
      ? beginGuildWork(input.travelerId)
      : () => {};
  try {
    const response = await fetch('/api/guild-invites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    });
    const data = await response.json();
    verify();
    if (!response.ok)
      throw Error(
        typeof data.error === 'string'
          ? data.error
          : 'Não foi possível verificar o convite.',
      );
    if (pendingKey) sessionStorage.removeItem(pendingKey);
    return data as T;
  } finally {
    finish();
  }
}
