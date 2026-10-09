import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const migration = readFileSync(
  new URL('../migrations/0000_initial_supabase_gameplay.sql', import.meta.url),
  'utf8',
);
const rollback = readFileSync(
  new URL(
    '../migrations/0000_initial_supabase_gameplay.down.sql',
    import.meta.url,
  ),
  'utf8',
);
const guildMigration = readFileSync(new URL('../migrations/0001_guild_supabase_v1.sql', import.meta.url), 'utf8');
const guildRollback = readFileSync(new URL('../migrations/0001_guild_supabase_v1.down.sql', import.meta.url), 'utf8');
const chestMigration = readFileSync(new URL('../migrations/0002_traveler_chests.sql', import.meta.url), 'utf8');
const chestRollback = readFileSync(new URL('../migrations/0002_traveler_chests.down.sql', import.meta.url), 'utf8');
const guildChestRewardMigration = readFileSync(new URL('../migrations/0003_guild_mission_chest_rewards.sql', import.meta.url), 'utf8');
const guildChestRewardRollback = readFileSync(new URL('../migrations/0003_guild_mission_chest_rewards.down.sql', import.meta.url), 'utf8');
const leaderPanelMigration = readFileSync(new URL('../migrations/0004_guild_leader_panel.sql', import.meta.url), 'utf8');
const leaderPanelRollback = readFileSync(new URL('../migrations/0004_guild_leader_panel.down.sql', import.meta.url), 'utf8');
const lessonMigration = readFileSync(new URL('../migrations/0005_guild_lessons_and_schedule.sql', import.meta.url), 'utf8');
const lessonRollback = readFileSync(new URL('../migrations/0005_guild_lessons_and_schedule.down.sql', import.meta.url), 'utf8');

describe('initial Supabase migration', () => {
  test('enables RLS and defines ownership policies for all six tables', () => {
    for (const table of [
      'profiles',
      'travelers',
      'traveler_stats',
      'wallets',
      'inventory',
      'equipped_items',
    ]) {
      expect(migration).toContain(
        `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`,
      );
      expect(migration).toContain(`ON "${table}" AS PERMISSIVE`);
    }
  });

  test('keeps privileged access out of client-callable functions', () => {
    expect(migration).not.toContain('SECURITY DEFINER');
    expect(migration.match(/SECURITY INVOKER/g)?.length).toBe(5);
    expect(migration).toContain('FROM PUBLIC, "anon"');
  });

  test('provides a rollback for every gameplay table', () => {
    for (const table of [
      'profiles',
      'travelers',
      'traveler_stats',
      'wallets',
      'inventory',
      'equipped_items',
    ]) {
      expect(rollback).toContain(`DROP TABLE IF EXISTS public.${table}`);
    }
  });
});

