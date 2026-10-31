'use client';
import { useEffect, useState } from 'react';
import type { LessonInput, Material, Workspace } from './contracts';
import { rewardLabel, validateLesson } from './contracts';
import css from '../guild-missions/panel.module.css';
import { GAMEPLAY_ENABLED } from '../../lib/release-scope';

export function LessonEditor({
  initial,
  workspace,
  busy,
  onSave,
  onClose,
  classMode = false,
}: {
  initial: LessonInput;
  workspace: Workspace;
  busy: boolean;
  onSave: (v: LessonInput) => Promise<boolean>;
  onClose: () => void;
  classMode?: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const update = <K extends keyof LessonInput>(k: K, v: LessonInput[K]) =>
    setForm((old) => ({ ...old, [k]: v }));
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  const material = (i: number, patch: Partial<Material>) =>
    update(
      'materials',
      form.materials.map((v, index) => (index === i ? { ...v, ...patch } : v)),
    );
  return (
    <form
      className={`${css.card} ${css.form}`}
      aria-label="Editor de aula"
      onSubmit={async (e) => {
        e.preventDefault();
        const message = validateLesson(form, classMode);
        setError(message);
        if (!message)
          await onSave(GAMEPLAY_ENABLED ? form : { ...form, rewardTier: '' });
      }}
    >
      <h2>Editor de aula</h2>
      <p>
        Conteúdo de autoria do professor. Salvar mantém o rascunho; publicação é
        uma ação separada.
      </p>
      {error && (
        <p role="alert" className={css.error}>
          {error}
        </p>
      )}
      <label>
        Título
        <input
          required
          minLength={2}
          maxLength={100}
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
        />
      </label>
      <label>
        Tema {classMode ? '(opcional)' : ''}
        <input
          required={!classMode}
          minLength={classMode ? undefined : 2}
          maxLength={100}
          value={form.theme}
          onChange={(e) => update('theme', e.target.value)}
        />
      </label>
      <label>
        Descrição
        <textarea
          maxLength={2000}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </label>
      <label>
        Conteúdo livre
        <textarea
          maxLength={10000}
          value={form.content}
          onChange={(e) => update('content', e.target.value)}
        />
      </label>
      <label>
        Referências bíblicas (opcional)
        <input
          maxLength={100}
          value={form.reference}
          onChange={(e) => update('reference', e.target.value)}
        />
      </label>
      <label>
        Data e horário
        <input
          type="datetime-local"
          value={form.scheduledAt}
          onChange={(e) => update('scheduledAt', e.target.value)}
        />
      </label>
      <label>
        Professor responsável
        <select
          aria-label="Professor responsável"
          value={form.teacherId}
          disabled={!workspace.leader}
          onChange={(e) => update('teacherId', e.target.value)}
        >
          {(classMode
            ? (workspace.teacherCandidates ?? [])
            : workspace.members.filter(
                (m) =>
                  m.leader ||
                  workspace.teachers.some(
                    (t) => t.traveler_id === m.id && t.active,
                  ),
              )
          ).map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Público-alvo
        <select
          aria-label="Público-alvo"
          value={form.audience}
          onChange={(e) =>
            setForm((v) => ({
              ...v,
              audience: e.target.value as LessonInput['audience'],
              targetIds: [],
            }))
          }
        >
          <option value="all">Todos os membros ativos</option>
          <option value="selected">Alunos selecionados</option>
        </select>
      </label>
      {form.audience === 'selected' && (
        <fieldset>
          <legend>Alunos elegíveis</legend>
          {workspace.members.map((m) => (
            <label className={css.check} key={m.id}>
              <input
                type="checkbox"
                checked={form.targetIds.includes(m.id)}
                onChange={(e) =>
                  update(
                    'targetIds',
                    e.target.checked
                      ? [...form.targetIds, m.id]
                      : form.targetIds.filter((id) => id !== m.id),
                  )
                }
              />
              {m.name}
            </label>
          ))}
        </fieldset>
      )}
      <label>
        Objetivos de aprendizado (opcional)
        <textarea
          maxLength={2000}
          value={form.objectives}
          onChange={(e) => update('objectives', e.target.value)}
        />
      </label>
      <fieldset>
        <legend>Materiais de apoio</legend>
        <p>
          Texto ou referência a material autorizado. Imagens/PDF abrem como
          links externos; uploads aguardam armazenamento privado.
        </p>
        {form.materials.map((m, i) => (
          <fieldset key={i}>
            <legend>Material {i + 1}</legend>
            <label>
              Tipo
              <select
                aria-label="Tipo do material"
                value={m.kind}
                onChange={(e) =>
                  material(i, { kind: e.target.value as Material['kind'] })
                }
              >
                <option value="link">Link</option>
                <option value="image">Imagem (link)</option>
                <option value="pdf">PDF (link)</option>
                <option value="text">Texto</option>
                <option value="reference">Referência</option>
              </select>
            </label>
            <label>
              Nome do material
              <input
                required
                maxLength={100}
                value={m.title}
                onChange={(e) => material(i, { title: e.target.value })}
              />
            </label>
            <label>
              {['link', 'image', 'pdf'].includes(m.kind)
                ? 'URL HTTPS'
                : 'Texto ou referência'}
              <textarea
                required
                maxLength={
                  ['link', 'image', 'pdf'].includes(m.kind) ? 500 : 2000
                }
                value={m.value}
                onChange={(e) => material(i, { value: e.target.value })}
              />
            </label>
            <button
              type="button"
              onClick={() =>
                update(
                  'materials',
                  form.materials.filter((_, index) => index !== i),
                )
              }
            >
              Remover material {i + 1}
            </button>
          </fieldset>
        ))}
        <button
          type="button"
          disabled={form.materials.length >= 20}
          onClick={() =>
            update('materials', [
              ...form.materials,
              { kind: 'link', title: '', value: '' },
            ])
          }
        >
          Adicionar material
        </button>
      </fieldset>
      {GAMEPLAY_ENABLED && (
        <label>
          Recompensa opcional
          <select
            aria-label="Recompensa opcional"
            value={form.rewardTier}
            onChange={(e) =>
              update('rewardTier', e.target.value as LessonInput['rewardTier'])
            }
          >
            <option value="">Sem recompensa</option>
            {(['normal', 'great', 'epic', 'extraordinary'] as const).map(
              (t) => (
                <option key={t} value={t}>
                  {rewardLabel(t)}
                </option>
              ),
            )}
          </select>
        </label>
      )}
      {GAMEPLAY_ENABLED && form.rewardTier && (
        <p className={css.notice}>
          Recompensa pendente: {rewardLabel(form.rewardTier)}
        </p>
      )}
      <p className={css.meta}>
        A participação e o aprendizado são registrados sem recompensas neste
        lançamento.
      </p>
      <div className={css.actions}>
        <button disabled={busy}>Salvar rascunho</button>
        <button type="button" disabled={busy} onClick={onClose}>
          Descartar edição
        </button>
      </div>
    </form>
  );
}
