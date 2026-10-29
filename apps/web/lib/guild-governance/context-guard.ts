import {
  canUseTravelerInCurrentSession,
  getCurrentOnlineUserId,
  getOnlineSessionRevision,
} from '../supabase/online-sync';
import { getGuildSelection } from './selection';
export function guardGuildContext(actor: string, guild?: string) {
  const owner = getCurrentOnlineUserId(),
    revision = getOnlineSessionRevision(),
    selected = getGuildSelection(actor);
  const verify = () => {
    const current = getGuildSelection(actor);
    const sameScope = !guild
      ? current === selected
      : selected === null
        ? current === null || current === guild
        : selected === guild && current === selected;
    if (
      !owner ||
      owner !== getCurrentOnlineUserId() ||
      revision !== getOnlineSessionRevision() ||
      !canUseTravelerInCurrentSession(actor) ||
      !sameScope
    )
      throw Error('A conta, o avatar ou a Guilda mudou. Atualize a consulta.');
  };
  verify();
  return verify;
}
