import { getSupabaseBrowserClient } from '../supabase/client';
import {
  getCurrentOnlineUserId,
  getOnlineSessionRevision,
  canUseTravelerInCurrentSession,
  reloadOnlineTraveler,
} from '../supabase/online-sync';
import { isShopTestPreview, isShopRelease } from '../release-scope';
import { CommunityOpeningSuspended } from '../community-chests/errors';
import { uuid } from '../../features/chest-reveal/receipt';
export type ShopState = {
  enabled: boolean;
  coins: number;
  balanceVerified: boolean;
  reason?: string;
};
function guard(actor: string) {
  const owner = getCurrentOnlineUserId(),
    revision = getOnlineSessionRevision();
  const verify = () => {
    if (
      !(isShopTestPreview() || isShopRelease()) ||
      !owner ||
      owner !== getCurrentOnlineUserId() ||
      revision !== getOnlineSessionRevision() ||
      !canUseTravelerInCurrentSession(actor)
    )
      throw Error('Retome a conta e o avatar autorizados.');
  };
  verify();
  return verify;
}
export async function readQAShop(actor: string): Promise<ShopState> {
  const verify = guard(actor);
  const { data, error } = await getSupabaseBrowserClient().rpc(
    isShopRelease() ? 'get_shop' : 'get_qa_shop',
    {
      p_actor: actor,
    },
  );
  verify();
  if (
    error ||
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    data.version !== 1 ||
    data.qaOnly !== !isShopRelease() ||
    typeof data.enabled !== 'boolean'
  )
    throw Error('Não foi possível confirmar o acesso à Loja.');
  if (!data.enabled)
    return {
      enabled: false,
      coins: 0,
      balanceVerified: false,
      reason: typeof data.reason === 'string' ? data.reason : undefined,
    };
  if (
    typeof data.coins !== 'number' ||
    !Number.isSafeInteger(data.coins) ||
    data.coins < 0 ||
    typeof data.balanceVerified !== 'boolean'
  )
    throw Error('Saldo inválido.');
  return {
    enabled: true,
    coins: data.coins,
    balanceVerified: data.balanceVerified,
  };
}
export async function readShopPurchases(actor: string) {
  const verify = guard(actor);
  if (!isShopRelease()) return [];
  const { data, error } = await getSupabaseBrowserClient()
    .from('chest_operations')
    .select('id,created_at,price_paid,rewards,operation_type')
    .eq('traveler_id', actor)
    .like('source', 'shop001c:%')
    .in('operation_type', ['purchase', 'equipment-purchase'])
    .order('created_at', { ascending: false })
    .limit(20);
  verify();
  if (error)
    throw Error(
      'Não foi possível consultar as compras. Seu saldo foi preservado.',
    );
  return data;
}
type Intent = { kind: 'chest' | 'equipment'; offer: string; id: string };
const key = (owner: string, actor: string) =>
  `rpg:${isShopRelease() ? 'shop' : 'qa-shop'}-purchase:v1:${owner}:${actor}`;
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
        isShopRelease() ? 'purchase_shop' : 'purchase_qa_shop',
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
        isShopRelease() &&
        data &&
        typeof data === 'object' &&
        !Array.isArray(data) &&
        data.version === 1 &&
        data.qaOnly === false &&
        data.status === 'suspended'
      ) {
        if (localStorage.getItem(key(owner, actor)) === JSON.stringify(intent))
          localStorage.removeItem(key(owner, actor));
        throw Error(
          'Compra suspensa para revisão. Nenhum novo débito ou item foi emitido.',
        );
      }
      if (
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data) ||
        data.version !== 1 ||
        data.qaOnly !== !isShopRelease() ||
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
export async function openShopChest(
  actor: string,
  type: string,
  operation: string,
) {
  const verify = guard(actor);
  if (!isShopRelease()) throw Error('Loja ainda indisponível.');
  const { data, error } = await getSupabaseBrowserClient().rpc(
    'open_shop_chest',
    { p_actor: actor, p_chest_type: type, p_operation_id: operation },
  );
  verify();
  if (error)
    throw Error(
      'Abertura não confirmada. Consulte a mesma solicitação novamente.',
    );
  if (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    data.status === 'suspended'
  )
    throw new CommunityOpeningSuspended(
      'Baú suspenso para revisão. Nenhum conteúdo foi concedido por esta tentativa.',
    );
}
