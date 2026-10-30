import { INVITE_UUID } from '../guild-invites/contracts';
export type InviteIntent = { requestId: string; days: number; maxUses: number };
export const inviteIntentKey = (
  owner: string,
  actor: string,
  guild: string,
  selected: string | null,
) => `rpg-member-invite:${owner}:${actor}:${guild}:${selected ?? 'guild'}`;
export function readInviteIntent(key: string): InviteIntent | null {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  const x = JSON.parse(raw);
  if (
    !x ||
    typeof x !== 'object' ||
    Object.keys(x).sort().join(',') !== 'days,maxUses,requestId' ||
    !INVITE_UUID.test(x.requestId) ||
    !Number.isInteger(x.days) ||
    x.days < 1 ||
    x.days > 30 ||
    !Number.isInteger(x.maxUses) ||
    x.maxUses < 1 ||
    x.maxUses > 100
  )
    throw Error('Pending invitation requires review');
  return x;
}
