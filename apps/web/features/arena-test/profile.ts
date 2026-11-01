import { isArenaTestAvailable } from '../../lib/arena-test-scope';
import { getSupabaseBrowserClient } from '../../lib/supabase/client';
import {
  canUseTravelerInCurrentSession,
  getCurrentOnlineUserId,
  getOnlineSessionRevision,
} from '../../lib/supabase/online-sync';

export async function readArenaQaProfile(
  owner: string,
  traveler: string,
): Promise<50 | null> {
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
  return 50;
}
