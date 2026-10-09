import { sql, type SQL } from 'drizzle-orm';
import {
  check,
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    displayName: text('display_name'),
    ...timestamps,
  },
  (table) => [
    check(
      'profiles_display_name_length_check',
      sql`${table.displayName} is null or char_length(${table.displayName}) between 2 and 50`,
    ),
    pgPolicy('profiles_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${authUid} = ${table.id}`,
    }),
    pgPolicy('profiles_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${authUid} = ${table.id}`,
    }),
    pgPolicy('profiles_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${authUid} = ${table.id}`,
      withCheck: sql`${authUid} = ${table.id}`,
    }),
  ],
).enableRLS();

export const travelers = pgTable(
  'travelers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    bodyType: text('body_type').notNull(),
    skinTone: text('skin_tone').notNull(),
    hairStyle: text('hair_style').notNull(),
    hairColor: text('hair_color'),
    avatarVariant: text('avatar_variant'),
    level: integer('level').notNull().default(1),
    xp: integer('xp').notNull().default(0),
    isActive: boolean('is_active').notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index('travelers_user_id_idx').on(table.userId),
    uniqueIndex('travelers_one_active_per_user_idx')
      .on(table.userId)
      .where(sql`${table.isActive} = true`),
    check(
      'travelers_name_length_check',
      sql`char_length(${table.name}) between 2 and 24`,
    ),
    check(
      'travelers_body_type_check',
      sql`${table.bodyType} in ('male', 'female')`,
    ),
    check('travelers_level_check', sql`${table.level} >= 1`),
    check('travelers_xp_check', sql`${table.xp} >= 0`),
    pgPolicy('travelers_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('travelers_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('travelers_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('travelers_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS();

const ownsTraveler = (travelerId: unknown): SQL =>
  sql`exists (
    select 1 from ${travelers}
    where ${travelers.id} = ${travelerId}
      and ${travelers.userId} = ${authUid}
  )`;

export const travelerStats = pgTable(
  'traveler_stats',
  {
    travelerId: uuid('traveler_id')
      .primaryKey()
      .references(() => travelers.id, { onDelete: 'cascade' }),
    baseLife: integer('base_life').notNull().default(1),
    baseStrength: integer('base_strength').notNull().default(1),
    baseDefense: integer('base_defense').notNull().default(1),
    baseWisdom: integer('base_wisdom').notNull().default(1),
    ...timestamps,
  },
  (table) => [
    check('traveler_stats_life_check', sql`${table.baseLife} >= 0`),
    check('traveler_stats_strength_check', sql`${table.baseStrength} >= 0`),
    check('traveler_stats_defense_check', sql`${table.baseDefense} >= 0`),
    check('traveler_stats_wisdom_check', sql`${table.baseWisdom} >= 0`),
    pgPolicy('traveler_stats_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: ownsTraveler(table.travelerId),
    }),
    pgPolicy('traveler_stats_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: ownsTraveler(table.travelerId),
    }),
    pgPolicy('traveler_stats_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: ownsTraveler(table.travelerId),
      withCheck: ownsTraveler(table.travelerId),
    }),
  ],
).enableRLS();

export const wallets = pgTable(
  'wallets',
  {
    travelerId: uuid('traveler_id')
      .primaryKey()
      .references(() => travelers.id, { onDelete: 'cascade' }),
    coins: integer('coins').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    check('wallets_coins_check', sql`${table.coins} >= 0`),
    pgPolicy('wallets_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: ownsTraveler(table.travelerId),
    }),
    pgPolicy('wallets_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: ownsTraveler(table.travelerId),
    }),
    pgPolicy('wallets_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: ownsTraveler(table.travelerId),
      withCheck: ownsTraveler(table.travelerId),
    }),
  ],
).enableRLS();

