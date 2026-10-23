import { chestRepository } from '../../lib/supabase/repositories/chest-repository';
import type { ChestType } from '../journey/data/chests';
import { receiptFromOperation } from './receipt';
import { openingLock, readVisual, startIntent } from './visual-store';

/** Economic intent goes to the existing RPC; animation is not involved. */
export function requestChestOpening(
  owner: string,
  traveler: string,
  type: ChestType,
  retry = false,
) {
  return openingLock(owner, traveler, async () => {
    const prior = readVisual(owner, traveler).intent;
    if (retry && (!prior || prior.type !== type))
      throw new Error('Não há solicitação pendente para reenviar.');
    const intent = retry ? prior! : startIntent(owner, traveler, type);
    const operationKey = `open:${intent.operationId}`;
    // On explicit retry, first consult the ledger. Never issue a fresh ID.
    const existing = retry
      ? await chestRepository.operation(traveler, operationKey)
      : null;
    if (!existing)
      await chestRepository.open(traveler, type, intent.operationId);
    const row =
      existing ?? (await chestRepository.operation(traveler, operationKey));
    if (!row)
      throw new Error(
        'Abertura pendente de confirmação. Consulte o resultado antes de tentar novamente.',
      );
    return receiptFromOperation(row, traveler);
  });
}
