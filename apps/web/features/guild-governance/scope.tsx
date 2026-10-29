'use client';
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useAuth } from '../../lib/supabase/auth-context';
import {
  getOnlineSessionRevision,
  subscribeOnlineSync,
} from '../../lib/supabase/online-sync';
import {
  guildRepository,
  type OnlineGuildContext,
} from '../../lib/supabase/repositories/guild-repository';
import {
  parseGovernanceStatus,
  type GovernanceStatus,
} from '../../lib/guild-governance/contracts';
import {
  getGuildSelection,
  restoreGuildSelection,
  selectGuild,
  subscribeGuildSelection,
  isGuildBusy,
} from '../../lib/guild-governance/selection';
import css from '../release-ebd/release.module.css';
export type GuildScopeValue = {
  guildId: string | null;
  context: OnlineGuildContext | null;
  contexts: OnlineGuildContext[];
  canManage: boolean;
  canCreate: boolean;
  writesEnabled: boolean;
  refresh: () => void;
  generation: number;
};
type Scope = GuildScopeValue;
export function GuildScope({
  actor,
  children,
}: {
  actor: string;
  children: (scope: Scope) => ReactNode;
}) {
  const auth = useAuth(),
    revision = useSyncExternalStore(
      subscribeOnlineSync,
      getOnlineSessionRevision,
      () => 0,
    );
  const owner = auth.status === 'signedIn' ? auth.user.id : '';
  return (
    <ScopeForAccount
      key={`${owner}:${revision}:${actor}`}
      owner={owner}
      actor={actor}
    >
      {children}
    </ScopeForAccount>
  );
}
function ScopeForAccount({
  owner,
  actor,
  children,
}: {
  owner: string;
  actor: string;
  children: (scope: Scope) => ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<{
      contexts: OnlineGuildContext[];
      status: GovernanceStatus;
      generation: number;
    }>(),
    [error, setError] = useState(false),
    [reload, setReload] = useState(0);
  const selected = useSyncExternalStore(
    subscribeGuildSelection,
    () => getGuildSelection(actor),
    () => null,
  );
  const refresh = useCallback(() => setReload((v) => v + 1), []);
  const busy = useSyncExternalStore(
    subscribeGuildSelection,
    () => isGuildBusy(actor),
    () => false,
  );
  useEffect(() => {
    restoreGuildSelection(actor);
  }, [actor]);
  useEffect(() => {
    let live = true;
    if (!owner) return;
    void Promise.all([
      guildRepository.listContexts(actor),
      guildRepository.getStatus(actor),
    ])
      .then(([contexts, status]) => {
        if (live) {
          setSnapshot({
            contexts,
            status: parseGovernanceStatus(status),
            generation: reload,
          });
          setError(false);
        }
      })
      .catch(() => {
        if (live) {
          setSnapshot(undefined);
          setError(true);
        }
      });
    return () => {
      live = false;
    };
  }, [actor, owner, reload]);
  const contexts = snapshot?.contexts;
  const context =
    contexts?.find((c) => c.guild.id === selected) ??
    (contexts?.length === 1 ? contexts[0] : undefined);
  useEffect(() => {
    if (!contexts || snapshot?.generation !== reload || busy) return;
    const id = context?.guild.id ?? null;
    if (
      (selected && !contexts.some((c) => c.guild.id === selected)) ||
      (!selected && id)
    )
      selectGuild(actor, id);
  }, [
    actor,
    contexts,
    context?.guild.id,
    selected,
    snapshot?.generation,
    reload,
    busy,
  ]);
  if (error)
    return (
      <section className={css.card}>
        <p role="alert">
          Não foi possível confirmar suas comunidades e permissões. Nenhuma
          comunidade foi selecionada automaticamente.
        </p>
        <button onClick={refresh}>Tentar carregar comunidades</button>
      </section>
    );
  if (!snapshot)
    return <p role="status">Carregando comunidades e permissões…</p>;
  return (
    <>
      <section className={css.card} aria-label="Comunidade ativa">
        <label>
          Guilda ativa
          <select
            value={context?.guild.id ?? ''}
            disabled={busy || snapshot.generation !== reload}
            onChange={(event) => {
              selectGuild(actor, event.target.value || null);
              refresh();
            }}
          >
            <option value="">
              {contexts?.length
                ? 'Selecione uma comunidade'
                : 'Nenhuma comunidade ativa'}
            </option>
            {contexts?.map((c) => (
              <option key={c.guild.id} value={c.guild.id}>
                {c.guild.name}
              </option>
            ))}
          </select>
        </label>
        <p>
          Permissões pertencem a cada comunidade. Trocar de Guilda descarta o
          editor aberto; confirme a comunidade antes de agir.
        </p>
        {!snapshot.status.writesEnabled && snapshot.status.version === 2 ? (
          <p role="status">
            A gestão está temporariamente em consulta. Seus vínculos e registros
            foram preservados.
          </p>
        ) : null}
        <button
          onClick={refresh}
          disabled={busy || snapshot.generation !== reload}
        >
          Atualizar comunidades e permissões
        </button>
      </section>
      {snapshot.generation !== reload ? (
        <p role="status">Reconfirmando a comunidade e suas permissões…</p>
      ) : contexts && contexts.length > 1 && !context ? (
        <p role="status">
          Escolha explicitamente a Guilda ativa para continuar.
        </p>
      ) : (
        children({
          guildId: context?.guild.id ?? null,
          context: context ?? null,
          contexts: snapshot.contexts,
          canManage: context?.canManage === true,
          canCreate: snapshot.status.canCreateAdditionalGuilds,
          writesEnabled: snapshot.status.writesEnabled !== false,
          refresh,
          generation: reload,
        })
      )}
    </>
  );
}
