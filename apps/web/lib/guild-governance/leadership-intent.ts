import { INVITE_UUID } from '../guild-invites/contracts';
type Intent = { id: string; requestId: string; hash: string };
const key = (owner: string) => `rpg:leadership-intent:${owner}`;
export async function leadershipIntent(
  owner: string,
  data: Record<string, unknown>,
): Promise<Intent> {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(data)),
  );
  const hash = Array.from(new Uint8Array(bytes), (x) =>
    x.toString(16).padStart(2, '0'),
  ).join('');
  const raw = sessionStorage.getItem(key(owner));
  if (raw) {
    const old = JSON.parse(raw) as Intent;
    if (
      !INVITE_UUID.test(old.id) ||
      !INVITE_UUID.test(old.requestId) ||
      !/^[a-f0-9]{64}$/.test(old.hash)
    )
      throw Error('Invalid pending operation');
    if (old.hash !== hash)
      throw Error('Resolve the pending invitation before changing it');
    return old;
  }
  const intent = {
    id: crypto.randomUUID(),
    requestId: crypto.randomUUID(),
    hash,
  };
  sessionStorage.setItem(key(owner), JSON.stringify(intent));
  return intent;
}
export function clearLeadershipIntent(owner: string, confirmedId: string) {
  const raw = sessionStorage.getItem(key(owner));
  if (raw && (JSON.parse(raw) as Intent).id === confirmedId)
    sessionStorage.removeItem(key(owner));
}
