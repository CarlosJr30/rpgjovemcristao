// Loopback-only synthetic accounts/Guilds. No hosted proof, designation or rewards.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { Client } from 'pg';
const root = path.resolve('build/community-043b-impl-1'),
  bin = path.resolve(
    process.env.RPG_POSTGRES_BIN ??
      '../rpgjovemcristao-rpg-dev-007/build/rpg-dev-007/postgres-tool/node_modules/@embedded-postgres/windows-x64/native/bin',
  );
fs.mkdirSync(root, { recursive: true });
assert(fs.existsSync(path.join(bin, 'postgres.exe')));
const cluster = path.join(root, 'isolated-' + Date.now());
assert(cluster.startsWith(root + path.sep));
const port = await new Promise((r) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => {
    const p = s.address().port;
    s.close(() => r(p));
  });
});
execFileSync(
  path.join(bin, 'initdb.exe'),
  [
    '-D',
    cluster,
    '-U',
    'postgres',
    '-A',
    'trust',
    '--encoding=UTF8',
    '--locale=C',
    '--no-sync',
  ],
  { windowsHide: true, stdio: 'pipe' },
);
execFileSync(
  path.join(bin, 'pg_ctl.exe'),
  [
    '-D',
    cluster,
    '-l',
    path.join(cluster, 'server.log'),
    '-o',
    `-h 127.0.0.1 -p ${port}`,
    '-w',
    'start',
  ],
  { windowsHide: true, stdio: 'ignore', timeout: 10000 },
);
const options = {
    host: '127.0.0.1',
    port,
    user: 'postgres',
    database: 'postgres',
  },
  db = new Client(options),
  connections = [],
  checks = [];
const q = (s, p) => db.query(s, p),
  sql = (f) => fs.readFileSync(f, 'utf8').replaceAll('\r\n', '\n'),
  uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  tid = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  email = (n) => `isolated-${n}@fixtures.invalid`;
