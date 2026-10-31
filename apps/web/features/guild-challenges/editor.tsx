'use client';
import { useState } from 'react';
import { QuizEditor } from '../guild-ebd/quiz';
import type { ClassQuiz } from '../guild-ebd/contracts';
import type { ChallengeMode, ChallengeWorkspace } from './contracts';
import css from '../guild-missions/panel.module.css';
const localDate = (s?: string) =>
  s
    ? new Date(Date.parse(s) - new Date(s).getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : '';
export function ChallengeEditor({
  data,
  busy,
  save,
  close,
}: {
  data: ChallengeWorkspace;
  busy: boolean;
  save: (payload: object) => Promise<boolean>;
  close: () => void;
}) {
  const e = data.event?.status === 'draft' ? data.event : null;
  const [title, setTitle] = useState(e?.title ?? ''),
    [description, setDescription] = useState(e?.description ?? ''),
    [theme, setTheme] = useState(e?.theme ?? ''),
    [reference, setReference] = useState(e?.reference ?? ''),
    [criteria, setCriteria] = useState(e?.criteria ?? ''),
    [mode, setMode] = useState<ChallengeMode>(e?.mode ?? 'individual'),
    [start, setStart] = useState(localDate(e?.startsAt)),
    [end, setEnd] = useState(localDate(e?.endsAt)),
    [meetingId, setMeeting] = useState(e?.meetingId ?? ''),
    [manualIds, setManual] = useState(e?.manualIds ?? []),
    [teams, setTeams] = useState(data.teams.map((t) => t.name).join('\n')),
    [error, setError] = useState('');
  const initial: ClassQuiz | undefined = e
    ? {
        id: e.id,
        lessonId: e.id,
        revision: e.revision,
        difficulty: 'easy',
        questions: data.questions,
      }
    : undefined;
  return (
    <section className={css.card} aria-label="Editor de gincana">
      <h3>{e ? 'Editar rascunho' : 'Criar gincana'}</h3>
      <p>
        Elabore e revise as sete perguntas. Publicar congela regras e perguntas;
        iniciar congela participantes e equipes. Não há recompensas.
      </p>
      {error && <p role="alert">{error}</p>}
      <fieldset disabled={busy} className={css.form}>
        <legend>Regras da gincana</legend>
        <label>
          Título
          <input
            value={title}
            maxLength={100}
            onChange={(x) => setTitle(x.target.value)}
          />
        </label>
        <label>
          Descrição
          <textarea
            value={description}
            maxLength={1000}
            onChange={(x) => setDescription(x.target.value)}
          />
        </label>
        <label>
          Tema
          <input
            value={theme}
            maxLength={100}
            onChange={(x) => setTheme(x.target.value)}
          />
        </label>
        <label>
          Referência da gincana (opcional)
          <input
            value={reference}
            maxLength={100}
            onChange={(x) => setReference(x.target.value)}
          />
        </label>
        <label>
          Objetivos obrigatórios e critérios
          <textarea
            value={criteria}
            maxLength={1000}
            onChange={(x) => setCriteria(x.target.value)}
          />
        </label>
        <label>
          Modalidade
          <select
            value={mode}
            onChange={(x) => setMode(x.target.value as ChallengeMode)}
          >
            <option value="individual">Individual</option>
            <option value="cooperative">Cooperativa</option>
            <option value="competitive">Competição entre equipes</option>
          </select>
        </label>
        <label>
          Início
          <input
            type="datetime-local"
            value={start}
            onChange={(x) => setStart(x.target.value)}
          />
        </label>
        <label>
          Fim
          <input
            type="datetime-local"
            value={end}
            onChange={(x) => setEnd(x.target.value)}
          />
        </label>
        <label>
          Encontro associado
          <select
            value={meetingId}
            onChange={(x) => setMeeting(x.target.value)}
          >
            <option value="">Independente</option>
            {data.meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>
        {mode !== 'individual' && (
          <label>
            Equipes (uma por linha)
            <textarea
              value={teams}
              maxLength={8100}
              onChange={(x) => setTeams(x.target.value)}
            />
          </label>
        )}
        <fieldset>
          <legend>Objetivos manuais obrigatórios</legend>
          {data.manualActivities.length === 0 && (
            <p>Nenhuma atividade publicada disponível.</p>
          )}
          {data.manualActivities.map((m) => (
            <label key={m.id} className={css.check}>
              <input
                type="checkbox"
                checked={manualIds.includes(m.id)}
                onChange={(x) =>
                  setManual((old) =>
                    x.target.checked
                      ? [...old, m.id]
                      : old.filter((id) => id !== m.id),
                  )
                }
              />
              {m.title}
            </label>
          ))}
        </fieldset>
      </fieldset>
      <QuizEditor
        initial={initial}
        perQuestionDifficulty
        busy={busy}
        onClose={close}
        onSave={async (_, questions) => {
          if (
            title.trim().length < 2 ||
            !criteria.trim() ||
            !start ||
            !end ||
            !Number.isFinite(Date.parse(start)) ||
            Date.parse(end) <= Date.parse(start)
          ) {
            setError('Confira título, critérios e período válido.');
            return false;
          }
          setError('');
          return save({
            title,
            description,
            theme,
            reference,
            criteria,
            mode,
            startsAt: new Date(start).toISOString(),
            endsAt: new Date(end).toISOString(),
            meetingId,
            manualIds,
            teams:
              mode === 'individual'
                ? []
                : teams
                    .split('\n')
                    .map((t) => t.trim())
                    .filter(Boolean),
            questions,
          });
        }}
      />
    </section>
  );
}
