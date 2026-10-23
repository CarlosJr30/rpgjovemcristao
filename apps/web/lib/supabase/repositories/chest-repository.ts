import type { ChestType } from '@rpg/game-engine';
import { getSupabaseBrowserClient } from '../client';
import type {
  ChestOpenResult,
  ChestOperationRow,
  ChestPurchaseResult,
  TravelerChestRow,
} from '../database.types';
import { requireData } from './errors';

export const chestRepository = {
  async claimPhaseReward(
    travelerId: string,
    rewardKey: 'phase:garden-choice',
  ): Promise<boolean> {
    void travelerId; void rewardKey;
    throw new Error('Recompensa da fase pausada até validação autoritativa. Nenhum baú foi concedido.');
  },
  async list(travelerId: string): Promise<TravelerChestRow[]> {
    const result = await getSupabaseBrowserClient()
      .from('traveler_chests')
      .select('*')
      .eq('traveler_id', travelerId)
      .order('created_at');
    if (result.error) throw new Error('Não foi possível carregar seus Baús.');
    return result.data;
  },

  async history(travelerId: string): Promise<ChestOperationRow[]> {
    const result = await getSupabaseBrowserClient()
      .from('chest_operations')
      .select('*')
      .eq('traveler_id', travelerId)
      .eq('operation_type', 'open')
      .order('created_at', { ascending: false })
      .limit(20);
    if (result.error)
      throw new Error('Não foi possível carregar o histórico de Baús.');
    return result.data;
  },

  async operation(
    travelerId: string,
    operationKey: string,
  ): Promise<ChestOperationRow | null> {
    const result = await getSupabaseBrowserClient()
      .from('chest_operations')
      .select('*')
      .eq('traveler_id', travelerId)
      .eq('operation_type', 'open')
      .eq('operation_key', operationKey)
      .maybeSingle();
    if (result.error)
      throw new Error(
        'Não foi possível confirmar a abertura. Consulte novamente sem abrir outro Baú.',
      );
    return result.data;
  },

  async purchase(
    travelerId: string,
    type: ChestType,
    operationId: string,
  ): Promise<ChestPurchaseResult> {
    const result = await getSupabaseBrowserClient().rpc('purchase_chest', {
      p_traveler_id: travelerId,
      p_chest_type: type,
      p_operation_id: operationId,
    });
    return requireData(result, 'Saldo insuficiente ou Baú indisponível.');
  },

  async open(
    travelerId: string,
    type: ChestType,
    operationId: string,
  ): Promise<ChestOpenResult> {
    const result = await getSupabaseBrowserClient().rpc('open_chest', {
      p_traveler_id: travelerId,
      p_chest_type: type,
      p_operation_id: operationId,
    });
    return requireData(result, 'Não foi possível abrir o Baú.');
  },
};
