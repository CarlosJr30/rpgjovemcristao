import { INVITE_UUID } from '../guild-invites/contracts';
export type EbdClass = {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'archived';
  revision: number;
  role: 'leader' | 'teacher' | 'student';
};
export type ClassesWorkspace = {
  version: 1;
  guildId: string;
  classId: string | null;
  leader: boolean;
  classes: EbdClass[];
  members: {
    id: string;
    name: string;
    status: 'active' | 'left' | 'removed';
    revision: number;
  }[];
  teachers: {
    traveler_id: string;
    active: boolean;
    can_publish: boolean;
    can_attend: boolean;
    revision: number;
  }[];
  history: { id: number; action: string; created_at: string }[];
};
const record = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);
const id = (x: unknown) => typeof x === 'string' && INVITE_UUID.test(x);
const rev = (x: unknown) =>
  typeof x === 'number' && Number.isSafeInteger(x) && x > 0;
export function parseClassesWorkspace(
  value: unknown,
  guild: string,
  selected: string | null,
): ClassesWorkspace {
  if (
    !record(value) ||
    value.version !== 1 ||
    value.guildId !== guild ||
    value.classId !== selected ||
    typeof value.leader !== 'boolean' ||
    !Array.isArray(value.classes) ||
    !value.classes.every(
      (c) =>
        record(c) &&
        id(c.id) &&
        typeof c.name === 'string' &&
        c.name.length >= 2 &&
        c.name.length <= 80 &&
        typeof c.description === 'string' &&
        c.description.length <= 1000 &&
        rev(c.revision) &&
        ['active', 'paused', 'archived'].includes(String(c.status)) &&
        ['leader', 'teacher', 'student'].includes(String(c.role)),
    ) ||
    new Set(value.classes.map((c) => c.id)).size !== value.classes.length ||
    (selected !== null && !value.classes.some((c) => c.id === selected)) ||
    !Array.isArray(value.members) ||
    !value.members.every(
      (m) =>
        record(m) &&
        id(m.id) &&
        typeof m.name === 'string' &&
        rev(m.revision) &&
        ['active', 'left', 'removed'].includes(String(m.status)),
    ) ||
    !Array.isArray(value.teachers) ||
    !value.teachers.every(
      (t) =>
        record(t) &&
        id(t.traveler_id) &&
        rev(t.revision) &&
        ['active', 'can_publish', 'can_attend'].every(
          (k) => typeof t[k] === 'boolean',
        ),
    ) ||
    !Array.isArray(value.history) ||
    !value.history.every(
      (h) =>
        record(h) &&
        rev(h.id) &&
        typeof h.action === 'string' &&
        typeof h.created_at === 'string' &&
        Number.isFinite(Date.parse(h.created_at)),
    )
  )
    throw Error('Não foi possível confirmar as classes e suas permissões.');
  return value as ClassesWorkspace;
}
export function validateClass(name: string, description: string) {
  return (
    name.trim().length >= 2 &&
    name.trim().length <= 80 &&
    description.length <= 1000
  );
}
