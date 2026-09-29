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
