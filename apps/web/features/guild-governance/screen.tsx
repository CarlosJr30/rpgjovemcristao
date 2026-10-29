'use client';
import Image from 'next/image';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../lib/supabase/auth-context';
import { getOnlineSessionRevision } from '../../lib/supabase/online-sync';
import { governanceAction } from '../../lib/guild-governance/client';
import {
  GOVERNANCE_PERMISSIONS,
  parseGovernanceStatus,
  type GovernanceStatus,
  type GovernanceWorkspace,
  type GovernanceHistory,
  type IssuedLeadershipInvite,
} from '../../lib/guild-governance/contracts';
import { ReleaseAccess, ReleaseShell } from '../release-ebd/shell';
import { GuildHall } from '../journey/components/guild-artwork';
import css from '../release-ebd/release.module.css';
import own from './screen.module.css';

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
  checkedAt?: number;
  error?: boolean;
};
export function GovernanceScreen() {
  const auth = useAuth();
  const owner = auth.status === 'signedIn' ? auth.user.id : '';
  const identity = `${owner}:${getOnlineSessionRevision()}`;
  return (
    <ReleaseAccess>
      <ReleaseShell back="/journey/guild" backLabel="Voltar à Guilda">
        <GuildHall className={css.guildScene}>
          <header className={css.card}>
            <h1>Administração das comunidades</h1>
          </header>
          {owner ? <GovernancePanel key={identity} owner={owner} /> : null}
        </GuildHall>
      </ReleaseShell>
    </ReleaseAccess>
  );
}
function GovernancePanel({ owner }: { owner: string }) {
  const mutation = useRef(false);
  const [refresh, setRefresh] = useState(0),
    [offset, setOffset] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot>(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const [issued, setIssued] = useState<IssuedLeadershipInvite>();
  const key = `${owner}:${offset}:${refresh}`;
  useEffect(() => {
    let active = true;
    void governanceAction<unknown>({ action: 'scopeStatus' }, owner)
      .then(async (value) => {
        const status = parseGovernanceStatus(value);
        const [workspace, history] = await Promise.all([
          status.permissions.includes('guilds.read')
            ? governanceAction<GovernanceWorkspace>(
                { action: 'workspace', offset },
                owner,
              )
            : undefined,
          status.permissions.includes('audit.read')
            ? governanceAction<GovernanceHistory>(
                { action: 'history', offset },
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
        if (active)
          setSnapshot({
            key,
            status,
            workspace,
            history,
            checkedAt: Date.now(),
          });
      })
      .catch(() => {
        if (active) setSnapshot({ key, error: true });
      });
    return () => {
      active = false;
    };
  }, [owner, key, offset]);
  async function run(kind: string, id: string, data: Record<string, unknown>) {
    if (mutation.current) return;
    mutation.current = true;
    setBusy(true);
    setMessage('');
    try {
      const response = await governanceAction<IssuedLeadershipInvite>(
        { action: 'command', kind, id, requestId: crypto.randomUUID(), data },
        owner,
      );
      if (kind === 'issue_leadership') setIssued(response);
      setMessage('Operação confirmada pelo servidor.');
      setRefresh((v) => v + 1);
    } catch {
      setIssued(undefined);
      setMessage(
        'A operação não foi confirmada. Confira sua permissão e os dados.',
      );
      setRefresh((v) => v + 1);
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }
  const issue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    void run('issue_leadership', crypto.randomUUID(), {
      recipientEmail: String(f.get('recipientEmail')),
      expiresInDays: Number(f.get('expiresInDays')),
      reason: String(f.get('reason')),
    });
  };
  const revoke = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    void run('revoke_leadership', String(f.get('accountId')), {
      reason: String(f.get('reason')),
    });
  };
  const grant = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    void run('set_admin', String(f.get('accountId')), {
      permissions: f.getAll('permissions').map(String),
      active: f.get('active') === 'on',
      reason: String(f.get('reason')),
    });
  };
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
  const { status, workspace, history } = snapshot;
  return (
    <div className={own.content}>
      <section className={css.card} aria-label="Suas autorizações">
        <h2>Suas autorizações</h2>
        <p>
          {status.administrator
            ? 'Permissões administrativas confirmadas pelo servidor.'
            : 'Esta conta não possui permissões de Administrador Geral.'}
        </p>
        <p>
          Autorização de liderança:{' '}
          {status.leadership === 'active'
            ? 'ativa'
            : status.leadership === 'revoked'
              ? 'revogada'
              : 'não concedida'}
          .
        </p>
        <p>
          {status.multiGuildReady
            ? 'A comunidade ativa é selecionada na Guilda ou na EBD. A criação exige autorização individual de liderança; permissões são conferidas em cada operação.'
            : 'Esta etapa prepara as autorizações. A criação de múltiplas Guildas ainda não está disponível.'}{' '}
          Nenhuma recompensa é concedida.
        </p>
        {status.permissions.length ? (
          <ul>
            {status.permissions.map((p) => (
              <li key={p}>{labels[p]}</li>
            ))}
          </ul>
        ) : null}
      </section>
      {message ? <p role="status">{message}</p> : null}
      {status.permissions.includes('leadership.manage') &&
      status.writesEnabled !== false ? (
        <>
          <form className={css.card} onSubmit={issue}>
            <h2>Convidar uma liderança</h2>
            <p>
              O convite é individual e só pode ser aceito pela conta que
              confirmar o endereço indicado. Não autentica a pessoa ou cria uma
              Guilda.
            </p>
            <label>
              E-mail do destinatário
              <input
                name="recipientEmail"
                type="email"
                autoComplete="off"
                required
                maxLength={254}
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
              />
            </label>
            <Reason />
            <button disabled={busy}>Emitir convite individual</button>
          </form>
          {issued ? (
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
                  >
                    {issued.url}
                  </a>
                  <Image
                    src={issued.qr}
                    alt="QR Code do convite individual de liderança"
                    width={256}
                    height={256}
                    unoptimized
                  />
                  <p>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(issued.url)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Compartilhar pelo WhatsApp
                    </a>
                  </p>
                </>
              ) : (
                <p>
                  Essa emissão já foi processada. Se o link foi perdido, revogue
                  o convite antes de emitir outro.
                </p>
              )}
            </section>
          ) : null}
          <form className={css.card} onSubmit={revoke}>
            <h2>Revogar autorização de liderança</h2>
            <p>
              {status.multiGuildReady
                ? 'A revogação bloqueia a criação e os poderes de liderança nas Guildas, inclusive em sessões autenticadas. Vínculos, registros e histórico permanecem preservados.'
                : 'A revogação desta fundação altera a autorização nova. Os vínculos existentes são preservados; a integração de gestão permanece pendente.'}
            </p>
            <Account />
            <Reason />
            <button disabled={busy}>Revogar autorização</button>
          </form>
        </>
      ) : null}
      {status.permissions.includes('admins.manage') &&
      status.writesEnabled !== false ? (
        <form className={css.card} onSubmit={grant}>
          <h2>Permissões administrativas</h2>
          <p>
            Use somente o identificador confirmado da conta autorizada. Esta
            operação será registrada com motivo.
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
      ) : null}
      {workspace ? (
        <>
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
            {workspace.guilds.length === 0 ? (
              <p>Nenhuma comunidade nesta página.</p>
            ) : null}
          </section>
          <section className={css.card}>
            <h2>Convites de liderança</h2>
            <ul>
              {workspace.invitations.map((i) => (
                <li key={i.id}>
                  Válido até{' '}
                  {new Date(i.expires_at).toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                  })}{' '}
                  ·{' '}
                  {i.consumed_at
                    ? 'aceito'
                    : i.revoked_at
                      ? 'revogado'
                      : Date.parse(i.expires_at) <= (snapshot.checkedAt ?? 0)
                        ? 'expirado'
                        : 'aguardando aceite'}
                  {!i.revoked_at &&
                  !i.consumed_at &&
                  status.permissions.includes('leadership.manage') ? (
                    <RevokeInvite id={i.id} busy={busy} run={run} />
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
      {history ? (
        <section className={css.card}>
          <h2>Histórico de administração</h2>
          <ul>
            {history.map((h) => (
              <li key={h.id}>
                {new Date(h.created_at).toLocaleString('pt-BR')} · {h.action} ·{' '}
                {h.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {workspace || history ? (
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
                (history?.length ?? 0) < 25)
            }
            onClick={() => setOffset((v) => v + 25)}
          >
            Próxima página
          </button>
        </div>
      ) : null}
      <button disabled={busy} onClick={() => setRefresh((v) => v + 1)}>
        Atualizar autorizações
      </button>
    </div>
  );
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
      Motivo da operação
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
function RevokeInvite({
  id,
  busy,
  run,
}: {
  id: string;
  busy: boolean;
  run: (
    kind: string,
    id: string,
    data: Record<string, unknown>,
  ) => Promise<void>;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const f = new FormData(event.currentTarget);
        void run('revoke_invite', id, { reason: String(f.get('reason')) });
      }}
    >
      <Reason />
      <button disabled={busy}>Revogar este convite</button>
    </form>
  );
}
