import { isArenaCard, type ArenaCard } from '@rpg/game-engine';
import { getSupabaseBrowserClient } from './client';
import {
  canUseTravelerInCurrentSession,
  getCurrentOnlineUserId,
  getOnlineSessionRevision,
} from './online-sync';

export type ArchiveCard = {
  card: ArenaCard;
  receiptId: string;
  version: string;
  provenance?: 'qa-training';
};
export async function readOwnedCards(
  travelerId: string,
): Promise<ArchiveCard[]> {
  const owner = getCurrentOnlineUserId(),
    session = getOnlineSessionRevision();
  if (!owner || !canUseTravelerInCurrentSession(travelerId))
    throw new Error('Conta indisponível.');
  const result = await getSupabaseBrowserClient().rpc('get_owned_cards', {
    p_traveler_id: travelerId,
  });
  if (
    result.error ||
    !Array.isArray(result.data) ||
    owner !== getCurrentOnlineUserId() ||
    session !== getOnlineSessionRevision() ||
    !canUseTravelerInCurrentSession(travelerId)
  )
    throw new Error('Não foi possível consultar as cartas.');
  return result.data.map((value) => {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      !isArenaCard(value.card) ||
      typeof value.version !== 'string' ||
      typeof value.receiptId !== 'string' ||
      !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
        value.receiptId,
      ) ||
      (value.provenance !== undefined &&
        (value.provenance !== 'qa-training' ||
          process.env.NEXT_PUBLIC_SUPABASE_URL !==
            'https://wkdvdzfkbwvhyjmamrsg.supabase.co'))
    )
      throw new Error('Carta indisponível para consulta.');
    return {
      card: value.card,
      version: value.version,
      receiptId: value.receiptId,
      ...(value.provenance === 'qa-training'
        ? { provenance: 'qa-training' as const }
        : {}),
    };
  });
}
