import { Client } from 'pg';
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const url = process.env.TASK_0076A_REVIEW_DATABASE_URL;
const container = process.env.TASK_0076A_REVIEW_CONTAINER;
const output = 'build/task-0076a-reward-security/review-four-points';
const migrationDir = 'packages/database/migrations';
const userA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const userB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const signatures = {
  create_traveler: 'uuid,text,text,text,text,text,text',
  open_chest: 'uuid,text,uuid',
  purchase_chest: 'uuid,text,uuid',
};
let db: Client;
let owned = false;
let legacy: string;
let oldFunctions: Record<string, unknown>[];
const evidence: Record<string, unknown> = {};
async function functions(schema: string) {
  return (
    await db.query(
      `SELECT p.proname,p.prosrc,p.prosecdef,p.proconfig,
    pg_get_function_identity_arguments(p.oid) args,pg_get_function_result(p.oid) result
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname=$1 AND p.proname=ANY($2::text[]) ORDER BY p.proname`,
      [schema, Object.keys(signatures)],
    )
  ).rows;
}
async function asUser<T>(
  user: string | null,
  work: (c: Client) => Promise<T>,
  role = 'authenticated',
) {
  const c = new Client({ connectionString: url });
  await c.connect();
  try {
    await c.query(role === 'anon' ? 'SET ROLE anon' : 'SET ROLE authenticated');
    await c.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
      user ?? '',
    ]);
    return await work(c);
  } finally {
    await c.end();
  }
}
const create = (c: Client, id: string) =>
  c.query(
    "SELECT public.create_traveler($1,'Synthetic','male','medio','curto',null,'musgo') id",
    [id],
  );
