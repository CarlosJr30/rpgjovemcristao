'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/supabase/auth-context';
import { RequireTraveler, Shell } from '../journey/components/shell';
import type { Traveler } from '../journey/domain/traveler';
import { DeckEditor } from './editor';
import { loadArenaCollection } from './collection';
import { arenaDeckStorage } from './storage';
import type { ArenaCard } from '@rpg/game-engine';
function Content({ owner, traveler }: { owner: string; traveler: Traveler }) {
  const [data, setData] = useState<{
    cards: readonly ArenaCard[];
    selection: string[];
    locked: boolean;
  } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    loadArenaCollection(owner, traveler.id)
      .then((cards) => {
        const saved = arenaDeckStorage.load(owner, traveler.id, cards);
        if (live)
          setData({
            cards,
            selection: saved.selection,
            locked: saved.battle?.status === 'in_progress',
          });
      })
      .catch((e) => {
        if (live)
          setError(
            e instanceof Error
              ? e.message
              : 'Não foi possível carregar o baralho.',
          );
      });
    return () => {
      live = false;
    };
  }, [owner, traveler.id]);
  return (
    <>
      <h1>Meu Baralho — Arena</h1>
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p role="status">Carregando coleção…</p>}
      {data && (
        <DeckEditor
          showTitle={false}
          cards={data.cards}
          initial={data.selection}
          locked={data.locked}
          busy={busy}
          onSave={async (ids) => {
            setBusy(true);
            try {
              const cards = await loadArenaCollection(owner, traveler.id);
              await arenaDeckStorage.save(owner, traveler.id, cards, ids);
              setData({ cards, selection: [...ids], locked: false });
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
      <p>
        <Link href="/journey/arena">Voltar à Arena</Link>
      </p>
    </>
  );
}
export function ArenaDeckScreen() {
  const auth = useAuth();
  return (
    <Shell back="/journey/arena" backLabel="Voltar à Arena">
      <RequireTraveler>
        {(traveler) => (
          <Content
            key={`${auth.user?.id}:${traveler.id}`}
            owner={auth.user?.id ?? ''}
            traveler={traveler}
          />
        )}
      </RequireTraveler>
    </Shell>
  );
}
