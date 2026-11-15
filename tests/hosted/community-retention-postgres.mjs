// Loopback-only synthetic retention lifecycle. No Supabase/network credentials.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
const pg = await import(process.env.RPG_PG_MODULE ?? 'pg');
const Client = pg.Client ?? pg.default.Client;
const bin = process.env.RPG_POSTGRES_BIN;
assert(bin, 'Explicit disposable PostgreSQL binary directory required');
const root = path.resolve('build/community-retention');
fs.mkdirSync(root, { recursive: true });
const cluster = path.join(root, `isolated-${Date.now()}`);
const port = await new Promise((resolve) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => {
    const p = s.address().port;
    s.close(() => resolve(p));
  });
});
const exe = (name, args) =>
  execFileSync(path.join(bin, `${name}.exe`), args, {
    stdio: 'ignore',
    windowsHide: true,
    timeout: 30000,
  });
exe('initdb', [
  '-D',
  cluster,
  '-U',
  'postgres',
  '-A',
  'trust',
  '--encoding=UTF8',
  '--locale=C',
  '--no-sync',
]);
exe('pg_ctl', [
  '-D',
  cluster,
  '-l',
  path.join(cluster, 'server.log'),
  '-o',
  `-h 127.0.0.1 -p ${port}`,
  '-w',
  'start',
]);
const options = {
  host: '127.0.0.1',
  port,
  user: 'postgres',
  database: 'postgres',
};
const db = new Client(options),
  peers = [],
  checks = [];
const q = (text, params) => db.query(text, params);
const sql = (p) => fs.readFileSync(p, 'utf8').replaceAll('\r\n', '\n');
const base = 'packages/database/deployments/community043b/sql/';
const retention = sql(base + 'community_retention_v1.sql.in');
const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const tid = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
async function check(name, fn) {
  await fn();
  checks.push({ name, pass: true });
  console.log('PASS', name);
}
const count = async (table) =>
  (await q(`select count(*)::int n from ${table}`)).rows[0].n;
