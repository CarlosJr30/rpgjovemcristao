'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Traveler } from '../journey/domain/traveler';
import {
  ebdRepository as repository,
  EbdConflict,
} from '../../lib/supabase/repositories/guild-ebd-repository';
import {
  blankLesson,
  dateLabel,
  fromLesson,
  rewardLabel,
  safeMaterialUrl,
  states,
  type Activity,
  type Lesson,
  type Workspace,
} from './contracts';
import { LessonEditor } from './lesson-editor';
import { ActivityEditor } from './activity-editor';
import { GAMEPLAY_ENABLED } from '../../lib/release-scope';
import { ActivityCard, type Command } from './participation';
import { AttendanceForm, TeacherForm } from './administration';
import css from '../guild-missions/panel.module.css';
const tabs = [
  ['overview', 'Visão geral'],
  ['lessons', 'Aulas'],
  ['create', 'Criar aula'],
  ['drafts', 'Rascunhos'],
  ['activities', 'Atividades e questionários'],
  ['schedule', 'Agenda'],
  ['attendance', 'Presença'],
  ['students', 'Alunos'],
  ['teachers', 'Professores'],
  ['history', 'Histórico de aprendizado'],
] as const;
type Tab = (typeof tabs)[number][0];
type Editor = { id: string; lesson?: Lesson };
const historyLabels: Record<string, string> = {
  lesson_saved: 'Rascunho salvo',
  state: 'Publicação atualizada',
  activity_saved: 'Atividade salva',
  grade: 'Avaliação registrada',
  attendance: 'Presença registrada/corrigida',
  teacher: 'Permissão de professor atualizada',
};

