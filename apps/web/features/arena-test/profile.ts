import { isArenaTestAvailable } from '../../lib/arena-test-scope';
import { getSupabaseBrowserClient } from '../../lib/supabase/client';
import {
  canUseTravelerInCurrentSession,
  getCurrentOnlineUserId,
  getOnlineSessionRevision,
} from '../../lib/supabase/online-sync';
import { TOWER_FLOORS } from '../arena-tower/config';
import type { AttributeValues } from '../journey/domain/traveler';

export type QaTrainingProfile = Readonly<{
  level: 50;
  attributes: Readonly<AttributeValues>;
}>;

export async function readArenaQaProfile(
  owner: string,
  traveler: string,
): Promise<QaTrainingProfile | null> {
  if (
    !isArenaTestAvailable() ||
    owner !== getCurrentOnlineUserId() ||
    !canUseTravelerInCurrentSession(traveler)
  )
    throw Error('Perfil QA indisponível nesta sessão.');
  const revision = getOnlineSessionRevision();
  const r = await getSupabaseBrowserClient().rpc('get_arena_qa_profile', {
    p_traveler_id: traveler,
  });
  if (
    r.error ||
    revision !== getOnlineSessionRevision() ||
    owner !== getCurrentOnlineUserId() ||
    !canUseTravelerInCurrentSession(traveler)
  )
    throw Error('Não foi possível validar o perfil de treino.');
  if (r.data === null) return null;
  if (
    !r.data ||
    typeof r.data !== 'object' ||
    Array.isArray(r.data) ||
    r.data.kind !== 'qa-training' ||
    r.data.trainingLevel !== 50 ||
    r.data.canonicalLevel !== 1 ||
    r.data.canonicalXp !== 0
  )
    throw Error('Perfil de treino incompatível.');
  const attrs = r.data.trainingAttributes;
  const expected = TOWER_FLOORS[6].snapshot.attributes;
  if (
    r.data.trainingPreset !== 'tower-champion-attributes-v1' ||
    !attrs ||
    typeof attrs !== 'object' ||
    Array.isArray(attrs) ||
    Object.keys(attrs).length !== 4 ||
    !(['life', 'strength', 'defense', 'wisdom'] as const).every(
      (k) => attrs[k] === expected[k],
    )
  )
    throw Error('Preset de treino incompatível.');
  return Object.freeze({
    level: 50,
    attributes: Object.freeze({
      life: Number(attrs.life),
      strength: Number(attrs.strength),
      defense: Number(attrs.defense),
      wisdom: Number(attrs.wisdom),
    }),
  });
}