async function denied(fn, code = '42501') {
  await assert.rejects(fn, (e) => e.code === code);
}
async function login(c, n) {
  await c.query('SET ROLE authenticated');
  await c.query(
    "select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",
    [uid(n), JSON.stringify({ is_anonymous: false, session_id: uid(n) })],
  );
}
async function reset(c = db) {
  await c.query('RESET ROLE');
  await c.query(
    "select set_config('request.jwt.claim.sub','',false),set_config('request.jwt.claims','{}',false)",
  );
}
async function create(
  n,
  request = randomUUID(),
  name = 'Synthetic Guild',
  client = db,
) {
  await login(client, n);
  try {
    return (
      await client.query(
        'select public.community_create_own_guild($1,$2,$3,$4) result',
        [tid(n), request, name, ''],
      )
    ).rows[0].result;
  } finally {
    await reset(client);
  }
}
try {
  await db.connect();
  await q(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
   CREATE SCHEMA auth; CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
   CREATE TABLE auth.users(id uuid PRIMARY KEY,is_anonymous boolean DEFAULT false,email_confirmed_at timestamptz DEFAULT now(),deleted_at timestamptz,banned_until timestamptz);
   CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid,not_after timestamptz);
   CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
   GRANT USAGE ON SCHEMA auth TO authenticated;
   GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO authenticated;
   CREATE FUNCTION public.release_scope() RETURNS text LANGUAGE sql IMMUTABLE AS $$select 'guild-ebd-001'::text$$;
   CREATE TABLE public.travelers(id uuid PRIMARY KEY,user_id uuid REFERENCES auth.users(id),is_active boolean DEFAULT true);
   CREATE SCHEMA guild_admin_private;
   REVOKE ALL ON SCHEMA guild_admin_private FROM PUBLIC,anon,authenticated,service_role;
   CREATE TABLE guild_admin_private.multiguild_control(singleton boolean PRIMARY KEY,writes_enabled boolean,revision int);
   INSERT INTO guild_admin_private.multiguild_control VALUES(true,true,1);
   CREATE TABLE guild_admin_private.leadership_revocations(user_id uuid,cleared_at timestamptz);
   CREATE TABLE guild_admin_private.leader_authorizations(user_id uuid,revoked_at timestamptz);`);
  await q(
    sql('packages/database/migrations/0001_guild_supabase_v1.sql')
      .split('--> statement-breakpoint')
      .slice(0, 3)
      .join('\n'),
  );
  const activity = sql(
    'packages/database/migrations/0004_guild_leader_panel.sql',
  );
  await q(activity.split('--> statement-breakpoint')[0]);
  await q(
    activity
      .slice(
        activity.indexOf('CREATE FUNCTION public.guild_activity_capture()'),
        activity.indexOf('CREATE TRIGGER guild_activity_member'),
      )
      .replaceAll('--> statement-breakpoint', ''),
  );
  const gov = sql(
    'supabase/migrations/20261029082857_rpg_dev_010a_governance_production.sql',
  );
  await q(
    gov.slice(
      gov.indexOf('CREATE TABLE guild_admin_private.audit('),
      gov.indexOf(
        'ALTER TABLE guild_admin_private.admin_grants ENABLE ROW LEVEL SECURITY;',
      ),
    ),
  );
  await q(
    "alter table guild_admin_private.audit drop constraint audit_action_check; alter table guild_admin_private.audit add check(action in('bootstrap_admin','guild_create')); ALTER TABLE guild_admin_private.audit ENABLE ROW LEVEL SECURITY; REVOKE ALL ON guild_admin_private.audit FROM PUBLIC,anon,authenticated,service_role;",
  );
  await q(
    gov.match(
      /CREATE FUNCTION guild_admin_private.account_uid\(\)[\s\S]*?END \$\$;/,
    )[0],
  );
  const multi = sql(
    'supabase/migrations/20261029082907_rpg_dev_010a2_multiguild_production.sql',
  );
  for (const name of ['leader_not_revoked', 'active_actor'])
    await q(
      multi.match(
        new RegExp(
          `CREATE FUNCTION guild_admin_private.${name}\\([\\s\\S]*?\\$\\$;`,
        ),
      )[0],
    );
  // Same schema USAGE as the existing governance baseline, not access to new retention internals.
  await q('GRANT USAGE ON SCHEMA guild_admin_private TO authenticated');
  for (let n = 1; n <= 12; n++) {
    await q('insert into auth.users(id) values($1);', [uid(n)]);
    await q('insert into public.travelers(id,user_id) values($1,$2)', [
      tid(n),
      uid(n),
    ]);
    await q('insert into auth.sessions values($1,$1,null)', [uid(n)]);
  }
  const legacy = uid(100);
  await q(
    "insert into public.guilds(id,name,created_by_user_id,leader_traveler_id) values($1,'Legacy', $2,$3)",
    [legacy, uid(1), tid(1)],
  );
  await q(
    "insert into public.guild_members(guild_id,traveler_id,role) values($1,$2,'leader')",
    [legacy, tid(1)],
  );
  await q(
    'insert into public.guild_invites(guild_id,invited_by_traveler_id) values($1,$2)',
    [legacy, tid(1)],
  );
  await q(
    "insert into guild_admin_private.audit(actor_uid,request_id,action,resource_id,reason,payload_hash,result) values($1,$2,'guild_create',$3,'Legacy creation identity',repeat('a',64),$4)",
    [uid(1), randomUUID(), legacy, { account: uid(1), actor: tid(1) }],
  );
  await q(
    "insert into guild_admin_private.audit(actor_uid,request_id,action,resource_id,reason,payload_hash,result) values($1,$2,'bootstrap_admin',$3,'Preserve unrelated action',repeat('b',64),'{}')",
    [uid(1), randomUUID(), uid(900)],
  );
  const unrelated = JSON.stringify(
    (
      await q(
        "select * from guild_admin_private.audit where action='bootstrap_admin'",
      )
    ).rows,
  );
  await q(
    "insert into public.guild_activity_log(guild_id,actor_traveler_id,event_type) values($1,$2,'member_joined')",
    [legacy, tid(1)],
  );
  const unrelatedActivity = JSON.stringify(
    (
      await q(
        "select * from public.guild_activity_log where event_type='member_joined' order by id",
      )
    ).rows,
  );
  await q(
    "set rpg.community043b.target_project='wspafhlbtlpabypzymjo'; set rpg.community043b.install='reviewed-production'",
  );
  await q(
    sql(
      base + '20261113215415_community_043b_controlled_creation_production.sql',
    ),
  );
  await q(sql(base + 'community_own_guild_capability.sql.in'));
  await check('wrong project rejects retention atomically', async () => {
    await q(
      "BEGIN;SET LOCAL rpg.community043b.target_project='wkdvdzfkbwvhyjmamrsg';SET LOCAL rpg.community043b.retention_install='reviewed-production'",
    );
    await denied(() => q(retention));
    await q('ROLLBACK');
    assert.equal(
      (await q("select to_regnamespace('community_retention_private') n"))
        .rows[0].n,
      null,
    );
  });
  await q(
    "BEGIN;SET LOCAL rpg.community043b.retention_install='reviewed-production'",
  );
  await q(retention);
  await q('COMMIT');
  await check(
    'backfill preserves legacy Guild, invites and noncreation audit',
    async () => {
      assert.equal(await count('community_retention_private.markers'), 1);
      assert.equal(await count('public.guilds'), 1);
      assert.equal(await count('public.guild_invites'), 1);
      const creationActivity = (
        await q(
          "select actor_traveler_id,metadata from public.guild_activity_log where guild_id=$1 and event_type='guild_created'",
          [legacy],
        )
      ).rows[0];
      assert.equal(creationActivity.actor_traveler_id, tid(1));
      assert.equal(
        JSON.stringify(
          (
            await q(
              "select * from guild_admin_private.audit where action='bootstrap_admin'",
            )
          ).rows,
        ),
        unrelated,
      );
      assert.equal(
        (
          await q(
            'select octet_length(subject) n from community_retention_private.markers',
          )
        ).rows[0].n,
        32,
      );
    },
  );
  await check(
    'missing scheduler denies capability and private schedule fails closed',
    async () => {
      await q(
        "update guild_admin_private.multiguild_control set community_creation_enabled=true,community_environment='production'",
      );
      await login(db, 2);
      assert.deepEqual(
        (
          await q('select public.community_own_guild_capability($1) r', [
            tid(2),
          ])
        ).rows[0].r,
        { version: 1, available: false },
      );
      await reset();
      await denied(
        () => q('select community_retention_private.install_schedule()'),
        '55000',
      );
    },
  );
  // SQL contract fixture only; not evidence that pg_cron is installed or ran in Supabase.
  await q(`CREATE SCHEMA cron; CREATE TABLE cron.job(jobname text PRIMARY KEY,active boolean,schedule text,command text,username text,database text);
   CREATE FUNCTION cron.schedule(text,text,text) RETURNS bigint LANGUAGE plpgsql AS $$BEGIN
    INSERT INTO cron.job VALUES($1,true,$2,$3,'postgres',current_database()) ON CONFLICT(jobname) DO UPDATE SET command=excluded.command; RETURN 1; END $$;
   SELECT community_retention_private.install_schedule();`);
  await check('schedule installation idempotent and health fresh', async () => {
    await q('select community_retention_private.install_schedule()');
    assert.equal(await count('cron.job'), 1);
    assert.equal(
      (await q('select community_retention_private.operational() v')).rows[0].v,
      true,
    );
  });
  await check(
    'private ACL/RLS and immutable audit resist ordinary account',
    async () => {
      for (const role of ['anon', 'authenticated', 'service_role']) {
        assert.equal(
          (
            await q(
              "select has_schema_privilege($1,'community_retention_private','USAGE') ok",
              [role],
            )
          ).rows[0].ok,
          false,
        );
        assert.equal(
          (
            await q(
              "select has_function_privilege($1,'community_retention_private.sweep()','EXECUTE') ok",
              [role],
            )
          ).rows[0].ok,
          false,
        );
      }
      assert.equal(
        (
          await q(
            "select bool_and(relrowsecurity) ok from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='community_retention_private' and c.relkind='r'",
          )
        ).rows[0].ok,
        true,
      );
      await denied(() =>
        q(
          "update guild_admin_private.audit set actor_uid=null where action='bootstrap_admin'",
        ),
      );
      await denied(() => q('delete from guild_admin_private.audit'));
    },
  );
  const request = randomUUID();
  const made = await create(2, request);
  await check(
    'active account marker, replay and payload conflict',
    async () => {
      assert.equal((await create(2, request)).replayed, true);
      await denied(() => create(2, request, 'Different payload'), '22023');
      await denied(() => create(2), '23505');
      assert.equal(
        (
          await q(
            'select deleted_at from community_retention_private.markers where subject=community_retention_private.subject($1)',
            [uid(2)],
          )
        ).rows[0].deleted_at,
        null,
      );
    },
  );
  await check('live account marker does not age out', async () => {
    assert.equal(
      Number(
        (await q('select community_retention_private.sweep() n')).rows[0].n,
      ),
      0,
    );
    await denied(() => create(2), '23505');
  });
  await check('suspended account and foreign avatar denied', async () => {
    await q(
      "update auth.users set banned_until=now()+interval '1 day' where id=$1",
      [uid(3)],
    );
    await denied(() => create(3));
    await login(db, 4);
    await denied(() =>
      q('select public.community_create_own_guild($1,$2,$3,$4)', [
        tid(5),
        randomUUID(),
        'Foreign',
        '',
      ]),
    );
    await reset();
  });
  await check(
    'same-account concurrent creates serialize to one Guild',
    async () => {
      const p = new Client(options);
      peers.push(p);
      await p.connect();
      const results = await Promise.allSettled([
        create(4),
        create(4, randomUUID(), 'Race', p),
      ]);
      assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
      assert.equal(
        results.find((r) => r.status === 'rejected').reason.code,
        '23505',
      );
    },
  );
  await check(
    'deletion starts window, freezes leader and preserves members/invites',
    async () => {
      await q('update auth.users set deleted_at=now() where id=$1', [uid(2)]);
      assert.equal(
        (
          await q('select leader_traveler_id from public.guilds where id=$1', [
            made.id,
          ])
        ).rows[0].leader_traveler_id,
        null,
      );
      assert.equal(
        (
          await q(
            'select count(*)::int n from public.guild_members where guild_id=$1',
            [made.id],
          )
        ).rows[0].n,
        1,
      );
      assert.equal(
        (
          await q('select role from public.guild_members where guild_id=$1', [
            made.id,
          ])
        ).rows[0].role,
        'member',
      );
      assert.equal(await count('public.guild_invites'), 1);
      await denied(() => create(2));
    },
  );
  await check(
    'same identity recovers within window; different account not linked',
    async () => {
      await q('update auth.users set deleted_at=null where id=$1', [uid(2)]);
      assert.equal(
        (
          await q('select leader_traveler_id from public.guilds where id=$1', [
            made.id,
          ])
        ).rows[0].leader_traveler_id,
        tid(2),
      );
      assert.equal(
        (
          await q('select role from public.guild_members where guild_id=$1', [
            made.id,
          ])
        ).rows[0].role,
        'leader',
      );
      await denied(() => create(2), '23505');
      assert.equal((await create(5)).status, 'created');
    },
  );
  await check(
    'expired deletion removes covered links only and purge is idempotent',
    async () => {
      await q('update auth.users set deleted_at=now() where id=$1', [uid(1)]);
      await q(
        "update community_retention_private.markers set deleted_at=now()-interval '31 days' where subject=community_retention_private.subject($1)",
        [uid(1)],
      );
      assert.equal(
        Number(
          (await q('select community_retention_private.sweep() n')).rows[0].n,
        ),
        1,
      );
      assert.equal(
        Number(
          (await q('select community_retention_private.sweep() n')).rows[0].n,
        ),
        0,
      );
      const g = (await q('select * from public.guilds where id=$1', [legacy]))
        .rows[0];
      assert.equal(g.created_by_user_id, null);
      assert.equal(g.leader_traveler_id, null);
      assert.equal(
        (
          await q(
            "select actor_traveler_id from public.guild_activity_log where guild_id=$1 and event_type='guild_created'",
            [legacy],
          )
        ).rows[0].actor_traveler_id,
        null,
      );
      assert.equal(
        JSON.stringify(
          (
            await q(
              "select * from public.guild_activity_log where event_type='member_joined' order by id",
            )
          ).rows,
        ),
        unrelatedActivity,
      );
      const a = (
        await q(
          "select * from guild_admin_private.audit where reason='Creation identity removed under retention policy'",
        )
      ).rows[0];
      assert.equal(a.actor_uid, null);
      assert.notEqual(a.resource_id, legacy);
      assert.deepEqual(a.result, {});
      assert.notEqual(a.payload_hash, 'a'.repeat(64));
      assert.equal(
        JSON.stringify(
          (
            await q(
              "select * from guild_admin_private.audit where action='bootstrap_admin'",
            )
          ).rows,
        ),
        unrelated,
      );
      assert.equal(await count('public.guild_invites'), 1);
      assert.equal(
        (
          await q(
            'select count(*)::int n from community_retention_private.guild_links where guild_id=$1',
            [legacy],
          )
        ).rows[0].n,
        0,
      );
    },
  );
  await check(
    'new eligible identity can create after former marker expiration',
    async () => assert.equal((await create(6)).status, 'created'),
  );
  await check(
    'ordinary users cannot grant themselves a redaction permit',
    async () => {
      await login(db, 6);
      await denied(() =>
        q('select * from community_retention_private.markers'),
      );
      await denied(() =>
        q(
          "insert into community_retention_private.redaction_permits values(1,txid_current(),'{}')",
        ),
      );
      await reset();
    },
  );
  await check(
    'legal hold explicitly preserves marker pending operator review',
    async () => {
      await q('update auth.users set deleted_at=now() where id=$1', [uid(5)]);
      await q(
        "update community_retention_private.markers set deleted_at=now()-interval '31 days' where subject=community_retention_private.subject($1)",
        [uid(5)],
      );
      await q(
        "insert into community_retention_private.legal_holds values(community_retention_private.subject($1),'synthetic-obligation-reference',now()+interval '1 day')",
        [uid(5)],
      );
      assert.equal(
        Number(
          (await q('select community_retention_private.sweep() n')).rows[0].n,
        ),
        0,
      );
    },
  );
  await check(
    'cleanup failure rolls back redaction and disables creation with redacted alert',
    async () => {
      await q('update auth.users set deleted_at=now() where id=$1', [uid(2)]);
      await q(
        "update community_retention_private.markers set deleted_at=now()-interval '31 days' where subject=community_retention_private.subject($1)",
        [uid(2)],
      );
      await q(
        "create function public.synthetic_failure() returns trigger language plpgsql as $$begin raise exception 'synthetic only' using errcode='23514';end$$; create trigger synthetic_failure before delete on community_retention_private.markers for each row execute function public.synthetic_failure()",
      );
      const before = JSON.stringify(
        (await q('select * from guild_admin_private.audit order by id')).rows,
      );
      await q('select community_retention_private.tick()');
      assert.equal(
        JSON.stringify(
          (await q('select * from guild_admin_private.audit order by id')).rows,
        ),
        before,
      );
      assert.equal(
        (
          await q(
            'select community_creation_enabled from guild_admin_private.multiguild_control',
          )
        ).rows[0].community_creation_enabled,
        false,
      );
      assert.equal(
        (await q('select failure_code from community_retention_private.health'))
          .rows[0].failure_code,
        '23514',
      );
      await q(
        'drop trigger synthetic_failure on community_retention_private.markers;drop function public.synthetic_failure();select community_retention_private.tick()',
      );
      assert.equal(
        (await q('select failure_code from community_retention_private.health'))
          .rows[0].failure_code,
        null,
      );
      assert.equal(
        (
          await q(
            'select count(*)::int n from community_retention_private.replays where subject=community_retention_private.subject($1)',
            [uid(2)],
          )
        ).rows[0].n,
        0,
      );
      assert.equal(
        (
          await q(
            'select count(*)::int n from community_retention_private.audit_links where subject=community_retention_private.subject($1)',
            [uid(2)],
          )
        ).rows[0].n,
        0,
      );
    },
  );
  await check(
    'physical Auth deletion blocked by unrelated references is atomic',
    async () => {
      const before = JSON.stringify(
        (
          await q(
            'select * from community_retention_private.markers order by subject',
          )
        ).rows,
      );
      await denied(
        () => q('delete from auth.users where id=$1', [uid(6)]),
        '23503',
      );
      assert.equal(
        JSON.stringify(
          (
            await q(
              'select * from community_retention_private.markers order by subject',
            )
          ).rows,
        ),
        before,
      );
    },
  );
  await check(
    'expired soft Auth recovery requires explicit review even after marker removal',
    async () => {
      await q(
        "update auth.users set deleted_at=now()-interval '31 days' where id=$1",
        [uid(2)],
      );
      await denied(() =>
        q('update auth.users set deleted_at=null where id=$1', [uid(2)]),
      );
    },
  );
  await check('stale scheduler heartbeat fails closed', async () => {
    await q(
      "update community_retention_private.health set last_success=now()-interval '3 minutes'",
    );
    assert.equal(
      (await q('select community_retention_private.operational() ok')).rows[0]
        .ok,
      false,
    );
  });
  fs.writeFileSync(
    path.join(root, 'evidence.json'),
    JSON.stringify(
      { checks, hostedProof: false, schedulerFixture: true, postgresMajor: 17 },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      pass: true,
      checks: checks.length,
      hostedProof: false,
      schedulerFixture: true,
    }),
  );
} finally {
  for (const p of peers) await p.end().catch(() => {});
  await db.end().catch(() => {});
  exe('pg_ctl', ['-D', cluster, '-m', 'fast', '-w', 'stop']);
}