export const inventory = pgTable(
  'inventory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    travelerId: uuid('traveler_id')
      .notNull()
      .references(() => travelers.id, { onDelete: 'cascade' }),
    itemId: text('item_id').notNull(),
    quantity: integer('quantity').notNull().default(1),
    acquiredAt: timestamp('acquired_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  },
  (table) => [
    index('inventory_traveler_id_idx').on(table.travelerId),
    unique('inventory_traveler_item_unique').on(table.travelerId, table.itemId),
    check(
      'inventory_item_id_length_check',
      sql`char_length(${table.itemId}) between 1 and 64`,
    ),
    check('inventory_quantity_check', sql`${table.quantity} > 0`),
    pgPolicy('inventory_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: ownsTraveler(table.travelerId),
    }),
    pgPolicy('inventory_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: ownsTraveler(table.travelerId),
    }),
    pgPolicy('inventory_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: ownsTraveler(table.travelerId),
      withCheck: ownsTraveler(table.travelerId),
    }),
    pgPolicy('inventory_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: ownsTraveler(table.travelerId),
    }),
  ],
).enableRLS();

export const equippedItems = pgTable(
  'equipped_items',
  {
    travelerId: uuid('traveler_id')
      .notNull()
      .references(() => travelers.id, { onDelete: 'cascade' }),
    slot: text('slot').notNull(),
    itemId: text('item_id').notNull(),
    equippedAt: timestamp('equipped_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.travelerId, table.slot] }),
    foreignKey({
      columns: [table.travelerId, table.itemId],
      foreignColumns: [inventory.travelerId, inventory.itemId],
      name: 'equipped_items_owned_item_fk',
    }).onDelete('cascade'),
    check(
      'equipped_items_slot_check',
      sql`${table.slot} in ('helmet', 'armor', 'weapon', 'shield', 'boots', 'amulet')`,
    ),
    pgPolicy('equipped_items_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: ownsTraveler(table.travelerId),
    }),
    pgPolicy('equipped_items_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: ownsTraveler(table.travelerId),
    }),
    pgPolicy('equipped_items_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: ownsTraveler(table.travelerId),
      withCheck: ownsTraveler(table.travelerId),
    }),
    pgPolicy('equipped_items_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: ownsTraveler(table.travelerId),
    }),
  ],
).enableRLS();

export const guilds = pgTable(
  'guilds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'restrict' }),
    leaderTravelerId: uuid('leader_traveler_id')
      .notNull()
      .references(() => travelers.id, { onDelete: 'restrict' }),
    status: text('status').notNull().default('active'),
    ...timestamps,
  },
  (table) => [
    index('guilds_leader_traveler_id_idx').on(table.leaderTravelerId),
    check('guilds_name_length_check', sql`char_length(btrim(${table.name})) between 2 and 60`),
    check('guilds_description_length_check', sql`${table.description} is null or char_length(${table.description}) <= 500`),
    check('guilds_status_check', sql`${table.status} in ('active', 'archived')`),
    pgPolicy('guilds_select_member', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.is_active_guild_member(${table.id})`,
    }),
  ],
).enableRLS();

export const guildMembers = pgTable(
  'guild_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: uuid('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
    travelerId: uuid('traveler_id').notNull().references(() => travelers.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
    status: text('status').notNull().default('active'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('guild_members_guild_traveler_unique').on(table.guildId, table.travelerId),
    uniqueIndex('guild_members_one_active_guild_per_traveler_idx').on(table.travelerId).where(sql`${table.status} = 'active'`),
    index('guild_members_guild_status_idx').on(table.guildId, table.status),
    check('guild_members_role_check', sql`${table.role} in ('leader', 'co_leader', 'moderator', 'member')`),
    check('guild_members_status_check', sql`${table.status} in ('active', 'pending', 'left', 'removed')`),
    pgPolicy('guild_members_select_same_guild', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.is_active_guild_member(${table.guildId})`,
    }),
  ],
).enableRLS();

