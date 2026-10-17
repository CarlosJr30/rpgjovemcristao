import { economyClient } from '../../../lib/economy/client';
import {
  reloadOnlineTraveler,
  getCurrentOnlineUserId,
} from '../../../lib/supabase/online-sync';
import {
  cardArenaStorage,
  type CardArenaScope,
  type CardSettlement,
} from '../persistence/card-arena-storage';
import { arenaRepository } from '../persistence/arena-storage';

/** Remote replay/ledger replaces all browser-calculated credits for authenticated play. */
export async function settleOnlineCardArenaReward(
  scope: CardArenaScope,
): Promise<CardSettlement | null> {
  if (scope.ownerId === 'local' || getCurrentOnlineUserId() !== scope.ownerId)
    return null;
  const session = cardArenaStorage.load(scope);
  if (!session || session.battle.phase !== 'finished') return null;
  if (session.settlement?.status === 'applied') return session.settlement;
  const battle = session.battle;
  // A lost response is retryable with this same server-issued ID. The server ledger,
  // rather than a browser reservation, makes retries safe across tabs/devices.
  const reward = await economyClient.settle(scope.travelerId, battle);
  if (getCurrentOnlineUserId() !== scope.ownerId) return null;
  if (
    !session.settlement &&
    !cardArenaStorage.reserve(scope, battle.id, reward)
  )
    throw Error(
      'Resultado confirmado no servidor; retome o treino para atualizar o cache.',
    );
  if (!cardArenaStorage.complete(scope, battle.id, reward, 'applied'))
    throw Error(
      'Resultado confirmado no servidor; retome o treino para atualizar o cache.',
    );
  arenaRepository.add({
    id: battle.id,
    playerId: scope.travelerId,
    opponentId: battle.opponent.snapshot.id,
    opponentName: battle.opponent.snapshot.name,
    result: battle.winner === 'player' ? 'victory' : 'defeat',
    roundCount: battle.round,
    createdAt: new Date().toISOString(),
    damageDealt: battle.player.damageDealt,
    damageTaken: battle.player.damageTaken,
    abilitiesUsed: battle.player.cardsPlayed,
    reward,
    settlement: 'applied',
  });
  await reloadOnlineTraveler(scope.travelerId);
  return { status: 'applied', reward };
}
