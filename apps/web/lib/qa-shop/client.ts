import { getSupabaseBrowserClient } from '../supabase/client';
import {
  getCurrentOnlineUserId,
  getOnlineSessionRevision,
  canUseTravelerInCurrentSession,
  reloadOnlineTraveler,
} from '../supabase/online-sync';
import { isShopTestPreview } from '../release-scope';
import { uuid } from '../../features/chest-reveal/receipt';
export type ShopState = {
  enabled: boolean;
  coins: number;
  balanceVerified: boolean;
};
function guard(actor: string) {
  const owner = getCurrentOnlineUserId(),
    revision = getOnlineSessionRevision();
  const verify = () => {
    if (
      !isShopTestPreview() ||
      !owner ||
      owner !== getCurrentOnlineUserId() ||
      revision !== getOnlineSessionRevision() ||
      !canUseTravelerInCurrentSession(actor)
    )
      throw Error('Retome a conta e o avatar QA autorizados.');
  };
  verify();
  return verify;
}
export async function readQAShop(actor: string): Promise<ShopState> {
  const verify = guard(actor);
  const { data, error } = await getSupabaseBrowserClient().rpc('get_qa_shop', {
    p_actor: actor,
  });
  verify();
  if (
    error ||
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    data.version !== 1 ||
    data.qaOnly !== true ||
    typeof data.enabled !== 'boolean'
  )
    throw Error('Não foi possível confirmar o acesso à Loja TEST.');
  if (!data.enabled)
    return { enabled: false, coins: 0, balanceVerified: false };
  if (
    typeof data.coins !== 'number' ||
    !Number.isSafeInteger(data.coins) ||
    data.coins < 0 ||
    typeof data.balanceVerified !== 'boolean'
  )
    throw Error('Saldo QA inválido.');
  return {
    enabled: true,
    coins: data.coins,
    balanceVerified: data.balanceVerified,
  };
}
type Intent = { kind: 'chest' | 'equipment'; offer: string; id: string };
const key = (owner: string, actor: string) =>
  `rpg:qa-shop-purchase:v1:${owner}:${actor}`;
export function purchaseIntent(
  owner: string,
  actor: string,
  kind: Intent['kind'],
  offer: string,
): Intent {
  const raw = localStorage.getItem(key(owner, actor));
  if (raw) {
    const prior = JSON.parse(raw) as Intent;
    if (!uuid(prior.id) || prior.kind !== kind || prior.offer !== offer)
      throw Error(
        'Confirme a compra pendente anterior antes de iniciar outra.',
      );
    return prior;
  }
  const next = { kind, offer, id: crypto.randomUUID() };
  localStorage.setItem(key(owner, actor), JSON.stringify(next));
  return next;
}
export async function purchaseQAShop(
  actor: string,
  kind: Intent['kind'],
  offer: string,
) {
  const verify = guard(actor),
    owner = getCurrentOnlineUserId()!;
  if (!navigator.locks?.request)
    throw Error('Este navegador não oferece coordenação segura para compras.');
  return navigator.locks.request(
    key(owner, actor),
    { mode: 'exclusive', ifAvailable: true },
    async (lock) => {
      if (!lock)
        throw Error(
          'Há uma compra em andamento em outra aba. Consulte o resultado antes de repetir.',
        );
      verify();
      const intent = purchaseIntent(owner, actor, kind, offer);
      const { data, error } = await getSupabaseBrowserClient().rpc(
        'purchase_qa_shop',
        {
          p_actor: actor,
          p_kind: kind,
          p_offer: offer,
          p_operation_id: intent.id,
        },
      );
      verify();
      if (error)
        throw Error(
          'Compra não confirmada. Reenvie a mesma oferta para consultar sem duplicar.',
        );
      if (
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data) ||
        data.version !== 1 ||
        data.qaOnly !== true ||
        !uuid(data.receiptId) ||
        data.kind !== kind ||
        data.offer !== offer
      )
        throw Error(
          'Recibo não confirmado. Consulte a mesma compra novamente.',
        );
      if (!(await reloadOnlineTraveler(actor)))
        throw Error(
          'Recibo confirmado; recarregue o saldo antes de continuar.',
        );
      verify();
      if (localStorage.getItem(key(owner, actor)) === JSON.stringify(intent))
        localStorage.removeItem(key(owner, actor));
      return data;
    },
  );
}
export async function resumeQAPurchase(actor: string) {
  guard(actor);
  const raw = localStorage.getItem(key(getCurrentOnlineUserId()!, actor));
  if (!raw) throw Error('Nenhuma compra pendente neste avatar.');
  const prior = JSON.parse(raw) as Intent;
  if (
    !uuid(prior.id) ||
    !['chest', 'equipment'].includes(prior.kind) ||
    typeof prior.offer !== 'string'
  )
    throw Error('Solicitação pendente inválida.');
  return purchaseQAShop(actor, prior.kind, prior.offer);
}
export async function openQAShop(actor: string, operation: string) {
  const verify = guard(actor);
  const { error } = await getSupabaseBrowserClient().rpc('open_qa_shop_chest', {
    p_actor: actor,
    p_operation_id: operation,
  });
  verify();
  if (error)
    throw Error(
      'Abertura não confirmada. Consulte novamente usando a mesma solicitação.',
    );
}
