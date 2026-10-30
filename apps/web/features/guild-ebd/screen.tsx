'use client';
import { useState } from 'react';
import type { Traveler } from '../journey/domain/traveler';
import { useAuth } from '../../lib/supabase/auth-context';
import { RequireTraveler } from '../journey/components/shell';
import { ReleaseShell as Shell } from '../release-ebd/shell';
import { GuildHub } from '../journey/screens/guild-hub';
import { EbdPanel } from './panel';
import { EbdClasses } from './classes';
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
                    <div
                      key={`${traveler.id}:${scope.guildId}:${scope.generation}`}
                    >
                      <Classroom traveler={traveler} guildId={scope.guildId} />
                    </div>
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
function Classroom({
  traveler,
  guildId,
}: {
  traveler: Traveler;
  guildId: string;
}) {
  const [selected, setSelected] = useState<string | null>(null),
    [legacy, setLegacy] = useState(false),
    [busy, setBusy] = useState(false);
  return (
    <>
      <EbdClasses
        actor={traveler.id}
        guildId={guildId}
        onSelect={setSelected}
        selectionDisabled={busy}
      />
      {selected ? (
        <EbdPanel
          key={selected}
          traveler={traveler}
          guildId={guildId}
          classId={selected}
          onBusyChange={setBusy}
        />
      ) : (
        <section className={releaseStyles.card}>
          <h1>Escola Bíblica</h1>
          <p>
            Selecione sua classe para estudar, preparar aulas ou consultar
            presença.
          </p>
        </section>
      )}
      <details onToggle={(e) => setLegacy(e.currentTarget.open)}>
        <summary>Aulas anteriores da Guilda</summary>
        <p>Aulas legadas preservadas, sem conversão automática para classes.</p>
        {legacy && <EbdPanel traveler={traveler} guildId={guildId} />}
      </details>
    </>
  );
}
