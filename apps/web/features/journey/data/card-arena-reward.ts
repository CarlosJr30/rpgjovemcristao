import { calculateTrainingReward, type TrainingReward } from '@rpg/game-engine';
import {
  arenaRepository,
  type ArenaBattleRecord,
} from '../persistence/arena-storage';
import {
  cardArenaStorage,
  type CardArenaScope,
  type CardSettlement,
} from '../persistence/card-arena-storage';

export const emptyCardReward = (
  reason: TrainingReward['reason'] = 'defeat',
): TrainingReward => ({ xp: 0, coins: 0, rewarded: false, reason });
/** Call only inside the identity-specific Web Lock; persisted reservation precedes any credit. */
export function settleCardArenaReward(
  scope: CardArenaScope,
  apply: (reward: TrainingReward) => boolean,
): CardSettlement | null {
  const session = cardArenaStorage.load(scope);
  if (!session || session.battle.phase !== 'finished') return null;
  if (session.settlement) {
    if (session.settlement.status !== 'reserved')
      arenaRepository.finalizeCardReward(
        session.battle.id,
        session.settlement.reward,
        session.settlement.status,
      );
    return session.settlement;
  }
  const battle = session.battle;
  const reward = calculateTrainingReward(
    battle.winner === 'player',
    arenaRepository.rewardedToday(
      scope.travelerId,
      battle.opponent.snapshot.id,
    ),
  );
  if (
    arenaRepository.has(battle.id) ||
    !cardArenaStorage.reserve(scope, battle.id, reward)
  )
    return null;
  const record: ArenaBattleRecord = {
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
    reward: emptyCardReward(reward.reason),
    settlement: 'reserved',
  };
  if (!arenaRepository.add(record)) {
    cardArenaStorage.complete(
      scope,
      battle.id,
      emptyCardReward(reward.reason),
      'failed',
    );
    return { status: 'failed', reward: emptyCardReward(reward.reason) };
  }
  let applied = false;
  try {
    applied = !reward.rewarded || apply(reward);
  } catch {
    applied = false;
  }
  const result: CardSettlement = {
    status: applied ? 'applied' : 'failed',
    reward: applied ? reward : emptyCardReward(reward.reason),
  };
  // A crash or storage failure leaves a reservation, never a retryable credit.
  if (
    !cardArenaStorage.complete(
      scope,
      battle.id,
      result.reward,
      result.status as 'applied' | 'failed',
    )
  )
    return { status: 'reserved', reward: emptyCardReward(reward.reason) };
  arenaRepository.finalizeCardReward(
    battle.id,
    result.reward,
    result.status as 'applied' | 'failed',
  );
  return result;
}
