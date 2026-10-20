import { getSupabaseBrowserClient } from '../client';
import type { WalletRow } from '../database.types';
import { ECONOMY_TRANSITION_NOTICE } from '../../authority/legacy-cutover';

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
    void travelerId;
    void coins;
    throw new Error(ECONOMY_TRANSITION_NOTICE);
  },
  async addCoins(travelerId: string, amount: number): Promise<number> {
    void travelerId;
    void amount;
    throw new Error(ECONOMY_TRANSITION_NOTICE);
  },
  async spendCoins(travelerId: string, amount: number): Promise<number> {
    void travelerId;
    void amount;
    throw new Error(ECONOMY_TRANSITION_NOTICE);
  },
};
