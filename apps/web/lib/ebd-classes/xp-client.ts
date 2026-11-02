import { getSupabaseBrowserClient } from '../supabase/client';
import { guardGuildContext } from '../guild-governance/context-guard';
import { reloadOnlineTraveler } from '../supabase/online-sync';
import { levelForXp } from '../../features/journey/data/progression';

export type XpReceipt = {
  version: 1;
  status: 'credited' | 'weekly-limit';
  receiptId: string;
  travelerId: string;
  eventId: string;
  xp: 0 | 50;
  totalXp: number;
  level: number;
  weekStart: string;
  replayed: boolean;
  reviewPending: boolean;
};
type PendingStatus =
  'disabled' | 'legacy-reconciliation-required' | 'not-eligible' | 'suspended';
export type XpResult = XpReceipt | { version: 1; status: PendingStatus };
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const uuid = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value);
export function parseXpResult(value: unknown): XpResult {
  if (!object(value) || value.version !== 1)
    throw Error('Resposta de XP inválida.');
  if (
    [
      'disabled',
      'legacy-reconciliation-required',
      'not-eligible',
      'suspended',
    ].includes(String(value.status))
  )
    return value as XpResult;
  if (
    !['credited', 'weekly-limit'].includes(String(value.status)) ||
    !uuid(value.receiptId) ||
    !uuid(value.travelerId) ||
    !uuid(value.eventId) ||
    ![0, 50].includes(Number(value.xp)) ||
    typeof value.xp !== 'number' ||
    !Number.isSafeInteger(value.totalXp) ||
    Number(value.totalXp) < Number(value.xp) ||
    value.level !== levelForXp(Number(value.totalXp)) ||
    typeof value.weekStart !== 'string' ||
    !Number.isFinite(Date.parse(value.weekStart)) ||
    typeof value.replayed !== 'boolean' ||
    typeof value.reviewPending !== 'boolean' ||
    (value.status === 'credited') !== (value.xp === 50)
  )
    throw Error('Recibo de XP inválido.');
  return value as XpReceipt;
}
export async function claimAttendanceXp(
  actor: string,
  guild: string,
  lesson: string,
) {
  const verify = guardGuildContext(actor, guild);
  const { data, error } = await getSupabaseBrowserClient().rpc(
    'claim_ebd_attendance_xp',
    { p_actor: actor, p_lesson: lesson },
  );
  verify();
  if (error)
    throw Error(
      'Não foi possível confirmar o XP. A repetição é segura e não duplica o crédito.',
    );
  const result = parseXpResult(data);
  if ('eventId' in result && result.eventId !== lesson)
    throw Error('Recibo de outra aula.');
  let refreshed = true;
  if ('travelerId' in result && result.travelerId === actor) {
    try {
      refreshed = await reloadOnlineTraveler(actor);
    } catch {
      refreshed = false;
    }
    verify();
  }
  return { result, refreshed };
}
export async function loadCommunityXpHistory(actor: string, guild: string) {
  const verify = guardGuildContext(actor, guild);
  const { data, error } = await getSupabaseBrowserClient().rpc(
    'get_community_xp_history',
    { p_actor: actor },
  );
  verify();
  if (
    error ||
    !object(data) ||
    data.version !== 1 ||
    !Array.isArray(data.receipts) ||
    !Array.isArray(data.suspendedEvents) ||
    !data.suspendedEvents.every(uuid)
  )
    throw Error('Histórico de XP indisponível.');
  const receipts = data.receipts.map(parseXpResult);
  if (!receipts.every((r): r is XpReceipt => 'receiptId' in r))
    throw Error('Histórico de XP inválido.');
  return { receipts, suspendedEvents: data.suspendedEvents as string[] };
}
