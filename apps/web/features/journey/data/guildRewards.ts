import type { SpecialChallengeRewardTier } from '../domain/traveler';
import {
  guildMissionRewards,
  type GuildMissionRewardDefinition,
} from '@rpg/game-engine';
export { guildMissionRewards, type GuildRewardTier } from '@rpg/game-engine';

export type GuildRewardDefinition = GuildMissionRewardDefinition & {
  allowedRarities: readonly ('comum' | 'raro' | 'épico' | 'lendário')[];
  itemCount: number;
};

export const PHASE_GUILD_REWARD: GuildRewardDefinition = {
  xp: 180,
  coins: 75,
  chestType: 'epic',
  chestQuantity: 1,
  chestLabel: 'Baú Épico da Célula',
  allowedRarities: ['comum', 'raro'],
  itemCount: 0,
};

export const specialChallengeRewardTables: Record<SpecialChallengeRewardTier, GuildRewardDefinition> = {
  great: {
    ...guildMissionRewards.great,
    allowedRarities: ['comum', 'raro'],
    itemCount: 1,
  },
  epic: {
    ...guildMissionRewards.epic,
    allowedRarities: ['raro', 'épico'],
    itemCount: 1,
  },
  extraordinary: {
    ...guildMissionRewards.extraordinary,
    allowedRarities: ['raro', 'épico', 'lendário'],
    itemCount: 2,
  },
};
