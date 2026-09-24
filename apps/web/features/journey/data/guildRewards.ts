import type { SpecialChallengeRewardTier } from '../domain/traveler';

export type GuildRewardDefinition = {
  xp: number;
  coins: number;
  chestLabel: string;
  allowedRarities: readonly ('comum' | 'raro' | 'épico' | 'lendário')[];
  itemCount: number;
};

export const PHASE_GUILD_REWARD: GuildRewardDefinition = {
  xp: 180,
  coins: 75,
  chestLabel: 'Baú Épico da Célula',
  allowedRarities: ['comum', 'raro'],
  itemCount: 0,
};

export const specialChallengeRewardTables: Record<SpecialChallengeRewardTier, GuildRewardDefinition> = {
  great: {
    xp: 240,
    coins: 100,
    chestLabel: 'Baú Grande',
    allowedRarities: ['comum', 'raro'],
    itemCount: 1,
  },
  epic: {
    xp: 480,
    coins: 220,
    chestLabel: 'Baú Épico',
    allowedRarities: ['raro', 'épico'],
    itemCount: 1,
  },
  extraordinary: {
    xp: 720,
    coins: 360,
    chestLabel: 'Baú Extraordinário',
    allowedRarities: ['raro', 'épico', 'lendário'],
    itemCount: 2,
  },
};
