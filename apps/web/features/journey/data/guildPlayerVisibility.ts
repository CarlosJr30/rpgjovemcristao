import type { GuildMissionRow } from '../../../lib/supabase/database.types';
import type { GuildContent } from './guildContent';
import type { SpecialChallenge } from '../domain/traveler';

export type PlayerGuildSection = 'available' | 'pending' | 'history' | 'hidden';

export function playerPhaseSection(status: string): PlayerGuildSection {
  if (status === 'completed') return 'history';
  if (['awaiting-validation', 'approved', 'reward-available'].includes(status))
    return 'pending';
  return [
    'available',
    'in-progress',
    'revision-requested',
    'submitted',
  ].includes(status)
    ? 'available'
    : 'hidden';
}

export function playerSpecialSection(
  challenge: Pick<SpecialChallenge, 'status' | 'expiresAt'>,
  now: number,
): PlayerGuildSection {
  if (challenge.status === 'completed') return 'history';
  if (
    ['submitted', 'awaiting-validation', 'reward-available'].includes(
      challenge.status,
    )
  )
    return 'pending';
  if (challenge.expiresAt && !(Date.parse(challenge.expiresAt) > now))
    return 'hidden';
  return ['available', 'in-progress', 'revision-requested'].includes(
    challenge.status,
  )
    ? 'available'
    : 'hidden';
}

export function missionIsPlayable(
  mission: Pick<GuildMissionRow, 'status' | 'starts_at' | 'due_at'>,
  now: number,
) {
  return (
    mission.status === 'published' &&
    (!mission.starts_at || Date.parse(mission.starts_at) <= now) &&
    (!mission.due_at || Date.parse(mission.due_at) > now)
  );
}

export function playerMissionSection(
  mission: Pick<GuildMissionRow, 'status' | 'starts_at' | 'due_at'>,
  progress: string | undefined,
  now: number,
): PlayerGuildSection {
  if (progress === 'completed') return 'history';
  if (progress === 'pending_approval' || progress === 'approved')
    return 'pending';
  if (!missionIsPlayable(mission, now)) return 'hidden';
  return !progress ||
    ['available', 'started', 'rejected', 'changes_requested'].includes(progress)
    ? 'available'
    : 'hidden';
}

// Local content has a date-only deadline, inclusive through the local day.
export function localContentDeadline(date: string): number {
  if (!date) return Infinity;
  const day = new Date(`${date}T00:00:00`);
  day.setDate(day.getDate() + 1);
  return day.getTime();
}

export function playerContentSection(
  item: GuildContent,
  progress: string | undefined,
  now: number,
): PlayerGuildSection {
  if (progress === 'claimed') return 'history';
  if (progress === 'submitted' || progress === 'approved') return 'pending';
  if (
    item.status !== 'active' ||
    localContentDeadline(item.date) <= now ||
    Number.isNaN(localContentDeadline(item.date))
  )
    return 'hidden';
  return !progress || progress === 'revision-requested'
    ? 'available'
    : 'hidden';
}
