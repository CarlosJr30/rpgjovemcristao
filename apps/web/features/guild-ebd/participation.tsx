'use client';
import { useEffect, useRef, useState } from 'react';
import {
  answerStates,
  dateLabel,
  kinds,
  type Activity,
  type Answer,
} from './contracts';
import type { EbdAction } from '../../lib/supabase/repositories/guild-ebd-repository';
import css from '../guild-missions/panel.module.css';
export type Command = (
  action: EbdAction,
  id: string,
  revision: number,
  payload: object,
  message: string,
) => Promise<boolean>;

export function ActivityCard({
  activity,
  answers,
  actor,
  manage,
  published,
  busy,
  command,
  onEdit,
}: {
  activity: Activity;
  answers: Answer[];
  actor: string;
  manage: boolean;
  published: boolean;
  busy: boolean;
  command: Command;
  onEdit?: () => void;
}) {
  const [response, setResponse] = useState('');
  const [choice, setChoice] = useState('');
  const keys = useRef(new Map<string, string>());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const own = answers.filter((x) => x.traveler_id === actor);
  const available =
    published &&
    own.length < activity.attempt_limit &&
    !own.some((x) => x.status === 'pending' || x.status === 'completed') &&
    (!activity.deadline || new Date(activity.deadline).getTime() > now);
  return (
    <article className={css.card} aria-label={`Atividade: ${activity.title}`}>
      <span className={css.badge}>{kinds[activity.kind]}</span>
      <h3>{activity.title}</h3>
      <p>{activity.prompt}</p>
      <p className={css.meta}>
        Prazo: {dateLabel(activity.deadline)} · Até {activity.attempt_limit}{' '}
        tentativa(s) ·{' '}
        {activity.criterion === 'correct'
          ? 'Conclusão por acerto'
          : activity.criterion === 'participation'
            ? 'Conclusão por participação'
            : 'Avaliação manual'}
      </p>
      {onEdit && (
        <button disabled={busy} onClick={onEdit}>
          Editar atividade
        </button>
      )}
      {available && (
        <form
          className={css.form}
          onSubmit={async (e) => {
            e.preventDefault();
            const payload = {
              activityId: activity.id,
              response:
                activity.kind === 'choice'
                  ? activity.options[Number(choice)]
                  : response,
              choice: activity.kind === 'choice' ? Number(choice) : null,
            };
            const fingerprint = JSON.stringify([own.length, payload]);
            let key = keys.current.get(fingerprint);
            if (!key) {
              key = crypto.randomUUID();
              keys.current.set(fingerprint, key);
            }
            await command(
              'submit',
              key,
              own.length,
              payload,
              'Resposta registrada.',
            );
          }}
        >
          {activity.kind === 'choice' ? (
            <label>
              Sua resposta
              <select
                aria-label="Sua resposta"
                required
                value={choice}
                onChange={(e) => setChoice(e.target.value)}
              >
                <option value="">Selecione uma opção</option>
                {activity.options.map((o, i) => (
                  <option key={i} value={i}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Sua resposta
              <textarea
                required
                maxLength={2000}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              />
            </label>
          )}
          <button disabled={busy}>Enviar resposta</button>
        </form>
      )}
      {!available && !manage && (
        <p className={css.meta}>
          Consulte o histórico abaixo. Novos envios dependem do prazo, estado da
          aula e tentativas disponíveis.
        </p>
      )}
      {typeof activity.answer_key === 'number' && (
        <p className={css.notice}>
          Gabarito {manage ? 'do professor' : 'após avaliação concluída'}:{' '}
          {activity.options[activity.answer_key]}
        </p>
      )}
      {answers.map((a) => (
        <div key={a.id} className={css.notice}>
          <b>
            {manage ? a.traveler_name : 'Sua resposta'} · Tentativa {a.attempt}
          </b>
          <p>{a.response}</p>
          <p>{answerStates[a.status]}</p>
          {a.feedback && <p>Feedback: {a.feedback}</p>}
          {manage && a.status === 'pending' && a.traveler_id !== actor && (
            <GradeForm answer={a} busy={busy} command={command} />
          )}
        </div>
      ))}
    </article>
  );
}
function GradeForm({
  answer,
  busy,
  command,
}: {
  answer: Answer;
  busy: boolean;
  command: Command;
}) {
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('completed');
  return (
    <form
      className={css.form}
      aria-label={`Avaliar ${answer.traveler_name}`}
      onSubmit={async (e) => {
        e.preventDefault();
        await command(
          'grade',
          answer.id,
          answer.revision,
          { status, feedback },
          'Avaliação registrada.',
        );
      }}
    >
      <label>
        Feedback do professor
        <textarea
          maxLength={1000}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
      </label>
      <label>
        Resultado
        <select
          aria-label="Resultado"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="completed">Concluída</option>
          <option value="revise">Revisar resposta</option>
        </select>
      </label>
      <button disabled={busy}>Registrar avaliação</button>
    </form>
  );
}
