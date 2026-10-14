import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  integer,
  boolean,
  pgPolicy,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase';
import { guilds, travelers } from './schema';

const canRead = (guild: unknown) =>
  sql`guild_chat_private.can_access(${guild})`;
const canModerate = (guild: unknown) =>
  sql`guild_chat_private.can_access(${guild},true)`;
export const guildChatMessages = pgTable(
  'guild_chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sequence: bigint('sequence', { mode: 'number' })
      .generatedAlwaysAsIdentity()
      .unique(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'restrict' }),
    authorTravelerId: uuid('author_traveler_id').references(
      () => travelers.id,
      { onDelete: 'set null' },
    ),
    clientId: uuid('client_id').notNull(),
    authorName: text('author_name').notNull(),
    authorBodyType: text('author_body_type').notNull(),
    authorSkinTone: text('author_skin_tone').notNull(),
    authorHairStyle: text('author_hair_style').notNull(),
    authorOutfit: text('author_outfit').notNull(),
    body: text('body'),
    isAnnouncement: boolean('is_announcement').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`clock_timestamp()`),
    removedAt: timestamp('removed_at', { withTimezone: true }),
  },
  (t) => [
    unique('guild_chat_messages_author_traveler_id_client_id_key').on(
      t.authorTravelerId,
      t.clientId,
    ),
    index('guild_chat_messages_page_idx').on(t.guildId, t.sequence.desc()),
    index('guild_chat_messages_author_idx').on(t.authorTravelerId),
    check(
      'guild_chat_messages_sequence_check',
      sql`${t.sequence} <= 9007199254740991`,
    ),
    check(
      'guild_chat_messages_author_name_check',
      sql`char_length(${t.authorName}) between 2 and 24`,
    ),
    check(
      'guild_chat_messages_author_body_type_check',
      sql`${t.authorBodyType} in ('male','female')`,
    ),
    check(
      'guild_chat_messages_author_skin_tone_check',
      sql`${t.authorSkinTone} in ('claro','medio','escuro')`,
    ),
    check(
      'guild_chat_messages_author_hair_style_check',
      sql`${t.authorHairStyle} in ('curto','longo','cacheado')`,
    ),
    check(
      'guild_chat_messages_author_outfit_check',
      sql`${t.authorOutfit} in ('musgo','ocre','azul')`,
    ),
    check(
      'guild_chat_messages_body_check',
      sql`(${t.removedAt} is null and ${t.body} is not null and char_length(btrim(${t.body})) between 1 and 1000 and octet_length(${t.body}) <= 4000) or (${t.removedAt} is not null and ${t.body} is null)`,
    ),
    pgPolicy('guild_chat_messages_read', {
      for: 'select',
      to: authenticatedRole,
      using: canRead(t.guildId),
    }),
  ],
).enableRLS();
export const guildChatReads = pgTable(
  'guild_chat_reads',
  {
    guildId: uuid('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'restrict' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    lastReadSequence: bigint('last_read_sequence', { mode: 'number' })
      .notNull()
      .default(0),
  },
  (t) => [
    primaryKey({ columns: [t.guildId, t.userId] }),
    check(
      'guild_chat_reads_last_read_sequence_check',
      sql`${t.lastReadSequence} >= 0`,
    ),
    pgPolicy('guild_chat_reads_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${t.userId}=(select ${authUid}) and ${canRead(t.guildId)}`,
    }),
  ],
).enableRLS();
export const guildChatReports = pgTable(
  'guild_chat_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'restrict' }),
    messageId: uuid('message_id')
      .notNull()
      .references(() => guildChatMessages.id, { onDelete: 'restrict' }),
    reporterTravelerId: uuid('reporter_traveler_id').references(
      () => travelers.id,
      { onDelete: 'set null' },
    ),
    reason: text('reason').notNull(),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`clock_timestamp()`),
  },
  (t) => [
    unique('guild_chat_reports_message_id_reporter_traveler_id_key').on(
      t.messageId,
      t.reporterTravelerId,
    ),
    index('guild_chat_reports_queue_idx').on(
      t.guildId,
      t.status,
      t.createdAt.desc(),
    ),
    index('guild_chat_reports_reporter_idx').on(t.reporterTravelerId),
    check(
      'guild_chat_reports_reason_check',
      sql`${t.reason} in ('bullying','personal_data','sexual_content','violence','other')`,
    ),
    check(
      'guild_chat_reports_status_check',
      sql`${t.status} in ('pending','removed','dismissed')`,
    ),
    pgPolicy('guild_chat_reports_moderators', {
      for: 'select',
      to: authenticatedRole,
      using: canModerate(t.guildId),
    }),
  ],
).enableRLS();
export const guildChatModerationLog = pgTable(
  'guild_chat_moderation_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'restrict' }),
    messageId: uuid('message_id')
      .notNull()
      .references(() => guildChatMessages.id, { onDelete: 'restrict' }),
    actorTravelerId: uuid('actor_traveler_id').references(() => travelers.id, {
      onDelete: 'set null',
    }),
    action: text('action').notNull(),
    reason: text('reason').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`clock_timestamp()`),
  },
  (t) => [
    index('guild_chat_moderation_log_guild_idx').on(
      t.guildId,
      t.createdAt.desc(),
    ),
    index('guild_chat_moderation_log_message_idx').on(t.messageId),
    index('guild_chat_moderation_log_actor_idx').on(t.actorTravelerId),
    check(
      'guild_chat_moderation_log_action_check',
      sql`${t.action} in ('remove','dismiss_reports')`,
    ),
    check(
      'guild_chat_moderation_log_reason_check',
      sql`char_length(btrim(${t.reason})) between 3 and 200`,
    ),
    pgPolicy('guild_chat_log_moderators', {
      for: 'select',
      to: authenticatedRole,
      using: canModerate(t.guildId),
    }),
  ],
).enableRLS();
export const guildChatRateLimits = pgSchema('guild_chat_private')
  .table(
    'rate_limits',
    {
      userId: uuid('user_id')
        .notNull()
        .references(() => authUsers.id, { onDelete: 'cascade' }),
      kind: text('kind').notNull(),
      lastAt: timestamp('last_at', { withTimezone: true }),
      windowAt: timestamp('window_at', { withTimezone: true })
        .notNull()
        .default(sql`clock_timestamp()`),
      hits: integer('hits').notNull().default(0),
    },
    (t) => [
      primaryKey({ columns: [t.userId, t.kind] }),
      check('rate_limits_kind_check', sql`${t.kind} in ('send','report')`),
    ],
  )
  .enableRLS();