export const guildInvites = pgTable(
  'guild_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: uuid('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
    invitedTravelerId: uuid('invited_traveler_id').references(() => travelers.id, { onDelete: 'cascade' }),
    invitedByTravelerId: uuid('invited_by_traveler_id').notNull().references(() => travelers.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('guild_invites_guild_status_idx').on(table.guildId, table.status),
    check('guild_invites_status_check', sql`${table.status} in ('pending', 'accepted', 'declined', 'expired', 'cancelled')`),
    pgPolicy('guild_invites_select_participant', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.is_active_guild_member(${table.guildId}) or public.owns_traveler(${table.invitedTravelerId})`,
    }),
  ],
).enableRLS();

export const guildJoinRequests = pgTable(
  'guild_join_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: uuid('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
    travelerId: uuid('traveler_id').notNull().references(() => travelers.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('pending'),
    reviewedByTravelerId: uuid('reviewed_by_traveler_id').references(() => travelers.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('guild_join_requests_one_pending_idx').on(table.guildId, table.travelerId).where(sql`${table.status} = 'pending'`),
    index('guild_join_requests_guild_status_idx').on(table.guildId, table.status),
    check('guild_join_requests_status_check', sql`${table.status} in ('pending', 'accepted', 'rejected', 'cancelled')`),
    pgPolicy('guild_join_requests_select_participant', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.owns_traveler(${table.travelerId}) or public.is_guild_leader(${table.guildId})`,
    }),
  ],
).enableRLS();

