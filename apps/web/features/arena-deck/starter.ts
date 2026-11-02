import { getSupabaseBrowserClient } from '../../lib/supabase/client';
import {
  canUseTravelerInCurrentSession,
  getCurrentOnlineUserId,
  getOnlineSessionRevision,
} from '../../lib/supabase/online-sync';

export type StarterReceipt = {
  receiptId: string;
  travelerId: string;
  catalogVersion: string;
  status: 'available' | 'claimed-on-another-traveler';
};
const uuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
/** Called only after explicit player confirmation, never by a page-load effect. */
export async function requestArenaStarter(
  owner: string,
  traveler: string,
): Promise<StarterReceipt> {
  const revision = getOnlineSessionRevision();
  if (
    !owner ||
    owner !== getCurrentOnlineUserId() ||
    !canUseTravelerInCurrentSession(traveler)
  )
    throw Error('Viajante indisponível.');
  const { data, error } = await getSupabaseBrowserClient().rpc(
    'claim_arena_starter',
    { p_traveler_id: traveler },
  );
  if (
    error ||
    owner !== getCurrentOnlineUserId() ||
    revision !== getOnlineSessionRevision() ||
    !canUseTravelerInCurrentSession(traveler)
  )
    throw Error(
      'Não foi possível confirmar a solicitação. Você pode tentar novamente com segurança.',
    );
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    !uuid(data.receiptId) ||
    !uuid(data.travelerId) ||
    typeof data.catalogVersion !== 'string' ||
    data.catalogVersion.length > 160 ||
    !['available', 'claimed-on-another-traveler'].includes(
      String(data.status),
    ) ||
    (data.status === 'available' && data.travelerId !== traveler)
  )
    throw Error('Não foi possível confirmar o recibo.');
  return data as StarterReceipt;
}
