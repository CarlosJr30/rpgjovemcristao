import { getSupabaseBrowserClient } from '../client';
import type { WalletRow } from '../database.types';
import { requireData, requireSuccess } from './errors';

export const walletRepository = {
  async getWallet(travelerId: string): Promise<WalletRow | null> {
    const result = await getSupabaseBrowserClient()
      .from('wallets')
      .select('*')
      .eq('traveler_id', travelerId)
      .maybeSingle();
    if (result.error) throw new Error('Não foi possível carregar as moedas.');
    return result.data;
  },

  async setCoins(travelerId: string, coins: number): Promise<void> {
    if (!Number.isSafeInteger(coins) || coins < 0)
      throw new Error('Saldo de moedas inválido.');
    const result = await getSupabaseBrowserClient()
      .from('wallets')
      .update({ coins })
      .eq('traveler_id', travelerId);
    requireSuccess(result, 'Não foi possível salvar as moedas.');
  },

  async addCoins(travelerId: string, amount: number): Promise<number> {
    const result = await getSupabaseBrowserClient().rpc('add_coins', {
      p_traveler_id: travelerId,
      p_amount: amount,
    });
    return requireData(result, 'Não foi possível salvar as moedas.');
  },

  async spendCoins(travelerId: string, amount: number): Promise<number> {
    const result = await getSupabaseBrowserClient().rpc('spend_coins', {
      p_traveler_id: travelerId,
      p_amount: amount,
    });
    return requireData(result, 'Saldo insuficiente ou indisponível.');
  },
};
