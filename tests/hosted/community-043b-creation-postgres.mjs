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
      "select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) args,pg_get_functiondef(p.oid) definition,p.proacl::text acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','guild_ops','ebd_ops','guild_invite_private','guild_admin_private','guild_chat_private') order by 1,2,3",
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
  const beforeGame = await gameData();
  await q('BEGIN;' + migration + 'COMMIT;');
  await q(
    'alter table auth.users add column deleted_at timestamptz,add column banned_until timestamptz;create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz)',
  );
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
