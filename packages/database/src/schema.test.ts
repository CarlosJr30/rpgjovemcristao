import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, test } from 'vitest';
import {
  equippedItems,
  guildInvites,
  guildJoinRequests,
  guildMembers,
  guildMissionProgress,
  guildMissions,
  guildLessons,
  guildRewardClaims,
  guildActivityLog,
  guilds,
  inventory,
  profiles,
  travelerStats,
  travelers,
  wallets,
  travelerChests,
  chestOperations,
} from './schema';

const tables = [
  profiles,
  travelers,
  travelerStats,
  wallets,
  inventory,
  equippedItems,
  guilds,
  guildMembers,
  guildInvites,
  guildJoinRequests,
  guildMissions,
  guildLessons,
  guildMissionProgress,
  guildRewardClaims,
  guildActivityLog,
  travelerChests,
  chestOperations,
];

describe('initial Supabase gameplay schema', () => {
  test('enables RLS and declares explicit policies on every table', () => {
    for (const table of tables) {
      const config = getTableConfig(table);
      expect(config.enableRLS).toBe(true);
      expect(config.policies.length).toBeGreaterThan(0);
    }
  });

  test('enforces ownership and domain constraints in the schema', () => {
    const travelerConfig = getTableConfig(travelers);
    const inventoryConfig = getTableConfig(inventory);
    const equippedConfig = getTableConfig(equippedItems);

    expect(travelerConfig.indexes.map((entry) => entry.config.name)).toContain(
      'travelers_one_active_per_user_idx',
    );
    expect(
      inventoryConfig.uniqueConstraints.map((entry) => entry.name),
    ).toContain('inventory_traveler_item_unique');
    expect(equippedConfig.primaryKeys).toHaveLength(1);
    expect(equippedConfig.foreignKeys).toHaveLength(2);

    const memberConfig = getTableConfig(guildMembers);
    const missionConfig = getTableConfig(guildMissions);
    const lessonConfig = getTableConfig(guildLessons);
    const progressConfig = getTableConfig(guildMissionProgress);
    const chestsConfig = getTableConfig(travelerChests);
    const operationsConfig = getTableConfig(chestOperations);
    expect(memberConfig.indexes.map((entry) => entry.config.name)).toContain('guild_members_one_active_guild_per_traveler_idx');
    expect(missionConfig.checks.map((entry) => entry.name)).toContain('guild_missions_reward_tier_check');
    expect(lessonConfig.checks.map((entry) => entry.name)).toContain('guild_lessons_status_check');
    expect(lessonConfig.foreignKeys).toHaveLength(3);
    expect(progressConfig.uniqueConstraints.map((entry) => entry.name)).toContain('guild_mission_progress_mission_traveler_unique');
    expect(chestsConfig.primaryKeys).toHaveLength(1);
    expect(chestsConfig.checks.map((entry) => entry.name)).toContain('traveler_chests_sources_check');
    expect(operationsConfig.uniqueConstraints.map((entry) => entry.name)).toContain('chest_operations_traveler_key_unique');
  });
});
