'use client';
import { useId, useState } from 'react';
import type { Attendance, Lesson, Teacher, Workspace } from './contracts';
import type { Command } from './participation';
import css from '../guild-missions/panel.module.css';

export function TeacherForm({
  member,
  teacher,
  busy,
  command,
}: {
  member: Workspace['members'][number];
  teacher?: Teacher;
  busy: boolean;
  command: Command;
}) {
  const [active, setActive] = useState(teacher?.active ?? false);
  const [publish, setPublish] = useState(teacher?.can_publish ?? false);
  const [attend, setAttend] = useState(teacher?.can_attend ?? false);
  return (
    <form
      className={`${css.card} ${css.form}`}
      aria-label={`Permissões de ${member.name}`}
      onSubmit={async (e) => {
        e.preventDefault();
        await command(
          'teacher',
          member.id,
          teacher?.revision ?? 0,
          { active, publish, attend },
          'Permissões atualizadas.',
        );
      }}
    >
      <h3>{member.name}</h3>
      <label className={css.check}>
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Professor autorizado
      </label>
      <label className={css.check}>
        <input
          type="checkbox"
          checked={publish}
          onChange={(e) => setPublish(e.target.checked)}
        />
        Pode publicar suas aulas
      </label>
      <label className={css.check}>
        <input
          type="checkbox"
          checked={attend}
          onChange={(e) => setAttend(e.target.checked)}
        />
        Pode registrar presença em suas aulas
      </label>
      <button disabled={busy}>Salvar permissões</button>
    </form>
  );
}
export function AttendanceForm({
  lesson,
  members,
  records,
  busy,
  command,
}: {
  lesson: Lesson;
  members: Workspace['members'];
  records: Attendance[];
  busy: boolean;
  command: Command;
}) {
  const eligible = members.filter(
    (m) => lesson.audience === 'all' || lesson.target_ids.includes(m.id),
  );
  const selectId = useId();
  const [target, setTarget] = useState(eligible[0]?.id ?? '');
  const current = records.find(
    (r) => r.lesson_id === lesson.id && r.traveler_id === target,
  );
  return (
    <div className={`${css.card} ${css.form}`}>
      <h3>{lesson.title}</h3>
      <label htmlFor={selectId}>Aluno</label>
      <select
        id={selectId}
        value={target}
        onChange={(e) => setTarget(e.target.value)}
      >
        <option value="">Selecione</option>
        {eligible.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      {target && (
        <AttendanceEntry
          key={`${target}-${current?.revision ?? 0}`}
          lessonId={lesson.id}
          target={target}
          record={current}
          busy={busy}
          command={command}
        />
      )}
    </div>
  );
}
function AttendanceEntry({
  lessonId,
  target,
  record,
  busy,
  command,
}: {
  lessonId: string;
  target: string;
  record?: Attendance;
  busy: boolean;
  command: Command;
}) {
  const [status, setStatus] = useState(record?.status ?? 'present');
  const [reason, setReason] = useState(record?.reason ?? '');
  return (
    <form
      className={css.form}
      onSubmit={async (e) => {
        e.preventDefault();
        await command(
          'attendance',
          lessonId,
          record?.revision ?? 0,
          { travelerId: target, status, reason },
          'Presença registrada com histórico.',
        );
      }}
    >
      <label>
        Registro
        <select
          aria-label="Registro"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'present' | 'absent')}
        >
          <option value="present">Presente</option>
          <option value="absent">Ausente</option>
        </select>
      </label>
      <label>
        Justificativa opcional
        <textarea
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <p className={css.meta}>
        Use uma observação breve, sem dados sensíveis. Correções preservam o
        registro anterior para auditoria.
      </p>
      <button disabled={busy}>Registrar presença</button>
    </form>
  );
}
