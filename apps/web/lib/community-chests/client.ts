import { getSupabaseBrowserClient } from '../supabase/client';
import { guardGuildContext } from '../guild-governance/context-guard';
import { uuid } from '../../features/chest-reveal/receipt';
export type ChestGrant = {
  version: 1;
  status: string;
  receiptId?: string;
  travelerId?: string;
  chestType?: 'common' | 'epic';
  eventId?: string;
};
const pending = [
  'disabled',
  'legacy-reconciliation-required',
  'not-eligible',
  'category-disabled',
  'suspended',
  'weekly-limit',
  'monthly-limit',
  'leader-monthly-limit',
];
export function parseChestGrant(value: unknown): ChestGrant {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('Resposta de baú inválida.');
  const v = value as Record<string, unknown>;
  if (v.version !== 1 || typeof v.status !== 'string')
    throw Error('Resposta de baú inválida.');
  if (pending.includes(v.status)) return v as ChestGrant;
  if (
    !['awarded', 'already-awarded'].includes(v.status) ||
    !uuid(v.receiptId) ||
    !uuid(v.travelerId) ||
    !uuid(v.eventId) ||
    !['common', 'epic'].includes(String(v.chestType))
  )
    throw Error('Recibo de baú inválido.');
  return v as ChestGrant;
}
export async function claimCommunityChest(
  actor: string,
  guild: string,
  mission: string,
) {
  const verify = guardGuildContext(actor, guild);
  const { data, error } = await getSupabaseBrowserClient().rpc(
    'claim_community_chest',
    { p_actor: actor, p_mission: mission },
  );
  verify();
  if (error)
    throw Error(
      'Não foi possível confirmar o baú. Consultar novamente não duplica a recompensa.',
    );
  return parseChestGrant(data);
}
export const chestGrantMessages: Record<string, string> = {
  disabled: 'Baús comunitários ainda indisponíveis.',
  'legacy-reconciliation-required':
    'Este avatar precisa de reconciliação econômica antes de receber baús. Seus dados foram preservados.',
  'not-eligible':
    'Esta atividade ainda não tem elegibilidade confirmada para você. Atividades anteriores à ativação não geram baús retroativos.',
  'category-disabled': 'Esta categoria de baú ainda não foi liberada.',
  suspended: 'Recompensa suspensa para revisão. Nenhum novo baú foi concedido.',
  'weekly-limit':
    'Você atingiu sete atividades com baú comum nesta semana. Continue participando normalmente.',
  'monthly-limit': 'Você atingiu quatro baús épicos neste mês.',
  'leader-monthly-limit':
    'O responsável atingiu dois eventos épicos recompensados neste mês.',
  awarded: 'Baú confirmado na Mochila. A abertura exige sua confirmação.',
  'already-awarded':
    'Esta recompensa já foi atribuída ao avatar do recibo original. Não foi concedido outro baú.',
};
