import type { User } from '@supabase/supabase-js';
import { profileDisplayName } from '../auth';
import { getSupabaseBrowserClient } from '../client';
import { requireSuccess } from './errors';

export const profileRepository = {
  async ensure(user: User): Promise<void> {
    const result = await getSupabaseBrowserClient()
      .from('profiles')
      .upsert(
        { id: user.id, display_name: profileDisplayName(user) },
        { onConflict: 'id', ignoreDuplicates: true },
      );
    requireSuccess(result, 'Não foi possível preparar seu perfil.');
  },
};
