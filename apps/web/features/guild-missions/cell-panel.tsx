'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  guildActivityRepository as repository,
  CellCommandRejected,
  type CellAction,
} from '../../lib/supabase/repositories/guild-activity-repository';
import { MissionEditor } from './mission-editor';
import {
  activityCategories,
  futureCategories,
  blankCell,
  cellForm,
  cellPayload,
  type CellDetails,
  type CellMission,
  type CellWorkspace,
  type CellProgress,
} from './cell-contracts';
import css from './panel.module.css';
const labels = {
  draft: 'Rascunho',
  published: 'Publicado',
  closed: 'Encerrado',
  cancelled: 'Cancelado',
};
const results: Record<string, string> = {
  pending_approval: 'Aguardando validação',
  approved: 'Participação validada · sem recompensa',
  rejected: 'Não validada',
  changes_requested: 'Correção solicitada',
};
type Action = (
  action: CellAction,
  id: string,
  revision: number,
  data: object,
) => Promise<boolean>;
export function CellActivityPanel({
  actor,
  guildId,
}: {
  actor: string;
  guildId: string;
}) {
  const [data, setData] = useState<CellWorkspace | null>(null),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [offset, setOffset] = useState(0),
    [tab, setTab] = useState('overview');
  const [editor, setEditor] = useState<{
    id: string;
    mission?: CellMission;
    extra: CellDetails;
  } | null>(null);
  const mounted = useRef(false),
    pending = useRef(false),
    intent = useRef<{ signature: string; request: string } | null>(null);
  const load = useCallback(
    () => repository.load(actor, guildId, offset),
    [actor, guildId, offset],
  );
  useEffect(() => {
    mounted.current = true;
    let live = true;
    void load()
      .then((w) => {
        if (live) {
          setData(w);
          setError('');
        }
      })
      .catch((e) => {
        if (live) {
          setData(null);
          setError(e instanceof Error ? e.message : 'Consulta indisponível.');
        }
      });
    return () => {
      live = false;
      mounted.current = false;
    };
  }, [load]);
  const refresh = async () => {
    try {
      const w = await load();
      if (mounted.current) {
        setData(w);
        setError('');
        intent.current = null;
      }
    } catch (e) {
      if (mounted.current) {
        setData(null);
        setError(e instanceof Error ? e.message : 'Consulta indisponível.');
      }
    }
  };
  const action: Action = async (name, id, revision, payload) => {
    if (pending.current) return false;
    const signature = JSON.stringify([name, id, revision, payload]);
    if (intent.current && intent.current.signature !== signature) {
      setError(
        'Há um resultado pendente. Atualize e confira o histórico antes de iniciar outra operação.',
      );
      return false;
    }
    intent.current ??= { signature, request: crypto.randomUUID() };
    pending.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await repository.command(
        actor,
        guildId,
        name,
        id,
        revision,
        payload,
        intent.current.request,
      );
      const w = await load();
      if (mounted.current) {
        setData(w);
        setMessage(
          'Registro confirmado. Nenhum XP, moeda ou baú foi concedido.',
        );
        intent.current = null;
      }
      return true;
    } catch (e) {
      if (e instanceof CellCommandRejected) intent.current = null;
      if (mounted.current)
        setError(e instanceof Error ? e.message : 'Resultado não confirmado.');
      return false;
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  if (!data)
    return (
      <section aria-label="Encontros e atividades" className={css.panel}>
        <h2>Encontros e atividades da comunidade</h2>
        {error ? (
          <p role="alert">{error}</p>
        ) : (
          <p role="status">Carregando atividades…</p>
        )}
        <button disabled={busy} onClick={() => void refresh()}>
          Atualizar atividades
        </button>
      </section>
    );
  const visible = data.missions.filter((m) =>
    tab === 'meetings'
      ? m.kind === 'meeting'
      : tab === 'activities'
        ? m.kind === 'activity'
        : true,
  );
  return (
    <section className={css.panel} aria-label="Encontros e atividades">
      <h2>Encontros e atividades da comunidade</h2>
      <p>
        Guilda selecionada. Participação educativa, sem medir fé ou
        espiritualidade. Recompensas futuras estão indisponíveis; nenhum XP,
        moeda ou baú é emitido.
      </p>
      <div className={css.actions}>
        <button disabled={busy} onClick={() => void refresh()}>
          Atualizar atividades
        </button>
        {data.leader && (
          <>
            <button
              disabled={busy}
              onClick={() =>
                setEditor({
                  id: crypto.randomUUID(),
                  extra: blankCell(actor, 'meeting'),
                })
              }
            >
              Criar encontro
            </button>
            <button
              disabled={busy}
              onClick={() =>
                setEditor({
                  id: crypto.randomUUID(),
                  extra: blankCell(actor, 'activity'),
                })
              }
            >
              Criar atividade
            </button>
          </>
        )}
      </div>
      <label>
        Área das atividades
        <select
          aria-label="Área das atividades"
          disabled={busy}
          value={tab}
          onChange={(e) => setTab(e.target.value)}
        >
          <option value="overview">Visão geral e agenda</option>
          <option value="meetings">Encontros</option>
          <option value="activities">Atividades e desafios</option>
          <option value="participation">Participações e resultados</option>
          <option value="history">Histórico de atividades</option>
        </select>
      </label>
      {error && (
        <p role="alert" className={css.notice}>
          {error}
        </p>
      )}
      {message && (
        <p role="status" className={css.notice}>
          {message}
        </p>
      )}
      {editor && data.leader && (
        <MissionEditor
          key={editor.id}
          cellMode
          initial={editor.mission ? cellForm(editor.mission) : undefined}
          members={
            data.members.map((m) => ({
              traveler_id: m.id,
              traveler_name: m.name,
              member_status: 'active',
              role: 'member',
            })) as Parameters<typeof MissionEditor>[0]['members']
          }
          busy={busy}
          onCancel={() => setEditor(null)}
          onSave={async (form) => {
            if (
              !(await action(
                'save',
                editor.id,
                editor.mission?.revision ?? 0,
                cellPayload(form, editor.extra),
              ))
            )
              throw Error('Não confirmado.');
            setEditor(null);
          }}
        >
          <CellFields
            value={editor.extra}
            members={data.members}
            meetings={data.missions.filter(
              (m) =>
                m.kind === 'meeting' &&
                ['draft', 'published'].includes(m.status),
            )}
            busy={busy}
            onChange={(extra) =>
              setEditor((current) => (current ? { ...current, extra } : null))
            }
          />
        </MissionEditor>
      )}
      {tab === 'history' ? (
        <>
          <h3>Histórico auditado</h3>
          {data.history.map((h) => (
            <p key={h.id}>
              {new Date(h.created_at).toLocaleString('pt-BR')} ·{' '}
              {h.event_type.replace('community_', '')} ·{' '}
              {data.missions.find((m) => m.id === h.entity_id)?.title}
            </p>
          ))}
          {data.validations.map((h, i) => (
            <p className={css.notice} key={`${h.missionId}-${h.revision}-${i}`}>
              {new Date(h.createdAt).toLocaleString('pt-BR')} ·{' '}
              {results[h.beforeStatus] ?? h.beforeStatus} →{' '}
              {results[h.afterStatus] ?? h.afterStatus}
              {h.reason && ` · ${h.reason}`}
            </p>
          ))}
          {!data.history.length && !data.validations.length && (
            <p>Nenhum registro nesta página.</p>
          )}
        </>
      ) : visible.length ? (
        visible.map((m) => (
          <article
            className={css.card}
            aria-label={`Atividade: ${m.title}`}
            key={m.id}
          >
            <p className={css.meta}>
              {m.kind === 'meeting'
                ? 'Encontro'
                : activityCategories[m.category]}{' '}
              · {labels[m.status]} · v{m.revision}
            </p>
            <h3>{m.title}</h3>
            {m.theme && <p>Tema: {m.theme}</p>}
            <p>{m.description}</p>
            <p>Objetivo: {m.objective}</p>
            {m.reference && <p>Referência bíblica: {m.reference}</p>}
            {m.startsAt && (
              <p>Início: {new Date(m.startsAt).toLocaleString('pt-BR')}</p>
            )}
            {m.dueAt && (
              <p>Encerramento: {new Date(m.dueAt).toLocaleString('pt-BR')}</p>
            )}
            {m.kind === 'meeting' && (
              <p>
                {m.meetingType === 'digital'
                  ? 'Encontro digital'
                  : 'Encontro presencial em espaço comunitário'}
              </p>
            )}
            {m.accessDetails &&
              (m.meetingType === 'digital' ? (
                <p>
                  <a
                    href={m.accessDetails}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir acesso privado autorizado
                  </a>
                </p>
              ) : (
                <p>Orientação privada do encontro: {m.accessDetails}</p>
              ))}
            <details>
              <summary>Orientações e validação</summary>
              <p>{m.instructions}</p>
              <p>Critério: {m.evidenceCriterion}</p>
              <p>
                Validação humana por responsável autorizado. Declaração não é
                prova automática de presença ou fé.
              </p>
              <p>
                Categoria futura: {futureCategories[m.futureCategory]}.
                Integração econômica010D indisponível.
              </p>
            </details>
            {m.canEdit && (
              <div className={css.actions}>
                {m.status === 'draft' && (
                  <>
                    <button
                      disabled={busy}
                      onClick={() =>
                        setEditor({ id: m.id, mission: m, extra: m })
                      }
                    >
                      Editar rascunho
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void action('state', m.id, m.revision, {
                          state: 'published',
                        })
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
                      void action('state', m.id, m.revision, {
                        state: 'closed',
                      })
                    }
                  >
                    Encerrar
                  </button>
                )}
                {['draft', 'published'].includes(m.status) && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void action('state', m.id, m.revision, {
                        state: 'cancelled',
                      })
                    }
                  >
                    Cancelar encontro ou atividade
                  </button>
                )}
              </div>
            )}
            <Participation
              mission={m}
              records={data.progress.filter((p) => p.missionId === m.id)}
              actor={actor}
              busy={busy}
              action={action}
            />
            {m.canEdit && (
              <Delegate
                mission={m}
                members={data.members}
                delegations={data.delegations.filter(
                  (d) => d.missionId === m.id,
                )}
                busy={busy}
                action={action}
              />
            )}
          </article>
        ))
      ) : (
        <p>Nenhum encontro ou atividade nesta página.</p>
      )}
      <div className={css.actions}>
        <button
          disabled={busy || offset === 0}
          onClick={() => {
            setEditor(null);
            setOffset((n) => Math.max(0, n - 25));
          }}
        >
          Página anterior de atividades
        </button>
        <button
          disabled={busy || !data.hasMore}
          onClick={() => {
            setEditor(null);
            setOffset((n) => n + 25);
          }}
        >
          Próxima página de atividades
        </button>
      </div>
      <p>
        Gincanas verificadas e eventos entre Guildas terão incrementos próprios.
        As demonstrações de Missões e Serpente permanecem sem progressão.
      </p>
    </section>
  );
}
function CellFields({
  value,
  members,
  meetings,
  busy,
  onChange,
}: {
  value: CellDetails;
  members: { id: string; name: string }[];
  meetings: CellMission[];
  busy: boolean;
  onChange: (value: CellDetails) => void;
}) {
  const update = <K extends keyof CellDetails>(key: K, v: CellDetails[K]) =>
    onChange({ ...value, [key]: v });
  return (
    <fieldset disabled={busy}>
      <legend>
        {value.kind === 'meeting' ? 'Dados do encontro' : 'Dados da atividade'}
      </legend>
      <label>
        Tema (opcional)
        <input
          maxLength={100}
          value={value.theme}
          onChange={(e) => update('theme', e.target.value)}
        />
      </label>
      <label>
        Responsável da comunidade
        <select
          aria-label="Responsável da comunidade"
          value={value.responsibleId}
          onChange={(e) => update('responsibleId', e.target.value)}
        >
          {members.map((m) => (
            <option value={m.id} key={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      <p>
        Escolher o responsável não concede privilégios. Um substituto precisa de
        autorização temporária explícita abaixo da atividade.
      </p>
      {value.kind === 'meeting' ? (
        <>
          <label>
            Tipo de encontro
            <select
              aria-label="Tipo de encontro"
              value={value.meetingType}
              onChange={(e) =>
                update(
                  'meetingType',
                  e.target.value as CellDetails['meetingType'],
                )
              }
            >
              <option value="in_person">Presencial</option>
              <option value="digital">Digital</option>
            </select>
          </label>
          <label>
            {value.meetingType === 'digital'
              ? 'Link HTTPS privado (sem credenciais no endereço)'
              : 'Ponto comunitário de encontro (sem endereço residencial)'}
            <input
              maxLength={600}
              value={value.accessDetails}
              onChange={(e) => update('accessDetails', e.target.value)}
            />
          </label>
          <p>
            Somente público autorizado vê o acesso após publicação. Não inclua
            residência, telefone, dados de adolescentes ou geolocalização.
          </p>
        </>
      ) : (
        <>
          <label>
            Encontro associado (opcional)
            <select
              aria-label="Encontro associado"
              value={value.meetingId}
              onChange={(e) => update('meetingId', e.target.value)}
            >
              <option value="">Atividade independente</option>
              {meetings.map((m) => (
                <option value={m.id} key={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Categoria da atividade
            <select
              aria-label="Categoria da atividade"
              value={value.category}
              onChange={(e) =>
                update('category', e.target.value as CellDetails['category'])
              }
            >
              {Object.entries(activityCategories).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      <label>
        Classificação futura (não concede recompensa)
        <select
          aria-label="Classificação futura"
          value={value.futureCategory}
          onChange={(e) =>
            update(
              'futureCategory',
              e.target.value as CellDetails['futureCategory'],
            )
          }
        >
          {Object.entries(futureCategories).map(([key, name]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}
function Participation({
  mission,
  records,
  actor,
  busy,
  action,
}: {
  mission: CellMission;
  records: CellProgress[];
  actor: string;
  busy: boolean;
  action: Action;
}) {
  const [declared, setDeclared] = useState(false);
  const own = records.find((p) => p.own),
    eligible =
      mission.canParticipate &&
      (!own || ['rejected', 'changes_requested'].includes(own.status));
  return (
    <section>
      <h4>Participação e resultados</h4>
      {eligible && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              declared &&
              (await action('participate', mission.id, own?.revision ?? 0, {
                declared: true,
              }))
            )
              setDeclared(false);
          }}
        >
          <label className={css.check}>
            <input
              type="checkbox"
              required
              checked={declared}
              disabled={busy}
              onChange={(e) => setDeclared(e.target.checked)}
            />
            Declaro minha participação, sem enviar texto pessoal, foto ou
            localização.
          </label>
          <button disabled={busy || !declared}>
            Solicitar validação de participação
          </button>
        </form>
      )}
      {!mission.canParticipate && mission.status === 'published' && (
        <p>
          Participação indisponível agora. Confira datas e atualize a consulta.
        </p>
      )}
      {records.map((p) => (
        <div className={css.notice} key={p.id}>
          <p>
            {p.own ? 'Sua participação' : p.travelerName}:{' '}
            {results[p.status] ?? p.status} · v{p.revision}
          </p>
          {p.reviewNote && <p>Orientação: {p.reviewNote}</p>}
          {p.own && p.travelerId !== actor && (
            <p>
              Esta conta já participa com outro avatar. Não será criada
              participação duplicada.
            </p>
          )}
          {mission.canValidate && !p.own && (
            <Review
              key={`${p.id}-${p.revision}`}
              record={p}
              mission={mission}
              action={action}
              busy={busy}
            />
          )}
        </div>
      ))}
      {!records.length && <p>Nenhuma participação visível nesta atividade.</p>}
    </section>
  );
}
function Review({
  record,
  mission,
  action,
  busy,
}: {
  record: CellProgress;
  mission: CellMission;
  action: Action;
  busy: boolean;
}) {
  const [decision, setDecision] = useState('approved'),
    [reason, setReason] = useState('');
  return (
    <form
      aria-label={`Validar participação de ${record.travelerName}`}
      onSubmit={(e) => {
        e.preventDefault();
        void action('review', mission.id, record.revision, {
          travelerId: record.travelerId,
          decision,
          reason,
        });
      }}
    >
      <label>
        Decisão
        <select
          aria-label="Decisão de participação"
          disabled={busy}
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
        >
          <option value="approved">Validar participação</option>
          <option value="changes_requested">Solicitar correção</option>
          <option value="rejected">Não validar</option>
        </select>
      </label>
      <label>
        Motivo objetivo (obrigatório em correção)
        <textarea
          maxLength={300}
          disabled={busy}
          required={
            decision !== 'approved' ||
            record.status !== 'pending_approval' ||
            mission.status === 'closed'
          }
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <p>
        Não registre dados sensíveis nem avaliações de fé. Toda decisão fica no
        histórico, sem conceder XP ou baú.
      </p>
      <button disabled={busy || mission.status === 'cancelled'}>
        Confirmar validação
      </button>
    </form>
  );
}
function Delegate({
  mission,
  members,
  delegations,
  busy,
  action,
}: {
  mission: CellMission;
  members: { id: string; name: string }[];
  delegations: CellWorkspace['delegations'];
  busy: boolean;
  action: Action;
}) {
  const [target, setTarget] = useState(''),
    [expires, setExpires] = useState('');
  const current = delegations.find((d) => d.travelerId === target);
  return (
    <details>
      <summary>Substituto temporário desta atividade</summary>
      <p>
        Autoriza somente validação neste encontro ou atividade. Não concede
        liderança, professor ou economia. Prazo máximo de30dias; saída,
        revogação e expiração retiram o poder no servidor.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (target && expires)
            void action('delegate', mission.id, current?.revision ?? 0, {
              travelerId: target,
              active: true,
              expiresAt: new Date(expires).toISOString(),
            });
        }}
      >
        <label>
          Substituto
          <select
            aria-label="Substituto temporário"
            disabled={busy}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="">Selecione um membro</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Validade da autorização
          <input
            disabled={busy}
            type="datetime-local"
            required
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
          />
        </label>
        <button
          disabled={
            busy || !target || !['draft', 'published'].includes(mission.status)
          }
        >
          Autorizar validação temporária
        </button>
      </form>
      {delegations.map((d) => (
        <div key={d.travelerId}>
          <p>
            {members.find((m) => m.id === d.travelerId)?.name ??
              'Membro autorizado'}{' '}
            · {d.active ? 'Autorização registrada' : 'Revogada'} · até
            {new Date(d.expiresAt).toLocaleString('pt-BR')}
          </p>
          {d.active && (
            <button
              disabled={busy}
              onClick={() =>
                void action('delegate', mission.id, d.revision, {
                  travelerId: d.travelerId,
                  active: false,
                  expiresAt: d.expiresAt,
                })
              }
            >
              Revogar substituto
            </button>
          )}
        </div>
      ))}
    </details>
  );
}