export const guildMissions = pgTable(
  'guild_missions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: uuid('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
    createdByTravelerId: uuid('created_by_traveler_id').notNull().references(() => travelers.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    description: text('description'),
    missionType: text('mission_type').notNull(),
    bibleReference: text('bible_reference'),
    bibleUrl: text('bible_url'),
    completionMode: text('completion_mode').notNull(),
    requiresLeaderApproval: boolean('requires_leader_approval').notNull().default(false),
    rewardTier: text('reward_tier').notNull(),
    status: text('status').notNull().default('draft'),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    dueAt: timestamp('due_at', { withTimezone: true }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('guild_missions_guild_status_idx').on(table.guildId, table.status),
    check('guild_missions_title_length_check', sql`char_length(btrim(${table.title})) between 2 and 100`),
    check('guild_missions_description_length_check', sql`${table.description} is null or char_length(${table.description}) <= 1000`),
    check('guild_missions_reference_length_check', sql`${table.bibleReference} is null or char_length(${table.bibleReference}) <= 100`),
    check('guild_missions_bible_url_check', sql`${table.bibleUrl} is null or ${table.bibleUrl} ~ '^https://www\\.bible\\.com/[A-Za-z0-9/._?=&%-]{1,240}$'`),
    check('guild_missions_type_check', sql`${table.missionType} in ('bible_reading', 'lesson', 'quiz', 'practical_activity', 'individual_challenge', 'collective_challenge', 'special_mission', 'journey_gate')`),
    check('guild_missions_completion_mode_check', sql`${table.completionMode} in ('self_complete', 'leader_approval')`),
    check('guild_missions_reward_tier_check', sql`${table.rewardTier} in ('normal', 'great', 'epic', 'extraordinary')`),
    check('guild_missions_status_check', sql`${table.status} in ('draft', 'published', 'closed', 'cancelled')`),
    check('guild_missions_dates_check', sql`${table.dueAt} is null or ${table.startsAt} is null or ${table.dueAt} > ${table.startsAt}`),
    check('guild_missions_metadata_size_check', sql`${table.metadata} is null or octet_length(${table.metadata}::text) <= 2048`),
    pgPolicy('guild_missions_select_member', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.is_active_guild_member(${table.guildId}) and (${table.status} = 'published' or public.is_guild_leader(${table.guildId}))`,
    }),
  ],
).enableRLS();

export const guildLessons = pgTable(
  'guild_lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: uuid('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
    createdByTravelerId: uuid('created_by_traveler_id').notNull().references(() => travelers.id, { onDelete: 'restrict' }),
    relatedMissionId: uuid('related_mission_id').references(() => guildMissions.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    theme: text('theme').notNull(),
    bibleReference: text('bible_reference').notNull(),
    bibleUrl: text('bible_url'),
    introduction: text('introduction').notNull().default(''),
    content: text('content').notNull().default(''),
    mainPoints: jsonb('main_points').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    discussionQuestions: jsonb('discussion_questions').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    activityText: text('activity_text'),
    status: text('status').notNull().default('draft'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('guild_lessons_guild_schedule_idx').on(table.guildId, table.scheduledAt),
    check('guild_lessons_status_check', sql`${table.status} in ('draft', 'published', 'completed', 'cancelled')`),
    check('guild_lessons_title_check', sql`char_length(btrim(${table.title})) between 2 and 100`),
    check('guild_lessons_theme_check', sql`char_length(btrim(${table.theme})) between 2 and 100`),
    check('guild_lessons_reference_check', sql`char_length(btrim(${table.bibleReference})) between 2 and 100`),
    check('guild_lessons_url_check', sql`${table.bibleUrl} is null or ${table.bibleUrl} ~ '^https://www\\.bible\\.com/[A-Za-z0-9/._?=&%-]{1,240}$'`),
    check('guild_lessons_introduction_check', sql`char_length(${table.introduction}) <= 2000`),
    check('guild_lessons_content_check', sql`char_length(${table.content}) <= 10000`),
    check('guild_lessons_published_content_check', sql`${table.status} not in ('published', 'completed') or (char_length(btrim(${table.content})) > 0 and ${table.scheduledAt} is not null)`),
    check('guild_lessons_activity_check', sql`${table.activityText} is null or char_length(${table.activityText}) <= 2000`),
    check('guild_lessons_points_check', sql`jsonb_typeof(${table.mainPoints}) = 'array' and jsonb_array_length(${table.mainPoints}) <= 12`),
    check('guild_lessons_questions_check', sql`jsonb_typeof(${table.discussionQuestions}) = 'array' and jsonb_array_length(${table.discussionQuestions}) <= 12`),
    pgPolicy('guild_lessons_select_member', {
      for: 'select', to: authenticatedRole,
      using: sql`public.is_active_guild_member(${table.guildId}) and (${table.status} in ('published', 'completed') or public.is_guild_leader(${table.guildId}))`,
    }),
  ],
).enableRLS();

export const guildMissionProgress = pgTable(
  'guild_mission_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    missionId: uuid('mission_id').notNull().references(() => guildMissions.id, { onDelete: 'cascade' }),
    travelerId: uuid('traveler_id').notNull().references(() => travelers.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('available'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    approvedByTravelerId: uuid('approved_by_traveler_id').references(() => travelers.id, { onDelete: 'set null' }),
    completionNote: text('completion_note'),
    reviewNote: text('review_note'),
    rewardClaimedAt: timestamp('reward_claimed_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique('guild_mission_progress_mission_traveler_unique').on(table.missionId, table.travelerId),
    index('guild_mission_progress_traveler_status_idx').on(table.travelerId, table.status),
    check('guild_mission_progress_status_check', sql`${table.status} in ('available', 'started', 'pending_approval', 'completed', 'rejected')`),
    check('guild_mission_progress_note_length_check', sql`${table.completionNote} is null or char_length(${table.completionNote}) <= 500`),
    check('guild_mission_progress_review_note_length', sql`${table.reviewNote} is null or char_length(${table.reviewNote}) <= 500`),
    pgPolicy('guild_mission_progress_select_participant', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.owns_traveler(${table.travelerId}) or public.can_lead_mission(${table.missionId})`,
    }),
  ],
).enableRLS();

