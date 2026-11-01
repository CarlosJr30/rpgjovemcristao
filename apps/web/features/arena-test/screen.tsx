'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/supabase/auth-context';
import { isArenaTestAvailable } from '../../lib/arena-test-scope';
import { ReleaseShell } from '../release-ebd/shell';
import { RequireTraveler } from '../journey/components/shell';
import { ArenaExperience } from '../journey/screens/arena';
import { TowerExperience } from '../arena-tower/screen';
import { ArenaDeckContent } from '../arena-deck/screen';
import { loadTestArenaCollection } from './collection';
import { readArenaQaProfile } from './profile';
import type { Traveler } from '../journey/domain/traveler';

function Practice({
  traveler,
  owner,
  mode,
}: {
  traveler: Traveler;
  owner: string;
  mode: 'arena' | 'tower' | 'deck';
}) {
  const [profile, setProfile] = useState<{
    level: 50 | null;
    error?: boolean;
  }>();
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    readArenaQaProfile(owner, traveler.id)
      .then((level) => {
        if (live) setProfile({ level });
      })
      .catch(() => {
        if (live) setProfile({ level: null, error: true });
      });
    return () => {
      live = false;
    };
  }, [owner, traveler.id, retry]);
  if (!profile) return <p role="status">Validando perfil de treino…</p>;
  if (profile.error)
    return (
      <section>
        <p role="alert">Não foi possível validar o treino.</p>
        <button
          onClick={() => {
            setProfile(undefined);
            setRetry((v) => v + 1);
          }}
        >
          Tentar novamente
        </button>
      </section>
    );
  return (
    <>
      {profile.level === 50 && (
        <p role="note">
          Perfil QA: nível de treino 50. Avatar canônico nível 1, XP 0;
          atributos e equipamentos preservados.
        </p>
      )}
      {mode === 'arena' ? (
        <ArenaExperience
          traveler={traveler}
          ownerId={owner}
          collectionSource={loadTestArenaCollection}
          practiceOnly
          trainingLevel={profile.level ?? undefined}
        />
      ) : mode === 'tower' ? (
        <TowerExperience
          traveler={traveler}
          ownerId={owner}
          collectionSource={loadTestArenaCollection}
          practiceOnly
          trainingLevel={profile.level ?? undefined}
        />
      ) : (
        <ArenaDeckContent
          traveler={traveler}
          owner={owner}
          collectionSource={loadTestArenaCollection}
        />
      )}
    </>
  );
}

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
          <Practice
            key={`${auth.user.id}:${traveler.id}:${mode}`}
            owner={auth.user.id}
            traveler={traveler}
            mode={mode}
          />
        )}
      </RequireTraveler>
    </ReleaseShell>
  );
}
