import { getSupabaseBrowserClient } from '../client';
import type { WalletRow } from '../database.types';

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
};
