import type { ChestType } from '@rpg/game-engine';
import { getSupabaseBrowserClient } from '../client';
import type {
  ChestOpenResult,
  ChestOperationRow,
  ChestPurchaseResult,
  TravelerChestRow,
} from '../database.types';
import { requireData } from './errors';
import {canUseTravelerInCurrentSession,getCurrentOnlineUserId,getOnlineSessionRevision} from '../online-sync';
import {CommunityOpeningSuspended} from '../../community-chests/errors';

export const chestRepository = {
  async communityGrants(travelerId:string):Promise<ChestOperationRow[]>{
    const result=await getSupabaseBrowserClient().from('chest_operations').select('*').eq('traveler_id',travelerId).eq('operation_type','grant').like('source','community001c:%').order('created_at',{ascending:false}).limit(20);
    if(result.error)throw Error('Não foi possível consultar os baús conquistados.');return result.data;
  },
  async openCommunity(travelerId:string,type:ChestType,operationId:string):Promise<ChestOpenResult>{
    const owner=getCurrentOnlineUserId(),session=getOnlineSessionRevision();
    if(!owner||!canUseTravelerInCurrentSession(travelerId))throw Error('Retome seu avatar antes de abrir baús.');
    const result=await getSupabaseBrowserClient().rpc('open_community_chest',{p_actor:travelerId,p_chest_type:type,p_operation_id:operationId});
    if(owner!==getCurrentOnlineUserId()||session!==getOnlineSessionRevision()||!canUseTravelerInCurrentSession(travelerId))throw Error('A conta ou avatar mudou. Consulte o resultado na conta original.');
    const data=requireData(result,'Não foi possível abrir este baú. Verifique elegibilidade, reconciliação e autorização atuais.');
    if(data&&typeof data==='object'&&!Array.isArray(data)&&data.status==='suspended')throw new CommunityOpeningSuspended('Recompensa suspensa para revisão. Nenhum conteúdo foi concedido por esta tentativa.');
    return data as unknown as ChestOpenResult;
  },
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
