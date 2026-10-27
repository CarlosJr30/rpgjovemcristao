'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../../lib/supabase/auth-context';
import {
  canUseTravelerInCurrentSession,
  getOnlineSessionRevision,
  getCurrentOnlineUserId,
  readOnlineArchive,
  type ArchiveSnapshot,
} from '../../lib/supabase/online-sync';
import { useJourney } from '../journey/state/use-journey';
import { ReleaseAccess, ReleaseShell } from './shell';
import {
  readOwnedCards,
  type ArchiveCard,
} from '../../lib/supabase/owned-cards-read';

export function ArchiveAccess({
  children,
  includeCards = false,
}: {
  children: (snapshot: ArchiveSnapshot, cards: ArchiveCard[]) => ReactNode;
  includeCards?: boolean;
}) {
  return (
    <ReleaseAccess>
      <ReleaseShell back="/journey" backLabel="Voltar ao salão">
        <ArchiveReader includeCards={includeCards}>{children}</ArchiveReader>
      </ReleaseShell>
    </ReleaseAccess>
  );
}
function ArchiveReader({
  children,
  includeCards,
}: {
  children: (snapshot: ArchiveSnapshot, cards: ArchiveCard[]) => ReactNode;
  includeCards: boolean;
}) {
  const auth = useAuth();
  const journey = useJourney();
  const travelerId = journey.status === 'ready' ? journey.traveler.id : '';
  const owner = auth.status === 'signedIn' ? auth.user.id : '';
  const session = getOnlineSessionRevision();
  const key = `${owner}:${travelerId}:${session}:${includeCards}`;
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    snapshot?: ArchiveSnapshot;
    cards?: ArchiveCard[];
    error?: boolean;
  }>();
  useEffect(() => {
    let active = true;
    if (owner && owner === getCurrentOnlineUserId() && travelerId && canUseTravelerInCurrentSession(travelerId)) {
      Promise.all([
        readOnlineArchive(travelerId),
        includeCards ? readOwnedCards(travelerId) : Promise.resolve([]),
      ])
        .then(([snapshot, cards]) => {
          if (active) setResult({ key, snapshot, cards });
        })
        .catch(() => {
          if (active) setResult({ key, error: true });
        });
    }
    return () => {
      active = false;
    };
  }, [owner, travelerId, key, retry, includeCards]);
  if (!owner || owner !== getCurrentOnlineUserId() || !travelerId || !canUseTravelerInCurrentSession(travelerId))
    return (
      <p role="status">
        Retome seu Herói no salão para consultar seus registros.
      </p>
    );
  if (result?.key !== key)
    return <p role="status">Consultando seus registros…</p>;
  if (result.error || !result.snapshot)
    return (
      <section>
        <p role="alert">Não foi possível consultar seus registros.</p>
        <button
          onClick={() => {
            setResult(undefined);
            setRetry((v) => v + 1);
          }}
        >
          Tentar novamente
        </button>
      </section>
    );
  return children(result.snapshot, result.cards ?? []);
}
