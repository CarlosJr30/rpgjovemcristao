import { chestRepository } from '../../lib/supabase/repositories/chest-repository';
import type { ChestType } from '../journey/data/chests';
import { receiptFromOperation } from './receipt';
import { openingLock, readVisual, startIntent } from './visual-store';
import { rejectOpeningIntent } from './visual-store';
import { CommunityOpeningSuspended } from '../../lib/community-chests/errors';
import { openQAShop, openShopChest } from '../../lib/qa-shop/client';
import { isShopRelease } from '../../lib/release-scope';

/** Economic intent goes to the existing RPC; animation is not involved. */
export function requestChestOpening(
  owner: string,
  traveler: string,
  type: ChestType,
  retry = false,
  communityOnly = false,
  qaShop = false,
  purchaseOperation?: string,
) {
  return openingLock(owner, traveler, async () => {
    const prior = readVisual(owner, traveler).intent;
    if (retry && (!prior || prior.type !== type))
      throw new Error('Não há solicitação pendente para reenviar.');
    const intent = retry
      ? prior!
      : startIntent(owner, traveler, type, purchaseOperation);
    const operationKey = `open:${intent.operationId}`;
    // On explicit retry, first consult the ledger. Never issue a fresh ID.
    const existing =
      retry || purchaseOperation
        ? await chestRepository.operation(traveler, operationKey)
        : null;
    try {
      if (!existing)
        await (isShopRelease()
          ? openShopChest(traveler, type, intent.operationId)
          : qaShop
            ? openQAShop(traveler, intent.operationId)
            : communityOnly
              ? chestRepository.openCommunity(
                  traveler,
                  type,
                  intent.operationId,
                )
              : chestRepository.open(traveler, type, intent.operationId));
    } catch (e) {
      if (
        (communityOnly || isShopRelease()) &&
        e instanceof CommunityOpeningSuspended
      )
        rejectOpeningIntent(owner, traveler, intent.operationId);
      throw e;
    }
    const row =
      existing ?? (await chestRepository.operation(traveler, operationKey));
    if (!row)
      throw new Error(
        'Abertura pendente de confirmação. Consulte o resultado antes de tentar novamente.',
      );
    return receiptFromOperation(row, traveler);
  });
}
