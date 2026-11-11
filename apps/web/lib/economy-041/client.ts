import { getSupabaseBrowserClient } from '../supabase/client';
import {
  canUseTravelerInCurrentSession,
  getCurrentOnlineUserId,
  getOnlineSessionRevision,
  reloadOnlineTraveler,
} from '../supabase/online-sync';
import { activeTraining } from '../training-qa/client';
import { isShopRelease } from '../release-scope';
import { uuid } from '../../features/chest-reveal/receipt';

function guard(actor: string) {
  const owner = getCurrentOnlineUserId(),
    revision = getOnlineSessionRevision();
  const verify = () => {
    if (
      !owner ||
      getCurrentOnlineUserId() !== owner ||
      getOnlineSessionRevision() !== revision ||
      !canUseTravelerInCurrentSession(actor) ||
      !isShopRelease() ||
      activeTraining(actor)
    )
      throw Error('Retome seu avatar na economia oficial.');
  };
  verify();
  return { owner: owner!, verify };
}
export type ResaleAccess = {
  quantity: number;
  eligible: boolean;
  sellValue: number;
};
export async function readResaleAccess(
  actor: string,
  item: string,
): Promise<ResaleAccess> {
  const { verify } = guard(actor);
  const { data, error } = await getSupabaseBrowserClient().rpc(
    'get_repeated_item_access',
    { p_actor: actor, p_item: item },
  );
  verify();
  if (
    error ||
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    data.version !== 1 ||
    data.actor !== actor ||
    data.itemId !== item ||
    typeof data.eligible !== 'boolean' ||
    !Number.isSafeInteger(data.quantity) ||
    Number(data.quantity) < 0 ||
    !Number.isSafeInteger(data.sellValue) ||
    Number(data.sellValue) < 0
  )
    throw Error('Não foi possível confirmar a cópia excedente.');
  return {
    quantity: Number(data.quantity),
    eligible: data.eligible,
    sellValue: Number(data.sellValue),
  };
}
export async function sellRepeated(
  actor: string,
  item: string,
  expected: number,
) {
  const { owner, verify } = guard(actor);
  const key = `rpg:economy041:sale:${owner}:${actor}:${item}`;
  if (!navigator.locks?.request)
    throw Error('Use um navegador com coordenação segura de operações.');
  return navigator.locks.request(key, { ifAvailable: true }, async (lock) => {
    if (!lock) throw Error('Há uma venda em andamento.');
    verify();
    let intent: { id: string; expected: number };
    const saved = localStorage.getItem(key);
    if (saved) {
      intent = JSON.parse(saved);
      if (
        !uuid(intent.id) ||
        !Number.isSafeInteger(intent.expected) ||
        intent.expected < 2
      )
        throw Error('Venda pendente inválida.');
    } else {
      intent = { id: crypto.randomUUID(), expected };
      localStorage.setItem(key, JSON.stringify(intent));
    }
    const { data, error } = await getSupabaseBrowserClient().rpc(
      'sell_repeated_item',
      {
        p_actor: actor,
        p_item: item,
        p_operation_id: intent.id,
        p_expected_quantity: intent.expected,
      },
    );
    verify();
    if (error) {
      // A definitive rejection did not commit. Network/unknown errors retain the original ID.
      if (['42501', 'PT409', '22023'].includes(error.code))
        localStorage.removeItem(key);
      throw Error(
        error.code === 'PT409'
          ? 'A coleção mudou. Atualize antes de vender.'
          : error.code === '42501'
            ? 'Esta cópia deve ser preservada.'
            : 'Venda não confirmada. Tente novamente sem iniciar outra operação.',
      );
    }
    if (
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      data.version !== 1 ||
      data.catalogVersion !== 'economy041-chest-v1' ||
      data.itemId !== item ||
      !uuid(data.receiptId) ||
      !Number.isSafeInteger(data.quantity) ||
      Number(data.quantity) < 1 ||
      !Number.isSafeInteger(data.coins) ||
      Number(data.coins) < 1
    )
      throw Error('Recibo de venda não confirmado.');
    localStorage.removeItem(key);
    await reloadOnlineTraveler(actor);
    verify();
    return { quantity: Number(data.quantity), coins: Number(data.coins) };
  });
}
export async function claimProgressReward(
  actor: string,
  kind: 'mission' | 'world',
  event: string,
) {
  const { verify } = guard(actor);
  const { data, error } = await getSupabaseBrowserClient().rpc(
    'claim_progress_reward',
    { p_actor: actor, p_kind: kind, p_event: event },
  );
  verify();
  if (
    error ||
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    data.version !== 1 ||
    data.catalogVersion !== 'economy041-chest-v1' ||
    !uuid(data.receiptId) ||
    data.eventKind !== kind ||
    data.eventId !== event
  )
    throw Error(
      'Recompensa indisponível. Conclusão e validações precisam estar confirmadas.',
    );
  await reloadOnlineTraveler(actor);
  verify();
  return data;
}
