'use client';
import Image from 'next/image';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../lib/supabase/auth-context';
import { getOnlineSessionRevision } from '../../lib/supabase/online-sync';
import { governanceAction } from '../../lib/guild-governance/client';
import {
  clearLeadershipIntent,
  leadershipIntent,
} from '../../lib/guild-governance/leadership-intent';
import {
  GOVERNANCE_PERMISSIONS,
  parseGovernanceStatus,
  type GovernanceStatus,
  type GovernanceWorkspace,
  type GovernanceHistory,
  type GovernanceLeaders,
  type IssuedLeadershipInvite,
} from '../../lib/guild-governance/contracts';
import { ReleaseAccess, ReleaseShell } from '../release-ebd/shell';
import { GuildHall } from '../journey/components/guild-artwork';
import css from '../release-ebd/release.module.css';
import own from './screen.module.css';

type Pane = 'invite' | 'leaders' | 'communities' | 'advanced';
const sections: [Pane, string][] = [
  ['invite', 'Convidar líder'],
  ['leaders', 'Gerenciar líderes'],
  ['communities', 'Comunidades'],
  ['advanced', 'Configurações avançadas'],
];
const labels = {
  'admins.manage': 'Gerenciar permissões administrativas',
  'leadership.manage': 'Gerenciar autorizações e convites de liderança',
  'guilds.read': 'Consultar comunidades',
  'audit.read': 'Consultar histórico de administração',
};
type Snapshot = {
  key: string;
  status?: GovernanceStatus;
  workspace?: GovernanceWorkspace;
  history?: GovernanceHistory;
  leaders?: GovernanceLeaders;
  checkedAt?: number;
  error?: boolean;
};
type Run = (
  kind: string,
  id: string,
  data: Record<string, unknown>,
  requestId?: string,
) => Promise<void>;

export function GovernanceScreen() {
  const auth = useAuth();
  const owner = auth.status === 'signedIn' ? auth.user.id : '';
  return (
    <ReleaseAccess>
      <ReleaseShell back="/journey/guild" backLabel="Voltar à Guilda">
        <GuildHall className={css.guildScene}>
          <header className={css.card}>
            <h1>Administração das comunidades</h1>
          </header>
          {owner ? (
            <GovernancePanel
              key={`${owner}:${getOnlineSessionRevision()}`}
              owner={owner}
            />
          ) : null}
        </GuildHall>
      </ReleaseShell>
    </ReleaseAccess>
  );
}

