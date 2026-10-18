import type { TrainingReward } from '@rpg/game-engine';

export const ARENA_STORAGE_KEY = 'rpg-jovem-cristao:arena:v1';
export type ArenaBattleRecord = Readonly<{
  id: string;
  playerId: string;
  opponentId: string;
  opponentName: string;
  result: 'victory' | 'defeat';
  roundCount: number;
  createdAt: string;
  damageDealt: number;
  damageTaken: number;
  abilitiesUsed: number;
  reward: TrainingReward;
  settlement?: 'reserved' | 'applied' | 'failed';
}>;
const MAX_RECORDS = 100;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
function valid(value: unknown): value is ArenaBattleRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.playerId === 'string' &&
    typeof value.opponentId === 'string' &&
    typeof value.opponentName === 'string' &&
    value.opponentName.length <= 80 &&
    ['victory', 'defeat'].includes(String(value.result)) &&
    Number.isInteger(value.roundCount) &&
    typeof value.createdAt === 'string' &&
    Number.isFinite(Date.parse(value.createdAt)) &&
    Number.isInteger(value.damageDealt) &&
    Number.isInteger(value.damageTaken) &&
    Number.isInteger(value.abilitiesUsed) &&
    isRecord(value.reward) &&
    typeof value.reward.rewarded === 'boolean' &&
    Number.isInteger(value.reward.xp) &&
    Number.isInteger(value.reward.coins) &&
    ['victory', 'daily-limit', 'defeat'].includes(
      String(value.reward.reason),
    ) &&
    (value.settlement === undefined ||
      ['reserved', 'applied', 'failed'].includes(String(value.settlement)))
  );
}
function load(): ArenaBattleRecord[] {
  try {
    const raw = window.localStorage.getItem(ARENA_STORAGE_KEY);
    if (!raw || raw.length > 256_000) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(valid).slice(-MAX_RECORDS)
      : [];
  } catch {
    return [];
  }
}
export const arenaRepository = {
  list(playerId: string) {
    return load()
      .filter((record) => record.playerId === playerId)
      .reverse();
  },
  has(id: string) {
    return load().some((record) => record.id === id);
  },
  rewardedToday(playerId: string, opponentId: string, now = new Date()) {
    const day = now.toISOString().slice(0, 10);
    return load().filter(
      (record) =>
        record.playerId === playerId &&
        record.opponentId === opponentId &&
        (record.reward.rewarded || record.settlement === 'reserved') &&
        record.createdAt.slice(0, 10) === day,
    ).length;
  },
  add(record: ArenaBattleRecord) {
    const records = load();
    if (records.some((item) => item.id === record.id) || !valid(record))
      return false;
    try {
      window.localStorage.setItem(
        ARENA_STORAGE_KEY,
        JSON.stringify([...records, record].slice(-MAX_RECORDS)),
      );
      return true;
    } catch {
      return false;
    }
  },
  finalizeCardReward(
    id: string,
    reward: TrainingReward,
    status: 'applied' | 'failed',
  ) {
    const records = load(),
      index = records.findIndex(
        (record) => record.id === id && record.settlement === 'reserved',
      );
    if (index < 0) return false;
    records[index] = { ...records[index], reward, settlement: status };
    try {
      window.localStorage.setItem(ARENA_STORAGE_KEY, JSON.stringify(records));
      return true;
    } catch {
      return false;
    }
  },
};
