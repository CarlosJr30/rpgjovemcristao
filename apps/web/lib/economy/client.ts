import type { CardBattle, TrainingReward } from '@rpg/game-engine';
import type { BattleState, ArenaAction } from '@rpg/game-engine';
import type { JourneyAction, JourneyProgress } from './journey-authority';
import { getSupabaseBrowserClient } from '../supabase/client';

async function operation<T>(body: object): Promise<T> {
  const { data, error } = await getSupabaseBrowserClient().auth.getSession();
  if (error || !data.session)
    throw Error('Entre novamente para validar esta operação.');
  const response = await fetch('/api/economy', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok)
    throw Error('Não foi possível confirmar a operação no servidor.');
  return response.json() as Promise<T>;
}
export const economyClient = {
  journey: (travelerId: string, operationId: string, action: JourneyAction) =>
    operation<{ progress: JourneyProgress }>({
      operation: 'journey-action',
      travelerId,
      operationId,
      action,
    }),
  startClassic: (travelerId: string, opponentId: string) =>
    operation<BattleState>({
      operation: 'start-classic-battle',
      travelerId,
      opponentId,
    }),
  settleClassic: (
    travelerId: string,
    battleId: string,
    commands: ArenaAction[],
  ) =>
    operation<TrainingReward>({
      operation: 'settle-classic-battle',
      travelerId,
      battleId,
      commands,
    }),
  start: (travelerId: string, opponentId: string) =>
    operation<CardBattle>({
      operation: 'start-card-battle',
      travelerId,
      opponentId,
    }),
  settle: (travelerId: string, battle: CardBattle) =>
    operation<TrainingReward>({
      operation: 'settle-card-battle',
      travelerId,
      battleId: battle.id,
      commands: battle.commands,
    }),
  purchase: (travelerId: string, itemId: string) =>
    operation<{ status: 'purchased' | 'owned' }>({
      operation: 'purchase-equipment',
      travelerId,
      itemId,
    }),
};
