'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../lib/supabase/auth-context';
import {
  memberInviteAction,
  MemberInviteRejected,
} from '../../lib/ebd-classes/invites-client';
import {
  inviteIntentKey,
  readInviteIntent,
} from '../../lib/ebd-classes/invite-intent';
import type {
  IssuedMemberInvite,
  MemberInvite,
} from '../../lib/ebd-classes/invites-contracts';
import css from '../guild-missions/panel.module.css';
import journeyCss from '../journey/journey.module.css';
export function CommonInvites(props: {
  actor: string;
  guildId: string;
  classId: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button
        className={journeyCss.primaryLink}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {props.classId ? 'Convidar alunos' : 'Convidar membros'}
      </button>
      {open && <InvitesBody {...props} />}
    </section>
  );
}
function InvitesBody({
  actor,
  guildId,
  classId,
}: {
  actor: string;
  guildId: string;
  classId: string | null;
}) {
  const auth = useAuth(),
    owner = auth.status === 'signedIn' ? auth.user.id : '';
  const [items, setItems] = useState<MemberInvite[]>([]),
    [issued, setIssued] = useState<IssuedMemberInvite>(),
    [days, setDays] = useState(7),
    [maxUses, setMaxUses] = useState(10),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [locked, setLocked] = useState(false);
  const pending = useRef(false),
    intent = useRef<{
      requestId: string;
      days: number;
      maxUses: number;
    } | null>(null),
    live = useRef(false);
  const scope = { actor, guildId, classId };
  const intentKey = inviteIntentKey(owner, actor, guildId, classId);
  async function refresh() {
    const result = await memberInviteAction<MemberInvite[]>(
      { action: 'list', ...scope },
      owner,
    );
    if (live.current) setItems(result);
  }
  useEffect(() => {
    let active = true;
    live.current = true;
    void Promise.resolve()
      .then(() => {
        const previous = readInviteIntent(intentKey);
        if (active && previous) {
          intent.current = previous;
          setDays(previous.days);
          setMaxUses(previous.maxUses);
          setLocked(true);
        }
        return memberInviteAction<MemberInvite[]>(
          { action: 'list', actor, guildId, classId },
          owner,
        );
      })
      .then((result) => {
        if (active) setItems(result);
      })
      .catch(() => {
        if (active)
          setError('Não foi possível consultar os convites autorizados.');
      });
    return () => {
      active = false;
      live.current = false;
    };
  }, [actor, guildId, classId, owner, intentKey]);
  async function run(fn: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (error) {
      if (error instanceof MemberInviteRejected) {
        intent.current = null;
        sessionStorage.removeItem(intentKey);
        if (live.current) setLocked(false);
      }
      if (live.current)
        setError(
          'A operação não foi confirmada. Confira sua permissão e a lista antes de tentar novamente.',
        );
    } finally {
      pending.current = false;
      if (live.current) setBusy(false);
    }
  }
  return (
    <section className={css.card} aria-label="Convites de entrada automática">
      <h3>
        {classId
          ? 'Convidar alunos para esta classe'
          : 'Convidar para a Guilda'}
      </h3>
      <p>
        Entrada automática por convite válido. Não concede liderança nem
        permissão de professor.
      </p>
      {error && <p role="alert">{error}</p>}
      <label>
        Validade em dias
        <input
          type="number"
          min={1}
          max={30}
          value={days}
          disabled={busy || locked}
          onChange={(e) => setDays(Number(e.target.value))}
        />
      </label>
      <label>
        Máximo de utilizações
        <input
          type="number"
          min={1}
          max={100}
          value={maxUses}
          disabled={busy || locked}
          onChange={(e) => setMaxUses(Number(e.target.value))}
        />
      </label>
      <button
        disabled={busy}
        onClick={() =>
          void run(async () => {
            if (
              !Number.isInteger(days) ||
              days < 1 ||
              days > 30 ||
              !Number.isInteger(maxUses) ||
              maxUses < 1 ||
              maxUses > 100
            ) {
              setError(
                'Use validade de 1 a 30 dias e limite de 1 a 100 utilizações.',
              );
              return;
            }
            setLocked(true);
            intent.current ??= {
              requestId: crypto.randomUUID(),
              days,
              maxUses,
            };
            sessionStorage.setItem(intentKey, JSON.stringify(intent.current));
            const result = await memberInviteAction<IssuedMemberInvite>(
              { action: 'create', ...scope, ...intent.current },
              owner,
            );
            intent.current = null;
            sessionStorage.removeItem(intentKey);
            if (live.current) setLocked(false);
            if (live.current) setIssued(result);
            await refresh();
          })
        }
      >
        Gerar convite de entrada
      </button>
      <button disabled={busy} onClick={() => void run(refresh)}>
        Atualizar convites de entrada
      </button>
      {issued?.url && issued.qr ? (
        <>
          <Image
            src={issued.qr}
            alt="QR Code do convite de entrada"
            width={256}
            height={256}
            unoptimized
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <label>
            Link do convite de entrada
            <input readOnly value={issued.url} />
          </label>
          <button
            onClick={() =>
              void run(() => navigator.clipboard.writeText(issued.url!))
            }
          >
            Copiar convite de entrada
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(issued.url)}`}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            Compartilhar convite pelo WhatsApp
          </a>
        </>
      ) : issued ? (
        <p role="status">
          A emissão já foi confirmada. O segredo não pode ser recuperado;
          revogue para emitir outro convite.
        </p>
      ) : null}
      <ul>
        {items.map((i) => (
          <li key={i.id}>
            {i.revokedAt
              ? 'Revogado'
              : `Válido até ${new Date(i.expiresAt).toLocaleString('pt-BR')}`}{' '}
            · {i.uses}/{i.maxUses} utilizações
            {!i.revokedAt && (
              <button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await memberInviteAction(
                      { action: 'revoke', ...scope, id: i.id },
                      owner,
                    );
                    if (issued?.id === i.id) setIssued(undefined);
                    await refresh();
                  })
                }
              >
                Revogar convite de entrada
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