export function EbdPanel({
  traveler,
  guildId,
}: {
  traveler: Traveler;
  guildId?: string;
}) {
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [reload, setReload] = useState(0);
  const [offset, setOffset] = useState(0);
  const [tab, setTab] = useState<Tab>('overview');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [activityEditor, setActivityEditor] = useState<{
    id: string;
    lessonId: string;
    activity?: Activity;
  } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const fetchData = useCallback(
    () =>
      guildId
        ? repository.load(traveler.id, offset, guildId)
        : repository.load(traveler.id, offset),
    [traveler.id, offset, guildId],
  );
  useEffect(() => {
    let live = true;
    fetchData()
      .then((v) => {
        if (live) {
          setData(v);
          setError('');
        }
      })
      .catch((e) => {
        if (live) {
          setData(null);
          setError(
            e instanceof Error
              ? e.message
              : 'Não foi possível carregar a Escola Bíblica.',
          );
        }
      });
    return () => {
      live = false;
    };
  }, [fetchData, reload]);
  const command = useCallback<Command>(
    async (action, id, revision, payload, feedback) => {
      if (pending.current) return false;
      pending.current = true;
      setBusy(true);
      setError('');
      setMessage('');
      try {
        if (guildId)
          await repository.command(
            traveler.id,
            action,
            id,
            revision,
            payload,
            guildId,
          );
        else
          await repository.command(traveler.id, action, id, revision, payload);
        setData(await fetchData());
        setMessage(feedback);
        return true;
      } catch (e) {
        setError(
          e instanceof EbdConflict
            ? e.message
            : e instanceof Error
              ? e.message
              : 'Operação indisponível.',
        );
        return false;
      } finally {
        pending.current = false;
        setBusy(false);
      }
    },
    [traveler.id, fetchData, guildId],
  );
  if (!data)
    return (
      <section className={css.panel}>
        <h1>Escola Bíblica</h1>
        {error ? (
          <>
            <p role="alert" className={`${css.notice} ${css.error}`}>
              {error} É necessário pertencer a uma Guilda ativa.
            </p>
            <button onClick={() => setReload((v) => v + 1)}>
              Tentar novamente
            </button>
          </>
        ) : (
          <p role="status">Carregando Escola Bíblica…</p>
        )}
        <p>
          <Link href="/journey/guild">Voltar à Guilda</Link>
        </p>
      </section>
    );
  const choose = (next: Tab) => {
    setTab(next);
    if (next === 'create' && !editor) setEditor({ id: crypto.randomUUID() });
  };
  const teacher = data.teacher;
  const visibleTabs = tabs.filter(
    ([id]) =>
      teacher || !['create', 'drafts', 'students', 'teachers'].includes(id),
  );
  const lesson = data.lessons.find((l) => l.id === selected);
  const managed = data.lessons.filter((l) => l.canEdit);
  const editable = data.lessons.filter(
    (l) => l.canEdit && l.status === 'draft',
  );
  const renderActivities = (l: Lesson) =>
    data.activities
      .filter((a) => a.lesson_id === l.id)
      .map((a) => (
        <ActivityCard
          key={a.id}
          activity={a}
          answers={data.answers.filter((x) => x.activity_id === a.id)}
          actor={traveler.id}
          manage={l.canEdit}
          published={
            l.status === 'published' &&
            (l.audience === 'all' || l.target_ids.includes(traveler.id))
          }
          busy={busy}
          command={command}
          onEdit={
            l.canEdit && l.status === 'draft'
              ? () =>
                  setActivityEditor({ id: a.id, lessonId: l.id, activity: a })
              : undefined
          }
        />
      ));
  const cards = (items: Lesson[]) =>
    items.length ? (
      <div className={css.grid}>
        {items.map((l) => (
          <article
            className={css.card}
            key={l.id}
            aria-label={`Aula: ${l.title}`}
          >
            <span className={css.badge}>{states[l.status] ?? l.status}</span>
            <h3>{l.title}</h3>
            <p>{l.theme}</p>
            <p className={css.meta}>
              {dateLabel(l.scheduled_at)} · Versão {l.ebd_revision}
            </p>
            <div className={css.actions}>
              <button onClick={() => setSelected(l.id)}>Abrir aula</button>
              {l.canEdit && l.status === 'draft' && (
                <button
                  disabled={busy}
                  onClick={() => setEditor({ id: l.id, lesson: l })}
                >
                  Editar rascunho
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    ) : (
      <p className={css.notice}>
        Nenhuma aula nesta seção. O conteúdo será preparado pelos professores.
      </p>
    );
  return (
    <section className={css.panel} aria-labelledby="ebd-title">
      <header className={css.hero}>
        <p className={css.kicker}>Guilda · Aprendizado em comunidade</p>
        <h1 id="ebd-title">Escola Bíblica</h1>
        <p>
          Aulas e atividades criadas pelos professores da sua Guilda. Seu estudo
          é independente da posição no Modo História.
        </p>
        <div className={css.actions}>
          <Link className={css.link} href="/journey/guild">
            Voltar à Guilda
          </Link>
          {data.leader && (
            <Link className={css.link} href="/journey/guild/manage">
              Painel da Guilda
            </Link>
          )}
        </div>
      </header>
      <nav className={css.tabs} aria-label="Áreas da Escola Bíblica">
        {visibleTabs.map(([id, label]) => (
          <button
            disabled={busy}
            key={id}
            aria-pressed={tab === id}
            onClick={() => choose(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <label className={css.mobileNav}>
        Área da Escola Bíblica
        <select
          aria-label="Área da Escola Bíblica"
          disabled={busy}
          value={tab}
          onChange={(e) => choose(e.target.value as Tab)}
        >
          {visibleTabs.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className={`${css.notice} ${css.error}`}>
          {error}
        </p>
      )}
      {message && (
        <p role="status" className={css.notice}>
          {message}
        </p>
      )}
      {error && (
        <button disabled={busy} onClick={() => setReload((v) => v + 1)}>
          Recarregar dados (preservar editor)
        </button>
      )}
      {editor && teacher && (
        <LessonEditor
          key={editor.id}
          initial={
            editor.lesson ? fromLesson(editor.lesson) : blankLesson(traveler.id)
          }
          workspace={data}
          busy={busy}
          onClose={() => setEditor(null)}
          onSave={async (input) => {
            const ok = await command(
              'lesson',
              editor.id,
              editor.lesson?.ebd_revision ?? 0,
              {
                ...input,
                scheduledAt: input.scheduledAt
                  ? new Date(input.scheduledAt).toISOString()
                  : '',
              },
              'Rascunho salvo. A aula ainda não foi publicada.',
            );
            if (ok) {
              setEditor(null);
              setTab('drafts');
            }
            return ok;
          }}
        />
      )}
      {activityEditor && (
        <ActivityEditor
          key={activityEditor.id}
          lessonId={activityEditor.lessonId}
          activity={activityEditor.activity}
          busy={busy}
          onClose={() => setActivityEditor(null)}
          onSave={async (input) => {
            const ok = await command(
              'activity',
              activityEditor.id,
              activityEditor.activity?.revision ?? 0,
              {
                ...input,
                deadline: input.deadline
                  ? new Date(input.deadline).toISOString()
                  : '',
              },
              'Atividade salva no rascunho.',
            );
            if (ok) setActivityEditor(null);
            return ok;
          }}
        />
      )}
      {lesson && (
        <article className={css.card} aria-label="Detalhe da aula">
          <span className={css.badge}>{states[lesson.status]}</span>
          <h2>{lesson.title}</h2>
          <p className={css.meta}>
            Material de autoria do professor ·{' '}
            {data.members.find((m) => m.id === lesson.teacher_id)?.name ??
              'Professor responsável'}{' '}
            · {dateLabel(lesson.scheduled_at)}
          </p>
          <p>{lesson.introduction}</p>
          {lesson.bible_reference && (
            <p>
              Referências indicadas pelo professor: {lesson.bible_reference}
            </p>
          )}
          <p>{lesson.content}</p>
          {lesson.objectives && <p>Objetivos: {lesson.objectives}</p>}
          {lesson.bible_url && safeMaterialUrl(lesson.bible_url) && (
            <p>
              <a
                href={lesson.bible_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Referência da aula legada
              </a>
            </p>
          )}
          {Array.isArray(lesson.main_points) &&
            lesson.main_points.length > 0 && (
              <ul>
                {lesson.main_points.map((p, i) => (
                  <li key={i}>{String(p)}</li>
                ))}
              </ul>
            )}
          {Array.isArray(lesson.discussion_questions) &&
            lesson.discussion_questions.length > 0 && (
              <ul>
                {lesson.discussion_questions.map((p, i) => (
                  <li key={i}>{String(p)}</li>
                ))}
              </ul>
            )}
          {lesson.activity_text && (
            <p>Atividade da aula legada: {lesson.activity_text}</p>
          )}
          {lesson.materials.map((m, i) => (
            <div key={i}>
              <h3>{m.title}</h3>
              {['link', 'image', 'pdf'].includes(m.kind) ? (
                safeMaterialUrl(m.value) ? (
                  <p>
                    <a href={m.value} target="_blank" rel="noopener noreferrer">
                      Abrir{' '}
                      {m.kind === 'pdf'
                        ? 'PDF'
                        : m.kind === 'image'
                          ? 'imagem'
                          : 'material'}{' '}
                      externo
                    </a>
                  </p>
                ) : (
                  <p>Link indisponível.</p>
                )
              ) : (
                <p>{m.value}</p>
              )}
            </div>
          ))}
          {GAMEPLAY_ENABLED && lesson.reward_tier && (
            <p className={css.notice}>
              Recompensa opcional: {rewardLabel(lesson.reward_tier)}. Integração
              pendente; uma conclusão avaliada registra no máximo uma pendência
              por aula, sem conceder saldo.
            </p>
          )}
          <div className={css.actions}>
            <PublicationActions lesson={lesson} busy={busy} command={command} />
            {lesson.canEdit && lesson.status === 'draft' && (
              <button
                disabled={busy}
                onClick={() =>
                  setActivityEditor({
                    id: crypto.randomUUID(),
                    lessonId: lesson.id,
                  })
                }
              >
                Criar atividade
              </button>
            )}
            <button onClick={() => setSelected(null)}>Fechar aula</button>
          </div>
          {renderActivities(lesson)}
        </article>
      )}
      {tab === 'overview' && (
        <>
          <h2>Aprender juntos</h2>
          <p>
            {data.total} aula(s) acessível(is).{' '}
            {teacher
              ? 'Prepare rascunhos, defina atividades e publique quando estiver pronto.'
              : 'Abra uma aula publicada para estudar e participar.'}
          </p>
          <p className={css.notice}>
            Aulas são conteúdo dos professores. Referências bíblicas são
            indicadas por eles; os textos livres não são apresentados como
            Escritura oficial do jogo.
          </p>
          {cards(data.lessons.filter((l) => l.status === 'published'))}
        </>
      )}
      {tab === 'lessons' && (
        <>
          <h2>Aulas</h2>
          {cards(data.lessons)}
        </>
      )}
      {tab === 'create' && !editor && teacher && (
        <button onClick={() => setEditor({ id: crypto.randomUUID() })}>
          Iniciar novo rascunho
        </button>
      )}
      {tab === 'drafts' && teacher && (
        <>
          <h2>Rascunhos</h2>
          {cards(
            managed.filter((l) => ['draft', 'scheduled'].includes(l.status)),
          )}
        </>
      )}
      {tab === 'activities' && (
        <>
          <h2>Atividades e questionários</h2>
          {teacher && editable.length > 0 && (
            <p>
              Abra um rascunho para criar ou editar suas atividades antes de
              publicar.
            </p>
          )}
          {data.activities.length === 0 && <p>Nenhuma atividade disponível.</p>}
          {data.lessons.map((l) => (
            <div key={l.id}>
              <h3>{l.title}</h3>
              {renderActivities(l)}
            </div>
          ))}
        </>
      )}
      {tab === 'schedule' && (
        <>
          <h2>Agenda</h2>
          <p className={css.meta}>
            Datas das aulas e prazos das atividades desta página. Aulas
            agendadas aguardam publicação explícita do responsável.
          </p>
          <ul className={css.list}>
            {[
              ...data.lessons
                .filter(
                  (l) =>
                    l.scheduled_at &&
                    ['scheduled', 'published'].includes(l.status),
                )
                .map((l) => ({
                  id: l.id,
                  date: l.scheduled_at!,
                  label: `Aula: ${l.title}`,
                })),
              ...data.activities
                .filter(
                  (a) =>
                    a.deadline &&
                    data.lessons.some(
                      (l) =>
                        l.id === a.lesson_id &&
                        ['scheduled', 'published'].includes(l.status),
                    ),
                )
                .map((a) => ({
                  id: a.id,
                  date: a.deadline!,
                  label: `Prazo: ${a.title}`,
                })),
            ]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((e) => (
                <li key={e.id} className={css.card}>
                  {dateLabel(e.date)} · {e.label}
                </li>
              ))}
          </ul>
        </>
      )}
      {tab === 'attendance' && (
        <>
          <h2>Presença</h2>
          <p>
            Registros do responsável. Alunos consultam apenas suas próprias
            presenças.
          </p>
          {managed
            .filter(
              (l) =>
                l.canAttend &&
                ['published', 'closed', 'completed'].includes(l.status),
            )
            .map((l) => (
              <AttendanceForm
                key={l.id}
                lesson={l}
                members={data.members}
                records={data.attendance}
                busy={busy}
                command={command}
              />
            ))}
          {data.attendance.length === 0 && <p>Nenhuma presença registrada.</p>}
          {data.attendance.map((r) => (
            <p className={css.notice} key={`${r.lesson_id}-${r.traveler_id}`}>
              {data.lessons.find((l) => l.id === r.lesson_id)?.title} ·{' '}
              {data.members.find((m) => m.id === r.traveler_id)?.name ??
                'Seu registro'}
              : {r.status === 'present' ? 'Presente' : 'Ausente'} · v
              {r.revision}
              {r.reason && ` · ${r.reason}`}
            </p>
          ))}
        </>
      )}
      {tab === 'teachers' && teacher && (
        <>
          <h2>Professores</h2>
          <p>
            A autorização vale para aulas próprias; não concede poderes sobre
            missões, membros ou convites.
          </p>
          {data.leader ? (
            data.members
              .filter((m) => !m.leader)
              .map((m) => (
                <TeacherForm
                  key={`${m.id}-${data.teachers.find((t) => t.traveler_id === m.id)?.revision ?? 0}`}
                  member={m}
                  teacher={data.teachers.find((t) => t.traveler_id === m.id)}
                  busy={busy}
                  command={command}
                />
              ))
          ) : (
            <p>
              Você pode criar e administrar suas aulas conforme as permissões
              concedidas pela liderança.
            </p>
          )}
        </>
      )}
      {tab === 'students' && teacher && (
        <>
          <h2>Alunos</h2>
          <p className={css.meta}>
            Membros ativos; resultados limitados às aulas sob sua
            responsabilidade nesta página.
          </p>
          {data.members.map((m) => (
            <article key={m.id} className={css.card}>
              <h3>{m.name}</h3>
              <p>
                {
                  data.answers.filter(
                    (a) =>
                      a.traveler_id === m.id &&
                      a.status === 'completed' &&
                      managed.some((l) =>
                        data.activities.some(
                          (x) => x.id === a.activity_id && x.lesson_id === l.id,
                        ),
                      ),
                  ).length
                }{' '}
                atividade(s) concluída(s)
              </p>
            </article>
          ))}
        </>
      )}
      {tab === 'history' && (
        <>
          <h2>Histórico de aprendizado</h2>
          <p>Envios e avaliações desta página de aulas.</p>
          {data.answers.map((a) => (
            <p className={css.notice} key={a.id}>
              {data.activities.find((x) => x.id === a.activity_id)?.title} ·{' '}
              {data.leader || data.teacher ? a.traveler_name : 'Você'} ·
              Tentativa {a.attempt} ·{' '}
              {a.status === 'pending'
                ? 'Aguardando avaliação'
                : a.status === 'completed'
                  ? 'Concluída'
                  : 'Revisar resposta'}
              {a.feedback && ` · ${a.feedback}`}
            </p>
          ))}
          {GAMEPLAY_ENABLED &&
            data.rewards.map((r) => (
              <p className={css.notice} key={`${r.lesson_id}-${r.traveler_id}`}>
                Recompensa pendente · {rewardLabel(r.tier)} ·{' '}
                {data.lessons.find((l) => l.id === r.lesson_id)?.title}. Sem
                concessão econômica.
              </p>
            ))}
          {teacher && (
            <>
              <h3>Auditoria recente</h3>
              <p className={css.meta}>
                Até 100 alterações recentes; versões integrais e correções são
                preservadas no banco para auditoria restrita.
              </p>
              {data.history.map((h) => (
                <p key={h.id}>
                  {dateLabel(h.created_at)} ·{' '}
                  {historyLabels[h.action] ?? h.action} · versão {h.revision}
                </p>
              ))}
            </>
          )}
        </>
      )}
      <div className={css.actions} aria-label="Paginação de aulas">
        <button
          disabled={busy || offset === 0 || !!editor || !!activityEditor}
          onClick={() => {
            setData(null);
            setSelected(null);
            setOffset((v) => Math.max(0, v - 20));
          }}
        >
          Página anterior
        </button>
        <span>
          {data.total === 0
            ? 'Nenhuma aula'
            : `${offset + 1}–${Math.min(offset + 20, data.total)} de ${data.total}`}
        </span>
        <button
          disabled={
            busy || offset + 20 >= data.total || !!editor || !!activityEditor
          }
          onClick={() => {
            setData(null);
            setSelected(null);
            setOffset((v) => v + 20);
          }}
        >
          Próxima página
        </button>
      </div>
    </section>
  );
}

function PublicationActions({
  lesson,
  busy,
  command,
}: {
  lesson: Lesson;
  busy: boolean;
  command: Command;
}) {
  return (
    <>
      {lesson.canPublish &&
        (
          (lesson.status === 'draft'
            ? ['scheduled', 'published', 'archived']
            : lesson.status === 'scheduled'
              ? ['draft', 'published', 'archived']
              : lesson.status === 'published'
                ? ['closed']
                : ['closed', 'completed', 'cancelled'].includes(lesson.status)
                  ? ['archived']
                  : []) as string[]
        ).map((s) => (
          <button
            key={s}
            disabled={busy}
            onClick={() =>
              void command(
                'state',
                lesson.id,
                lesson.ebd_revision,
                { state: s },
                `Aula: ${states[s]}.`,
              )
            }
          >
            {s === 'published'
              ? 'Publicar aula'
              : s === 'scheduled'
                ? 'Agendar aula'
                : s === 'draft'
                  ? 'Voltar ao rascunho'
                  : s === 'closed'
                    ? 'Encerrar aula'
                    : 'Arquivar aula'}
          </button>
        ))}
    </>
  );
}
