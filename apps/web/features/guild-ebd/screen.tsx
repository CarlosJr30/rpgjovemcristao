'use client';
import { useAuth } from '../../lib/supabase/auth-context';
import { RequireTraveler } from '../journey/components/shell';
import { ReleaseShell as Shell } from '../release-ebd/shell';
import { GuildHub } from '../journey/screens/guild-hub';
import { EbdPanel } from './panel';
export function EbdScreen() {
  const auth = useAuth();
  if (auth.status === 'loading')
    return (
      <Shell back="/journey/guild" backLabel="Voltar à Guilda">
        <p role="status">Carregando Escola Bíblica…</p>
      </Shell>
    );
  if (auth.status !== 'signedIn') return <GuildHub />;
  return (
    <Shell back="/journey/guild" backLabel="Voltar à Guilda">
      <RequireTraveler>
        {(traveler) => <EbdPanel key={traveler.id} traveler={traveler} />}
      </RequireTraveler>
    </Shell>
  );
}
