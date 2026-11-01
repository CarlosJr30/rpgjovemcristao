'use client';
import { Fragment } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/supabase/auth-context';
import { isArenaTestAvailable } from '../../lib/arena-test-scope';
import { ReleaseShell } from '../release-ebd/shell';
import { RequireTraveler } from '../journey/components/shell';
import { ArenaExperience } from '../journey/screens/arena';
import { TowerExperience } from '../arena-tower/screen';
import { ArenaDeckContent } from '../arena-deck/screen';
import { loadTestArenaCollection } from './collection';

export function ArenaTestScreen({
  mode,
}: {
  mode: 'arena' | 'tower' | 'deck';
}) {
  const auth = useAuth();
  if (!isArenaTestAvailable() || auth.status !== 'signedIn')
    return <p>Treino indisponível fora da sessão TEST.</p>;
  return (
    <ReleaseShell back="/journey" backLabel="Voltar à Jornada">
      <p role="note">
        Treino TEST. Usa somente cartas já possuídas. Batalhas e andares são
        locais, sem recompensas ou progresso oficial.
      </p>
      <nav aria-label="Arena e Torre">
        <Link href="/journey/arena">Arena</Link>
        {' · '}
        <Link href="/journey/arena/deck">Meu Baralho</Link>
        {' · '}
        <Link href="/journey/arena/tower">Torre dos 7 Desafios</Link>
      </nav>
      <RequireTraveler>
        {(traveler) => (
          <Fragment key={`${auth.user.id}:${traveler.id}:${mode}`}>
            {mode === 'arena' ? (
              <ArenaExperience
                traveler={traveler}
                ownerId={auth.user.id}
                collectionSource={loadTestArenaCollection}
                practiceOnly
              />
            ) : mode === 'tower' ? (
              <TowerExperience
                traveler={traveler}
                ownerId={auth.user.id}
                collectionSource={loadTestArenaCollection}
                practiceOnly
              />
            ) : (
              <ArenaDeckContent
                traveler={traveler}
                owner={auth.user.id}
                collectionSource={loadTestArenaCollection}
              />
            )}
          </Fragment>
        )}
      </RequireTraveler>
    </ReleaseShell>
  );
}
