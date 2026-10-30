'use client';

import { useEffect, useState } from 'react';
import type { ResolvedInvite } from '../../lib/guild-invites/contracts';

export function GuildInvitePreview({ token }: { token: string }) {
  const [invite, setInvite] = useState<ResolvedInvite | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/guild-invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'preview', token }),
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw Error('Unavailable');
        const result = (await response.json()) as { data: ResolvedInvite };
        if (!controller.signal.aborted) setInvite(result.data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setUnavailable(true);
      });
    return () => controller.abort();
  }, [token]);
  return (
    <aside aria-label="Prévia do convite">
      {invite ? (
        <>
          <h2>{invite.guild_name}</h2>
          <p>
            Esta Guilda convidou você. Entre ou crie sua conta para continuar.
            Um convite válido permite confirmar sua participação após entrar.
          </p>
        </>
      ) : (
        <p role="status">
          {unavailable
            ? 'Convite indisponível, expirado ou revogado. Você ainda pode entrar ou criar sua conta normalmente.'
            : 'Verificando convite…'}
        </p>
      )}
    </aside>
  );
}
