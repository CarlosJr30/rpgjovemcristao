import 'server-only';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import type { TrainingReward } from '@rpg/game-engine';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
  type Traveler,
} from '../../features/journey/domain/traveler';
import { EQUIPMENT_CATALOG } from '../../features/journey/data/equipmentCatalog';
import { levelForXp } from '../../features/journey/data/progression';
import { getSupabasePublicConfig } from '../supabase/env';
import {
  EconomyError,
  type EconomyPort,
  type RegisteredBattle,
} from './authority';
import { transitionJourney, type JourneyState } from './journey-authority';

/** A fresh client has no browser session and never persists a token. */
export function createEconomyPort(): EconomyPort {
  const config = getSupabasePublicConfig();
  const options = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  };
  const verifier = createClient(config.url, config.publishableKey, options);
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new EconomyError(503);
  const database = createClient(config.url, secret, options);
  let ready: Promise<void> | undefined;
  function ensureReady() {
    return (ready ??= (async () => {
      const result = await database.rpc('economy_protocol_version');
      if (result.error || result.data !== 2) throw new EconomyError(503);
    })());
  }
  async function call<T>(
    userId: string,
    travelerId: string,
    operation: string,
    payload: object = {},
  ): Promise<T> {
    await ensureReady();
    const result = await database.rpc('economy_authority', {
      p_user_id: userId,
      p_traveler_id: travelerId,
      p_operation: operation,
      p_payload: payload,
    });
    if (result.error || result.data === null)
      throw new EconomyError(
        result.error?.code === '40001'
          ? 409
          : result.error?.code === '42501'
            ? 403
            : 503,
      );
    return result.data as T;
  }
  return {
    async authenticate(token) {
      const { data, error } = await verifier.auth.getUser(token);
      return error || !data.user
        ? null
        : { id: data.user.id, anonymous: data.user.is_anonymous === true };
    },
    async loadTraveler(userId, travelerId) {
      const data = await call<{
        xp: number;
        name: string;
        coins: number;
        attributes: Traveler['attributes'];
        inventory: { item_id: string; quantity: number }[];
        equipped: Traveler['equipped'];
      }>(userId, travelerId, 'context');
      const traveler = createTraveler(
        data.name,
        DEFAULT_APPEARANCE,
        travelerId,
        new Date().toISOString(),
      );
      return {
        ...traveler,
        xp: data.xp,
        level: levelForXp(data.xp),
        coins: data.coins,
        attributes: data.attributes,
        equipped: data.equipped,
        inventory: data.inventory.flatMap((entry) => {
          const item = EQUIPMENT_CATALOG.find(
            (candidate) => candidate.id === entry.item_id,
          );
          return item ? [{ ...item, quantity: entry.quantity }] : [];
        }),
      };
    },
    start: (userId, travelerId, player, opponent, mode = 'card') =>
      call<RegisteredBattle>(userId, travelerId, 'start', {
        player,
        opponent,
        mode,
      }),
    battle: (userId, travelerId, battleId) =>
      call<RegisteredBattle>(userId, travelerId, 'battle', { battleId }),
    settle: (userId, travelerId, battleId, won) =>
      call<TrainingReward>(userId, travelerId, 'settle', { battleId, won }),
    purchase: (userId, travelerId, itemId) =>
      call(userId, travelerId, 'purchase', { itemId }),
    async journey(userId, travelerId, operationId, action) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const context = await call<{ state: JourneyState; revision: number }>(
          userId,
          travelerId,
          'journey-context',
        );
        let result;
        try {
          result = transitionJourney(context.state, action);
        } catch {
          throw new EconomyError(422);
        }
        try {
          return await call(userId, travelerId, 'journey-commit', {
            operationId,
            revision: context.revision,
            state: result.state,
            rewardKey: result.rewardKey,
            digest: createHash('sha256')
              .update(JSON.stringify(action))
              .digest('hex'),
          });
        } catch (error) {
          if (
            !(error instanceof EconomyError) ||
            error.status !== 409 ||
            attempt === 2
          )
            throw error;
        }
      }
      throw new EconomyError(409);
    },
  };
}