const migration = sql(
  'supabase/migrations/20261028213600_rpg_dev_010a2_multiguild_test.sql',
);
const quotaMigration = sql(
  'supabase/migrations/20261113232954_community_043b_membership_link_quotas.sql',
);
const requestQuotaMigration = sql(
  'supabase/migrations/20261114110000_community_043b_join_request_quotas_test.sql',
);
const check = async (name, fn) => {
  await fn();
  checks.push({ name, pass: true });
  fs.writeFileSync(
    root + '/postgres-progress.json',
    JSON.stringify({ checks }, null, 2),
  );
};
const rejects = (fn, code) => assert.rejects(fn, (e) => e.code === code);
async function auth(client, n, role = 'authenticated') {
  await client.query('BEGIN');
  await client.query('SET LOCAL ROLE ' + role);
  await client.query(
    "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
    [n === null ? '' : uid(n), JSON.stringify({ is_anonymous: false })],
  );
}
async function as(
  n,
  s,
  p = [],
  commit = true,
  client = db,
  role = 'authenticated',
) {
  await auth(client, n, role);
  try {
    const r = await client.query(s, p);
    await client.query(commit ? 'COMMIT' : 'ROLLBACK');
    return r;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
}
const gov = (n, a, id, data, request = randomUUID(), client = db) =>
  as(
    n,
    'select public.guild_governance_command($1,$2,$3,$4) result',
    [a, id, request, data],
    true,
    client,
  );
const issue = async (n) =>
  (
    await gov(1, 'issue_leadership', randomUUID(), {
      recipientEmail: email(n),
      expiresInDays: 7,
      reason: 'Isolated explicit leadership approval',
    })
  ).rows[0].result;
const accept = (n, i, request = randomUUID()) =>
  gov(
    n,
    'accept_leadership',
    i.id,
    { token: i.token, travelerId: tid(n) },
    request,
  );
const newConnection = async () => {
  const c = new Client(options);
  await c.connect();
  connections.push(c);
  return c;
};
async function waitBlocked(c) {
  const start = Date.now();
  while (Date.now() - start < 3000) {
    if (
      (
        await q(
          "select wait_event='advisory' blocked from pg_stat_activity where pid=$1",
          [c.processID],
        )
      ).rows[0]?.blocked
    )
      return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw Error('Missing concurrent lock evidence');
}
async function gameData() {
  return JSON.stringify(
    (
      await q(
        "select jsonb_build_object('travelers',(select jsonb_agg(case when id in ('10000000-0000-4000-8000-000000000009','10000000-0000-4000-8000-000000000010') then to_jsonb(x)-'updated_at' else to_jsonb(x) end order by id) from public.travelers x),'wallets',(select jsonb_agg(to_jsonb(x) order by traveler_id) from public.wallets x),'stats',(select jsonb_agg(to_jsonb(x) order by traveler_id) from public.traveler_stats x),'inventory',(select jsonb_agg(to_jsonb(x) order by id) from public.inventory x),'chests',(select jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text) from public.traveler_chests x)) result",
      )
    ).rows[0].result,
  );
}
async function definitions() {
  return (
    await q(
      "select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) args,pg_get_functiondef(p.oid) definition,p.proacl::text acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','guild_ops','ebd_ops','guild_invite_private','guild_admin_private','guild_chat_private','ebd_class_private') order by 1,2,3",
    )
  ).rows;
}
try {
  await db.connect();
  assert.equal(
    (await q('SHOW listen_addresses')).rows[0].listen_addresses,
    '127.0.0.1',
  );
  const fixture = sql('tests/fixtures/offline-authority-postgres.ts').match(
    /query\(`(CREATE ROLE anon[\s\S]+?CREATE PUBLICATION supabase_realtime;)`\);/,
  )[1];
  await q(fixture);
  await q(
    'alter table auth.users add column email text,add column email_confirmed_at timestamptz',
  );
  for (const lock of ['consolidation-002', 'consolidation-004'])
    for (const step of JSON.parse(
      sql(`packages/database/reviewed/${lock}.lock.json`),
    ).steps) {
      const s = sql(step.source);
      assert.equal(createHash('sha256').update(s).digest('hex'), step.sha256);
      await q(/^\s*BEGIN;\s*$/m.test(s) ? s : `BEGIN;${s}\nCOMMIT;`);
    }
  for (const n of [1, 2, 3, 4, 5, 6, 9]) {
    await q(
      'insert into auth.users(id,is_anonymous,email,email_confirmed_at) values($1,$2,$3,now())',
      [uid(n), n === 5, email(n)],
    );
    await q(
      "insert into public.travelers(id,user_id,name,body_type,skin_tone,hair_style,avatar_variant,is_active,level) values($1,$2,$3,'male','medio','curto','musgo',true,$4)",
      [tid(n), uid(n), 'Isolated ' + n, n === 4 ? 50 : 1],
    );
  }
  await q(
    "insert into public.travelers(id,user_id,name,body_type,skin_tone,hair_style,avatar_variant,is_active) values($1,$2,'Inactive','male','medio','curto','musgo',false)",
    [tid(7), uid(3)],
  );
  await q(
    "insert into public.travelers(id,user_id,name,body_type,skin_tone,hair_style,avatar_variant,is_active) values($1,$2,'Actor race fixture','male','medio','curto','musgo',false)",
    [tid(10), uid(9)],
  );
  for (const n of [3, 4]) {
    await q(
      'insert into public.guilds(id,name,created_by_user_id,leader_traveler_id) values($1,$2,$3,$4)',
      [uid(200 + n), 'Legacy ' + n, uid(n), tid(n)],
    );
    await q(
      "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'leader','active')",
      [uid(200 + n), tid(n)],
    );
  }
  await q(
    `BEGIN;${sql('supabase/migrations/20261024151503_release_ebd_001_isolation.sql')}\nCOMMIT;`,
  );
  await q(
    "create or replace function public.release_scope() returns text language sql immutable as $$select 'hero-equipment-006'::text$$",
  );
  await q(
    `BEGIN;${sql('supabase/migrations/20261028110010_rpg_dev_010a_governance_foundation_test.sql')}\nCOMMIT;`,
  );
  await q('select guild_admin_private.bootstrap_admin($1,$2,$3,$4)', [
    uid(1),
    ['admins.manage', 'leadership.manage', 'guilds.read', 'audit.read'],
    'Isolated explicit initial administrator',
    randomUUID(),
  ]);
  const firstInvite = await issue(3),
    firstAcceptance = randomUUID();
  await accept(3, firstInvite, firstAcceptance);
  // Disposable historical-link fixture: real FK-linked use rows are captured
  // before the additive version marker migration, then compared afterward.
  const historicalLinkToken = 'a'.repeat(64);
  await q(
    "insert into auth.users(id,is_anonymous,email,email_confirmed_at) select ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,false,'isolated-'||n||'@fixtures.invalid',now() from generate_series(100,154) n",
  );
  await q(
    "insert into public.travelers(id,user_id,name,body_type,skin_tone,hair_style,avatar_variant,is_active) select ('10000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'Quota Fixture '||n,'male','medio','curto','musgo',true from generate_series(100,154) n",
  );
  await q(
    "insert into public.guilds(id,name,created_by_user_id,leader_traveler_id) select ('00000000-0000-4000-8000-'||lpad((1100+n)::text,12,'0'))::uuid,'Quota Fixture Guild '||n,('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,('10000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(100,149) n",
  );
  await q(
    "insert into public.guild_members(guild_id,traveler_id,role,status) select ('00000000-0000-4000-8000-'||lpad((1100+n)::text,12,'0'))::uuid,('10000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'leader','active' from generate_series(100,149) n",
  );
  await q(
    "insert into public.travelers(id,user_id,name,body_type,skin_tone,hair_style,avatar_variant,is_active,level) values($1,$2,'Second quota avatar','male','medio','curto','musgo',false,1)",
    [tid(155), uid(152)],
  );
  const beforeGame = await gameData();
  await q('BEGIN;' + migration + 'COMMIT;');
  await q(
    'alter table auth.users add column deleted_at timestamptz,add column banned_until timestamptz;create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz)',
  );
  await q(
    `BEGIN;${sql('supabase/migrations/20261030105539_rpg_dev_010b_classes_test.sql')}\nCOMMIT;`,
  );
  await q(
    `BEGIN;${sql('supabase/migrations/20261030110258_rpg_dev_010b_member_invites_test.sql')}\nCOMMIT;`,
  );
  await q(
    `BEGIN;${sql('supabase/migrations/20261030131230_rpg_dev_010b_legacy_invites_test.sql')}\nCOMMIT;`,
  );
  await q(
    "insert into guild_invite_private.link_invites(id,guild_id,leader_traveler_id,token_hash,created_at,expires_at) values($1,$2,$3,extensions.digest($4,'sha256'),transaction_timestamp(),transaction_timestamp()+interval '7 days')",
    [uid(2500), uid(203), tid(3), historicalLinkToken],
  );
  await q(
    "insert into ebd_class_private.legacy_uses(invite_id,traveler_id,user_id,membership_id,request_id) select $1,('10000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,m.id,gen_random_uuid() from generate_series(100,149) n join public.guild_members m on m.traveler_id=('10000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid",
    [uid(2500)],
  );
  const legacyInviteBefore = (
    await q(
      "select encode(token_hash,'hex') token_hash,created_at,expires_at,revoked_at,(select count(*)::int from ebd_class_private.legacy_uses where invite_id=i.id) uses from guild_invite_private.link_invites i where id=$1",
      [uid(2500)],
    )
  ).rows[0];
  const legacyDefinitions = await definitions();
  await check(
    'installation without explicit target fails before DDL',
    async () => {
      await rejects(
        () =>
          q(
            'BEGIN;' +
              sql(
                'supabase/migrations/20261113215415_community_043b_controlled_creation_test.sql',
              ) +
              'COMMIT;',
          ),
        'P0001',
      );
      await q('ROLLBACK');
      assert.equal(
        (
          await q(
            "select count(*)::int n from information_schema.columns where table_schema='guild_admin_private' and table_name='multiguild_control' and column_name like 'community_%'",
          )
        ).rows[0].n,
        0,
      );
    },
  );
  await q(
    'BEGIN;' +
      ("SET LOCAL rpg.community043b.install='local-test';" +
        sql(
          'supabase/migrations/20261113215415_community_043b_controlled_creation_test.sql',
        )) +
      'COMMIT;',
  );
  await check(
    'quota migration requires explicit local TEST target',
    async () => {
      await rejects(() => q('BEGIN;' + quotaMigration + 'COMMIT;'), 'P0001');
      await q('ROLLBACK');
      assert.equal(
        (
          await q(
            "select count(*)::int n from information_schema.columns where table_schema='guild_invite_private' and table_name='link_invites' and column_name='community_quota_version'",
          )
        ).rows[0].n,
        0,
      );
    },
  );
  await q(
    "BEGIN;SET LOCAL rpg.community043b.quotas_install='local-test';" +
      quotaMigration +
      'COMMIT;',
  );
  await check(
    'request-quota migration fails closed without explicit target',
    async () => {
      await rejects(
        () => q('BEGIN;' + requestQuotaMigration + 'COMMIT;'),
        'P0001',
      );
      await q('ROLLBACK');
      assert.equal(
        (
          await q(
            "select to_regprocedure('guild_admin_private.enforce_join_request_quotas()') fn",
          )
        ).rows[0].fn,
        null,
      );
    },
  );
  await q(
    "BEGIN;SET LOCAL rpg.community043b.request_quotas_install='local-test';" +
      requestQuotaMigration +
      'COMMIT;',
  );
  await q(
    "insert into public.guilds(id,name,created_by_user_id,leader_traveler_id) select ('00000000-0000-4000-8000-'||lpad((6000+n)::text,12,'0'))::uuid,'Request quota Guild '||n,('00000000-0000-4000-8000-'||lpad((100+n)::text,12,'0'))::uuid,('10000000-0000-4000-8000-'||lpad((100+n)::text,12,'0'))::uuid from generate_series(0,5) n",
  );
  await q(
    "insert into public.guild_members(guild_id,traveler_id,role,status) select ('00000000-0000-4000-8000-'||lpad((6000+n)::text,12,'0'))::uuid,('10000000-0000-4000-8000-'||lpad((100+n)::text,12,'0'))::uuid,'leader','active' from generate_series(0,5) n",
  );
  const requestJoin = async (account, guildNumber, avatar = tid(account)) =>
    (
      await as(account, 'select public.request_join_guild($1,$2) id', [
        uid(guildNumber),
        avatar,
      ])
    ).rows[0].id;
  const reviewJoin = (account, request, approve = false) =>
    as(account, 'select public.review_guild_join_request($1,$2,$3)', [
      request,
      tid(account),
      approve,
    ]);
  await check(
    'five rolling requests aggregate across avatars and replay is free',
    async () => {
      const activeState = (
        await q(
          'select id,is_active,updated_at from public.travelers where id in ($1,$2) order by id',
          [tid(152), tid(155)],
        )
      ).rows;
      const ids = [];
      try {
        for (const guild of [6000, 6001, 6002, 6003])
          ids.push(await requestJoin(152, guild, tid(152)));
        assert.equal(await requestJoin(152, 6000, tid(152)), ids[0]);

        // Each Auth account may have only one active avatar. Switch the
        // fixture's active avatar to exercise the account-wide aggregate.
        await q('update public.travelers set is_active=false where id=$1', [
          tid(152),
        ]);
        await q('update public.travelers set is_active=true where id=$1', [
          tid(155),
        ]);
        ids.push(await requestJoin(152, 6004, tid(155)));
        assert.equal(
          (
            await q(
              "select count(*)::int n from public.guild_join_requests r join public.travelers t on t.id=r.traveler_id where t.user_id=$1 and r.created_at>clock_timestamp()-interval '24 hours'",
              [uid(152)],
            )
          ).rows[0].n,
          5,
        );
        await assert.rejects(
          () => requestJoin(152, 6005, tid(155)),
          (e) => e.code === '54000',
        );
      } finally {
        await q(
          'update public.travelers set is_active=false where id in ($1,$2)',
          [tid(152), tid(155)],
        );
        for (const state of activeState)
          await q(
            'update public.travelers set is_active=$2,updated_at=$3 where id=$1',
            [state.id, state.is_active, state.updated_at],
          );
      }
      assert.ok(await requestJoin(153, 6005));
    },
  );
  await check(
    'rejection consumes quota and enforces per-avatar Guild cooldown',
    async () => {
      const request = await requestJoin(150, 6000);
      await reviewJoin(100, request, false);
      await assert.rejects(
        () => requestJoin(150, 6000),
        (e) => e.code === '55000',
      );
      for (const guild of [6001, 6002, 6003, 6004])
        await requestJoin(150, guild);
      await assert.rejects(
        () => requestJoin(150, 6005),
        (e) => e.code === '54000',
      );
      await q(
        "update public.guild_join_requests set created_at=clock_timestamp()-interval '25 hours',reviewed_at=clock_timestamp()-interval '25 hours' where traveler_id=$1 and guild_id=$2 and status='rejected'",
        [tid(150), uid(6000)],
      );
      assert.ok(await requestJoin(150, 6000));
    },
  );
  await check(
    'cancelled persisted requests do not refund account quota',
    async () => {
      const request = await requestJoin(149, 6000);
      await q(
        "update public.guild_join_requests set status='cancelled' where id=$1",
        [request],
      );
      for (const guild of [6001, 6002, 6003, 6004])
        await requestJoin(149, guild);
      await assert.rejects(
        () => requestJoin(149, 6005),
        (e) => e.code === '54000',
      );
    },
  );
  await check(
    'concurrent request attempts cannot exceed five per account',
    async () => {
      for (const guild of [6000, 6001, 6002, 6003])
        await requestJoin(148, guild);
      const winner = await newConnection();
      const contender = await newConnection();
      await winner.query('BEGIN');
      await auth(winner, 148);
      await winner.query('select public.request_join_guild($1,$2)', [
        uid(6004),
        tid(148),
      ]);
      const contenderResult = as(
        148,
        'select public.request_join_guild($1,$2)',
        [uid(6005), tid(148)],
        true,
        contender,
      ).then(
        () => null,
        (error) => error,
      );
      await waitBlocked(contender);
      await winner.query('COMMIT');
      assert.equal((await contenderResult)?.code, '54000');
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.guild_join_requests r join public.travelers t on t.id=r.traveler_id where t.user_id=$1 and r.created_at>clock_timestamp()-interval '24 hours'",
            [uid(148)],
          )
        ).rows[0].n,
        5,
      );
    },
  );
  await check(
    'approval revalidates active target and preserves pending request on denial',
    async () => {
      const request = await requestJoin(146, 6000);
      const originalTraveler = (
        await q('select updated_at from public.travelers where id=$1', [
          tid(146),
        ])
      ).rows[0];
      await q('update public.travelers set is_active=false where id=$1', [
        tid(146),
      ]);
      await assert.rejects(
        () => reviewJoin(100, request, true),
        (e) => e.code === '42501',
      );
      assert.equal(
        (
          await q('select status from public.guild_join_requests where id=$1', [
            request,
          ])
        ).rows[0].status,
        'pending',
      );
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.guild_members where guild_id=$1 and traveler_id=$2 and status='active'",
            [uid(6000), tid(146)],
          )
        ).rows[0].n,
        0,
      );
      await q(
        'update public.travelers set is_active=true,updated_at=$2 where id=$1',
        [tid(146), originalTraveler.updated_at],
      );
      await q(
        "update auth.users set banned_until=clock_timestamp()+interval '1 day' where id=$1",
        [uid(146)],
      );
      await assert.rejects(
        () => reviewJoin(100, request, true),
        (e) => e.code === '42501',
      );
      assert.equal(
        (
          await q('select status from public.guild_join_requests where id=$1', [
            request,
          ])
        ).rows[0].status,
        'pending',
      );
      await q('update auth.users set banned_until=null where id=$1', [
        uid(146),
      ]);
      await reviewJoin(100, request, true);
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.guild_members where guild_id=$1 and traveler_id=$2 and status='active'",
            [uid(6000), tid(146)],
          )
        ).rows[0].n,
        1,
      );
    },
  );
  await check(
    'co-leader without operation-specific delegation cannot review requests',
    async () => {
      const request = await requestJoin(145, 6000);
      await q(
        "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'co_leader','active')",
        [uid(6000), tid(147)],
      );
      await assert.rejects(
        () => reviewJoin(147, request, false),
        (e) => e.code === '42501',
      );
      assert.equal(
        (
          await q('select status from public.guild_join_requests where id=$1', [
            request,
          ])
        ).rows[0].status,
        'pending',
      );
      const otherGuildRequest = await requestJoin(144, 6001);
      await assert.rejects(
        () => reviewJoin(147, otherGuildRequest, false),
        (e) => e.code === '42501',
      );
    },
  );
  await check(
    'request quota trigger remains private with a fixed search path',
    async () => {
      const fn = (
        await q(
          "select p.prosecdef,p.proconfig,has_function_privilege('authenticated','guild_admin_private.enforce_join_request_quotas()','EXECUTE') auth_exec,has_function_privilege('anon','guild_admin_private.enforce_join_request_quotas()','EXECUTE') anon_exec from pg_proc p where p.oid='guild_admin_private.enforce_join_request_quotas()'::regprocedure",
        )
      ).rows[0];
      assert.equal(fn.prosecdef, true);
      assert.deepEqual(fn.proconfig, ['search_path=""']);
      assert.equal(fn.auth_exec, false);
      assert.equal(fn.anon_exec, false);
    },
  );
  await check('revoked link denies new acceptance', async () => {
    const invite = (
      await as(3, 'select public.guild_scoped_create_invite($1,$2,$3) result', [
        tid(3),
        uid(203),
        randomUUID(),
      ])
    ).rows[0].result;
    await as(3, 'select public.guild_scoped_revoke_invite($1,$2,$3)', [
      invite.id,
      tid(3),
      uid(203),
    ]);
    await assert.rejects(
      () =>
        as(2, 'select public.ebd_member_invite_accept($1,$2,$3)', [
          invite.token,
          tid(2),
          randomUUID(),
        ]),
      (e) => e.code === 'P0002',
    );
  });
  await check('historical link provenance and usage preserved', async () => {
    assert.deepEqual(
      (
        await q(
          "select encode(i.token_hash,'hex') token_hash,i.created_at,i.expires_at,i.revoked_at,(select count(*)::int from ebd_class_private.legacy_uses where invite_id=i.id) uses,i.community_quota_version from guild_invite_private.link_invites i where i.id=$1",
          [uid(2500)],
        )
      ).rows[0],
      { ...legacyInviteBefore, community_quota_version: null },
    );
    assert.equal(
      (
        await q(
          "select (ebd_class_private.invite_preview($1)->>'guildName') is not null allowed",
          [historicalLinkToken],
        )
      ).rows[0].allowed,
      true,
    );
  });
  await check(
    'empty recovery restores additive schema and can reinstall',
    async () => {
      await q(
        'BEGIN;' +
          sql(
            'packages/database/proposals/community-043b-recovery-empty.sql.in',
          ) +
          'COMMIT;',
      );
      assert.equal(
        (
          await q(
            "select to_regprocedure('public.community_create_own_guild(uuid,uuid,text,text)') x",
          )
        ).rows[0].x,
        null,
      );
      assert.equal(
        (
          await q(
            "select count(*)::int n from information_schema.columns where table_schema='guild_admin_private' and table_name='multiguild_control' and column_name like 'community_%'",
          )
        ).rows[0].n,
        0,
      );
      await q(
        'BEGIN;' +
          ("SET LOCAL rpg.community043b.install='local-test';" +
            sql(
              'supabase/migrations/20261113215415_community_043b_controlled_creation_test.sql',
            )) +
          'COMMIT;',
      );
    },
  );
  await q('insert into auth.sessions(id,user_id) select id,id from auth.users');
  const call = async (
    n,
    key = randomUUID(),
    name = 'Private Guild',
    actor = tid(n),
    client = db,
  ) => {
    await auth(client, n);
    await client.query("select set_config('request.jwt.claims',$1,true)", [
      JSON.stringify({ is_anonymous: false, session_id: uid(n) }),
    ]);
    try {
      const r = await client.query(
        'select public.community_create_own_guild($1,$2,$3,$4) result',
        [actor, key, name, ''],
      );
      await client.query('COMMIT');
      return r.rows[0].result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  };
  const newCommunityInvite = (
    await as(3, 'select public.guild_scoped_create_invite($1,$2,$3) result', [
      tid(3),
      uid(203),
      randomUUID(),
    ])
  ).rows[0].result;
  const firstUseRequest = randomUUID();
  await as(151, 'select public.ebd_member_invite_accept($1,$2,$3) result', [
    newCommunityInvite.token,
    tid(151),
    firstUseRequest,
  ]);
  await q(
    "insert into ebd_class_private.legacy_uses(invite_id,traveler_id,user_id,membership_id,request_id) select $1,('10000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,m.id,gen_random_uuid() from generate_series(100,148) n join public.guild_members m on m.traveler_id=('10000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid",
    [newCommunityInvite.id],
  );
  await check('new link carries the approved 50-use quota', async () => {
    assert.equal(
      (
        await q(
          'select community_quota_version from guild_invite_private.link_invites where id=$1',
          [newCommunityInvite.id],
        )
      ).rows[0].community_quota_version,
      1,
    );
    assert.equal(
      (
        await q(
          'select count(*)::int n from ebd_class_private.legacy_uses where invite_id=$1',
          [newCommunityInvite.id],
        )
      ).rows[0].n,
      50,
    );
    await rejects(
      () =>
        q('select ebd_class_private.invite_preview($1)', [
          newCommunityInvite.token,
        ]),
      'P0002',
    );
  });
  await check(
    'full new link replays prior use but rejects a new member',
    async () => {
      assert.equal(
        (
          await as(
            151,
            'select public.ebd_member_invite_accept($1,$2,$3) result',
            [newCommunityInvite.token, tid(151), firstUseRequest],
          )
        ).rows[0].result.replayed,
        true,
      );
      await rejects(
        () =>
          as(152, 'select public.ebd_member_invite_accept($1,$2,$3) result', [
            newCommunityInvite.token,
            tid(152),
            randomUUID(),
          ]),
        'P0002',
      );
      assert.equal(
        (
          await q(
            'select count(*)::int n from ebd_class_private.legacy_uses where invite_id=$1',
            [newCommunityInvite.id],
          )
        ).rows[0].n,
        50,
      );
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.guild_members where guild_id=$1 and traveler_id=$2 and status='active'",
            [uid(203), tid(152)],
          )
        ).rows[0].n,
        0,
      );
    },
  );
  await check(
    'historical link retains its legacy 100-use behavior',
    async () => {
      const result = (
        await as(
          152,
          'select public.ebd_member_invite_accept($1,$2,$3) result',
          [historicalLinkToken, tid(152), randomUUID()],
        )
      ).rows[0].result;
      assert.equal(result.enrolled, true);
      assert.equal(result.replayed, false);
      assert.equal(
        (
          await q(
            'select count(*)::int n from ebd_class_private.legacy_uses where invite_id=$1',
            [uid(2500)],
          )
        ).rows[0].n,
        51,
      );
    },
  );
  await q(
    "insert into public.guilds(id,name,created_by_user_id,leader_traveler_id) select ('00000000-0000-4000-8000-'||lpad((3000+n)::text,12,'0'))::uuid,'Membership quota '||n,$1,$2 from generate_series(0,5) n",
    [uid(153), tid(153)],
  );
  for (let n = 0; n < 4; n++)
    await q(
      "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'member','active')",
      [uid(3000 + n), tid(153)],
    );
  const capWinner = await newConnection(),
    capContender = await newConnection();
  await capWinner.query('BEGIN');
  await capWinner.query(
    "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'member','active')",
    [uid(3004), tid(153)],
  );
  const capContenderResult = capContender
    .query(
      "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'member','active')",
      [uid(3005), tid(153)],
    )
    .then(
      () => null,
      (error) => error,
    );
  await waitBlocked(capContender);
  await capWinner.query('COMMIT');
  await check(
    'concurrent membership inserts enforce five per avatar',
    async () => {
      const error = await capContenderResult;
      assert.equal(error?.code, '54000');
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.guild_members where traveler_id=$1 and status='active'",
            [tid(153)],
          )
        ).rows[0].n,
        5,
      );
    },
  );
  await check('leaving a Guild releases one membership slot', async () => {
    await q(
      "update public.guild_members set status='left' where guild_id=$1 and traveler_id=$2",
      [uid(3000), tid(153)],
    );
    await q(
      "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'member','active')",
      [uid(3005), tid(153)],
    );
    assert.equal(
      (
        await q(
          "select count(*)::int n from public.guild_members where traveler_id=$1 and status='active'",
          [tid(153)],
        )
      ).rows[0].n,
      5,
    );
  });
  await q(
    "insert into public.guilds(id,name,created_by_user_id,leader_traveler_id) values($1,'Fifty member quota',$2,$3)",
    [uid(4000), uid(149), tid(149)],
  );
  await q(
    "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'leader','active')",
    [uid(4000), tid(149)],
  );
  for (let n = 100; n < 149; n++)
    await q(
      "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'member','active')",
      [uid(4000), tid(n)],
    );
  await check('51st active Guild member is denied', async () => {
    await rejects(
      () =>
        q(
          "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'member','active')",
          [uid(4000), tid(152)],
        ),
      '54000',
    );
    assert.equal(
      (
        await q(
          "select count(*)::int n from public.guild_members where guild_id=$1 and status='active'",
          [uid(4000)],
        )
      ).rows[0].n,
      50,
    );
  });
  await check(
    'join-request approval at capacity rolls back and preserves pending request',
    async () => {
      const request = (
        await as(152, 'select public.request_join_guild($1,$2) id', [
          uid(4000),
          tid(152),
        ])
      ).rows[0].id;
      await rejects(
        () =>
          as(149, 'select public.review_guild_join_request($1,$2,true)', [
            request,
            tid(149),
          ]),
        '54000',
      );
      assert.equal(
        (
          await q('select status from public.guild_join_requests where id=$1', [
            request,
          ])
        ).rows[0].status,
        'pending',
      );
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.guild_members where guild_id=$1 and status='active'",
            [uid(4000)],
          )
        ).rows[0].n,
        50,
      );
    },
  );
  await q(
    "insert into public.guilds(id,name,created_by_user_id,leader_traveler_id) values($1,'Concurrent fifty member quota',$2,$3)",
    [uid(4001), uid(149), tid(149)],
  );
  await q(
    "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'leader','active')",
    [uid(4001), tid(149)],
  );
  for (let n = 100; n < 148; n++)
    await q(
      "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'member','active')",
      [uid(4001), tid(n)],
    );
  const guildCapWinner = await newConnection(),
    guildCapContender = await newConnection();
  await guildCapWinner.query('BEGIN');
  await guildCapWinner.query(
    "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'member','active')",
    [uid(4001), tid(154)],
  );
  const guildCapContenderResult = guildCapContender
    .query(
      "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'member','active')",
      [uid(4001), tid(152)],
    )
    .then(
      () => null,
      (error) => error,
    );
  await waitBlocked(guildCapContender);
  await guildCapWinner.query('COMMIT');
  await check(
    'concurrent membership inserts enforce 50 per Guild',
    async () => {
      const error = await guildCapContenderResult;
      assert.equal(error?.code, '54000');
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.guild_members where guild_id=$1 and status='active'",
            [uid(4001)],
          )
        ).rows[0].n,
        50,
      );
    },
  );
  await check(
    'quota helpers retain private execution and fixed search path',
    async () => {
      const fn = (
        await q(
          "select prosecdef,proconfig,has_function_privilege('authenticated','guild_admin_private.enforce_membership_quotas()','EXECUTE') auth_exec,has_function_privilege('anon','guild_admin_private.enforce_membership_quotas()','EXECUTE') anon_exec,has_function_privilege('authenticated','guild_invite_private.create_invite(uuid,uuid)','EXECUTE') create_exec,has_function_privilege('authenticated','ebd_class_private.legacy_accept(text,uuid,uuid)','EXECUTE') legacy_exec,has_function_privilege('authenticated','ebd_class_private.invite_preview(text)','EXECUTE') preview_exec,has_function_privilege('anon','ebd_class_private.invite_preview(text)','EXECUTE') preview_anon,has_function_privilege('authenticated','ebd_class_private.invite_list(uuid,uuid,uuid)','EXECUTE') list_exec from pg_proc where oid='guild_admin_private.enforce_membership_quotas()'::regprocedure",
        )
      ).rows[0];
      assert.equal(fn.prosecdef, true);
      assert.deepEqual(fn.proconfig, ['search_path=""']);
      assert.equal(fn.auth_exec, false);
      assert.equal(fn.anon_exec, false);
      assert.equal(fn.create_exec, false);
      assert.equal(fn.legacy_exec, false);
      assert.equal(fn.preview_exec, true);
      assert.equal(fn.preview_anon, true);
      assert.equal(fn.list_exec, true);
    },
  );
  await check('default disabled', async () => rejects(() => call(2), '55000'));
  await q(
    "update guild_admin_private.multiguild_control set community_creation_enabled=true,community_environment='local'",
  );
  await check('foreign avatar', async () =>
    rejects(() => call(2, randomUUID(), 'Private Guild', tid(4)), '42501'),
  );
  await check('anonymous account', async () => rejects(() => call(5), '42501'));
  await q(
    "update auth.users set banned_until=now()+interval '1 day' where id=$1",
    [uid(2)],
  );
  await check('suspended account', async () => rejects(() => call(2), '42501'));
  await q(
    'update auth.users set banned_until=null,email_confirmed_at=null where id=$1',
    [uid(2)],
  );
  await check('unconfirmed account', async () =>
    rejects(() => call(2), '42501'),
  );
  await q('update auth.users set email_confirmed_at=now() where id=$1', [
    uid(2),
  ]);
  await q('delete from auth.sessions where user_id=$1', [uid(2)]);
  await check('revoked session', async () => rejects(() => call(2), '42501'));
  await q('insert into auth.sessions values($1,$1,null)', [uid(2)]);
  const key = randomUUID();
  let result;
  await check(
    'common creation and local leadership without global grants',
    async () => {
      result = await call(2, key);
      assert.equal(result.status, 'created');
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.guild_members where guild_id=$1 and traveler_id=$2 and role='leader'",
            [result.id, tid(2)],
          )
        ).rows[0].n,
        1,
      );
      assert.equal(
        (
          await q(
            'select count(*)::int n from guild_admin_private.leader_authorizations where user_id=$1',
            [uid(2)],
          )
        ).rows[0].n,
        0,
      );
    },
  );
  await check('idempotent replay', async () => {
    const r = await call(2, key);
    assert.equal(r.id, result.id);
    assert.equal(r.replayed, true);
  });
  await check('conflicting replay', async () =>
    rejects(() => call(2, key, 'Other Guild'), '22023'),
  );
  await check('account lifetime limit', async () =>
    rejects(() => call(2), '23505'),
  );
  await check('historical creator limit', async () =>
    rejects(() => call(3), '23505'),
  );
  await check('economic baseline unchanged', async () =>
    assert.equal(await gameData(), beforeGame),
  );
  await check('helper and anonymous ACL', async () => {
    for (const [role, fn] of [
      ['authenticated', 'guild_admin_private.community_actor(uuid)'],
      ['anon', 'public.community_create_own_guild(uuid,uuid,text,text)'],
      [
        'service_role',
        'public.community_create_own_guild(uuid,uuid,text,text)',
      ],
    ])
      assert.equal(
        (
          await q("select has_function_privilege($1,$2,'EXECUTE') allowed", [
            role,
            fn,
          ])
        ).rows[0].allowed,
        false,
      );
  });
  await check('existing functions and ACL preserved', async () => {
    const after = await definitions();
    for (const old of legacyDefinitions.filter(
      (x) =>
        ![
          'community_quota_contract',
          'community_actor',
          'create_own_guild',
          'community_create_own_guild',
          'enforce_membership_quotas',
          'create_invite',
          'legacy_accept',
          'invite_preview',
          'invite_list',
        ].includes(x.proname),
    ))
      assert.deepEqual(
        after.find(
          (x) =>
            x.nspname === old.nspname &&
            x.proname === old.proname &&
            x.args === old.args,
        ),
        old,
      );
  });
  await q('update auth.users set banned_until=null where id=$1', [uid(6)]);
  const blocker = await newConnection(),
    c = await newConnection();
  await blocker.query('BEGIN;SELECT pg_advisory_xact_lock(1010,1)');
  const waiting = call(6, randomUUID(), 'Waiting Guild', tid(6), c);
  // Attach rejection immediately, while waiting on the lock.
  const expected = rejects(() => waiting, '42501');
  await waitBlocked(c);
  await blocker.query(
    "update auth.users set banned_until=now()+interval '1 day' where id=$1",
    [uid(6)],
  );
  await blocker.query('COMMIT');
  await check('revocation during lock wait', async () => expected);
  await q('update auth.users set banned_until=null where id=$1', [uid(6)]);
  const a = await newConnection(),
    b = await newConnection();
  await check('concurrent account creation has one winner', async () => {
    const results = await Promise.allSettled([
      call(6, randomUUID(), 'First Guild', tid(6), a),
      call(6, randomUUID(), 'Second Guild', tid(6), b),
    ]);
    assert.equal(results.filter((x) => x.status === 'fulfilled').length, 1);
    assert.equal(
      results.filter(
        (x) => x.status === 'rejected' && x.reason.code === '23505',
      ).length,
      1,
    );
    assert.equal(
      (
        await q(
          'select count(*)::int n from public.guilds where created_by_user_id=$1',
          [uid(6)],
        )
      ).rows[0].n,
      1,
    );
  });
  await q(
    "create function public.fail_community_audit() returns trigger language plpgsql as $$begin if new.actor_uid='00000000-0000-4000-8000-000000000009' then raise exception 'injected';end if;return new;end$$;create trigger fail_community_audit before insert on guild_admin_private.audit for each row execute function public.fail_community_audit()",
  );
  await check('audit failure rolls back Guild and membership', async () => {
    await rejects(() => call(9), 'P0001');
    assert.equal(
      (
        await q(
          'select count(*)::int n from public.guilds where created_by_user_id=$1',
          [uid(9)],
        )
      ).rows[0].n,
      0,
    );
    assert.equal(
      (
        await q(
          'select count(*)::int n from public.guild_members where traveler_id=$1',
          [tid(9)],
        )
      ).rows[0].n,
      0,
    );
  });
  await q('drop trigger fail_community_audit on guild_admin_private.audit');
  await q(
    "insert into public.guilds(id,name,created_by_user_id,leader_traveler_id) select gen_random_uuid(),'Quota Guild',$1,$2 from generate_series(1,5)",
    [uid(4), tid(4)],
  );
  await q(
    "insert into public.guild_members(guild_id,traveler_id,role,status) select id,$1,'member','active' from public.guilds where name='Quota Guild'",
    [tid(9)],
  );
  await check('sixth membership through creation denied', async () =>
    rejects(() => call(9), '54000'),
  );
  await q(
    "update public.guild_members set status='left' where id=(select id from public.guild_members where traveler_id=$1 limit 1)",
    [tid(9)],
  );
  await check('released fifth slot permits creation', async () =>
    assert.equal((await call(9)).status, 'created'),
  );
  await q('update public.travelers set is_active=false where id=$1', [tid(6)]);
  await q('update public.travelers set user_id=$1,is_active=true where id=$2', [
    uid(6),
    tid(10),
  ]);
  await check(
    'another active avatar cannot bypass account creation limit',
    async () =>
      rejects(() => call(6, randomUUID(), 'Another Guild', tid(10)), '23505'),
  );
  await q(
    "create or replace function public.release_scope() returns text language sql immutable as $$select 'guild-ebd-001'::text$$",
  );
  await check('PROD scope denied even if TEST switches enabled', async () =>
    rejects(() => call(2), '55000'),
  );
  await check('nonempty recovery refuses to remove live feature', async () => {
    await rejects(
      () =>
        q(
          'BEGIN;' +
            sql(
              'packages/database/proposals/community-043b-recovery-empty.sql.in',
            ) +
            'COMMIT;',
        ),
      'P0001',
    );
    await q('ROLLBACK');
    assert.notEqual(
      (
        await q(
          "select to_regprocedure('public.community_create_own_guild(uuid,uuid,text,text)') x",
        )
      ).rows[0].x,
      null,
    );
  });
  const auditBefore = (
    await q('select count(*)::int n from guild_admin_private.audit')
  ).rows[0].n;
  await q(
    "create or replace function public.release_scope() returns text language sql immutable as $$select 'hero-equipment-006'::text$$;update guild_admin_private.multiguild_control set community_creation_enabled=false",
  );
  await check('containment denies replay and preserves audit', async () => {
    await rejects(() => call(2, key), '55000');
    assert.equal(
      (await q('select count(*)::int n from guild_admin_private.audit')).rows[0]
        .n,
      auditBefore,
    );
  });
  console.log(JSON.stringify({ pass: true, checks, hostedProof: false }));
} finally {
  for (const c of connections) await c.end().catch(() => {});
  await db.end().catch(() => {});
  execFileSync(
    path.join(bin, 'pg_ctl.exe'),
    ['-D', cluster, '-m', 'fast', '-w', 'stop'],
    { windowsHide: true, stdio: 'ignore', timeout: 10000 },
  );
}
