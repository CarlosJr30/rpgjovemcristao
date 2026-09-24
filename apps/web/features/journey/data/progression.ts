import type { Traveler } from '../domain/traveler';

// Valores de balanceamento provisórios, concentrados para ajustes futuros.
export const MAX_LEVEL = 50;
export const TRAVELER_CURRENCY_NAME = 'Moedas do Viajante';
export const LEVEL_UNLOCKS = [
  { level: 2, label: 'Bônus de 10 moedas' },
  { level: 5, label: 'Primeiro talento de gameplay (em preparação)' },
  { level: 10, label: 'Mercador Especial (em preparação)' },
  { level: 15, label: 'Equipamentos épicos (em preparação)' },
  { level: 20, label: 'Especialização (em preparação)' },
] as const;

export function xpForLevel(level: number): number {
  const bounded = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  return 100 * bounded * (bounded - 1);
}

export function levelForXp(xp: number): number {
  if (!Number.isFinite(xp) || xp < 0) return 1;
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level += 1;
  return level;
}

export function addExperience(traveler: Traveler, amount: number): Traveler {
  if (!Number.isInteger(amount) || amount < 0) throw new Error('XP inválido');
  const xp = traveler.xp + amount;
  if (!Number.isSafeInteger(xp)) throw new Error('Limite de XP excedido');
  const level = levelForXp(xp);
  const coinBonus = traveler.level < 2 && level >= 2 ? 10 : 0;
  return { ...traveler, xp, level, coins: traveler.coins + coinBonus };
}

export function addGameplayReward(traveler: Traveler, xp: number, coins: number): Traveler {
  if (!Number.isInteger(coins) || coins < 0) throw new Error('Moedas inválidas');
  const leveled = addExperience(traveler, xp);
  const balance = leveled.coins + coins;
  if (!Number.isSafeInteger(balance)) throw new Error('Limite de moedas excedido');
  return { ...leveled, coins: balance };
}

export function nextUnlock(level: number) {
  return LEVEL_UNLOCKS.find((unlock) => unlock.level > level) ?? null;
}
