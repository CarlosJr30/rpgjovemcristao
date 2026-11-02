'use client';
import Link from 'next/link';
import { useAuth } from '../../lib/supabase/auth-context';
import { ReleaseAccess, ReleaseShell } from '../release-ebd/shell';
import { RequireTraveler } from '../journey/components/shell';
import { ArenaExperience } from '../journey/screens/arena';
import { TowerExperience } from '../arena-tower/screen';
import { ArenaDeckContent } from './screen';
import { loadPlayerArenaCollection } from './player-collection';

export function ArenaPlayerScreen({
  mode,
}: {
  mode: 'arena' | 'deck' | 'tower';
}) {
  const auth = useAuth();
  return (
    <ReleaseAccess>
      <ReleaseShell back="/journey" backLabel="Voltar à Jornada">
        <p role="note">
          Arena e Torre — treino local, sem recompensas ou progresso oficial.
          São necessárias sete cartas próprias homologadas. Acesso não concede
          cartas. O pacote inicial exige solicitação explícita em Meu Baralho;
          compras e batalhas oficiais continuam indisponíveis.
        </p>
        <nav aria-label="Arena e Torre">
          <Link href="/journey/arena">Arena</Link>
          {' · '}
          <Link href="/journey/arena/deck">Meu Baralho</Link>
          {' · '}
          <Link href="/journey/arena/tower">Torre dos 7 Desafios</Link>
        </nav>
        <RequireTraveler>
          {(traveler) => {
            if (auth.status !== 'signedIn') return null;
            const props = {
              traveler,
              ownerId: auth.user.id,
              collectionSource: loadPlayerArenaCollection,
              practiceOnly: true,
            };
            const key = `${auth.user.id}:${traveler.id}:${mode}`;
            return mode === 'arena' ? (
              <ArenaExperience key={key} {...props} />
            ) : mode === 'tower' ? (
              <TowerExperience key={key} {...props} />
            ) : (
              <ArenaDeckContent
                key={key}
                traveler={traveler}
                owner={auth.user.id}
                collectionSource={loadPlayerArenaCollection}
                starterEnabled
              />
            );
          }}
        </RequireTraveler>
      </ReleaseShell>
    </ReleaseAccess>
  );
}
