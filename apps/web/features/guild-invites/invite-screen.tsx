'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { guildInviteAction } from '../../lib/guild-invites/client';
import type { ResolvedInvite } from '../../lib/guild-invites/contracts';
import { useJourney } from '../journey/state/use-journey';
import styles from '../auth/auth.module.css';

export function GuildInviteScreen({ token }: { token: string }) {
  const journey = useJourney();
  const [invite, setInvite] = useState<ResolvedInvite | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    let active = true;
    void guildInviteAction<{ data: ResolvedInvite }>({
      action: 'resolve',
      token,
    })
      .then((result) => {
        if (active) setInvite(result.data);
      })
      .catch(() => {
        if (active)
          setError(
            'Convite indisponível, expirado ou revogado. Solicite um novo link ao líder.',
          );
      });
    return () => {
      active = false;
    };
  }, [token]);
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Convite para a Guilda</h1>
        {error && <p role="alert">{error}</p>}
        {!invite && !error && <p role="status">Verificando convite…</p>}
        {invite && (
          <>
            <h2>{invite.guild_name}</h2>
            <p>Confirme sua participação nesta Guilda pelo convite válido.</p>
            {submitted ? (
              <p role="status">Participação confirmada nesta Guilda.</p>
            ) : journey.status === 'ready' ? (
              <button
                type="button"
                disabled={pending}
                onClick={async () => {
                  if (pending) return;
                  setPending(true);
                  setError('');
                  try {
                    await guildInviteAction({
                      action: 'request',
                      token,
                      travelerId: journey.traveler.id,
                    });
                    setSubmitted(true);
                  } catch {
                    setError(
                      'Não foi possível participar. O convite pode estar expirado, revogado, esgotado ou indisponível para este Viajante.',
                    );
                  } finally {
                    setPending(false);
                  }
                }}
              >
                Confirmar participação
              </button>
            ) : (
              <Link
                href={`/journey/create?next=${encodeURIComponent(`/guilda/convite/${token}`)}`}
              >
                Criar meu avatar para continuar
              </Link>
            )}
          </>
        )}
        <Link href="/">Voltar ao jogo</Link>
      </section>
    </main>
  );
}
