import type { MissionFormData } from './contracts';
export const activityCategories = {
  biblical_challenge: 'Desafio bíblico',
  guided_reading: 'Leitura orientada',
  practical: 'Atividade prática',
  gincana: 'Gincana',
  solidarity: 'Campanha solidária',
  group: 'Dinâmica em grupo',
  cooperative: 'Desafio cooperativo',
  competitive: 'Desafio competitivo',
  special: 'Evento especial',
} as const;
export const futureCategories = {
  none: 'Sem categoria',
  common: 'Comum · indisponível',
  rare: 'Raro · indisponível',
  epic: 'Épico · indisponível',
} as const;
export type CellDetails = {
  kind: 'meeting' | 'activity';
  meetingId: string;
  category: keyof typeof activityCategories;
  theme: string;
  meetingType: 'in_person' | 'digital';
  responsibleId: string;
  accessDetails: string;
  futureCategory: keyof typeof futureCategories;
};
export type CellMission = CellDetails & {
  id: string;
  title: string;
  description: string;
  objective: string;
  instructions: string;
  evidenceCriterion: string;
  reference: string;
  startsAt: string | null;
  dueAt: string | null;
  status: 'draft' | 'published' | 'closed' | 'cancelled';
  revision: number;
  audience: 'all' | 'selected';
  targetIds: string[];
  canEdit: boolean;
  canValidate: boolean;
  canParticipate: boolean;
};
export type CellProgress = {
  id: string;
  missionId: string;
  travelerId: string;
  travelerName: string;
  own: boolean;
  status: string;
  revision: number;
  submittedAt: string;
  approvedAt: string | null;
  reviewNote: string | null;
};
export type CellDelegation = {
  missionId: string;
  travelerId: string;
  expiresAt: string;
  active: boolean;
  revision: number;
};
export type CellWorkspace = {
  version: 1;
  guildId: string;
  leader: boolean;
  hasMore: boolean;
  offset: number;
  missions: CellMission[];
  progress: CellProgress[];
  members: { id: string; name: string }[];
  delegations: CellDelegation[];
  history: {
    id: string;
    entity_id: string;
    event_type: string;
    created_at: string;
  }[];
  validations: {
    missionId: string;
    travelerId: string;
    reviewerId: string;
    beforeStatus: string;
    afterStatus: string;
    reason: string;
    revision: number;
    createdAt: string;
  }[];
};
export const blankCell = (
  actor: string,
  kind: CellDetails['kind'],
): CellDetails => ({
  kind,
  meetingId: '',
  category: 'group',
  theme: '',
  meetingType: 'in_person',
  responsibleId: actor,
  accessDetails: '',
  futureCategory: 'none',
});
export function cellPayload(form: MissionFormData, extra: CellDetails) {
  if (extra.kind === 'meeting' && !form.startsAt)
    throw Error('Informe a data do encontro.');
  if (
    extra.kind === 'meeting' &&
    extra.meetingType === 'digital' &&
    extra.accessDetails
  ) {
    let url: URL;
    try {
      url = new URL(extra.accessDetails);
    } catch {
      throw Error('Informe um link HTTPS válido.');
    }
    if (url.protocol !== 'https:' || url.username || url.password)
      throw Error('Use HTTPS sem credenciais no endereço.');
  }
  const {
    title,
    description,
    objective,
    instructions,
    evidenceCriterion,
    bibleReference,
    audience,
    targetIds,
  } = form;
  return {
    title,
    description,
    objective,
    instructions,
    evidenceCriterion,
    bibleReference,
    audience,
    targetIds: audience === 'all' ? [] : targetIds,
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : '',
    dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : '',
    kind: extra.kind,
    meetingId: extra.meetingId,
    category: extra.category,
    theme: extra.theme,
    meetingType: extra.meetingType,
    responsibleId: extra.responsibleId,
    futureCategory: extra.futureCategory,
    accessDetails: extra.kind === 'meeting' ? extra.accessDetails : '',
  };
}
export function cellForm(m: CellMission): MissionFormData {
  const local = (value: string | null) =>
    value
      ? new Date(
          Date.parse(value) - new Date(value).getTimezoneOffset() * 60000,
        )
          .toISOString()
          .slice(0, 16)
      : '';
  return {
    title: m.title,
    description: m.description,
    objective: m.objective,
    instructions: m.instructions,
    evidenceCriterion: m.evidenceCriterion,
    bibleReference: m.reference ?? '',
    startsAt: local(m.startsAt),
    dueAt: local(m.dueAt),
    audience: m.audience,
    targetIds: m.targetIds,
    kind: 'mission',
    rewardTier: 'normal',
  };
}
export function parseCellWorkspace(
  value: unknown,
  guild: string,
): CellWorkspace {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('Resposta de atividades inválida.');
  const r = value as Record<string, unknown>;
  if (
    r.version !== 1 ||
    r.guildId !== guild ||
    typeof r.leader !== 'boolean' ||
    !Array.isArray(r.missions) ||
    !Array.isArray(r.progress) ||
    !Array.isArray(r.members) ||
    !Array.isArray(r.delegations) ||
    !Array.isArray(r.history) ||
    !Array.isArray(r.validations)
  )
    throw Error('A resposta não pertence à Guilda selecionada.');
  const ids = new Set<string>();
  for (const raw of r.missions) {
    if (
      !raw ||
      typeof raw !== 'object' ||
      typeof raw.id !== 'string' ||
      ids.has(raw.id) ||
      !['meeting', 'activity'].includes(raw.kind) ||
      !['draft', 'published', 'closed', 'cancelled'].includes(raw.status) ||
      !Number.isInteger(raw.revision) ||
      !Array.isArray(raw.targetIds)
    )
      throw Error('Atividade incompatível.');
    ids.add(raw.id);
  }
  return r as unknown as CellWorkspace;
}
