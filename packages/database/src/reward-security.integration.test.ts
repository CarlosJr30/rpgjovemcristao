import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { expect, test } from 'vitest';

// Explicit opt-in only. A remote URL is rejected even if someone misconfigures it.
const connectionString = process.env.TASK_0076A_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  'PostgreSQL: baseline exploit, grants, ownership, replay ledger, debit and rollback',
  async () => {
    const url = new URL(connectionString!);
    if (
      !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      !/^\/task0076a_[a-z0-9_]+$/.test(url.pathname)
    )
      throw Error(
        'Only an explicitly named disposable loopback task0076a_* database is allowed',
      );
    const db = new Client({ connectionString });
    await db.connect();
    const userA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      userB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const travelerA = '11111111-1111-4111-8111-111111111111',
      travelerB = '22222222-2222-4222-8222-222222222222';
    const actor = async (
      role: 'authenticated' | 'service_role' | 'anon',
      user: string | null,
    ) => {
      await db.query('RESET ROLE');
      await db.query(`SET LOCAL ROLE ${role}`);
      await db.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [
        user ?? '',
      ]);
    };
    const denied = async (sql: string, args: unknown[] = []) => {
      await db.query('SAVEPOINT negative_test');
      let code: string | undefined;
      try {
        await db.query(sql, args);
      } catch (error) {
        code = (error as { code: string }).code;
      }
      await db.query('ROLLBACK TO SAVEPOINT negative_test');
      await db.query('RELEASE SAVEPOINT negative_test');
      expect(code).toBe('42501');
    };
    const gateway = async (
      operation: string,
      payload: object,
      user = userA,
      traveler = travelerA,
    ) =>
      (
        await db.query(
          'SELECT public.economy_authority($1,$2,$3,$4) AS result',
          [user, traveler, operation, payload],
        )
      ).rows[0].result;
    try {
      await db.query('BEGIN');
      // Refuse existing application tables. The harness never overlays real saves.
      expect(
        (await db.query("SELECT to_regclass('public.travelers') AS existing"))
          .rows[0].existing,
      ).toBeNull();
      await db.query(`DO $$ BEGIN
      IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
      IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
      IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
    END $$;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,is_anonymous boolean DEFAULT false);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated,anon,service_role;
    GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,anon,service_role;`);
      for (const name of [
        '0000_initial_supabase_gameplay',
        '0001_guild_supabase_v1',
        '0002_traveler_chests',
        '0003_guild_mission_chest_rewards',
        '0004_guild_leader_panel',
        '0005_guild_lessons_and_schedule',
        '0006_traveler_journey_progress',
      ]) {
        await db.query(
          await readFile(
            resolve('packages/database/migrations', name + '.sql'),
            'utf8',
          ),
        );
      }
      await db.query('INSERT INTO auth.users(id) VALUES($1),($2)', [
        userA,
        userB,
      ]);
      for (const [user, id] of [
        [userA, travelerA],
        [userB, travelerB],
      ]) {
        await actor('authenticated', user);
        await db.query(
          "SELECT public.create_traveler($1,'Sintetico','male','medio','curto',null,'musgo')",
          [id],
        );
      }
      await actor('authenticated', userA);
      // Demonstration against the real baseline SQL, not a simulated RLS engine.
      expect(
        (
          await db.query('SELECT public.add_coins($1,999999) AS coins', [
            travelerA,
          ])
        ).rows[0].coins,
      ).toBe(999999);
      await db.query('UPDATE public.travelers SET xp=999999 WHERE id=$1', [
        travelerA,
      ]);
      await db.query(
        "INSERT INTO public.inventory(traveler_id,item_id,quantity) VALUES($1,'invented-card',999)",
        [travelerA],
      );
      expect(
        (
          await db.query(
            'UPDATE public.wallets SET coins=999999 WHERE traveler_id=$1 RETURNING *',
            [travelerB],
          )
        ).rowCount,
      ).toBe(0);
      await db.query('RESET ROLE');
      // Controlled fixture reset before testing the proposed patch.
      await db.query(
        'UPDATE public.wallets SET coins=100 WHERE traveler_id=$1',
        [travelerA],
      );
      await db.query('UPDATE public.travelers SET xp=0 WHERE id=$1', [
        travelerA,
      ]);
      await db.query(
        "DELETE FROM public.inventory WHERE item_id='invented-card'",
      );
      await db.query(
        await readFile(
          resolve(
            'packages/database/migrations/0009_reward_security_task0076a.sql',
          ),
          'utf8',
        ),
      );
      await db.query(await readFile(resolve('packages/database/migrations/0010_reward_security_cutover_task0076a.sql'),'utf8'));
      await actor('authenticated', userA);
      await denied(
        'UPDATE public.wallets SET coins=999999 WHERE traveler_id=$1',
        [travelerA],
      );
      await denied('UPDATE public.travelers SET xp=999999 WHERE id=$1', [
        travelerA,
      ]);
      await denied(
        "INSERT INTO public.inventory(traveler_id,item_id) VALUES($1,'invented-card')",
        [travelerA],
      );
      await denied('SELECT public.add_coins($1,999999)', [travelerA]);
      await denied(
        "SELECT public.claim_chest_reward($1,'phase:garden-choice')",
        [travelerA],
      );
      await denied("SELECT public.economy_authority($1,$2,'purchase',$3)", [
        userA,
        travelerA,
        { itemId: 'traveler-sword-common' },
      ]);
      await actor('anon', null);
      await denied("SELECT public.economy_authority($1,$2,'context','{}')", [
        userA,
        travelerA,
      ]);
      await actor('service_role', null);
      await denied("SELECT public.economy_authority($1,$2,'context','{}')", [
        userA,
        travelerB,
      ]);
      const issued = await gateway('start', {
        player: { id: travelerA },
        opponent: { id: 'training-apprentice' },
      });
      const reward = await gateway('settle', {
        battleId: issued.id,
        won: true,
      });
      expect(reward).toEqual({
        xp: 8,
        coins: 3,
        rewarded: true,
        reason: 'victory',
      });
      expect(
        await gateway('settle', { battleId: issued.id, won: true }),
      ).toEqual(reward);
      const purchased = await gateway('purchase', {
        itemId: 'traveler-sword-common',
      });
      expect(purchased).toMatchObject({
        status: 'purchased',
        pricePaid: 35,
        coins: 68,
      });
      expect(
        await gateway('purchase', { itemId: 'traveler-sword-common' }),
      ).toEqual({ status: 'owned' });
      expect((await gateway('context', {})).coins).toBe(68);
      // Force an inventory failure after debit to prove PostgreSQL rolls back both.
      await db.query('RESET ROLE');
      await db.query(
        "ALTER TABLE public.inventory ADD CONSTRAINT fixture_reject_armor CHECK(item_id<>'traveler-armor-uncommon')",
      );
      await actor('service_role', null);
      await db.query('SAVEPOINT atomic_test');
      await expect(
        gateway('purchase', { itemId: 'traveler-armor-uncommon' }),
      ).rejects.toMatchObject({ code: '23514' });
      await db.query('ROLLBACK TO SAVEPOINT atomic_test');
      expect((await gateway('context', {})).coins).toBe(68);
      await db.query('RESET ROLE');
      // Existing authenticated chest RPCs keep transactional debits and dedupe.
      await actor('authenticated', userA);
      const op = '44444444-4444-4444-8444-444444444444';
      const first = (
        await db.query(
          "SELECT public.purchase_chest($1,'common',$2) AS result",
          [travelerA, op],
        )
      ).rows[0].result;
      const retry = (
        await db.query(
          "SELECT public.purchase_chest($1,'common',$2) AS result",
          [travelerA, op],
        )
      ).rows[0].result;
      expect(first).toMatchObject({
        coins: 28,
        pricePaid: 40,
        duplicate: false,
      });
      expect(retry).toMatchObject({ coins: 28, duplicate: true });
    } finally {
      await db.query('ROLLBACK');
      await db.end();
    }
  },
  30000,
);
