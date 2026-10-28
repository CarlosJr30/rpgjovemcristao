'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../lib/supabase/auth-context';
import {
  canUseTravelerInCurrentSession,
  getOnlineSessionRevision,
} from '../../lib/supabase/online-sync';
import { governanceAction } from '../../lib/guild-governance/client';
import {
  LEADERSHIP_PATH,
  GOVERNANCE_PATH,
  type LeadershipPreview,
} from '../../lib/guild-governance/contracts';
import { INVITE_TOKEN } from '../../lib/guild-invites/contracts';
import { useJourney } from '../journey/state/use-journey';
import { ReleaseShell } from '../release-ebd/shell';
import css from '../release-ebd/release.module.css';

export function LeadershipInvitation() {
  const auth = useAuth();
  const owner = auth.status === 'signedIn' ? auth.user.id : '';
  return (
    <ReleaseShell back="/journey" backLabel="Voltar ao salão">
      <InvitationBody
        key={`${owner}:${getOnlineSessionRevision()}`}
        owner={owner}
      />
    </ReleaseShell>
  );
}
function InvitationBody({ owner }: { owner: string }) {
  const token = useRef<string | null>(null),
    mutation = useRef(false),
    journey = useJourney();
  const [preview, setPreview] = useState<LeadershipPreview>(),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(false),
    [accepted, setAccepted] = useState(false);
  useEffect(() => {
    let active = true;
    if (token.current === null) {
      token.current = window.location.hash.slice(1);
      // Remove secret before rendering links or navigating through Auth.
      if (window.location.hash)
        window.history.replaceState(null, '', window.location.pathname);
    }
    const incoming = token.current;
    const load = incoming
      ? INVITE_TOKEN.test(incoming)
        ? governanceAction<LeadershipPreview>({
            action: 'remember',
            token: incoming,
          })
        : Promise.reject(Error('Unavailable'))
      : governanceAction<LeadershipPreview>({ action: 'preview' });
    void load
      .then((value) => {
        if (active) setPreview(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);
  async function accept() {
    if (
      !preview ||
      !owner ||
      mutation.current ||
      journey.status !== 'ready' ||
      !canUseTravelerInCurrentSession(journey.traveler.id)
    )
      return;
    mutation.current = true;
    setBusy(true);
    setError(false);
    try {
      await governanceAction(
        {
          action: 'accept',
          id: preview.id,
          requestId: crypto.randomUUID(),
          travelerId: journey.traveler.id,
        },
        owner,
      );
      setAccepted(true);
    } catch {
      setError(true);
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }
  return (
    <section className={css.card}>
      <h1>Convite individual de liderança</h1>
      <p>
        Este convite autoriza uma liderança somente após validação da conta
        destinatária pelo servidor. Não autentica sua conta, não cria uma Guilda
        e não concede recompensas.
      </p>
      {error ? (
        <p role="alert">
          Não foi possível confirmar o convite. Ele pode estar indisponível ou
          não corresponder à sua conta.
        </p>
      ) : null}
      {!preview && !error ? <p role="status">Verificando convite…</p> : null}
      {accepted ? (
        <>
          <p role="status">Autorização de liderança confirmada.</p>
          <Link href={GOVERNANCE_PATH}>Consultar minhas autorizações</Link>
        </>
      ) : preview ? (
        <>
          <p>
            Validade: {new Date(preview.expiresAt).toLocaleString('pt-BR')}.
          </p>
          {!owner ? (
            <Link href={`/auth?next=${encodeURIComponent(LEADERSHIP_PATH)}`}>
              Entrar ou criar conta para continuar
            </Link>
          ) : journey.status !== 'ready' ? (
            <Link
              href={`/journey/create?next=${encodeURIComponent(LEADERSHIP_PATH)}`}
            >
              Criar ou retomar meu avatar
            </Link>
          ) : (
            <button disabled={busy} onClick={() => void accept()}>
              Aceitar autorização de liderança
            </button>
          )}
        </>
      ) : null}
    </section>
  );
}
