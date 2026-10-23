import { guildMissionRewards, type GuildRewardTier } from '@rpg/game-engine';
import type {
  GuildActivityRow,
  GuildMissionProgressRow,
  GuildMissionRow,
} from '../../lib/supabase/database.types';
export type Mission = GuildMissionRow & {
  objective: string | null;
  instructions: string | null;
  evidence_criterion: string | null;
  audience: 'all' | 'selected';
  target_traveler_ids: string[];
  workspace_revision: number;
};
export type Progress = GuildMissionProgressRow & {
  submission_revision: number;
};
export type Decision = 'approved' | 'rejected' | 'changes_requested';
export type Attempt = {
  id: string;
  mission_id: string;
  traveler_id: string;
  traveler_name: string;
  revision: number;
  note: string;
  submitted_at: string;
  decision: Decision | null;
  reason: string | null;
  reviewer_traveler_id: string | null;
  decided_at: string | null;
  imported_legacy?: boolean;
};
export type Workspace = {
  version: 1;
  guildId: string;
  missions: Mission[];
  progress: Progress[];
  attempts: Attempt[];
  history: GuildActivityRow[];
};
export type MissionFormData = {
  title: string;
  description: string;
  objective: string;
  instructions: string;
  evidenceCriterion: string;
  bibleReference: string;
  startsAt: string;
  dueAt: string;
  kind: 'mission' | 'special';
  rewardTier: GuildRewardTier;
  audience: 'all' | 'selected';
  targetIds: string[];
};
export const emptyMission = (special = false): MissionFormData => ({
  title: '',
  description: '',
  objective: '',
  instructions: '',
  evidenceCriterion: '',
  bibleReference: '',
  startsAt: '',
  dueAt: '',
  kind: special ? 'special' : 'mission',
  rewardTier: 'normal',
  audience: 'all',
  targetIds: [],
});
export const progressLabels: Record<string, string> = {
  available: 'Disponível',
  started: 'Em andamento',
  pending_approval: 'Aguardando aprovação',
  approved: 'Aprovada · recompensa pendente',
  rejected: 'Rejeitada · veja a justificativa',
  changes_requested: 'Correção solicitada',
  completed: 'Concluída',
};
export const missionLabels: Record<string, string> = {
  draft: 'Rascunho',
  published: 'Publicada',
  closed: 'Encerrada',
  cancelled: 'Cancelada',
};
export const isSpecial = (mission: Mission) =>
  ['special_mission', 'individual_challenge', 'collective_challenge'].includes(
    mission.mission_type,
  );
export function eligibleForTraveler(
  mission: Pick<Mission, 'audience' | 'target_traveler_ids'>,
  travelerId: string,
) {
  return (
    mission.audience !== 'selected' ||
    mission.target_traveler_ids?.includes(travelerId) === true
  );
}
export function validateMission(data: MissionFormData): string | null {
  for (const [key, min, max] of [
    ['title', 2, 100],
    ['description', 1, 1000],
    ['objective', 1, 500],
    ['instructions', 1, 1000],
    ['evidenceCriterion', 1, 300],
  ] as const) {
    if (data[key].trim().length < min || data[key].trim().length > max)
      return 'Preencha os campos obrigatórios dentro dos limites indicados.';
  }
  if (
    data.bibleReference.length > 100 ||
    !Object.hasOwn(guildMissionRewards, data.rewardTier)
  )
    return 'Referência ou recompensa inválida.';
  const start = data.startsAt ? Date.parse(data.startsAt) : null;
  const due = data.dueAt ? Date.parse(data.dueAt) : null;
  if (
    (start !== null && !Number.isFinite(start)) ||
    (due !== null && !Number.isFinite(due)) ||
    (start !== null && due !== null && due <= start)
  )
    return 'Informe datas válidas; o prazo deve ser posterior ao início.';
  if (
    data.audience === 'selected' &&
    (data.targetIds.length === 0 || data.targetIds.length > 100)
  )
    return 'Selecione entre 1 e 100 membros.';
  return null;
}
export function canParticipate(mission: Mission, now: number) {
  return (
    mission.status === 'published' &&
    (!mission.starts_at || Date.parse(mission.starts_at) <= now) &&
    (!mission.due_at || Date.parse(mission.due_at) > now)
  );
}
export function rewardLabel(progress: Progress | undefined) {
  if (progress?.reward_claimed_at) return 'Recompensa registrada pelo sistema';
  if (progress?.status === 'approved' || progress?.status === 'completed')
    return 'Recompensa pendente de integração';
  return 'Recompensa prevista · depende de aprovação';
}
export function formFromMission(mission: Mission): MissionFormData {
  const localDate = (value: string | null) => {
    if (!value) return '';
    const d = new Date(value);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };
  return {
    title: mission.title,
    description: mission.description ?? '',
    objective: mission.objective ?? '',
    instructions: mission.instructions ?? '',
    evidenceCriterion: mission.evidence_criterion ?? '',
    bibleReference: mission.bible_reference ?? '',
    startsAt: localDate(mission.starts_at),
    dueAt: localDate(mission.due_at),
    kind: isSpecial(mission) ? 'special' : 'mission',
    rewardTier: mission.reward_tier as GuildRewardTier,
    audience: mission.audience,
    targetIds: mission.target_traveler_ids,
  };
}
