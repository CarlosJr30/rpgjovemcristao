'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  guildRepository,
  type OnlineGuildContext,
} from '../../lib/supabase/repositories/guild-repository';
import type {
  GuildMemberSummary,
  GuildJoinRequestSummary,
} from '../../lib/supabase/database.types';
import { useJourney } from '../journey/state/use-journey';
import { GuildInvitePanel } from '../guild-invites/invite-panel';
import { GuildHall } from '../journey/components/guild-artwork';
import { GuildHero } from '../journey/components/guild-hero';
import { ReleaseShell } from './shell';
import css from './release.module.css';
export function ReleaseGuild({ management = false }: { management?: boolean }) {
  const state = useJourney();
  const id = state.status === 'ready' ? state.traveler.id : null;
  return <GuildForTraveler key={id} id={id} management={management} />;
}
function GuildForTraveler({
  id,
  management,
}: {
  id: string | null;
  management: boolean;
}) {
  const [context, setContext] = useState<OnlineGuildContext | null>(null),
    [members, setMembers] = useState<GuildMemberSummary[]>([]),
    [requests, setRequests] = useState<GuildJoinRequestSummary[]>([]),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!id) return null;
    const c = await guildRepository.getContext(id);
    const [m, r] = await Promise.all([
      c ? guildRepository.listMembers(id) : Promise.resolve([]),
      c?.membership.role === 'leader'
        ? guildRepository.listJoinRequests(id)
        : Promise.resolve([]),
    ]);
    return { c, m, r };
  }, [id]);
  const apply = useCallback((data: Awaited<ReturnType<typeof load>>) => {
    if (!data) return;
    setContext(data.c);
    setMembers(data.m);
    setRequests(data.r);
    setLoading(false);
  }, []);
  const reload = async () => apply(await load());
  useEffect(() => {
    let active = true;
    void load()
      .then((data) => {
        if (active) apply(data);
      })
      .catch(() => {
        if (!active) return;
        setMessage('Não foi possível carregar a Guilda. Tente atualizar.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [load, apply]);
  const run = async (action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      await action();
      await reload();
    } catch {
      setMessage(
        'A ação não foi confirmada. Confira sua permissão e tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  };
  const create = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    const data = new FormData(e.currentTarget);
    void run(() =>
      guildRepository.create(
        id,
        String(data.get('name')),
        String(data.get('description') ?? ''),
      ),
    );
  };
  return (
    <ReleaseShell>
      <h1 className={css.guildPageTitle}>Minha Guilda</h1>
      <GuildHall className={css.guildScene} showScene={!loading}>
        {message && <p role="alert">{message}</p>}
        {!id ? (
          <Link href="/journey">Escolher Viajante</Link>
        ) : loading ? (
          <p role="status">Carregando Guilda…</p>
        ) : context ? (
          <>
            <GuildHero
              name={context.guild.name}
              description={context.guild.description ?? ''}
              leader={
                members.find((member) => member.role === 'leader')
                  ?.traveler_name ?? 'Liderança da Guilda'
              }
              participation={
                context.membership.role === 'leader'
                  ? 'Líder da comunidade'
                  : 'Membro da comunidade'
              }
              management={management && context.membership.role === 'leader'}
              headingLevel={2}
            >
              <p>
                {members.length} membros · Professores são designados pelo líder
                na EBD.
              </p>
              <Link href="/journey/guild/ebd">
                Acessar Escola Bíblica Dominical
              </Link>
            </GuildHero>
            {context.membership.role === 'leader' && (
              <>
                <GuildInvitePanel travelerId={id} />
                <section className={css.card}>
                  <h2>Solicitações de entrada</h2>
                  {requests.length === 0 ? (
                    <p>Nenhum pedido pendente.</p>
                  ) : (
                    requests.map((r) => (
                      <article key={r.request_id}>
                        <h3>{r.traveler_name}</h3>
                        <div className={css.actions}>
                          <button
                            disabled={busy}
                            onClick={() =>
                              void run(() =>
                                guildRepository.reviewJoinRequest(
                                  r.request_id,
                                  id,
                                  true,
                                ),
                              )
                            }
                          >
                            Aprovar {r.traveler_name}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() =>
                              void run(() =>
                                guildRepository.reviewJoinRequest(
                                  r.request_id,
                                  id,
                                  false,
                                ),
                              )
                            }
                          >
                            Recusar {r.traveler_name}
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </section>
              </>
            )}
            <section className={css.card}>
              <h2>Membros</h2>
              <ul>
                {members.map((m) => (
                  <li key={m.traveler_id}>
                    {m.traveler_name} ·{' '}
                    {m.role === 'leader' ? 'Líder' : 'Membro'}
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          <>
            <section className={css.card}>
              <h2>Participar de uma Guilda</h2>
              <p>
                Peça ao líder um convite por link ou QR Code. Sua entrada
                depende da aprovação dele.
              </p>
              <p>Já enviou um pedido? Atualize para conferir a aprovação.</p>
            </section>
            <form className={css.card} onSubmit={create}>
              <h2>Criar uma Guilda</h2>
              <p>
                Ao confirmar a criação, você será responsável pela liderança
                desta nova Guilda.
              </p>
              <label>
                Nome da Guilda
                <input name="name" required minLength={2} maxLength={60} />
              </label>
              <label>
                Descrição
                <textarea name="description" maxLength={500} />
              </label>
              <button disabled={busy}>Criar Guilda e assumir liderança</button>
            </form>
          </>
        )}
        {id && (
          <button disabled={busy} onClick={() => void run(reload)}>
            Atualizar Guilda
          </button>
        )}
        <Link href="/journey/guild/administration">Autorizações e administração</Link>
      </GuildHall>
    </ReleaseShell>
  );
}