function GovernancePanel({ owner }: { owner: string }) {
  const mutation = useRef(false);
  const [pane, setPane] = useState<Pane>('invite');
  const [offset, setOffset] = useState(0),
    [refresh, setRefresh] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot>(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const [issued, setIssued] = useState<IssuedLeadershipInvite>(),
    [recipient, setRecipient] = useState('');
  const key = `${owner}:${pane}:${offset}:${refresh}`;
  useEffect(() => {
    let active = true;
    void governanceAction<unknown>({ action: 'scopeStatus' }, owner)
      .then(async (value) => {
        const status = parseGovernanceStatus(value);
        if (!status.administrator) {
          if (active) setSnapshot({ key, status });
          return;
        }
        if (
          pane === 'invite' &&
          !status.permissions.includes('leadership.manage')
        ) {
          if (active)
            setPane(
              status.permissions.includes('guilds.read')
                ? 'communities'
                : 'advanced',
            );
          return;
        }
        const [workspace, history, leaders] = await Promise.all([
          (pane === 'communities' || pane === 'advanced') &&
          status.permissions.includes('guilds.read')
            ? governanceAction<GovernanceWorkspace>(
                { action: 'workspace', offset },
                owner,
              )
            : undefined,
          pane === 'advanced' && status.permissions.includes('audit.read')
            ? governanceAction<GovernanceHistory>(
                { action: 'history', offset },
                owner,
              )
            : undefined,
          pane === 'leaders' && status.permissions.includes('leadership.manage')
            ? governanceAction<GovernanceLeaders>(
                { action: 'leaders', offset },
                owner,
              )
            : undefined,
        ]);
        if (
          workspace &&
          (workspace.version !== 1 ||
            !Array.isArray(workspace.guilds) ||
            !Array.isArray(workspace.invitations))
        )
          throw Error('Invalid workspace');
        if (history && !Array.isArray(history)) throw Error('Invalid history');
        if (
          leaders &&
          (leaders.version !== 1 || !Array.isArray(leaders.leaders))
        )
          throw Error('Invalid leaders');
        if (active)
          setSnapshot({
            key,
            status,
            workspace,
            history,
            leaders,
            checkedAt: Date.now(),
          });
      })
      .catch(() => {
        if (active) setSnapshot({ key, error: true });
      });
    return () => {
      active = false;
    };
  }, [owner, key, pane, offset]);

  const run: Run = async (kind, id, data, requestId = crypto.randomUUID()) => {
    if (mutation.current) return;
    mutation.current = true;
    setBusy(true);
    setMessage('');
    try {
      const value = await governanceAction<IssuedLeadershipInvite>(
        { action: 'command', kind, id, requestId, data },
        owner,
      );
      if (kind === 'issue_leadership') setIssued(value);
      if (kind === 'revoke_invite') {
        clearLeadershipIntent(owner, id);
        if (issued?.id === id) setIssued(undefined);
      }
      setMessage(
        kind === 'issue_leadership'
          ? 'Convite confirmado. O compartilhamento é manual; nenhum e-mail foi enviado.'
          : 'Operação confirmada pelo servidor.',
      );
    } catch {
      setMessage(
        'A operação não foi confirmada. Confira sua permissão e os dados; repetir a emissão usa a mesma solicitação.',
      );
    } finally {
      mutation.current = false;
      setBusy(false);
      setRefresh((v) => v + 1);
    }
  };
  async function issue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.current) return;
    const f = new FormData(event.currentTarget);
    const data = {
      recipientEmail: String(f.get('recipientEmail')).trim().toLowerCase(),
      expiresInDays: Number(f.get('expiresInDays')),
      reason: String(f.get('reason')).trim(),
    };
    try {
      const intent = await leadershipIntent(owner, data);
      setRecipient(data.recipientEmail);
      await run('issue_leadership', intent.id, data, intent.requestId);
    } catch {
      setMessage(
        'Confira a emissão pendente antes de alterar o convite. Nenhum convite novo foi criado.',
      );
    }
  }
  if (snapshot?.key !== key)
    return <p role="status">Consultando suas autorizações…</p>;
  if (snapshot.error || !snapshot.status)
    return (
      <section className={css.card}>
        <p role="alert">Não foi possível consultar as autorizações.</p>
        <button onClick={() => setRefresh((v) => v + 1)}>
          Tentar novamente
        </button>
      </section>
    );
  const { status, workspace, history, leaders } = snapshot;
  if (!status.administrator)
    return (
      <section className={css.card}>
        <p>Esta conta não possui permissões de Administrador Geral.</p>
      </section>
    );
  const canManage = status.permissions.includes('leadership.manage'),
    writes = status.writesEnabled !== false;
  return (
    <div className={own.content}>
      <nav className={own.sections} aria-label="Áreas da Administração">
        {sections.map(([id, label]) => (
          <button
            key={id}
            aria-pressed={pane === id}
            disabled={
              busy ||
              ((id === 'invite' || id === 'leaders') && !canManage) ||
              (id === 'communities' &&
                !status.permissions.includes('guilds.read'))
            }
            onClick={() => {
              setPane(id);
              setOffset(0);
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      {message && <p role="status">{message}</p>}
      {pane === 'invite' && canManage && (
        <>
          <form className={css.card} onSubmit={issue}>
            <h2>Convidar líder</h2>
            <p>
              O convite é individual, válido apenas para a conta destinatária e
              depende de aceite autenticado. Não concede liderança antes do
              aceite.
            </p>
            <p>
              Envio automático de e-mail ainda não configurado. Gere o link e o
              QR Code para compartilhar somente com a pessoa indicada.
            </p>
            <label>
              E-mail do destinatário
              <input
                name="recipientEmail"
                type="email"
                autoComplete="off"
                required
                maxLength={254}
                disabled={busy}
              />
            </label>
            <label>
              Validade em dias
              <input
                name="expiresInDays"
                type="number"
                min={1}
                max={7}
                defaultValue={7}
                required
                disabled={busy}
              />
            </label>
            <Reason />
            <button disabled={busy || !writes}>Gerar link e QR Code</button>
          </form>
          {issued && (
            <section className={css.card} aria-label="Convite emitido">
              <h2>Convite emitido</h2>
              {issued.url && issued.qr ? (
                <>
                  <p>
                    Compartilhe somente com a pessoa indicada. O link é exibido
                    apenas nesta emissão.
                  </p>
                  <a
                    className={own.invite}
                    href={issued.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                  >
                    Abrir convite individual
                  </a>
                  <Image
                    src={issued.qr}
                    alt="QR Code do convite individual de liderança"
                    width={256}
                    height={256}
                    unoptimized
                  />
                  <div className={css.actions}>
                    <button
                      onClick={() => {
                        void navigator.clipboard.writeText(issued.url!).then(
                          () => setMessage('Link copiado.'),
                          () =>
                            setMessage(
                              'Não foi possível copiar. Use o link acima.',
                            ),
                        );
                      }}
                    >
                      Copiar link
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(issued.url)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                    >
                      Compartilhar pelo WhatsApp
                    </a>
                    <a
                      href={`mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent('Você foi convidado para liderar no RPG Jovem Cristão!')}&body=${encodeURIComponent(`Você foi convidado para liderar uma comunidade no RPG Jovem Cristão. O aceite exige login na conta indicada. Convite válido até ${date(issued.expiresAt)}.\n\n${issued.url}`)}`}
                      referrerPolicy="no-referrer"
                    >
                      Compartilhar por e-mail
                    </a>
                  </div>
                  <button
                    onClick={() => {
                      clearLeadershipIntent(owner, issued.id);
                      setIssued(undefined);
                      setRecipient('');
                    }}
                  >
                    Preparar outro convite
                  </button>
                </>
              ) : (
                <p>
                  Essa emissão já foi processada. Se o link foi perdido, revogue
                  o convite em Configurações avançadas antes de emitir outro.
                </p>
              )}
            </section>
          )}
        </>
      )}
      {pane === 'leaders' && leaders && (
        <section className={css.card}>
          <h2>Gerenciar líderes</h2>
          <p>
            Autorizações existentes, consultadas com sua permissão atual. A
            revogação preserva vínculos e histórico.
          </p>
          {leaders.leaders.length === 0 && (
            <p>Nenhuma liderança nesta página.</p>
          )}
          {leaders.leaders.map((l) => (
            <article className={css.card} key={l.id}>
              <h3>{l.name}</h3>
              <p>
                {l.emailHint} ·{' '}
                {l.active ? 'Autorização ativa' : 'Autorização revogada'} ·
                concedida em {date(l.grantedAt)}
              </p>
              {l.active && writes && (
                <RevokeLeader leader={l} busy={busy} run={run} />
              )}
            </article>
          ))}
        </section>
      )}
      {pane === 'communities' && workspace && (
        <section className={css.card}>
          <h2>Comunidades existentes</h2>
          <ul>
            {workspace.guilds.map((g) => (
              <li key={g.id}>
                {g.name} · {g.leader_alias} · {g.members} participantes ·{' '}
                {g.status === 'active' ? 'ativa' : 'arquivada'}
              </li>
            ))}
          </ul>
          {workspace.guilds.length === 0 && (
            <p>Nenhuma comunidade nesta página.</p>
          )}
        </section>
      )}
      {pane === 'advanced' && (
        <>
          <section className={css.card} aria-label="Suas autorizações">
            <h2>Suas autorizações</h2>
            <p>Permissões administrativas confirmadas pelo servidor.</p>
            <p>
              Autorização de liderança:{' '}
              {status.leadership === 'active'
                ? 'ativa'
                : status.leadership === 'revoked'
                  ? 'revogada'
                  : 'não concedida'}
              . Nenhuma recompensa é concedida.
            </p>
            <ul>
              {status.permissions.map((p) => (
                <li key={p}>{labels[p]}</li>
              ))}
            </ul>
          </section>
          {status.permissions.includes('admins.manage') && writes && (
            <form
              className={css.card}
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run('set_admin', String(f.get('accountId')), {
                  permissions: f.getAll('permissions').map(String),
                  active: f.get('active') === 'on',
                  reason: String(f.get('reason')),
                });
              }}
            >
              <h2>Permissões administrativas</h2>
              <p>
                Somente para configuração técnica de uma conta explicitamente
                autorizada.
              </p>
              <Account />
              <fieldset>
                <legend>Permissões explícitas</legend>
                {GOVERNANCE_PERMISSIONS.map((p) => (
                  <label className={own.check} key={p}>
                    <input type="checkbox" name="permissions" value={p} />
                    {labels[p]}
                  </label>
                ))}
              </fieldset>
              <label className={own.check}>
                <input type="checkbox" name="active" defaultChecked />
                Concessão ativa
              </label>
              <Reason />
              <button disabled={busy}>Registrar permissões</button>
            </form>
          )}
          {workspace && (
            <section className={css.card}>
              <h2>Convites de liderança</h2>
              {workspace.invitations.length === 0 && (
                <p>Nenhum convite nesta página.</p>
              )}
              <ul>
                {workspace.invitations.map((i) => (
                  <li key={i.id}>
                    Válido até {date(i.expires_at)} ·{' '}
                    {i.consumed_at
                      ? 'aceito'
                      : i.revoked_at
                        ? 'revogado'
                        : Date.parse(i.expires_at) <= (snapshot.checkedAt ?? 0)
                          ? 'expirado'
                          : 'aguardando aceite'}
                    {!i.revoked_at && !i.consumed_at && canManage && writes && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void run('revoke_invite', i.id, {
                            reason: String(
                              new FormData(e.currentTarget).get('reason'),
                            ),
                          });
                        }}
                      >
                        <Reason />
                        <button disabled={busy}>Revogar este convite</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {history && (
            <section className={css.card}>
              <h2>Histórico de administração</h2>
              <ul>
                {history.map((h) => (
                  <li key={h.id}>
                    {date(h.created_at)} · {h.action} · {h.reason}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
      {(workspace || history || leaders) && (
        <div className={css.actions}>
          <button
            disabled={busy || offset === 0}
            onClick={() => setOffset((v) => Math.max(0, v - 25))}
          >
            Página anterior
          </button>
          <button
            disabled={
              busy ||
              ((workspace?.guilds.length ?? 0) < 25 &&
                (workspace?.invitations.length ?? 0) < 25 &&
                (history?.length ?? 0) < 25 &&
                (leaders?.leaders.length ?? 0) < 25)
            }
            onClick={() => setOffset((v) => v + 25)}
          >
            Próxima página
          </button>
        </div>
      )}
      <button disabled={busy} onClick={() => setRefresh((v) => v + 1)}>
        Atualizar autorizações
      </button>
    </div>
  );
}
function date(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  });
}
function Account() {
  return (
    <label>
      Identificador confirmado da conta
      <input
        name="accountId"
        required
        pattern="[a-fA-F0-9-]{36}"
        autoComplete="off"
        maxLength={36}
      />
    </label>
  );
}
function Reason() {
  return (
    <label>
      Motivo administrativo
      <textarea
        name="reason"
        required
        minLength={8}
        maxLength={500}
        placeholder="Descreva o motivo sem credenciais ou dados pessoais."
      />
    </label>
  );
}
function RevokeLeader({
  leader,
  busy,
  run,
}: {
  leader: GovernanceLeaders['leaders'][number];
  busy: boolean;
  run: Run;
}) {
  const [confirming, setConfirming] = useState(false);
  return confirming ? (
    <form
      aria-label={`Confirmar revogação de ${leader.name}`}
      onSubmit={(e) => {
        e.preventDefault();
        void run('revoke_leadership', leader.id, {
          reason: String(new FormData(e.currentTarget).get('reason')),
        });
      }}
    >
      <p>
        Revogar a autorização de {leader.name} ({leader.emailHint})? Os poderes
        de liderança serão bloqueados; vínculos e registros serão preservados.
      </p>
      <Reason />
      <button disabled={busy}>Confirmar revogação</button>
      <button
        type="button"
        disabled={busy}
        onClick={() => setConfirming(false)}
      >
        Cancelar
      </button>
    </form>
  ) : (
    <button disabled={busy} onClick={() => setConfirming(true)}>
      Revogar autorização de {leader.name}
    </button>
  );
}
