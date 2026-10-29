'use client';
import { useAuth } from '../../lib/supabase/auth-context';
import { RequireTraveler } from '../journey/components/shell';
import { ReleaseShell as Shell } from '../release-ebd/shell';
import { GuildHub } from '../journey/screens/guild-hub';
import { EbdPanel } from './panel';
import { GuildHall } from '../journey/components/guild-artwork';
import { GuildScope } from '../guild-governance/scope';
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
              <GuildScope actor={traveler.id}>
                {(scope) =>
                  scope.guildId ? (
                    <EbdPanel
                      key={`${traveler.id}:${scope.guildId}:${scope.generation}`}
                      traveler={traveler}
                      guildId={scope.guildId}
                    />
                  ) : (
                    <section className={releaseStyles.card}>
                      <h1>Escola Bíblica</h1>
                      <p role="alert">
                        Participe de uma Guilda ativa para acessar suas aulas.
                      </p>
                    </section>
                  )
                }
              </GuildScope>
            </div>
          </GuildHall>
        )}
      </RequireTraveler>
    </Shell>
  );
}
