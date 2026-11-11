'use client';
import { useRef, useState } from 'react';
import { claimProgressReward } from '../../lib/economy-041/client';
export function ProgressReward({
  actor,
  kind,
  event,
  onClaimed,
}: {
  actor: string;
  kind: 'mission' | 'world';
  event: string;
  onClaimed?: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [claimed, setClaimed] = useState(false);
  const pending = useRef(false);
  return (
    <div>
      <button
        disabled={busy || claimed}
        onClick={async () => {
          if (pending.current) return;
          pending.current = true;
          setBusy(true);
          try {
            await claimProgressReward(actor, kind, event);
            setClaimed(true);
            setMessage('Moedas e baú confirmados. Abra o baú na Mochila.');
            onClaimed?.();
          } catch (e) {
            setMessage(
              e instanceof Error ? e.message : 'Recompensa indisponível.',
            );
          } finally {
            pending.current = false;
            setBusy(false);
          }
        }}
      >
        {claimed ? 'Recompensa recebida' : 'Receber recompensa'}
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
