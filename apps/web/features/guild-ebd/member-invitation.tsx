'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../lib/supabase/auth-context';
import {
  canUseTravelerInCurrentSession,
  getOnlineSessionRevision,
} from '../../lib/supabase/online-sync';
import { useJourney } from '../journey/state/use-journey';
import { ReleaseShell } from '../release-ebd/shell';
import { memberInviteAction } from '../../lib/ebd-classes/invites-client';
import {
  MEMBER_INVITE_PATH,
  type MemberInvitePreview,
} from '../../lib/ebd-classes/invites-contracts';
import { INVITE_TOKEN, INVITE_UUID } from '../../lib/guild-invites/contracts';
import css from '../release-ebd/release.module.css';
export function MemberInvitation() {
  const auth = useAuth(),
    owner = auth.status === 'signedIn' ? auth.user.id : '';
  const journey = useJourney();
  return (
    <ReleaseShell back="/journey/guild" backLabel="Voltar à Guilda">
      <Invitation
        key={`${owner}:${getOnlineSessionRevision()}:${journey.status === 'ready' ? journey.traveler.id : ''}`}
        owner={owner}
      />
    </ReleaseShell>
  );
}
function Invitation({ owner }: { owner: string }) {
  const journey = useJourney(),
    token = useRef<string | null>(null),
    pending = useRef(false),
    request = useRef<string | null>(null);
  const [preview, setPreview] = useState<MemberInvitePreview>(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [accepted, setAccepted] = useState(false);
  useEffect(() => {
    let active = true;
    if (token.current === null) {
      token.current = window.location.hash.slice(1);
      if (window.location.hash)
        window.history.replaceState(null, '', MEMBER_INVITE_PATH);
    }
    const incoming = token.current;
    void (
      incoming
        ? INVITE_TOKEN.test(incoming)
          ? memberInviteAction<MemberInvitePreview>({
              action: 'remember',
              token: incoming,
            })
          : Promise.reject(Error('Unavailable'))
        : memberInviteAction<MemberInvitePreview>({ action: 'preview' })
    )
      .then((value) => {
        if (active) setPreview(value);
      })
      .catch(() => {
        if (active)
          setError('Convite indisponível, expirado, esgotado ou revogado.');
      });
    return () => {
      active = false;
    };
  }, []);
  async function accept() {
    if (
      pending.current ||
      !owner ||
      journey.status !== 'ready' ||
      !canUseTravelerInCurrentSession(journey.traveler.id)
    )
      return;
    pending.current = true;
    setBusy(true);
    setError('');
    request.current ??= crypto.randomUUID();
    try {
      const r = await memberInviteAction<{
        guildId: string;
        classId: string | null;
        enrolled: boolean;
        replayed: boolean;
      }>(
        {
          action: 'accept',
          actor: journey.traveler.id,
          requestId: request.current,
        },
        owner,
      );
      if (
        !INVITE_UUID.test(r.guildId) ||
        (r.classId !== null && !INVITE_UUID.test(r.classId)) ||
        r.enrolled !== true
      )
        throw Error('Invalid enrollment');
      setAccepted(true);
    } catch {
      setError(
        'A entrada não foi confirmada. Confira o convite e tente novamente, sem criar outro avatar.',
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <section className={css.card}>
      <h1>Participar por convite</h1>
      <p>
        O convite permite entrar nesta comunidade e, quando indicado, na classe.
        Não autentica sua conta, não concede liderança ou permissão de professor
        e não concede recompensas.
      </p>
      {error && <p role="alert">{error}</p>}
      {!preview && !error && <p role="status">Verificando convite…</p>}
      {accepted ? (
        <>
          <p role="status">
            Participação confirmada. Seus outros vínculos foram preservados.
          </p>
          <Link href="/journey/guild">Abrir minhas Guildas</Link>
          <Link href="/journey/guild/ebd">Abrir minhas classes</Link>
        </>
      ) : (
        preview && (
          <>
            <h2>{preview.guildName}</h2>
            {preview.className && <p>Classe: {preview.className}</p>}
            <p>
              Validade: {new Date(preview.expiresAt).toLocaleString('pt-BR')}.
            </p>
            <p>
              A entrada por convite válido não depende de aprovação posterior do
              líder.
            </p>
            {!owner ? (
              <Link
                href={`/auth?next=${encodeURIComponent(MEMBER_INVITE_PATH)}`}
              >
                Entrar ou criar conta para continuar
              </Link>
            ) : journey.status !== 'ready' ? (
              <Link
                href={`/journey/create?next=${encodeURIComponent(MEMBER_INVITE_PATH)}`}
              >
                Criar ou retomar meu avatar
              </Link>
            ) : (
              <button disabled={busy} onClick={() => void accept()}>
                Participar desta comunidade
              </button>
            )}
          </>
        )
      )}
    </section>
  );
}
