'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Traveler } from '../journey/domain/traveler';
import {
  guildRepository,
  type OnlineGuildContext,
} from '../../lib/supabase/repositories/guild-repository';
import { missionWorkspaceRepository as repository } from '../../lib/supabase/repositories/guild-mission-workspace-repository';
import type {
  GuildJoinRequestSummary,
  GuildMemberSummary,
} from '../../lib/supabase/database.types';
import { GuildInvitePanel } from '../guild-invites/invite-panel';
import { MissionEditor } from './mission-editor';
import {
  formFromMission,
  isSpecial,
  missionLabels,
  progressLabels,
  rewardLabel,
  type Decision,
  type Mission,
  type Workspace,
} from './contracts';
import { guildMissionRewards, type GuildRewardTier } from '@rpg/game-engine';
import css from './panel.module.css';

type Tab =
  | 'overview'
  | 'members'
  | 'requests'
  | 'missions'
  | 'special'
  | 'approvals'
  | 'rewards'
  | 'history';
const tabs: readonly [Tab, string][] = [
  ['overview', 'Visão geral'],
  ['members', 'Membros'],
  ['requests', 'Pedidos de entrada'],
  ['missions', 'Missões'],
  ['special', 'Desafios especiais'],
  ['approvals', 'Aprovações pendentes'],
  ['rewards', 'Recompensas'],
  ['history', 'Histórico de atividades'],
];
type Loaded = {
  context: OnlineGuildContext | null;
  workspace: Workspace | null;
  members: GuildMemberSummary[];
  requests: GuildJoinRequestSummary[];
};
export function GuildLeaderPanel({ traveler }: { traveler: Traveler }) {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState<{
    id: string;
    mission?: Mission;
    special: boolean;
  } | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [historyOffset, setHistoryOffset] = useState(0);
  const decisionKeys = useRef(new Map<string, string>());
  const fetchData = useCallback(async () => {
    const context = await guildRepository.getContext(traveler.id);
    if (!context || context.membership.role !== 'leader')
      return { context, workspace: null, members: [], requests: [] };
    const [workspace, members, requests] = await Promise.all([
      repository.load(traveler.id, historyOffset),
      guildRepository.listMembers(traveler.id),
      guildRepository.listJoinRequests(traveler.id),
    ]);
    if (workspace.guildId !== context.guild.id)
      throw new Error('Guild context changed');
    return { context, workspace, members, requests };
  }, [traveler.id, historyOffset]);
  useEffect(() => {
    let cancelled = false;
    fetchData()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError('');
        }
      })
      .catch(() => {
        if (!cancelled)
          setError(
            'Não foi possível carregar o Painel da Guilda. A atualização autorizada do banco pode estar pendente.',
          );
      });
    return () => {
      cancelled = true;
    };
  }, [fetchData, revision]);
  const act = async (operation: () => Promise<unknown>, message: string) => {
    if (pending.current) return false;
    pending.current = true;
    setBusy(true);
    setFeedback('');
    setError('');
    try {
      await operation();
      const result = await fetchData();
      setData(result);
      setFeedback(message);
      return true;
    } catch {
      setError(
        'A operação não foi confirmada. Confira a permissão e atualize os dados antes de tentar novamente.',
      );
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  if (!data)
    return (
      <section className={css.panel}>
        {error ? (
          <>
            <p role="alert" className={`${css.notice} ${css.error}`}>
              {error}
            </p>
            <button onClick={() => setRevision((v) => v + 1)}>
              Tentar novamente
            </button>
          </>
        ) : (
          <p role="status">Carregando Painel da Guilda…</p>
        )}
      </section>
    );
  if (
    !data.context ||
    data.context.membership.role !== 'leader' ||
    !data.workspace
  )
    return (
      <section className={css.panel}>
        <h1>Painel da Guilda</h1>
        <p>Esta área está disponível à liderança autorizada da sua Guilda.</p>
        <Link className={css.link} href="/journey/guild">
          Voltar à Guilda
        </Link>
      </section>
    );
  const { workspace, members, requests, context } = data;
  const queue = workspace.attempts.filter(
    (a) =>
      !a.decision &&
      members.some(
        (m) => m.traveler_id === a.traveler_id && m.member_status === 'active',
      ) &&
      workspace.progress.some(
        (p) =>
          p.mission_id === a.mission_id &&
          p.traveler_id === a.traveler_id &&
          p.status === 'pending_approval' &&
          p.submission_revision === a.revision,
      ) &&
      workspace.missions.some(
        (m) => m.id === a.mission_id && m.status !== 'cancelled',
      ),
  );
  const pendingRewards = workspace.progress.filter(
    (p) => ['approved', 'completed'].includes(p.status) && !p.reward_claimed_at,
  );
  const name = (id: string) =>
    members.find((m) => m.traveler_id === id)?.traveler_name ?? 'Viajante';
  const review = async (id: string, version: number, decision: Decision) => {
    const reason = reasons[id] ?? '';
    if (decision !== 'approved' && !reason.trim()) {
      setError(
        'Informe uma justificativa para rejeitar ou solicitar correção.',
      );
      return;
    }
    const key = `${id}:${decision}:${reason}`;
    if (!decisionKeys.current.has(key))
      decisionKeys.current.set(key, crypto.randomUUID());
    await act(
      () =>
        repository.review(
          traveler.id,
          id,
          version,
          decision,
          reason,
          decisionKeys.current.get(key)!,
        ),
      decision === 'approved'
        ? 'Aprovação registrada. Recompensa pendente de integração.'
        : 'Decisão registrada e enviada ao membro.',
    );
  };
  return (
    <section className={css.panel} aria-labelledby="guild-panel-title">
      <header className={css.hero}>
        <p className={css.kicker}>{context.guild.name} · liderança</p>
        <h1 id="guild-panel-title">Painel da Guilda</h1>
        <p>
          Organize atividades, acompanhe seus membros e revise conclusões. As
          decisões desta Guilda não bloqueiam o Modo História.
        </p>
        <Link className={css.link} href="/journey/guild">
          Ver área dos membros →
        </Link>
      </header>
      <GuildInvitePanel travelerId={traveler.id} />
      <nav className={css.tabs} aria-label="Áreas do Painel da Guilda">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            aria-pressed={tab === id}
            onClick={() => {
              setTab(id);
              setEditor(null);
            }}
          >
            {label}
            {id === 'approvals' ? ` (${queue.length})` : ''}
          </button>
        ))}
      </nav>
      <label className={css.mobileNav}>
        Área do painel
        <select
          value={tab}
          onChange={(e) => {
            setTab(e.target.value as Tab);
            setEditor(null);
          }}
        >
          {tabs.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
              {id === 'approvals' ? ` (${queue.length})` : ''}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p className={`${css.notice} ${css.error}`} role="alert">
          {error}
        </p>
      )}
      {feedback && (
        <p className={css.notice} role="status">
          {feedback}
        </p>
      )}
      {tab === 'overview' && (
        <>
          <h2>Visão geral</h2>
          <div className={css.grid}>
            <section className={css.card}>
              <h3>Precisam de atenção</h3>
              <p>{queue.length} conclusões aguardando decisão.</p>
              <p>
                {requests.filter((r) => r.request_status === 'pending').length}{' '}
                pedidos de entrada.
              </p>
              <div className={css.actions}>
                <button onClick={() => setTab('approvals')}>
                  Revisar conclusões
                </button>
                <button onClick={() => setTab('requests')}>Ver pedidos</button>
              </div>
            </section>
            <section className={css.card}>
              <h3>Atividades da Guilda</h3>
              <p>
                {
                  workspace.missions.filter((m) => m.status === 'published')
                    .length
                }{' '}
                publicadas ·{' '}
                {workspace.missions.filter((m) => m.status === 'draft').length}{' '}
                rascunhos.
              </p>
              <p>
                {pendingRewards.length} recompensas pendentes de integração.
              </p>
              <button onClick={() => setTab('missions')}>
                Organizar missões
              </button>
            </section>
          </div>
          <p className={css.meta}>
            O conteúdo é definido pelo líder e não constitui avaliação
            espiritual nem declaração bíblica oficial.
          </p>
        </>
      )}
      {(tab === 'missions' || tab === 'special') && (
        <>
          <h2>{tab === 'special' ? 'Desafios especiais' : 'Missões'}</h2>
          {editor ? (
            <MissionEditor
              key={editor.id}
              initial={
                editor.mission ? formFromMission(editor.mission) : undefined
              }
              special={editor.special}
              members={members}
              busy={busy}
              onCancel={() => setEditor(null)}
              onSave={async (value) => {
                const ok = await act(
                  () =>
                    repository.save(
                      traveler.id,
                      editor.id,
                      editor.mission?.workspace_revision ?? 0,
                      value,
                    ),
                  'Rascunho salvo. Revise e publique quando estiver pronto.',
                );
                if (!ok) throw new Error('Save not confirmed');
                setEditor(null);
              }}
            />
          ) : (
            <>
              <button
                onClick={() =>
                  setEditor({
                    id: crypto.randomUUID(),
                    special: tab === 'special',
                  })
                }
              >
                {' '}
                {tab === 'special' ? 'Criar desafio especial' : 'Criar missão'}
              </button>
              <div className={css.list}>
                {workspace.missions
                  .filter((m) => isSpecial(m) === (tab === 'special'))
                  .map((m) => (
                    <article
                      className={css.card}
                      key={m.id}
                      data-special={isSpecial(m)}
                    >
                      <span className={css.badge}>
                        {missionLabels[m.status]}
                      </span>
                      <h3>{m.title}</h3>
                      <p>{m.description}</p>
                      <details>
                        <summary>Ver requisitos</summary>
                        <p>
                          Objetivo:{' '}
                          {m.objective ??
                            'Complete o rascunho antes de publicar.'}
                        </p>
                        <p>Instruções: {m.instructions ?? 'a completar'}</p>
                        <p>
                          Comprovação: {m.evidence_criterion ?? 'a completar'}
                        </p>
                        {m.bible_reference && (
                          <p>
                            Referência informada pelo líder: {m.bible_reference}
                          </p>
                        )}
                        <p>
                          Público:{' '}
                          {m.audience === 'selected'
                            ? m.target_traveler_ids.map(name).join(', ')
                            : 'todos os membros ativos'}
                        </p>
                        <p>
                          Início:{' '}
                          {m.starts_at
                            ? new Date(m.starts_at).toLocaleString('pt-BR')
                            : 'após publicação'}{' '}
                          · Prazo:{' '}
                          {m.due_at
                            ? new Date(m.due_at).toLocaleString('pt-BR')
                            : 'sem prazo definido'}
                        </p>
                      </details>
                      <p className={css.meta}>
                        Recompensa prevista:{' '}
                        {
                          guildMissionRewards[m.reward_tier as GuildRewardTier]
                            ?.xp
                        }{' '}
                        XP ·{' '}
                        {
                          guildMissionRewards[m.reward_tier as GuildRewardTier]
                            ?.coins
                        }{' '}
                        moedas ·{' '}
                        {
                          guildMissionRewards[m.reward_tier as GuildRewardTier]
                            ?.chestLabel
                        }
                      </p>
                      <div className={css.actions}>
                        {m.status === 'draft' && (
                          <>
                            <button
                              disabled={busy}
                              onClick={() =>
                                setEditor({
                                  id: m.id,
                                  mission: m,
                                  special: isSpecial(m),
                                })
                              }
                            >
                              Editar rascunho
                            </button>
                            <button
                              disabled={busy}
                              onClick={() =>
                                void act(
                                  () =>
                                    repository.transition(
                                      traveler.id,
                                      m.id,
                                      m.workspace_revision,
                                      'publish',
                                    ),
                                  'Missão publicada para os membros elegíveis.',
                                )
                              }
                            >
                              Publicar
                            </button>
                          </>
                        )}
                        {m.status === 'published' && (
                          <button
                            disabled={busy}
                            onClick={() =>
                              void act(
                                () =>
                                  repository.transition(
                                    traveler.id,
                                    m.id,
                                    m.workspace_revision,
                                    'close',
                                  ),
                                'Atividade encerrada. Conclusões já enviadas continuam disponíveis para revisão.',
                              )
                            }
                          >
                            Encerrar
                          </button>
                        )}
                        {['draft', 'published'].includes(m.status) && (
                          <button
                            disabled={busy}
                            onClick={() =>
                              void act(
                                () =>
                                  repository.transition(
                                    traveler.id,
                                    m.id,
                                    m.workspace_revision,
                                    'cancel',
                                  ),
                                'Atividade cancelada. O histórico foi preservado.',
                              )
                            }
                          >
                            Cancelar atividade
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
              </div>
              {!workspace.missions.some(
                (m) => isSpecial(m) === (tab === 'special'),
              ) && (
                <p className={css.notice}>
                  Nenhuma atividade nesta seção. Crie um rascunho para começar.
                </p>
              )}
            </>
          )}
        </>
      )}
      {tab === 'members' && (
        <>
          <h2>Membros</h2>
          <ul className={css.list}>
            {members.map((m) => (
              <li className={css.card} key={m.traveler_id}>
                <h3>{m.traveler_name}</h3>
                <p>
                  {m.role === 'leader' ? 'Líder' : 'Membro'} ·{' '}
                  {m.member_status === 'active' ? 'Ativo' : 'Vínculo encerrado'}
                </p>
                {m.role !== 'leader' && m.member_status === 'active' && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void act(
                        () =>
                          guildRepository.removeMember(
                            m.traveler_id,
                            traveler.id,
                          ),
                        'Membro removido da Guilda.',
                      )
                    }
                  >
                    Remover membro
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {tab === 'requests' && (
        <>
          <h2>Pedidos de entrada</h2>
          {requests
            .filter((r) => r.request_status === 'pending')
            .map((r) => (
              <article className={css.card} key={r.request_id}>
                <h3>{r.traveler_name}</h3>
                <p>
                  Aguardando decisão ·{' '}
                  {new Date(r.created_at).toLocaleString('pt-BR')}
                </p>
                <div className={css.actions}>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void act(
                        () =>
                          guildRepository.reviewJoinRequest(
                            r.request_id,
                            traveler.id,
                            true,
                          ),
                        'Entrada aprovada.',
                      )
                    }
                  >
                    Aprovar entrada
                  </button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void act(
                        () =>
                          guildRepository.reviewJoinRequest(
                            r.request_id,
                            traveler.id,
                            false,
                          ),
                        'Pedido de entrada rejeitado.',
                      )
                    }
                  >
                    Rejeitar entrada
                  </button>
                </div>
              </article>
            ))}
          {!requests.some((r) => r.request_status === 'pending') && (
            <p>Nenhum pedido pendente.</p>
          )}
        </>
      )}
      {tab === 'approvals' && (
        <>
          <h2>Aprovações pendentes</h2>
          {queue.map((a) => (
            <article className={css.card} key={a.id}>
              <h3>
                {a.traveler_name} ·{' '}
                {workspace.missions.find((m) => m.id === a.mission_id)?.title}
              </h3>
              <p className={css.meta}>
                Tentativa {a.revision} ·{' '}
                {new Date(a.submitted_at).toLocaleString('pt-BR')}
              </p>
              <h4>Comprovação enviada</h4>
              <p>
                {a.note ||
                  'Nenhuma comprovação foi registrada no fluxo anterior. Solicite um reenvio.'}
              </p>
              <div className={css.form}>
                <label>
                  Justificativa ou orientação
                  <textarea
                    maxLength={500}
                    value={reasons[a.id] ?? ''}
                    onChange={(e) =>
                      setReasons((current) => ({
                        ...current,
                        [a.id]: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <div className={css.actions}>
                <button
                  disabled={
                    busy || a.traveler_id === traveler.id || !a.note.trim()
                  }
                  onClick={() => void review(a.id, a.revision, 'approved')}
                >
                  Aprovar conclusão
                </button>
                <button
                  disabled={busy || a.traveler_id === traveler.id}
                  onClick={() => void review(a.id, a.revision, 'rejected')}
                >
                  Rejeitar conclusão
                </button>
                <button
                  disabled={busy || a.traveler_id === traveler.id}
                  onClick={() =>
                    void review(a.id, a.revision, 'changes_requested')
                  }
                >
                  Solicitar correção
                </button>
              </div>
              <p className={css.meta}>
                Rejeição e correção exigem justificativa. Não é permitido
                revisar a própria conclusão, inclusive com outro Viajante da
                mesma conta.
              </p>
            </article>
          ))}
          {!queue.length && (
            <p className={css.notice}>
              Nenhuma conclusão aguardando aprovação.
            </p>
          )}
        </>
      )}
      {tab === 'rewards' && (
        <>
          <h2>Recompensas</h2>
          <p className={css.notice}>
            Aprovação e concessão são etapas distintas. Esta versão preserva os
            tiers existentes e mantém a recompensa pendente de integração; não
            altera saldos reais.
          </p>
          {workspace.progress
            .filter((p) => ['approved', 'completed'].includes(p.status))
            .map((p) => (
              <article className={css.card} key={p.id}>
                <h3>
                  {name(p.traveler_id)} ·{' '}
                  {workspace.missions.find((m) => m.id === p.mission_id)?.title}
                </h3>
                <p>{rewardLabel(p)}</p>
                <p className={css.meta}>
                  {progressLabels[p.status]}
                  {p.approved_at
                    ? ` · ${new Date(p.approved_at).toLocaleString('pt-BR')}`
                    : ''}
                </p>
              </article>
            ))}
        </>
      )}
      {tab === 'history' && (
        <>
          <h2>Histórico de atividades</h2>
          <p className={css.meta}>
            Decisões e eventos são protegidos. Comprovações pessoais não
            aparecem no log geral.
          </p>
          <ul className={css.list}>
            {workspace.history.map((h) => (
              <li className={css.card} key={h.id}>
                <p>
                  {historyLabels[h.event_type] ?? 'Atividade registrada'} ·{' '}
                  {h.actor_traveler_id ? name(h.actor_traveler_id) : 'Sistema'}
                </p>
                <p className={css.meta}>
                  {new Date(h.created_at).toLocaleString('pt-BR')}
                </p>
              </li>
            ))}
          </ul>
          <h3>Decisões de conclusões</h3>
          {workspace.attempts
            .filter((a) => a.decision)
            .map((a) => (
              <details className={css.card} key={a.id}>
                <summary>
                  {a.traveler_name} ·{' '}
                  {progressLabels[a.decision!] ?? a.decision} · tentativa{' '}
                  {a.revision}
                </summary>
                <p>{a.reason ?? 'Aprovação registrada.'}</p>
                <p className={css.meta}>
                  Revisor:{' '}
                  {a.reviewer_traveler_id
                    ? name(a.reviewer_traveler_id)
                    : 'Liderança'}{' '}
                  ·{' '}
                  {a.decided_at
                    ? new Date(a.decided_at).toLocaleString('pt-BR')
                    : ''}
                </p>
                <p>Comprovação: {a.note}</p>
              </details>
            ))}
          <div className={css.actions}>
            <button
              disabled={historyOffset === 0}
              onClick={() => setHistoryOffset((v) => Math.max(0, v - 20))}
            >
              Página anterior
            </button>
            <button
              disabled={workspace.history.length < 20 || historyOffset >= 10000}
              onClick={() => setHistoryOffset((v) => v + 20)}
            >
              Próxima página
            </button>
          </div>
        </>
      )}
    </section>
  );
}
const historyLabels: Record<string, string> = {
  mission_draft_updated: 'Rascunho atualizado',
  mission_state_changed: 'Estado da atividade alterado',
  guild_created: 'Guilda criada',
  member_joined: 'Membro entrou',
  member_removed: 'Membro removido',
  member_left: 'Membro saiu',
  mission_created: 'Missão criada',
  mission_published: 'Missão publicada',
  mission_closed: 'Missão encerrada',
  draft_deleted: 'Atividade cancelada',
  mission_submitted: 'Conclusão enviada',
  mission_decision: 'Decisão de conclusão registrada',
  mission_rejected: 'Conclusão rejeitada',
  mission_completed: 'Missão concluída',
  reward_processed: 'Recompensa registrada',
};