async function cutoverState() {
  return (
    await db.query(`SELECT jsonb_build_object(
    'protocol',public.economy_protocol_version(),
    'journeys',(SELECT count(*) FROM economy_private.journeys),
    'rewards',(SELECT count(*) FROM economy_private.journey_rewards),
    'wallet_acl',(SELECT relacl::text FROM pg_class WHERE oid='public.wallets'::regclass),
    'traveler_acl',(SELECT relacl::text FROM pg_class WHERE oid='public.travelers'::regclass),
    'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY policyname) FROM pg_policies p WHERE schemaname='public'),
    'triggers',(SELECT jsonb_agg(t.tgname ORDER BY t.tgname) FROM pg_trigger t WHERE tgrelid='public.travelers'::regclass AND NOT tgisinternal),
    'claim_body',(SELECT prosrc FROM pg_proc WHERE oid='public.claim_chest_reward(uuid,text)'::regprocedure),
    'travelers',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.travelers t),
    'wallets',(SELECT jsonb_agg(to_jsonb(w) ORDER BY traveler_id) FROM public.wallets w)
  ) value`)
  ).rows[0].value;
}
function psql(sql: string) {
  // The selected deployment mechanism: real psql, not pg.query's implicit batch.
  const args = [
    'exec',
    '-i',
    container!,
    'psql',
    '-X',
    '--single-transaction',
    '--set=ON_ERROR_STOP=1',
    '--username=postgres',
    '--dbname=task0076a_review',
    '--file=-',
  ];
  const result = spawnSync('docker', args, { input: sql, encoding: 'utf8' });
  if (result.error) throw result.error;
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

describe.skipIf(!url || !container)(
  'TASK-0076A four-point PostgreSQL review',
  () => {
    beforeAll(async () => {
      const parsed = new URL(url!);
      if (
        parsed.hostname !== '127.0.0.1' ||
        parsed.port !== '55476' ||
        parsed.pathname !== '/task0076a_review' ||
        container !== 'rpg-task0076a-review'
      )
        throw Error('Dedicated disposable loopback database required');
      const inspected = spawnSync('docker', ['inspect', container], {
        encoding: 'utf8',
      });
      if (inspected.status !== 0) throw Error('Disposable container missing');
      const [info] = JSON.parse(inspected.stdout);
      if (
        info.Config.Labels.task !== 'TASK-0076A-REVIEW' ||
        !info.HostConfig.AutoRemove
      )
        throw Error('Disposable container ownership mismatch');
      db = new Client({ connectionString: url });
      await db.connect();
      expect(
        (
          await db.query(
            "SELECT count(*) n FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema')",
          )
        ).rows[0].n,
      ).toBe('0');
      owned = true;
      evidence.server = (await db.query('SELECT version() v')).rows[0].v;
      await db.query(`CREATE ROLE anon NOLOGIN;CREATE ROLE authenticated NOLOGIN;CREATE ROLE service_role NOLOGIN;
      CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY,is_anonymous boolean DEFAULT false);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      GRANT USAGE ON SCHEMA auth TO authenticated,anon,service_role;
      GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,anon,service_role;
      CREATE PUBLICATION supabase_realtime;`);
      const journal = JSON.parse(
        await readFile(`${migrationDir}/meta/_journal.json`, 'utf8'),
      );
      for (const entry of journal.entries.slice(0, 9))
        await db.query(
          await readFile(`${migrationDir}/${entry.tag}.sql`, 'utf8'),
        );
      oldFunctions = await functions('public');
      await db.query('INSERT INTO auth.users(id) VALUES($1),($2)', [
        userA,
        userB,
      ]);
      legacy = randomUUID();
      await asUser(userA, (c) => create(c, legacy));
      await db.query(
        'UPDATE public.wallets SET coins=777 WHERE traveler_id=$1',
        [legacy],
      );
      await db.query(
        await readFile(
          `${migrationDir}/0009_reward_security_task0076a.sql`,
          'utf8',
        ),
      );
    });
    afterAll(async () => {
      if (db) {
        await writeFile(
          `${output}/postgres-evidence.json`,
          JSON.stringify(evidence, null, 2),
        );
        if (owned)
          await db.query(`DROP SCHEMA IF EXISTS guild_chat_private CASCADE;
        DROP SCHEMA IF EXISTS economy_private CASCADE;DROP SCHEMA IF EXISTS auth CASCADE;
        DROP SCHEMA public CASCADE;CREATE SCHEMA public;DROP PUBLICATION IF EXISTS supabase_realtime;`);
        await db.end();
      }
    });
    test('selected psql mechanism rolls back middle/end faults and commits the exact 0010', async () => {
      const sql = await readFile(
        `${migrationDir}/0010_reward_security_cutover_task0076a.sql`,
        'utf8',
      );
      const before = await cutoverState();
      const marker = 'CREATE TRIGGER travelers_initialize_journey';
      expect(sql.includes(marker)).toBe(true);
      const middle = psql(sql.replace(marker, `SELECT 1/0;\n${marker}`));
      expect(middle.status).toBe(3);
      expect(middle.stderr).toContain('division by zero');
      expect(await cutoverState()).toEqual(before);
      const end = psql(sql + '\nSELECT 1/0;\n');
      expect(end.status).toBe(3);
      expect(end.stderr).toContain('division by zero');
      expect(await cutoverState()).toEqual(before);
      const success = psql(sql);
      expect(success.status, success.stderr).toBe(0);
      const after = await cutoverState();
      expect(after.protocol).toBe(2);
      expect(after.wallets).toEqual(before.wallets);
      expect(after.travelers).toEqual(before.travelers);
      expect(after.journeys).toBe(1);
      expect(after.triggers).toContain('travelers_initialize_journey');
      evidence.atomicity = {
        mechanism: 'psql -X --single-transaction --set=ON_ERROR_STOP=1 --file',
        middle_fault_exit: middle.status,
        end_fault_exit: end.status,
        success_exit: success.status,
        full_catalog_and_data_rollback: true,
        exact_0010_committed: true,
      };
    });
    test('legacy bodies, signatures, qualified references, ACL and RLS survive wrappers', async () => {
      const moved = await functions('economy_private');
      const wrappers = await functions('public');
      for (const old of oldFunctions) {
        const name = old.proname as keyof typeof signatures;
        const implementation = moved.find((p) => p.proname === name)!;
        const wrapper = wrappers.find((p) => p.proname === name)!;
        expect(implementation.prosrc).toBe(old.prosrc);
        expect(implementation.args).toBe(old.args);
        expect(wrapper.args).toBe(old.args);
        expect(wrapper.result).toBe(old.result);
        expect(implementation.prosecdef).toBe(true);
        expect(wrapper.prosecdef).toBe(false);
        expect(implementation.proconfig).toContain('search_path=""');
        expect(wrapper.proconfig).toContain('search_path=""');
        expect(wrapper.prosrc).toContain('economy_private.');
        const acl = (
          await db.query(
            `SELECT
        has_function_privilege('authenticated',$1,'EXECUTE') auth,
        has_function_privilege('anon',$1,'EXECUTE') anon,
        has_function_privilege('authenticated',$2,'EXECUTE') private`,
            [
              `public.${name}(${signatures[name]})`,
              `economy_private.${name}(${signatures[name]})`,
            ],
          )
        ).rows[0];
        expect(acl).toEqual({
          auth: true,
          anon: false,
          private: name === 'create_traveler',
        });
      }
      const rls = (
        await db.query(`SELECT n.nspname,c.relname,c.relrowsecurity FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace WHERE (n.nspname='economy_private' AND c.relkind='r')
      OR (n.nspname='public' AND c.relname IN ('travelers','wallets','inventory','traveler_stats','traveler_chests','chest_operations'))`)
      ).rows;
      expect(rls).toHaveLength(10);
      expect(rls.every((row) => row.relrowsecurity)).toBe(true);
      const authorityAcl = (
        await db.query(`SELECT
      has_function_privilege('authenticated','public.economy_authority(uuid,uuid,text,jsonb)','EXECUTE') auth,
      has_function_privilege('anon','public.economy_authority(uuid,uuid,text,jsonb)','EXECUTE') anon,
      has_function_privilege('service_role','public.economy_authority(uuid,uuid,text,jsonb)','EXECUTE') service`)
      ).rows[0];
      expect(authorityAcl).toEqual({ auth: false, anon: false, service: true });
      evidence.wrappers = {
        identical_legacy_bodies: true,
        same_argument_names_types_returns: true,
        empty_search_paths: true,
        authority_acl: authorityAcl,
        rls_tables: rls,
      };
    });
    test('legacy calls work after revocations; auth, ownership and qualified references resist spoofing', async () => {
      const id = randomUUID();
      await asUser(userB, async (c) => {
        // Hostile search_path cannot replace explicitly qualified table/helper references.
        await c.query(
          'CREATE TEMP TABLE wallets(traveler_id uuid,coins integer)',
        );
        await c.query('CREATE TEMP TABLE travelers(id uuid,user_id uuid)');
        await c.query('SET search_path=pg_temp,public');
        expect((await create(c, id)).rows[0].id).toBe(id);
      });
      const starter = (
        await db.query(
          `SELECT t.user_id,t.xp,t.level,w.coins,
      (SELECT item_id FROM public.inventory WHERE traveler_id=t.id) item,
      (SELECT count(*) FROM economy_private.journeys WHERE traveler_id=t.id) journeys
      FROM public.travelers t JOIN public.wallets w ON w.traveler_id=t.id WHERE t.id=$1`,
          [id],
        )
      ).rows[0];
      expect(starter).toEqual({
        user_id: userB,
        xp: 0,
        level: 1,
        coins: 0,
        item: 'traveler-boots',
        journeys: '1',
      });
      await asUser(null, (c) =>
        expect(create(c, randomUUID())).rejects.toMatchObject({
          code: '42501',
        }),
      );
      await asUser(
        null,
        (c) =>
          expect(create(c, randomUUID())).rejects.toMatchObject({
            code: '42501',
          }),
        'anon',
      );
      await db.query(
        'UPDATE public.wallets SET coins=100 WHERE traveler_id=$1',
        [id],
      );
      const purchase = randomUUID(),
        open = randomUUID();
      await asUser(userB, async (c) => {
        const buy = (
          await c.query("SELECT public.purchase_chest($1,'common',$2) r", [
            id,
            purchase,
          ])
        ).rows[0].r;
        expect(buy.pricePaid).toBe(40);
        expect(buy.coins).toBe(60);
        expect(
          (
            await c.query("SELECT public.purchase_chest($1,'common',$2) r", [
              id,
              purchase,
            ])
          ).rows[0].r.duplicate,
        ).toBe(true);
        const first = (
          await c.query("SELECT public.open_chest($1,'common',$2) r", [
            id,
            open,
          ])
        ).rows[0].r;
        expect([10, 25]).toContain(first.coins);
        expect(
          (
            await c.query("SELECT public.open_chest($1,'common',$2) r", [
              id,
              open,
            ])
          ).rows[0].r,
        ).toEqual({ ...first, duplicate: true });
        await expect(
          c.query('SELECT public.add_coins($1,999999)', [id]),
        ).rejects.toMatchObject({ code: '42501' });
        await expect(
          c.query('SELECT public.spend_coins($1,1)', [id]),
        ).rejects.toMatchObject({ code: '42501' });
      });
      for (const fn of ['open_chest', 'purchase_chest']) {
        await asUser(userA, (c) =>
          expect(
            c.query(`SELECT public.${fn}($1,'common',$2)`, [id, randomUUID()]),
          ).rejects.toMatchObject({ code: '42501' }),
        );
        await asUser(userB, (c) =>
          expect(
            c.query(`SELECT economy_private.${fn}($1,'common',$2)`, [
              id,
              randomUUID(),
            ]),
          ).rejects.toMatchObject({ code: '42501' }),
        );
        await asUser(
          null,
          (c) =>
            expect(
              c.query(`SELECT public.${fn}($1,'common',$2)`, [
                id,
                randomUUID(),
              ]),
            ).rejects.toMatchObject({ code: '42501' }),
          'anon',
        );
      }
      await asUser(userA, (c) =>
        expect(
          c.query(
            "SELECT public.economy_authority($1,$2,'journey-commit',$3)",
            [userB, id, { state: {}, rewardKey: 'phase:garden-choice' }],
          ),
        ).rejects.toMatchObject({ code: '42501' }),
      );
      expect(
        (
          await db.query(
            'SELECT coins FROM public.wallets WHERE traveler_id=$1',
            [legacy],
          )
        ).rows[0].coins,
      ).toBe(777);
      evidence.legacy_execution = {
        new_traveler_fixed_starter: true,
        hostile_search_path_safe: true,
        purchase_price: 40,
        replay_debits: 1,
        open_replay_credits: 1,
        owner_only: true,
        direct_credit_and_private_chests_denied: true,
      };
    });
  },
);
