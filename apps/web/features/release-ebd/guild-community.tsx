'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { guildRepository } from '../../lib/supabase/repositories/guild-repository';
import type {
  GuildMemberSummary,
  GuildJoinRequestSummary,
} from '../../lib/supabase/database.types';
import {
  beginGuildCreation,
  confirmGuildCreation,
  pendingGuildCreation,
} from '../../lib/guild-governance/creation-intent';
import { selectGuild } from '../../lib/guild-governance/selection';
import { GuildScope, type GuildScopeValue } from '../guild-governance/scope';
import { useJourney } from '../journey/state/use-journey';
import { CommonInvites } from '../guild-ebd/common-invites';
import { CellActivityPanel } from '../guild-missions/cell-panel';
import { GuildHall } from '../journey/components/guild-artwork';
import { GuildHero } from '../journey/components/guild-hero';
import { ReleaseShell } from './shell';
import css from './release.module.css';
export function ReleaseGuild({ management = false }: { management?: boolean }) {
  const state = useJourney(),
    id = state.status === 'ready' ? state.traveler.id : null;
  return (
    <ReleaseShell>
      <h1 className={css.guildPageTitle}>Minha Guilda</h1>
      {!id ? (
        <Link href="/journey">Escolher Viajante</Link>
      ) : (
        <GuildScope actor={id}>
          {(scope) => (
            <GuildCommunity
              key={`${id}:${scope.guildId}:${scope.generation}`}
              id={id}
              scope={scope}
              management={management}
            />
          )}
        </GuildScope>
      )}
    </ReleaseShell>
  );
}
function GuildCommunity({
  id,
  scope,
  management,
}: {
  id: string;
  scope: GuildScopeValue;
  management: boolean;
}) {
  const { context, canManage, canCreate, writesEnabled, refresh } = scope;
  const guildId = context?.guild.id;
  const [members, setMembers] = useState<GuildMemberSummary[]>([]),
    [requests, setRequests] = useState<GuildJoinRequestSummary[]>([]),
    [loading, setLoading] = useState(!!guildId),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const pending = useRef(false);
  useEffect(() => {
    let live = true;
    if (!guildId) return;
    void Promise.all([
      guildRepository.listMembersScoped(id, guildId),
      canManage
        ? guildRepository.listRequestsScoped(id, guildId)
        : Promise.resolve([]),
    ])
      .then(([m, r]) => {
        if (live) {
          setMembers(m);
          setRequests(r);
          setLoading(false);
        }
      })
      .catch(() => {
        if (live) {
          setMessage(
            'Não foi possível confirmar esta Guilda. Atualize comunidades e permissões.',
          );
          setLoading(false);
        }
      });
    return () => {
      live = false;
    };
  }, [id, guildId, canManage]);
  async function run(action: () => Promise<unknown>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setMessage('');
    try {
      await action();
      refresh();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : 'A operação não foi confirmada.',
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <GuildHall className={css.guildScene} showScene={!loading}>
      {message ? <p role="alert">{message}</p> : null}
      {loading ? (
        <p role="status">Carregando Guilda…</p>
      ) : context ? (
        <>
          <GuildHero
            name={context.guild.name}
            description={context.guild.description ?? ''}
            leader={
              members.find((m) => m.role === 'leader')?.traveler_name ??
              'Liderança da Guilda'
            }
            participation={
              canManage
                ? 'Líder autorizado desta comunidade'
                : 'Membro da comunidade'
            }
            management={management && canManage}
            headingLevel={2}
          >
            <p>
              {members.filter((m) => m.member_status === 'active').length}{' '}
              membros ativos · Professores são designados pelo líder nesta
              comunidade.
            </p>
            <Link href="/journey/guild/ebd">
              Acessar Escola Bíblica Dominical
            </Link>
          </GuildHero>
          {canManage && writesEnabled && guildId ? (
            <>
              <CommonInvites
                key={`${id}:${guildId}`}
                actor={id}
                guildId={guildId}
                classId={null}
              />
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
                              guildRepository.reviewScoped(
                                r.request_id,
                                id,
                                context.guild.id,
                                true,
                                crypto.randomUUID(),
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
                              guildRepository.reviewScoped(
                                r.request_id,
                                id,
                                context.guild.id,
                                false,
                                crypto.randomUUID(),
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
          ) : null}
          <details
            className={css.card}
            onToggle={(e) => setActivitiesOpen(e.currentTarget.open)}
          >
            <summary>Encontros e atividades da comunidade</summary>
            {activitiesOpen && (
              <CellActivityPanel actor={id} guildId={context.guild.id} />
            )}
          </details>
          <section className={css.card}>
            <h2>Membros</h2>
            <ul>
              {members.map((m) => (
                <li key={m.traveler_id}>
                  {m.traveler_name} · {m.role === 'leader' ? 'Líder' : 'Membro'}
                  {m.member_status !== 'active'
                    ? ` · ${m.member_status === 'left' ? 'saiu' : 'removido'}`
                    : ''}
                  {canManage &&
                  writesEnabled &&
                  m.role === 'member' &&
                  m.member_status === 'active' ? (
                    <button
                      disabled={busy}
                      onClick={() =>
                        void run(() =>
                          guildRepository.removeScoped(
                            m.traveler_id,
                            id,
                            context.guild.id,
                            crypto.randomUUID(),
                          ),
                        )
                      }
                    >
                      Remover {m.traveler_name} desta Guilda
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
            {context.membership.role === 'member' && writesEnabled ? (
              <button
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    guildRepository.leaveScoped(
                      id,
                      context.guild.id,
                      crypto.randomUUID(),
                    ),
                  )
                }
              >
                Sair somente desta Guilda
              </button>
            ) : null}
          </section>
        </>
      ) : (
        <section className={css.card}>
          <h2>Participar de uma Guilda</h2>
          <p>
            Peça ao líder um convite por link ou QR Code. Sua entrada depende da
            aprovação dele, sem remover participações em outras comunidades.
          </p>
          <p>Já enviou um pedido? Atualize para conferir a aprovação.</p>
        </section>
      )}
      {canCreate && writesEnabled ? (
        <CreateGuild actor={id} scope={scope} />
      ) : (
        <section className={css.card}>
          <h2>Criar uma Guilda</h2>
          <p>
            A criação exige uma autorização individual de liderança ativa,
            confirmada pelo servidor. Ser Administrador ou ter nível elevado não
            substitui essa autorização.
          </p>
        </section>
      )}
      <Link href="/journey/guild/administration">
        Autorizações e administração
      </Link>
    </GuildHall>
  );
}
function CreateGuild({
  actor,
  scope,
}: {
  actor: string;
  scope: GuildScopeValue;
}) {
  const [initial] = useState(() => {
    try {
      return { intent: pendingGuildCreation(actor), error: '' };
    } catch {
      return {
        intent: null,
        error:
          'Não foi possível conferir a solicitação pendente. Atualize suas comunidades antes de criar outra.',
      };
    }
  });
  const [intent, setIntent] = useState(initial.intent),
    [error, setError] = useState(initial.error),
    [busy, setBusy] = useState(false);
  const pending = useRef(false),
    reconciling = useRef(false);
  useEffect(() => {
    if (
      !reconciling.current &&
      intent &&
      scope.contexts.some((c) => c.guild.id === intent.id)
    ) {
      reconciling.current = true;
      confirmGuildCreation(actor, intent.id);
      selectGuild(actor, intent.id);
      scope.refresh();
    }
  }, [actor, intent, scope]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const values = new FormData(event.currentTarget),
        name = String(values.get('name') ?? '').trim(),
        description = String(values.get('description') ?? '').trim();
      const request = beginGuildCreation(actor, name, description);
      setIntent(request);
      const id = await guildRepository.createScoped(
        actor,
        request.id,
        request.name,
        request.description,
        request.request,
      );
      confirmGuildCreation(actor, id);
      selectGuild(actor, id);
      scope.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível confirmar a criação.',
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (initial.error)
    return (
      <section className={css.card}>
        <p role="alert">{initial.error}</p>
      </section>
    );
  return (
    <form className={css.card} onSubmit={(event) => void create(event)}>
      <h2>Criar uma Guilda</h2>
      <p>
        A nova comunidade preserva seus outros vínculos. Uma confirmação
        pendente usa a mesma solicitação ao repetir ou recarregar.
      </p>
      <label>
        Nome da Guilda
        <input
          name="name"
          required
          minLength={2}
          maxLength={60}
          defaultValue={intent?.name ?? ''}
          readOnly={!!intent}
        />
      </label>
      <label>
        Descrição
        <textarea
          name="description"
          maxLength={500}
          defaultValue={intent?.description ?? ''}
          readOnly={!!intent}
        />
      </label>
      <button disabled={busy}>Criar Guilda e assumir liderança</button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
