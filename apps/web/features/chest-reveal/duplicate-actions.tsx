'use client';
import { useEffect, useRef, useState } from 'react';
import {
  readResaleAccess,
  sellRepeated,
  type ResaleAccess,
} from '../../lib/economy-041/client';

/** Shared presentation for a confirmed surplus. No local grant, price or inventory mutation. */
export function DuplicateActions({
  actor,
  itemId,
  onSold,
}: {
  actor: string;
  itemId: string;
  onSold?: () => void;
}) {
  const [access, setAccess] = useState<ResaleAccess | null>(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const pending = useRef(false),
    live = useRef(true),
    panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (message && access && !access.eligible)
      panel.current?.focus({ preventScroll: true });
  }, [message, access]);
  useEffect(() => {
    let current = true;
    live.current = true;
    readResaleAccess(actor, itemId)
      .then((v) => {
        if (current) setAccess(v);
      })
      .catch(() => {
        if (current) setAccess(null);
      });
    return () => {
      current = false;
      live.current = false;
    };
  }, [actor, itemId]);
  if (!access?.eligible && !message) return null;
  return (
    <div ref={panel} tabIndex={-1} aria-label="Cópia excedente">
      {access?.eligible && (
        <>
          <strong>ITEM REPETIDO · {access.quantity} cópias</strong>
          <p>
            Guardar conserva o item. Vender usa somente uma cópia excedente.
          </p>
          <button
            disabled={busy}
            onClick={async () => {
              if (pending.current) return;
              pending.current = true;
              setBusy(true);
              try {
                const result = await sellRepeated(
                  actor,
                  itemId,
                  access.quantity,
                );
                if (live.current) {
                  setMessage(`Cópia vendida: +${result.coins} moedas.`);
                  setAccess({
                    ...access,
                    quantity: result.quantity,
                    eligible: result.quantity > 1,
                  });
                  onSold?.();
                }
              } catch (e) {
                if (live.current)
                  setMessage(
                    e instanceof Error ? e.message : 'Venda não confirmada.',
                  );
              } finally {
                pending.current = false;
                if (live.current) setBusy(false);
              }
            }}
          >
            Vender repetido · {access.sellValue} moedas
          </button>
          <button
            disabled={busy}
            onClick={() => setMessage('Item guardado na Mochila.')}
          >
            Guardar na Mochila
          </button>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