export const guildRewardClaims = pgTable(
  'guild_reward_claims',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    missionId: uuid('mission_id').notNull().references(() => guildMissions.id, { onDelete: 'cascade' }),
    travelerId: uuid('traveler_id').notNull().references(() => travelers.id, { onDelete: 'cascade' }),
    rewardTier: text('reward_tier').notNull(),
    xpAwarded: integer('xp_awarded').notNull(),
    coinsAwarded: integer('coins_awarded').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('guild_reward_claims_mission_traveler_unique').on(table.missionId, table.travelerId),
    check('guild_reward_claims_tier_check', sql`${table.rewardTier} in ('normal', 'great', 'epic', 'extraordinary')`),
    check('guild_reward_claims_values_check', sql`${table.xpAwarded} >= 0 and ${table.coinsAwarded} >= 0`),
    pgPolicy('guild_reward_claims_select_participant', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.owns_traveler(${table.travelerId}) or public.can_lead_mission(${table.missionId})`,
    }),
  ],
).enableRLS();

export const guildActivityLog = pgTable(
  'guild_activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: uuid('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
    actorTravelerId: uuid('actor_traveler_id').references(() => travelers.id, { onDelete: 'set null' }),
    eventType: text('event_type').notNull(),
    entityType: text('entity_type'),
    entityId: uuid('entity_id'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('guild_activity_log_recent_idx').on(table.guildId, table.createdAt.desc()),
    check('guild_activity_log_metadata_size', sql`octet_length(${table.metadata}::text) <= 512`),
    pgPolicy('guild_activity_log_leader_read', {
      for: 'select', to: authenticatedRole,
      using: sql`public.is_guild_leader(${table.guildId})`,
    }),
  ],
).enableRLS();

export const travelerChests = pgTable(
  'traveler_chests',
  {
    travelerId: uuid('traveler_id')
      .notNull()
      .references(() => travelers.id, { onDelete: 'cascade' }),
    chestType: text('chest_type').notNull(),
    quantity: integer('quantity').notNull().default(0),
    sources: jsonb('sources').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.travelerId, table.chestType] }),
    check('traveler_chests_type_check', sql`${table.chestType} in ('common', 'uncommon', 'rare', 'epic', 'extraordinary')`),
    check('traveler_chests_quantity_check', sql`${table.quantity} > 0 and ${table.quantity} <= 9999`),
    check('traveler_chests_sources_check', sql`jsonb_typeof(${table.sources}) = 'array' and jsonb_array_length(${table.sources}) = ${table.quantity}`),
    pgPolicy('traveler_chests_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: ownsTraveler(table.travelerId),
    }),
  ],
).enableRLS();

export const chestOperations = pgTable(
  'chest_operations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    travelerId: uuid('traveler_id')
      .notNull()
      .references(() => travelers.id, { onDelete: 'cascade' }),
    operationKey: text('operation_key').notNull(),
    operationType: text('operation_type').notNull(),
    chestType: text('chest_type').notNull(),
    source: text('source').notNull(),
    pricePaid: integer('price_paid'),
    rewards: jsonb('rewards').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('chest_operations_traveler_key_unique').on(table.travelerId, table.operationKey),
    index('chest_operations_traveler_created_idx').on(table.travelerId, table.createdAt),
    check('chest_operations_key_length_check', sql`char_length(${table.operationKey}) between 1 and 160`),
    check('chest_operations_type_check', sql`${table.operationType} in ('grant', 'purchase', 'open')`),
    check('chest_operations_chest_type_check', sql`${table.chestType} in ('common', 'uncommon', 'rare', 'epic', 'extraordinary')`),
    check('chest_operations_source_length_check', sql`char_length(${table.source}) between 1 and 120`),
    check('chest_operations_price_check', sql`${table.pricePaid} is null or ${table.pricePaid} >= 0`),
    pgPolicy('chest_operations_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: ownsTraveler(table.travelerId),
    }),
  ],
).enableRLS();
