'use client';

import { useAuth } from '../../../lib/supabase/auth-context';
import { Shell, RequireTraveler } from '../components/shell';
import { OnlineGuildHub } from '../components/online-guild-hub';
import { GuildHub } from './guild-hub';

export function GuildManageScreen() {
  const auth = useAuth();
  if (auth.status === 'loading') return <Shell back="/journey/guild" backLabel="Voltar à Guilda"><p role="status">Carregando painel da Guilda…</p></Shell>;
  if (auth.status !== 'signedIn') return <GuildHub />;
  return (
    <Shell back="/journey/guild" backLabel="Voltar à Guilda">
      <RequireTraveler>{(traveler) => <OnlineGuildHub traveler={traveler} management />}</RequireTraveler>
    </Shell>
  );
}