describe('Guild Supabase V1 migration', () => {
  const tables = ['guilds', 'guild_members', 'guild_invites', 'guild_join_requests', 'guild_missions', 'guild_mission_progress', 'guild_reward_claims'];

  test('enables RLS, grants read-only table access and provides rollback', () => {
    for (const table of tables) {
      expect(guildMigration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
      expect(guildRollback).toContain(`DROP TABLE IF EXISTS public.${table}`);
    }
    expect(guildMigration).toContain('GRANT SELECT ON TABLE public.guilds, public.guild_members, public.guild_invites, public.guild_join_requests, public.guild_missions, public.guild_mission_progress, public.guild_reward_claims TO authenticated');
    expect(guildMigration).not.toMatch(/GRANT (INSERT|UPDATE|DELETE).*guild_/);
  });

  test('keeps rewards authoritative and idempotent', () => {
    expect(guildMigration).toContain("WHEN 'normal' THEN 80");
    expect(guildMigration).toContain("WHEN 'extraordinary' THEN 360");
    expect(guildMigration).toContain('ON CONFLICT (mission_id, traveler_id) DO NOTHING');
    expect(guildMigration).not.toMatch(/custom_?(xp|coins)/i);
    expect(guildMigration).toContain('REVOKE ALL ON FUNCTION public.apply_guild_mission_reward(uuid, uuid) FROM PUBLIC, anon, authenticated');
  });

  test('checks ownership and leader role in every privileged workflow', () => {
    for (const rpc of ['create_guild', 'request_join_guild', 'review_guild_join_request', 'create_guild_mission', 'publish_guild_mission', 'start_guild_mission', 'submit_guild_mission', 'review_guild_mission']) {
      expect(guildMigration).toContain(`CREATE FUNCTION public.${rpc}`);
    }
    expect(guildMigration.match(/public\.owns_traveler/g)?.length).toBeGreaterThanOrEqual(10);
    expect(guildMigration).toContain("gm.role = 'leader'");
  });
});

describe('Traveler chests migration', () => {
  test('uses private tables with ownership RLS and read-only browser access', () => {
    for (const table of ['traveler_chests', 'chest_operations']) {
      expect(chestMigration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
      expect(chestRollback).toContain(`DROP TABLE IF EXISTS public.${table}`);
    }
    expect(chestMigration).toContain('GRANT SELECT ON TABLE public.traveler_chests, public.chest_operations TO authenticated');
    expect(chestMigration).not.toMatch(/GRANT (INSERT|UPDATE|DELETE).*chest/i);
    expect(chestMigration).toContain('public.owns_traveler(p_traveler_id)');
  });

  test('keeps purchase and opening atomic, server-side and idempotent', () => {
    expect(chestMigration).toContain('CREATE FUNCTION public.purchase_chest');
    expect(chestMigration).toContain('CREATE FUNCTION public.open_chest');
    expect(chestMigration).toContain('public.spend_coins(p_traveler_id, price_value)');
    expect(chestMigration).toContain('roll_value := random()');
    expect(chestMigration).toContain('CONSTRAINT chest_operations_traveler_key_unique UNIQUE (traveler_id, operation_key)');
    expect(chestMigration).toContain('REVOKE ALL ON FUNCTION public.grant_traveler_chest(uuid,text,text,text) FROM PUBLIC, anon, authenticated');
  });

  test('turns the Guild chest label into a persisted grant', () => {
    expect(chestMigration).toContain("'guild_mission:' || p_mission_id::text");
    expect(chestMigration).toContain('PERFORM public.grant_traveler_chest');
    expect(chestRollback).toContain('CREATE OR REPLACE FUNCTION public.apply_guild_mission_reward');
  });
});

describe('Guild mission chest rewards migration', () => {
  test('maps every Guild tier to one allowed chest without granting extraordinary', () => {
    expect(guildChestRewardMigration).toContain("WHEN 'normal' THEN 'common'");
    expect(guildChestRewardMigration).toContain("WHEN 'great' THEN 'uncommon'");
    expect(guildChestRewardMigration).toContain("WHEN 'epic' THEN 'rare'");
    expect(guildChestRewardMigration).toContain("WHEN 'extraordinary' THEN 'epic'");
    expect(guildChestRewardMigration).toContain('chest_quantity_value integer := 1');
    expect(guildChestRewardMigration).not.toContain("WHEN 'extraordinary' THEN 'extraordinary'");
  });

  test('keeps XP, coins and chest in the same idempotent transaction', () => {
    expect(guildChestRewardMigration).toContain('ON CONFLICT (mission_id, traveler_id) DO NOTHING');
    expect(guildChestRewardMigration).toContain('IF NOT FOUND THEN RETURN false');
    expect(guildChestRewardMigration).toContain('PERFORM public.grant_traveler_chest');
    expect(guildChestRewardMigration).toContain("'guild_mission:' || p_mission_id::text || ':' || p_traveler_id::text");
    expect(guildChestRewardMigration).toContain('REVOKE ALL ON FUNCTION public.apply_guild_mission_reward(uuid, uuid) FROM PUBLIC, anon, authenticated');
    expect(guildChestRewardMigration).not.toMatch(/ALTER TABLE|CREATE POLICY|DROP POLICY/);
    expect(guildChestRewardRollback).toContain('CREATE OR REPLACE FUNCTION public.apply_guild_mission_reward');
  });
});

describe('Guild leader panel migration', () => {
  test('keeps history read-only and leader-only for authenticated clients', () => {
    expect(leaderPanelMigration).toContain('ALTER TABLE public.guild_activity_log ENABLE ROW LEVEL SECURITY');
    expect(leaderPanelMigration).toContain("gm.role = 'leader' AND gm.status = 'active'");
    expect(leaderPanelMigration).toContain('GRANT SELECT ON public.guild_activity_log TO authenticated');
    expect(leaderPanelMigration).not.toMatch(/GRANT (INSERT|UPDATE|DELETE) ON public\.guild_activity_log/);
    expect(leaderPanelRollback).toContain('DROP TABLE IF EXISTS public.guild_activity_log');
  });

  test('requires owned leader for new mutations and delegates reward idempotence', () => {
    for (const rpc of ['update_guild_mission_draft', 'delete_guild_mission_draft', 'close_guild_mission', 'remove_guild_member', 'review_guild_mission_with_guidance', 'guild_admin_stats']) {
      expect(leaderPanelMigration).toContain(`CREATE FUNCTION public.${rpc}`);
    }
    expect(leaderPanelMigration.match(/public\.owns_traveler\(p_leader_traveler_id\)/g)?.length).toBeGreaterThanOrEqual(4);
    expect(leaderPanelMigration).toContain('next_status := public.review_guild_mission(');
    expect(leaderPanelMigration).toContain("target.role = 'member' AND target.status = 'active'");
    expect(leaderPanelMigration).toContain("m.status = 'draft'");
  });
});

describe('Guild lessons migration', () => {
  test('keeps lessons private to the Guild and makes writes RPC-only', () => {
    expect(lessonMigration).toContain('ALTER TABLE public.guild_lessons ENABLE ROW LEVEL SECURITY');
    expect(lessonMigration).toContain("status IN ('published', 'completed') OR public.is_guild_leader(guild_id)");
    expect(lessonMigration).toContain('GRANT SELECT ON public.guild_lessons TO authenticated');
    expect(lessonMigration).not.toMatch(/GRANT (INSERT|UPDATE|DELETE) ON public\.guild_lessons/);
    expect(lessonMigration).toContain('public.owns_traveler(p_leader_traveler_id)');
    expect(lessonMigration).toContain("gm.role = 'leader' AND gm.status = 'active'");
    expect(lessonMigration).toContain('guild_id = guild_key');
    expect(lessonRollback).toContain('DROP TABLE IF EXISTS public.guild_lessons');
  });
  test('only adds the new lessons domain after 0004', () => {
    expect(lessonMigration).not.toContain('CREATE TABLE public.guild_activity_log');
    expect(lessonMigration).not.toContain('ALTER TABLE public.guild_mission_progress');
    expect(lessonMigration).not.toMatch(/GRANT (INSERT|UPDATE|DELETE).*guild_/);
  });
  test('limits public member profiles to active members of the same Guild', () => {
    expect(lessonMigration).toContain('CREATE FUNCTION public.guild_public_member_profile');
    expect(lessonMigration).toContain('public.owns_traveler(p_requester_traveler_id)');
    expect(lessonMigration).toContain('traveler_id = p_member_traveler_id AND status = \'active\'');
    expect(lessonMigration).toContain('RETURNS TABLE(level integer, completed_missions bigint)');
    expect(lessonRollback).toContain('DROP FUNCTION IF EXISTS public.guild_public_member_profile');
  });
});
