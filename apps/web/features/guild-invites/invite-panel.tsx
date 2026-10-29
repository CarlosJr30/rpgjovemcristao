'use client';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { guildInviteAction } from '../../lib/guild-invites/client';
import type {
  CreatedInvite,
  InviteRecord,
} from '../../lib/guild-invites/contracts';
import styles from '../auth/auth.module.css';
import journeyStyles from '../journey/journey.module.css';

export function GuildInvitePanel({
  travelerId,
  guildId,
}: {
  travelerId: string;
  guildId?: string;
}) {
  const mutation = useRef(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<CreatedInvite | null>(null);
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [message, setMessage] = useState('');
  const issuedURL = created?.url,
    issuedQR = created?.qr;
  const refresh = async () => {
    const result = await guildInviteAction<{ data: InviteRecord[] }>({
      action: 'list',
      travelerId,
      ...(guildId ? { guildId } : {}),
    });
    setInvites(result.data);
  };
  const run = async (action: () => Promise<void>) => {
    if (mutation.current) return;
    mutation.current = true;
    setPending(true);
    setMessage('');
    try {
      await action();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível preparar o convite.',
      );
    } finally {
      mutation.current = false;
      setPending(false);
    }
  };
  return (
    <section aria-label="Convites da Guilda">
      <button
        type="button"
        className={journeyStyles.primaryLink}
        disabled={pending}
        aria-expanded={open}
        onClick={() => {
          if (open) {
            setOpen(false);
            setCreated(null);
            return;
          }
          setOpen(true);
          void run(refresh);
        }}
      >
        Convidar membros
      </button>
      {open && (
        <div className={`${styles.card} ${styles.invitePanel}`}>
          <h2 id="invite-panel-title">Convites da Guilda</h2>
          <p>
            O convite vale por sete dias. A entrada continua dependendo da
            aprovação do líder. Compartilhe apenas com quem deseja convidar.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void run(async () => {
                setCreated(
                  await guildInviteAction<CreatedInvite>({
                    action: 'create',
                    travelerId,
                    ...(guildId ? { guildId } : {}),
                  }),
                );
                await refresh();
              })
            }
          >
            Gerar convite
          </button>
          {created && issuedURL && issuedQR ? (
            <>
              <Image
                src={issuedQR}
                unoptimized
                width={256}
                height={256}
                alt="QR Code do convite da Guilda"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <label>
                Link do convite
                <input
                  aria-label="Link do convite"
                  readOnly
                  value={issuedURL}
                />
              </label>
              <p>
                Expira em {new Date(created.expires_at).toLocaleString('pt-BR')}
                .
              </p>
              <button
                type="button"
                onClick={() =>
                  void run(async () => {
                    await navigator.clipboard.writeText(issuedURL);
                    setMessage('Link copiado.');
                  })
                }
              >
                Copiar link
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(issuedURL)}`}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
              >
                Compartilhar pelo WhatsApp
              </a>
            </>
          ) : created ? (
            <p role="status">
              Essa emissão já foi confirmada. O link não pode ser recuperado.
              Revogue o convite antes de emitir outro.
            </p>
          ) : null}
          <ul>
            {invites.map((invite) => (
              <li key={invite.id}>
                Criado em {new Date(invite.created_at).toLocaleString('pt-BR')}{' '}
                —{' '}
                {invite.revoked_at
                  ? 'Revogado'
                  : `expira em ${new Date(invite.expires_at).toLocaleString('pt-BR')}`}
                {!invite.revoked_at && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      void run(async () => {
                        await guildInviteAction({
                          action: 'revoke',
                          travelerId,
                          ...(guildId ? { guildId } : {}),
                          inviteId: invite.id,
                        });
                        if (created?.id === invite.id) setCreated(null);
                        await refresh();
                        setMessage('Convite revogado.');
                      })
                    }
                  >
                    Revogar convite
                  </button>
                )}
              </li>
            ))}
          </ul>
          {message && <p role="status">{message}</p>}
        </div>
      )}
    </section>
  );
}
