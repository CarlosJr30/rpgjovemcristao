'use client';
import { useAuth } from '../../lib/supabase/auth-context';
import { RequireTraveler } from '../journey/components/shell';
import { ReleaseShell as Shell } from '../release-ebd/shell';
import { GuildHub } from '../journey/screens/guild-hub';
import { EbdPanel } from './panel';
import { GuildHall } from '../journey/components/guild-artwork';
import releaseStyles from '../release-ebd/release.module.css';
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
        {(traveler) => (
          <GuildHall className={releaseStyles.guildScene}>
            <div className={releaseStyles.content}>
              <EbdPanel key={traveler.id} traveler={traveler} />
            </div>
          </GuildHall>
        )}
      </RequireTraveler>
    </Shell>
  );
}
