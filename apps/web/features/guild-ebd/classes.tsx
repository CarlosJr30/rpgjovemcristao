'use client';
import { useEffect, useRef, useState } from 'react';
import {
  classesRepository,
  ClassCommandRejected,
} from '../../lib/ebd-classes/client';
import {
  validateClass,
  type ClassesWorkspace,
} from '../../lib/ebd-classes/contracts';
import { guildRepository } from '../../lib/supabase/repositories/guild-repository';
import css from '../guild-missions/panel.module.css';
import { CommonInvites } from './common-invites';

const classStates = {
  active: 'Ativa',
  paused: 'Pausada',
  archived: 'Arquivada',
};
const roles = { leader: 'Líder', teacher: 'Professor', student: 'Aluno' };
export function EbdClasses({
  actor,
  guildId,
  onSelect,
  selectionDisabled = false,
}: {
  actor: string;
  guildId: string;
  onSelect?: (id: string | null) => void;
  selectionDisabled?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <ClassesBody
      key={`${actor}:${guildId}:${selected ?? ''}`}
      actor={actor}
      guildId={guildId}
      selected={selected}
      selectionDisabled={selectionDisabled}
      choose={(id) => {
        setSelected(id);
        onSelect?.(id);
      }}
    />
  );
}
function ClassesBody({
  actor,
  guildId,
  selected,
  choose,
  selectionDisabled = false,
}: {
  actor: string;
  guildId: string;
  selected: string | null;
  choose: (id: string | null) => void;
  selectionDisabled?: boolean;
}) {
  const [data, setData] = useState<ClassesWorkspace>();
  const [people, setPeople] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [reload, setReload] = useState(0);
  const [name, setName] = useState(''),
    [description, setDescription] = useState(''),
    [edit, setEdit] = useState<{ id: string; revision: number } | null>(null),
    [target, setTarget] = useState('');
  const pending = useRef(false),
    live = useRef(false),
    intent = useRef<{ request: string; signature: string } | null>(null);
  useEffect(() => {
    let active = true;
    live.current = true;
    void classesRepository
      .load(actor, guildId, selected)
      .then(async (workspace) => {
        if (!active) return;
        setData(workspace);
        setError('');
        if (workspace.leader) {
          const members = await guildRepository.listMembersScoped(
            actor,
            guildId,
          );
          if (active)
            setPeople(
              members.map((m) => ({
                id: m.traveler_id,
                name: m.traveler_name,
              })),
            );
        }
      })
      .catch(() => {
        if (active) {
          setData(undefined);
          setError(
            'Não foi possível carregar as classes. Confira sua permissão e tente novamente.',
          );
        }
      });
    return () => {
      active = false;
      live.current = false;
    };
  }, [actor, guildId, selected, reload]);
  const current = data?.classes.find((c) => c.id === selected);
  async function command(
    id: string,
    action: 'save' | 'state' | 'teacher' | 'member' | 'leave',
    revision: number,
    payload: object,
  ) {
    if (pending.current) return false;
    pending.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    const signature = JSON.stringify([id, action, revision, payload]);
    if (intent.current && intent.current.signature !== signature) {
      pending.current = false;
      setBusy(false);
      setError(
        'Há uma operação sem confirmação. Confira o estado atual antes de alterar o pedido.',
      );
      return false;
    }
    intent.current ??= { request: crypto.randomUUID(), signature };
    try {
      await classesRepository.command(
        actor,
        guildId,
        id,
        action,
        revision,
        payload,
        intent.current.request,
      );
      intent.current = null;
      if (live.current) {
        setReload((v) => v + 1);
        setMessage('Operação confirmada. Histórico preservado.');
      }
      return true;
    } catch (e) {
      if (e instanceof ClassCommandRejected) intent.current = null;
      if (live.current)
        setError(e instanceof Error ? e.message : 'Operação indisponível.');
      return false;
    } finally {
      pending.current = false;
      if (live.current) setBusy(false);
    }
  }
  return (
    <section className={css.panel} aria-label="Classes de EBD">
      <h2>Minhas classes de EBD</h2>
      <p>
        Classes privadas da Guilda selecionada. Nenhuma operação concede XP,
        moedas ou baús.
      </p>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <button disabled={busy} onClick={() => setReload((v) => v + 1)}>
        Atualizar classes
      </button>
      {!data && !error ? <p role="status">Carregando classes…</p> : null}
      {data && (
        <>
          <label>
            Classe ativa
            <select
              aria-label="Classe ativa"
              value={selected ?? ''}
              disabled={busy || selectionDisabled}
              onChange={(e) => choose(e.target.value || null)}
            >
              <option value="">Selecione uma classe</option>
              {data.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {roles[c.role]} · {classStates[c.status]}
                </option>
              ))}
            </select>
          </label>
          {!data.classes.length && (
            <p>Nenhuma classe disponível nesta Guilda.</p>
          )}
          {(data.leader || current?.role === 'teacher') && (
            <CommonInvites
              key={`${actor}:${guildId}:${selected ?? ''}`}
              actor={actor}
              guildId={guildId}
              classId={selected}
            />
          )}
          {data.leader && (
            <button
              disabled={busy}
              onClick={() => {
                setEdit({ id: crypto.randomUUID(), revision: 0 });
                setName('');
                setDescription('');
              }}
            >
              Criar classe
            </button>
          )}
          {edit && data.leader && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!validateClass(name, description)) {
                  setError(
                    'Informe nome de 2 a 80 caracteres e descrição de até 1000.',
                  );
                  return;
                }
                const id = edit.id;
                if (
                  await command(id, 'save', edit.revision, {
                    name,
                    description,
                  })
                ) {
                  setEdit(null);
                  choose(id);
                }
              }}
            >
              <label>
                Nome da classe
                <input
                  value={name}
                  required
                  minLength={2}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                Descrição da classe
                <textarea
                  value={description}
                  maxLength={1000}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              <button disabled={busy}>Salvar classe</button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setEdit(null)}
              >
                Cancelar edição
              </button>
            </form>
          )}
          {current && (
            <article className={css.card}>
              <h3>{current.name}</h3>
              <p>{current.description}</p>
              <p>
                {classStates[current.status]} · {roles[current.role]}
              </p>
              {data.leader && (
                <>
                  <button
                    disabled={busy}
                    onClick={() => {
                      setName(current.name);
                      setDescription(current.description);
                      setEdit({ id: current.id, revision: current.revision });
                    }}
                  >
                    Editar classe
                  </button>
                  <label>
                    Estado da classe
                    <select
                      value={current.status}
                      disabled={busy}
                      onChange={(e) =>
                        void command(current.id, 'state', current.revision, {
                          status: e.target.value,
                        })
                      }
                    >
                      {Object.entries(classStates).map(([v, label]) => (
                        <option key={v} value={v}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <fieldset disabled={busy}>
                    <legend>Alunos e professores</legend>
                    <label>
                      Membro da Guilda
                      <select
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                      >
                        <option value="">Selecione um apelido</option>
                        {people.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      disabled={!target}
                      onClick={() =>
                        void command(
                          current.id,
                          'member',
                          data.members.find((m) => m.id === target)?.revision ??
                            0,
                          { travelerId: target, active: true },
                        )
                      }
                    >
                      Matricular aluno
                    </button>
                    <button
                      disabled={!target}
                      onClick={() =>
                        void command(
                          current.id,
                          'teacher',
                          data.teachers.find((t) => t.traveler_id === target)
                            ?.revision ?? 0,
                          {
                            travelerId: target,
                            active: true,
                            publish: true,
                            attend: true,
                          },
                        )
                      }
                    >
                      Nomear professor
                    </button>
                  </fieldset>
                </>
              )}
              {current.role === 'student' && (
                <button
                  disabled={busy}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        'Sair apenas desta classe? Seus outros vínculos serão preservados.',
                      )
                    )
                      return;
                    const revision = data.members.find(
                      (m) => m.id === actor,
                    )?.revision;
                    if (revision === undefined) {
                      setError('Atualize a matrícula antes de sair.');
                      return;
                    }
                    if (await command(current.id, 'leave', revision, {}))
                      choose(null);
                  }}
                >
                  Sair desta classe
                </button>
              )}
              {current.role !== 'student' && (
                <>
                  <h4>Alunos desta classe</h4>
                  <ul>
                    {data.members.map((m) => (
                      <li key={m.id}>
                        {m.name} ·{' '}
                        {m.status === 'active'
                          ? 'Matriculado'
                          : 'Matrícula encerrada'}
                        {data.leader && m.status === 'active' && (
                          <button
                            disabled={busy}
                            onClick={() =>
                              void command(current.id, 'member', m.revision, {
                                travelerId: m.id,
                                active: false,
                              })
                            }
                          >
                            Remover {m.name} desta classe
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {data.leader && (
                <>
                  <h4>Professores</h4>
                  <ul>
                    {data.teachers.map((t) => (
                      <li key={t.traveler_id}>
                        {people.find((p) => p.id === t.traveler_id)?.name ??
                          'Professor'}{' '}
                        · {t.active ? 'Autorizado' : 'Revogado'}
                        {t.active && (
                          <button
                            disabled={busy}
                            onClick={() =>
                              void command(current.id, 'teacher', t.revision, {
                                travelerId: t.traveler_id,
                                active: false,
                                publish: false,
                                attend: false,
                              })
                            }
                          >
                            Revogar professor
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <p>
                As aulas anteriores da Guilda permanecem disponíveis abaixo.
              </p>
            </article>
          )}
        </>
      )}
    </section>
  );
}
