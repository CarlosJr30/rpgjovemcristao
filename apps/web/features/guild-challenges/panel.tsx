'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  guildChallengeRepository as repository,
  ChallengeRejected,
} from '../../lib/supabase/repositories/guild-challenge-repository';
import type { ChallengeAction, ChallengeWorkspace } from './contracts';
import { ChallengeEditor } from './editor';
import css from '../guild-missions/panel.module.css';
const labels = {
  draft: 'Rascunho',
  published: 'Publicado',
  running: 'Em andamento',
  closed: 'Encerrado',
  cancelled: 'Cancelado',
};
type Action = (
  name: ChallengeAction,
  revision: number,
  data: object,
) => Promise<boolean>;
export function GuildChallenges({
  actor,
  guildId,
}: {
  actor: string;
  guildId: string;
}) {
  const [data, setData] = useState<ChallengeWorkspace | null>(null),
    [selected, setSelected] = useState<string | null>(null),
    [offset, setOffset] = useState(0),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [editorId, setEditor] = useState<string | null>(null);
  const epoch = useRef(0),
    pending = useRef(false),
    intent = useRef<{ signature: string; request: string } | null>(null);
  const load = useCallback(async () => {
    const generation = ++epoch.current;
    try {
      const w = await repository.load(actor, guildId, selected, offset);
      if (generation === epoch.current) {
        setData(w);
        setError('');
        return true;
      }
    } catch (e) {
      if (generation === epoch.current) {
        setData(null);
        setError(e instanceof Error ? e.message : 'Consulta indisponível.');
      }
    }
    return false;
  }, [actor, guildId, selected, offset]);
  useEffect(() => {
    let live = true;
    const generation = ++epoch.current;
    void repository
      .load(actor, guildId, selected, offset)
      .then((w) => {
        if (live && generation === epoch.current) {
          setData(w);
          setError('');
        }
      })
      .catch((e) => {
        if (live && generation === epoch.current) {
          setData(null);
          setError(e instanceof Error ? e.message : 'Consulta indisponível.');
        }
      });
    return () => {
      live = false;
    };
  }, [actor, guildId, selected, offset]);
  const command = async (
    name: ChallengeAction,
    id: string,
    revision: number,
    payload: object,
  ) => {
    if (pending.current) return false;
    const signature = JSON.stringify([name, id, revision, payload]);
    if (intent.current && intent.current.signature !== signature) {
      setError(
        'Há um resultado pendente. Atualize e confira o histórico antes de continuar.',
      );
      return false;
    }
    intent.current ??= { signature, request: crypto.randomUUID() };
    pending.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    const generation = epoch.current;
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
      if (generation !== epoch.current) return false;
      if (await load()) {
        intent.current = null;
        setMessage('Registro confirmado. Sem XP, moedas ou baús.');
        return true;
      }
    } catch (e) {
      if (generation === epoch.current) {
        if (e instanceof ChallengeRejected) intent.current = null;
        setError(e instanceof Error ? e.message : 'Registro não confirmado.');
      }
    } finally {
      pending.current = false;
      setBusy(false);
    }
    return false;
  };
  const action: Action = (name, revision, payload) =>
    selected
      ? command(name, selected, revision, payload)
      : Promise.resolve(false);
  const select = (id: string | null) => {
    epoch.current++;
    setData(null);
    setSelected(id);
    setEditor(null);
    setMessage('');
  };
  return (
    <section className={css.panel} aria-label="Gincanas e desafios em equipe">
      <h2>Gincanas e desafios em equipe</h2>
      <p className={css.notice}>
        Exercícios da comunidade, sem recompensas. Uma participação por conta.
        Gabaritos, explicações e placar são revelados após o encerramento.
        Tentativas educativas posteriores preservam o resultado oficial.
      </p>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <button
        disabled={busy}
        onClick={async () => {
          if (await load()) intent.current = null;
        }}
      >
        Atualizar gincanas
      </button>
      {!data ? (
        !error && <p role="status">Carregando gincanas…</p>
      ) : (
        <>
          <label className={css.form}>
            Gincana selecionada
            <select
              disabled={busy}
              value={selected ?? ''}
              onChange={(e) => select(e.target.value || null)}
            >
              <option value="">Escolha uma gincana</option>
              {data.events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} · {labels[e.status]}
                </option>
              ))}
              {data.event && !data.events.some((e) => e.id === selected) && (
                <option value={data.event.id}>{data.event.title}</option>
              )}
            </select>
          </label>
          <div className={css.actions}>
            <button
              disabled={busy || offset === 0}
              onClick={() => {
                select(null);
                setOffset((n) => Math.max(0, n - 20));
              }}
            >
              Página anterior
            </button>
            <button
              disabled={busy || data.events.length < 20}
              onClick={() => {
                select(null);
                setOffset((n) => n + 20);
              }}
            >
              Próxima página
            </button>
          </div>
          {data.leader && (
            <button
              disabled={busy}
              onClick={() => {
                if (selected) {
                  select(null);
                }
                setEditor(crypto.randomUUID());
              }}
            >
              Criar gincana
            </button>
          )}
          {editorId && data.leader ? (
            <ChallengeEditor
              key={editorId}
              data={data}
              busy={busy}
              close={() => setEditor(null)}
              save={async (payload) => {
                const ok = await command(
                  'save',
                  editorId,
                  editorId === data.event?.id ? data.event.revision : 0,
                  payload,
                );
                if (ok) {
                  setEditor(null);
                  select(editorId);
                }
                return ok;
              }}
            />
          ) : (
            data.event && (
              <ChallengeDetails
                key={data.event.id}
                data={data}
                busy={busy}
                action={action}
                edit={() => setEditor(data.event!.id)}
              />
            )
          )}
        </>
      )}
    </section>
  );
}
function ChallengeDetails({
  data: w,
  busy,
  action,
  edit,
}: {
  data: ChallengeWorkspace;
  busy: boolean;
  action: Action;
  edit: () => void;
}) {
  const e = w.event!,
    own = w.roster.find((r) => r.own);
  const [reason, setReason] = useState(''),
    [invite, setInvite] = useState('');
  return (
    <article className={css.card}>
      <h3>{e.title}</h3>
      <p>
        {labels[e.status]} · versão de regras {e.ruleVersion}
      </p>
      <p>{e.description}</p>
      <p>
        {e.theme} {e.reference}
      </p>
      <p>{e.criteria}</p>
      <p>
        {new Date(e.startsAt).toLocaleString('pt-BR')} até{' '}
        {new Date(e.endsAt).toLocaleString('pt-BR')}
      </p>
      <p>
        Recebimentos: {e.progressReceived} · participantes fixados:{' '}
        {e.eligibleCount}
      </p>
      {!!e.manualIds.length && (
        <p>
          Objetivos manuais: {e.manualIds.length}. Use Encontros e atividades; a
          participação precisa ser enviada após o início e validada pelo
          responsável.
        </p>
      )}
      {w.leader && (
        <>
          {e.status === 'draft' && (
            <>
              <button disabled={busy} onClick={edit}>
                Editar rascunho
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  action('state', e.revision, {
                    state: 'published',
                    reason: '',
                  })
                }
              >
                Publicar regras
              </button>
            </>
          )}
          {e.status === 'published' && (
            <>
              <label className={css.form}>
                Convidar membro
                <select
                  value={invite}
                  onChange={(x) => setInvite(x.target.value)}
                >
                  <option value="">Escolha um membro</option>
                  {w.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                disabled={busy || !invite}
                onClick={() =>
                  action('invite', e.revision, { avatarId: invite })
                }
              >
                Convidar para participar
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  action('state', e.revision, { state: 'running', reason: '' })
                }
              >
                Iniciar gincana
              </button>
            </>
          )}
          {e.status === 'running' && (
            <button
              disabled={busy}
              onClick={() =>
                action('state', e.revision, { state: 'closed', reason: '' })
              }
            >
              Encerrar e confirmar placar
            </button>
          )}
          {['draft', 'published', 'running'].includes(e.status) && (
            <>
              <label className={css.form}>
                Motivo objetivo do cancelamento
                <input
                  maxLength={300}
                  value={reason}
                  onChange={(x) => setReason(x.target.value)}
                />
              </label>
              <button
                disabled={busy || !reason.trim()}
                onClick={() =>
                  action('state', e.revision, { state: 'cancelled', reason })
                }
              >
                Cancelar gincana
              </button>
            </>
          )}
        </>
      )}
      {own &&
        e.status === 'published' &&
        !own.frozen &&
        own.status !== 'accepted' && (
          <button
            disabled={busy}
            onClick={() => action('enrol', own.revision, { accept: true })}
          >
            Aceitar participação nesta gincana
          </button>
        )}
      {own &&
        ['invited', 'accepted'].includes(own.status) &&
        ['published', 'running'].includes(e.status) && (
          <button
            disabled={busy}
            onClick={() => action('enrol', own.revision, { accept: false })}
          >
            {own.status === 'invited'
              ? 'Recusar convite'
              : 'Retirar participação'}
          </button>
        )}
      <ul>
        {w.roster.map((r) => (
          <li key={r.id}>
            {r.alias} · {r.status}
            {r.own && ' · você'}
            {w.leader &&
            e.status === 'published' &&
            e.mode !== 'individual' &&
            r.status === 'accepted' ? (
              <label className={css.form}>
                Equipe de {r.alias}
                <select
                  disabled={busy}
                  value={r.teamId ?? ''}
                  onChange={(x) => {
                    if (x.target.value)
                      void action('team', e.revision, {
                        rosterId: r.id,
                        teamId: x.target.value,
                      });
                  }}
                >
                  <option value="">Escolha equipe</option>
                  {w.teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              r.teamId &&
              ` · ${w.teams.find((t) => t.id === r.teamId)?.name ?? 'Equipe'}`
            )}
          </li>
        ))}
      </ul>
      {(e.canAnswer || e.canPractice) && (
        <ChallengeAnswers
          key={`${e.id}:${e.status}`}
          data={w}
          busy={busy}
          action={action}
        />
      )}
      {w.myResult && (
        <p>
          Resultado oficial recebido e preservado
          {w.myResult.score === null
            ? '; nota disponível no encerramento.'
            : `: ${w.myResult.score}/7.`}{' '}
          Tentativas educativas: {w.myResult.practiceCount}.
        </p>
      )}
      {e.status === 'closed' && w.myResult && (
        <ol>
          {w.questions.map((q, i) => (
            <li key={i}>
              {q.prompt}
              <p>Resposta correta: {q.options[q.answerKey ?? -1]}</p>
              <p>{q.feedback}</p>
              {q.reference && <p>{q.reference}</p>}
            </li>
          ))}
        </ol>
      )}
      {w.latestPractice && (
        <p>
          Última tentativa educativa: {w.latestPractice.score}/7. O placar
          oficial permanece igual.
        </p>
      )}
      {w.board && (
        <section aria-label="Placar oficial">
          <h4>Placar oficial confirmado</h4>
          <p>
            Média da lista fixada; ausentes valem zero. Empates compartilham a
            colocação. Pontos são resultados do exercício.
          </p>
          <ol>
            {w.board.teams.map((t) => (
              <li key={t.id}>
                {t.place}º ·{' '}
                {w.teams.find((x) => x.id === t.id)?.name ??
                  w.roster.find((r) => r.id === t.id)?.alias ??
                  'Participante anterior'}{' '}
                · {Number(t.average).toFixed(2)} / {w.board!.maxPerPlayer} ·{' '}
                {t.eligible} participante(s) · {Number(t.percent).toFixed(2)}%
              </li>
            ))}
          </ol>
        </section>
      )}
      <details>
        <summary>Histórico da gincana</summary>
        <ul>
          {w.history.map((h, i) => (
            <li key={i}>
              {new Date(h.createdAt).toLocaleString('pt-BR')} · {h.action} ·
              revisão {h.revision}
              {h.reason && ` · ${h.reason}`}
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}
function ChallengeAnswers({
  data: w,
  busy,
  action,
}: {
  data: ChallengeWorkspace;
  busy: boolean;
  action: Action;
}) {
  const [choices, setChoices] = useState<number[]>(Array(7).fill(-1));
  const e = w.event!;
  return (
    <form
      aria-label={e.canPractice ? 'Tentativa educativa' : 'Respostas oficiais'}
      className={css.form}
      onSubmit={async (event) => {
        event.preventDefault();
        if (
          choices.every((v) => v >= 0 && v <= 3) &&
          (await action(e.canPractice ? 'practice' : 'answer', e.ruleVersion, {
            choices,
          }))
        )
          setChoices(Array(7).fill(-1));
      }}
    >
      <h4>
        {e.canPractice
          ? 'Aprender após o encerramento'
          : 'Tentativa oficial única'}
      </h4>
      <p>
        {e.canPractice
          ? 'Não altera o resultado oficial nem o ranking.'
          : 'Confira suas sete respostas. Ao confirmar, o resultado oficial será imutável.'}
      </p>
      {w.questions.map((q, i) => (
        <fieldset key={i} disabled={busy}>
          <legend>
            {i + 1}. {q.prompt} ·{' '}
            {q.difficulty === 'easy'
              ? 'Inicial'
              : q.difficulty === 'medium'
                ? 'Intermediária'
                : 'Avançada'}
          </legend>
          {q.options.map((v, j) => (
              <label key={j} className={css.check}>
              <input
                type="radio"
                required
                name={`challenge-${e.id}-${i}`}
                checked={choices[i] === j}
                onChange={() =>
                  setChoices((old) => old.map((x, k) => (k === i ? j : x)))
                }
              />
              {v}
            </label>
          ))}
        </fieldset>
      ))}
      <button disabled={busy || choices.some((v) => v < 0)}>
        {e.canPractice
          ? 'Enviar tentativa educativa'
          : 'Confirmar resultado oficial'}
      </button>
    </form>
  );
}
