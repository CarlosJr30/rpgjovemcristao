'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  claimCommunityChest,
  chestGrantMessages,
} from '../../lib/community-chests/client';
export function CommunityChestClaim({
  actor,
  guild,
  mission,
}: {
  actor: string;
  guild: string;
  mission: string;
}) {
  return (
    <ChestClaim
      key={`${actor}:${guild}:${mission}`}
      actor={actor}
      guild={guild}
      mission={mission}
    />
  );
}
function ChestClaim({
  actor,
  guild,
  mission,
}: {
  actor: string;
  guild: string;
  mission: string;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const pending = useRef(false),
    live = useRef(false);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  return (
    <section aria-label="Baú da atividade">
      <button
        disabled={busy}
        onClick={async () => {
          if (pending.current) return;
          pending.current = true;
          setBusy(true);
          setMessage('');
          try {
            const r = await claimCommunityChest(actor, guild, mission);
            if (live.current) setMessage(chestGrantMessages[r.status]);
          } catch (e) {
            if (live.current)
              setMessage(
                e instanceof Error ? e.message : 'Confirmação indisponível.',
              );
          } finally {
            pending.current = false;
            if (live.current) setBusy(false);
          }
        }}
      >
        Consultar e conquistar baú da atividade
      </button>
      {message && <p role="status">{message}</p>}
      <Link href="/journey/backpack">Ver baús na Mochila</Link>
    </section>
  );
}
