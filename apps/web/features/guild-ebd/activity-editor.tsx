'use client';
import { useState } from 'react';
import {
  kinds,
  localDate,
  type Activity,
  type ActivityInput,
} from './contracts';
import css from '../guild-missions/panel.module.css';

export function ActivityEditor({
  lessonId,
  activity,
  busy,
  onSave,
  onClose,
  classMode = false,
}: {
  lessonId: string;
  activity?: Activity;
  busy: boolean;
  onSave: (v: ActivityInput) => Promise<boolean>;
  onClose: () => void;
  classMode?: boolean;
}) {
  const [form, setForm] = useState<ActivityInput>({
    lessonId,
    title: activity?.title ?? '',
    kind: activity?.kind ?? 'open',
    prompt: activity?.prompt ?? '',
    options: activity?.options ?? ['', ''],
    answerKey: activity?.answer_key ?? 0,
    deadline: localDate(activity?.deadline ?? null),
    attemptLimit: activity?.attempt_limit ?? 1,
    criterion: activity?.criterion ?? 'manual',
  });
  const [error, setError] = useState('');
  return (
    <form
      aria-label="Editor de atividade"
      className={`${css.card} ${css.form}`}
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          form.kind === 'choice' &&
          (form.options.some((v) => !v.trim()) ||
            form.answerKey === null ||
            form.answerKey >= form.options.length)
        ) {
          setError('Preencha as opções e selecione o gabarito.');
          return;
        }
        setError('');
        await onSave({
          ...form,
          options: form.kind === 'choice' ? form.options : [],
          answerKey: form.kind === 'choice' ? form.answerKey : null,
          criterion: form.kind === 'choice' ? form.criterion : 'manual',
        });
      }}
    >
      <h2>Editor de atividade</h2>
      <p>
        Atividades ficam disponíveis ao publicar a aula. O gabarito permanece
        protegido durante as tentativas.
        {classMode &&
          ' Registre somente participação; não solicite reflexão pessoal, fotos, localização ou dados sensíveis. Questionários são preparados separadamente com sete perguntas.'}
      </p>
      {error && <p role="alert">{error}</p>}
      <label>
        Título da atividade
        <input
          required
          minLength={2}
          maxLength={100}
          value={form.title}
          onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
        />
      </label>
      <label>
        Tipo de atividade
        <select
          aria-label="Tipo de atividade"
          value={form.kind}
          onChange={(e) =>
            setForm((v) => ({
              ...v,
              kind: e.target.value as ActivityInput['kind'],
              criterion: e.target.value === 'choice' ? 'correct' : 'manual',
            }))
          }
        >
          {Object.entries(kinds)
            .filter(([k]) => !classMode || k !== 'choice')
            .map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
        </select>
      </label>
      <label>
        Enunciado
        <textarea
          required
          maxLength={2000}
          value={form.prompt}
          onChange={(e) => setForm((v) => ({ ...v, prompt: e.target.value }))}
        />
      </label>
      {form.kind === 'choice' && (
        <fieldset>
          <legend>Opções e gabarito privado</legend>
          {form.options.map((o, i) => (
            <label key={i}>
              Opção {i + 1}
              <input
                required
                maxLength={300}
                value={o}
                onChange={(e) =>
                  setForm((v) => ({
                    ...v,
                    options: v.options.map((x, j) =>
                      i === j ? e.target.value : x,
                    ),
                  }))
                }
              />
            </label>
          ))}
          <div className={css.actions}>
            <button
              type="button"
              disabled={form.options.length >= 6}
              onClick={() =>
                setForm((v) => ({ ...v, options: [...v.options, ''] }))
              }
            >
              Adicionar opção
            </button>
            <button
              type="button"
              disabled={form.options.length <= 2}
              onClick={() =>
                setForm((v) => ({
                  ...v,
                  options: v.options.slice(0, -1),
                  answerKey: 0,
                }))
              }
            >
              Remover última opção
            </button>
          </div>
          <label>
            Resposta correta
            <select
              aria-label="Resposta correta"
              value={form.answerKey ?? 0}
              onChange={(e) =>
                setForm((v) => ({ ...v, answerKey: Number(e.target.value) }))
              }
            >
              {form.options.map((_, i) => (
                <option key={i} value={i}>
                  Opção {i + 1}
                </option>
              ))}
            </select>
          </label>
          <label>
            Critério de conclusão
            <select
              aria-label="Critério de conclusão"
              value={form.criterion}
              onChange={(e) =>
                setForm((v) => ({
                  ...v,
                  criterion: e.target.value as ActivityInput['criterion'],
                }))
              }
            >
              <option value="correct">Resposta correta</option>
              <option value="participation">
                Participação, independentemente do acerto
              </option>
            </select>
          </label>
        </fieldset>
      )}
      {form.kind !== 'choice' && (
        <p>Conclusão por avaliação manual do professor, com feedback.</p>
      )}
      <label>
        Prazo (opcional)
        <input
          type="datetime-local"
          value={form.deadline}
          onChange={(e) => setForm((v) => ({ ...v, deadline: e.target.value }))}
        />
      </label>
      <label>
        Limite de tentativas
        <input
          type="number"
          required
          min={1}
          max={5}
          value={form.attemptLimit}
          onChange={(e) =>
            setForm((v) => ({ ...v, attemptLimit: Number(e.target.value) }))
          }
        />
      </label>
      <div className={css.actions}>
        <button disabled={busy}>Salvar atividade</button>
        <button type="button" disabled={busy} onClick={onClose}>
          Descartar atividade
        </button>
      </div>
    </form>
  );
}
