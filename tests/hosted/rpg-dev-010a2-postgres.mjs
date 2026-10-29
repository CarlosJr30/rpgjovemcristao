// Loopback-only synthetic accounts/Guilds. No hosted proof, designation or rewards.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { Client } from 'pg';
const root = path.resolve('build/rpg-dev-010a2'),
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
const cmd = (n, g, a, id, data = {}, request = randomUUID(), client = db) =>
  as(
    n,
    'select public.guild_scoped_command($1,$2,$3,$4,$5,$6) result',
    [tid(n), g, a, id, request, data],
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
const create = (n, g = uid(300 + n), request = randomUUID(), client = db) =>
  cmd(
    n,
    g,
    'create',
    g,
    {
      name: 'Isolated Guild ' + g.slice(-3),
      description: 'Synthetic multi-Guild validation',
    },
    request,
    client,
  );
const join = async (n, g) =>
  (await cmd(n, g, 'join', randomUUID())).rows[0].result.id;
const review = (leader, g, request, approve = true) =>
  cmd(leader, g, 'review', request, { approve });
const revoke = (n) =>
  gov(1, 'revoke_leadership', uid(n), {
    reason: 'Isolated leadership revocation with active sessions',
  });
const workspace = (n, g) =>
  as(n, 'select public.guild_scoped_ebd_workspace($1,$2,0) result', [
    tid(n),
    g,
  ]);
const ebd = (n, g, action, id, revision, data) =>
  as(n, 'select public.guild_scoped_ebd_command($1,$2,$3,$4,$5,$6) result', [
    tid(n),
    g,
    action,
    id,
    revision,
    data,
  ]);
const lesson = (teacher, title = 'Scoped isolated lesson') => ({
  title,
  theme: 'Genesis',
  description: 'Synthetic',
  content: 'Genesis 1',
  reference: 'Genesis 1:1',
  objectives: 'Read',
  teacherId: tid(teacher),
  materials: [],
  audience: 'all',
  targetIds: [],
  rewardTier: '',
  scheduledAt: null,
});
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
  const beforeGame = await gameData(),
    beforeDefinitions = await definitions(),
    beforeGuilds = (await q('select * from public.guilds order by id')).rows,
    beforeMembers = (await q('select * from public.guild_members order by id'))
      .rows;
  await check(
    'TEST target guard refuses production scope before DDL',
    async () => {
      await q(
        "create or replace function public.release_scope() returns text language sql immutable as $$select 'guild-ebd-001'::text$$",
      );
      await rejects(() => q(`BEGIN;${migration}\nCOMMIT;`), 'P0001');
      await q('ROLLBACK');
      assert.equal(
        (
          await q(
            "select to_regclass('guild_admin_private.multiguild_control') x",
          )
        ).rows[0].x,
        null,
      );
      await q(
        "create or replace function public.release_scope() returns text language sql immutable as $$select 'hero-equipment-006'::text$$",
      );
    },
  );
  await check(
    'reviewed migration applies and preserves foundation grant and audit',
    async () => {
      const n = (await q('select count(*) n from guild_admin_private.audit'))
        .rows[0].n;
      await q(`BEGIN;${migration}\nCOMMIT;`);
      assert.equal(
        (await q('select count(*) n from guild_admin_private.audit')).rows[0].n,
        n,
      );
      assert.equal(
        (
          await q(
            'select count(*) n from guild_admin_private.admin_grants where active',
          )
        ).rows[0].n,
        '1',
      );
    },
  );
  await check(
    'empty rollback restores foundation definitions ACLs and original memberships',
    async () => {
      await q(
        `BEGIN;${sql('packages/database/proposals/rpg-dev-010a2-recovery-empty.sql')}\nCOMMIT;`,
      );
      assert.equal(
        (
          await q(
            "select to_regclass('guild_admin_private.multiguild_control') x",
          )
        ).rows[0].x,
        null,
      );
      assert(
        (
          await q(
            "select to_regclass('public.guild_members_one_active_guild_per_traveler_idx') x",
          )
        ).rows[0].x,
      );
      assert.equal(
        (await as(3, 'select public.guild_governance_status() result')).rows[0]
          .result.version,
        1,
      );
      assert.deepEqual(await definitions(), beforeDefinitions);
      await q(`BEGIN;${migration}\nCOMMIT;`);
    },
  );
  await check(
    'old one-Guild index replaced without removing pair uniqueness',
    async () => {
      assert.equal(
        (
          await q(
            "select to_regclass('public.guild_members_one_active_guild_per_traveler_idx') x",
          )
        ).rows[0].x,
        null,
      );
      assert(
        (
          await q(
            "select to_regclass('public.guild_members_active_traveler_idx') x",
          )
        ).rows[0].x,
      );
      assert.equal(
        (
          await q(
            "select count(*) n from pg_constraint where conrelid='public.guild_members'::regclass and contype='u' and pg_get_constraintdef(oid)='UNIQUE (guild_id, traveler_id)'",
          )
        ).rows[0].n,
        '1',
      );
    },
  );
  for (const role of ['anon', 'service_role'])
    await check(role + ' denied every new API', async () => {
      for (const s of [
        'select public.guild_scoped_contexts($1)',
        'select public.guild_scoped_members($1,$2)',
        'select public.guild_scoped_ebd_workspace($1,$2,0)',
      ])
        await rejects(
          () =>
            as(
              3,
              s,
              s.includes('$2') ? [tid(3), uid(203)] : [tid(3)],
              false,
              db,
              role,
            ),
          '42501',
        );
    });
  await check('anonymous account cannot spoof authenticated role', () =>
    rejects(
      () => as(5, 'select public.guild_scoped_contexts($1)', [tid(5)]),
      '42501',
    ),
  );
  await check('foreign and inactive avatars denied', async () => {
    await rejects(
      () => as(2, 'select public.guild_scoped_contexts($1)', [tid(3)]),
      '42501',
    );
    await rejects(
      () => as(3, 'select public.guild_scoped_contexts($1)', [tid(7)]),
      '42501',
    );
  });
  await check('administrator alone is not leadership authorization', () =>
    rejects(() => create(1), '42501'),
  );
  await check(
    'foundation status remains version one and scoped capabilities use version two',
    async () => {
      const old = (
        await as(3, 'select public.guild_governance_status() result')
      ).rows[0].result;
      assert.equal(old.version, 1);
      assert.equal(old.multiGuildReady, false);
      const current = (
        await as(3, 'select public.guild_scoped_status() result')
      ).rows[0].result;
      assert.equal(current.version, 2);
      assert.equal(current.multiGuildReady, true);
      assert.equal(current.writesEnabled, true);
    },
  );
  await check(
    'legacy leader retains community authority but cannot create without new authorization',
    async () => {
      assert.equal((await workspace(4, uid(204))).rows[0].result.leader, true);
      await rejects(() => create(4), '42501');
      await rejects(
        () =>
          as(4, 'select public.create_guild($1,$2,$3)', [
            tid(4),
            'Blocked legacy bypass',
            '',
          ]),
        '42501',
      );
    },
  );
  const g1 = uid(301),
    g2 = uid(302);
  await check(
    'authorized same leader creates two additional Guilds preserving legacy membership',
    async () => {
      await create(3, g1);
      await create(3, g2);
      const r = (
        await as(3, 'select public.guild_scoped_contexts($1) result', [tid(3)])
      ).rows[0].result;
      assert.equal(r.guilds.length, 3);
      assert(r.guilds.every((g) => g.canManage));
    },
  );
  await check(
    'same creation nonce is idempotent and conflicting payload denied',
    async () => {
      const g = uid(303),
        nonce = randomUUID();
      await create(3, g, nonce);
      const r = (await create(3, g, nonce)).rows[0].result;
      assert.equal(r.replayed, true);
      assert.equal(
        (await q('select count(*) n from public.guilds where id=$1', [g]))
          .rows[0].n,
        '1',
      );
      await rejects(
        () =>
          cmd(
            3,
            g,
            'create',
            g,
            { name: 'Different payload', description: '' },
            nonce,
          ),
        '22023',
      );
    },
  );
  await check(
    'concurrent create produces one Guild and one canonical receipt',
    async () => {
      const a = await newConnection(),
        b = await newConnection(),
        g = uid(304),
        nonce = randomUUID();
      const results = await Promise.all([
        create(3, g, nonce, a),
        create(3, g, nonce, b),
      ]);
      assert.equal(results.filter((r) => r.rows[0].result.replayed).length, 1);
      assert.equal(
        (await q('select count(*) n from public.guilds where id=$1', [g]))
          .rows[0].n,
        '1',
      );
    },
  );
  for (const [name, s, p] of [
    ['leave', 'select public.leave_guild($1)', [tid(3)]],
    ['remove', 'select public.remove_guild_member($1,$2)', [tid(2), tid(3)]],
    ['members', 'select * from public.list_guild_members($1)', [tid(3)]],
    ['requests', 'select * from public.list_guild_join_requests($1)', [tid(3)]],
    ['EBD', 'select public.guild_ebd_workspace($1,0)', [tid(3)]],
    ['invites', 'select public.create_guild_link_invite($1)', [tid(3)]],
  ])
    await check('legacy ' + name + ' refuses multiple Guild ambiguity', () =>
      rejects(() => as(3, s, p), '55000'),
    );
  await check(
    'old create RPC cannot create additional Guilds even for authorized leader',
    () =>
      rejects(
        () =>
          as(3, 'select public.create_guild($1,$2,$3)', [
            tid(3),
            'Ambiguous create',
            '',
          ]),
        '55000',
      ),
  );
  await check(
    'same avatar can join two Guilds without replacing memberships',
    async () => {
      await review(3, g1, await join(2, g1));
      await review(3, g2, await join(2, g2));
      const r = (
        await as(2, 'select public.guild_scoped_contexts($1) result', [tid(2)])
      ).rows[0].result;
      assert.equal(r.guilds.length, 2);
      assert(r.guilds.every((g) => !g.canManage));
    },
  );
  await check('join is idempotent per pending Guild request', async () => {
    const a = await join(6, g1),
      b = await join(6, g1);
    assert.equal(a, b);
  });
  await check(
    'leader and member cannot access unrelated Guild scope',
    async () => {
      await rejects(() => workspace(3, uid(204)), '42501');
      await rejects(() => workspace(2, uid(203)), '42501');
      await rejects(
        () =>
          as(2, 'select * from public.guild_scoped_requests($1,$2)', [
            tid(2),
            g1,
          ]),
        '42501',
      );
    },
  );
  await check(
    'cross-Guild review denied even when leader controls both',
    async () => {
      const id = await join(6, g2);
      await rejects(() => review(3, g1, id), 'P0002');
      await review(3, g2, id, false);
    },
  );
  const l1 = uid(401),
    l2 = uid(402);
  await check(
    'scoped teacher assignment does not grant authority in another Guild',
    async () => {
      await ebd(3, g1, 'teacher', tid(2), 0, {
        active: true,
        publish: true,
        attend: true,
      });
      await ebd(3, g1, 'lesson', l1, 0, lesson(2));
      await ebd(3, g2, 'lesson', l2, 0, lesson(3));
      assert.equal((await workspace(2, g1)).rows[0].result.teacher, true);
      assert.equal((await workspace(2, g2)).rows[0].result.teacher, false);
      await rejects(
        () =>
          ebd(2, g2, 'teacher', tid(6), 0, {
            active: true,
            publish: true,
            attend: true,
          }),
        '42501',
      );
    },
  );
  await check(
    'teacher edits assigned lesson only, never another community lesson',
    async () => {
      await ebd(2, g1, 'lesson', l1, 1, lesson(2, 'Own scoped edit'));
      await rejects(
        () => ebd(2, g1, 'state', l2, 1, { state: 'published' }),
        '42501',
      );
      await rejects(() => ebd(2, g2, 'lesson', l2, 1, lesson(2)), '42501');
    },
  );
  await check(
    'leader controlling both cannot mix selected context and lesson',
    () =>
      rejects(
        () => ebd(3, g1, 'state', l2, 1, { state: 'published' }),
        '42501',
      ),
  );
  await check(
    'teacher cannot edit or publish another teacher lesson in the same Guild',
    async () => {
      const other = uid(403);
      await ebd(3, g1, 'lesson', other, 0, lesson(3));
      await rejects(() => ebd(2, g1, 'lesson', other, 1, lesson(2)), '42501');
      await rejects(
        () => ebd(2, g1, 'state', other, 1, { state: 'published' }),
        '42501',
      );
    },
  );
  await check(
    'lesson reward request remains denied through new and old APIs',
    async () => {
      await rejects(
        () =>
          ebd(3, g1, 'lesson', randomUUID(), 0, {
            ...lesson(3),
            rewardTier: 'epic',
          }),
        '42501',
      );
      await rejects(
        () =>
          as(4, 'select public.guild_ebd_command($1,$2,$3,$4,$5)', [
            tid(4),
            'lesson',
            randomUUID(),
            0,
            { ...lesson(4), rewardTier: 'normal' },
          ]),
        '42501',
      );
    },
  );
  let link;
  const linkNonce = randomUUID();
  await check(
    'ordinary invitations created and listed only inside selected Guild',
    async () => {
      link = (
        await as(
          3,
          'select public.guild_scoped_create_invite($1,$2,$3) result',
          [tid(3), g1, linkNonce],
        )
      ).rows[0].result;
      assert.equal(
        (
          await as(3, 'select public.guild_scoped_list_invites($1,$2) result', [
            tid(3),
            g1,
          ])
        ).rows[0].result.length,
        1,
      );
      assert.equal(
        (
          await as(3, 'select public.guild_scoped_list_invites($1,$2) result', [
            tid(3),
            g2,
          ])
        ).rows[0].result.length,
        0,
      );
      await rejects(
        () =>
          as(2, 'select public.guild_scoped_create_invite($1,$2,$3)', [
            tid(2),
            g1,
            randomUUID(),
          ]),
        '42501',
      );
    },
  );
  await check(
    'ordinary invite retry reuses receipt without exposing token or creating another link',
    async () => {
      const replay = (
        await as(
          3,
          'select public.guild_scoped_create_invite($1,$2,$3) result',
          [tid(3), g1, linkNonce],
        )
      ).rows[0].result;
      assert.equal(replay.id, link.id);
      assert.equal(replay.token, null);
      assert.equal(replay.replayed, true);
      assert.equal(
        (
          await as(3, 'select public.guild_scoped_list_invites($1,$2) result', [
            tid(3),
            g1,
          ])
        ).rows[0].result.length,
        1,
      );
      await rejects(
        () =>
          as(3, 'select public.guild_scoped_create_invite($1,$2,$3)', [
            tid(3),
            g2,
            linkNonce,
          ]),
        '22023',
      );
    },
  );
  await check(
    'concurrent ordinary invite creation consumes one nonce and reveals one secret',
    async () => {
      const c1 = await newConnection(),
        c2 = await newConnection(),
        nonce = randomUUID();
      const results = await Promise.all(
        [c1, c2].map((c) =>
          as(
            3,
            'select public.guild_scoped_create_invite($1,$2,$3) result',
            [tid(3), g1, nonce],
            true,
            c,
          ),
        ),
      );
      const rows = results.map((r) => r.rows[0].result);
      assert.equal(rows[0].id, rows[1].id);
      assert.equal(rows.filter((r) => typeof r.token === 'string').length, 1);
      assert.equal(rows.filter((r) => r.replayed === true).length, 1);
    },
  );
  await check(
    'concurrent ordinary invite requests reuse one pending membership request',
    async () => {
      const c1 = await newConnection(),
        c2 = await newConnection();
      const results = await Promise.all(
        [c1, c2].map((c) =>
          as(
            6,
            'select public.request_guild_link_invite($1,$2) result',
            [link.token, tid(6)],
            true,
            c,
          ),
        ),
      );
      assert.deepEqual(results[0].rows[0].result, results[1].rows[0].result);
      assert.equal(
        (
          await q(
            "select count(*) n from public.guild_join_requests where guild_id=$1 and traveler_id=$2 and status='pending'",
            [g1, tid(6)],
          )
        ).rows[0].n,
        '1',
      );
    },
  );
  await check(
    'invite revocation cannot target another selected Guild',
    async () => {
      await rejects(
        () =>
          as(3, 'select public.guild_scoped_revoke_invite($1,$2,$3)', [
            link.id,
            tid(3),
            g2,
          ]),
        'P0002',
      );
      await as(3, 'select public.guild_scoped_revoke_invite($1,$2,$3)', [
        link.id,
        tid(3),
        g1,
      ]);
      await rejects(
        () =>
          as(
            null,
            'select public.preview_guild_link_invite($1)',
            [link.token],
            false,
            db,
            'anon',
          ),
        'P0002',
      );
    },
  );
  await check(
    'removal affects one community and revokes teacher only there',
    async () => {
      await cmd(3, g1, 'remove', tid(2));
      const r = (
        await as(2, 'select public.guild_scoped_contexts($1) result', [tid(2)])
      ).rows[0].result;
      assert.deepEqual(
        r.guilds.map((x) => x.guild.id),
        [g2],
      );
      assert.equal(
        (
          await q(
            'select active from public.guild_ebd_teachers where guild_id=$1 and traveler_id=$2',
            [g1, tid(2)],
          )
        ).rows[0].active,
        false,
      );
      assert.equal(
        (
          await q('select count(*) n from public.guild_lessons where id=$1', [
            l1,
          ])
        ).rows[0].n,
        '1',
      );
    },
  );
  await check(
    'leaving preserves other membership and same nonce replay',
    async () => {
      await review(3, g1, await join(2, g1));
      const nonce = randomUUID();
      await cmd(2, g2, 'leave', tid(2), {}, nonce);
      assert.equal(
        (await cmd(2, g2, 'leave', tid(2), {}, nonce)).rows[0].result.replayed,
        true,
      );
      const r = (
        await as(2, 'select public.guild_scoped_contexts($1) result', [tid(2)])
      ).rows[0].result;
      assert.deepEqual(
        r.guilds.map((x) => x.guild.id),
        [g1],
      );
    },
  );
  await check('rejoining does not silently restore teacher grant', async () => {
    assert.equal((await workspace(2, g1)).rows[0].result.teacher, false);
    await rejects(() => ebd(2, g1, 'lesson', l1, 2, lesson(2)), '42501');
  });
  await check(
    'leader cannot leave itself or remove another leader',
    async () => {
      await rejects(() => cmd(3, g1, 'leave', tid(3)), '42501');
      await rejects(() => cmd(3, g1, 'remove', tid(3)), '42501');
    },
  );
  await check(
    'global revocation covers legacy leaders and pending invites without changing membership',
    async () => {
      const i = (
        await as(4, 'select public.create_guild_link_invite($1) result', [
          tid(4),
        ])
      ).rows[0].result;
      await revoke(4);
      assert.equal(
        (await as(4, 'select public.is_guild_leader($1) result', [uid(204)]))
          .rows[0].result,
        false,
      );
      assert.equal((await workspace(4, uid(204))).rows[0].result.leader, false);
      await rejects(
        () => as(4, 'select public.create_guild_link_invite($1)', [tid(4)]),
        '42501',
      );
      await rejects(
        () =>
          as(
            null,
            'select public.preview_guild_link_invite($1)',
            [i.token],
            false,
            db,
            'anon',
          ),
        'P0002',
      );
      assert.equal(
        (
          await q(
            'select role,status from public.guild_members where guild_id=$1 and traveler_id=$2',
            [uid(204), tid(4)],
          )
        ).rows[0].role,
        'leader',
      );
    },
  );
  await check(
    'revocation wins after waiting create without refreshing JWT',
    async () => {
      const a = await newConnection(),
        b = await newConnection(),
        g = uid(305);
      await auth(a, 1);
      await a.query('select pg_advisory_xact_lock(1010,1)');
      const pending = create(3, g, randomUUID(), b).then(
        () => ({ ok: true }),
        (e) => ({ code: e.code }),
      );
      await waitBlocked(b);
      await a.query('select public.guild_governance_command($1,$2,$3,$4)', [
        'revoke_leadership',
        uid(3),
        randomUUID(),
        { reason: 'Concurrent isolated leadership revocation' },
      ]);
      await a.query('COMMIT');
      assert.deepEqual(await pending, { code: '42501' });
      assert.equal(
        (await q('select count(*) n from public.guilds where id=$1', [g]))
          .rows[0].n,
        '0',
      );
    },
  );
  await check(
    'revoked authenticated leader cannot use old or scoped privileged APIs',
    async () => {
      await rejects(() => create(3, uid(306)), '42501');
      await rejects(
        () =>
          as(3, 'select public.create_guild($1,$2,$3)', [
            tid(3),
            'Blocked after revoke',
            '',
          ]),
        '42501',
      );
      await rejects(() => cmd(3, g1, 'remove', tid(2)), '42501');
      await rejects(
        () =>
          ebd(3, g1, 'teacher', tid(2), 2, {
            active: true,
            publish: true,
            attend: true,
          }),
        '42501',
      );
      assert.equal((await workspace(3, g1)).rows[0].result.leader, false);
    },
  );
  await check(
    'old acceptance replay cannot clear later global revocation',
    async () => {
      const r = (await accept(3, firstInvite, firstAcceptance)).rows[0].result;
      assert.equal(r.replayed, true);
      await rejects(() => create(3, uid(306)), '42501');
    },
  );
  await check(
    'fresh individual invitation can explicitly restore leadership',
    async () => {
      await accept(3, await issue(3));
      assert.equal(
        (await as(3, 'select public.guild_scoped_status() result')).rows[0]
          .result.canCreateAdditionalGuilds,
        true,
      );
    },
  );
  await check(
    'direct foundation private command cannot bypass new revocation wrapper',
    () =>
      rejects(
        () =>
          as(1, 'select guild_admin_private.command($1,$2,$3,$4)', [
            'revoke_leadership',
            uid(3),
            randomUUID(),
            { reason: 'Private bypass attempt' },
          ]),
        '42501',
      ),
  );
  await check(
    'avatar change while creation waits rejects the formerly active actor',
    async () => {
      await accept(9, await issue(9));
      const a = await newConnection(),
        b = await newConnection(),
        g = uid(309);
      await a.query('BEGIN');
      await a.query('select id from public.travelers where id=$1 for update', [
        tid(9),
      ]);
      const pending = create(9, g, randomUUID(), b).then(
        () => ({ ok: true }),
        (e) => ({ code: e.code }),
      );
      const start = Date.now();
      let blocked = false;
      while (Date.now() - start < 3000) {
        blocked = (
          await q(
            "select wait_event_type='Lock' and wait_event<>'advisory' blocked from pg_stat_activity where pid=$1",
            [b.processID],
          )
        ).rows[0]?.blocked;
        if (blocked) break;
        await new Promise((r) => setTimeout(r, 20));
      }
      assert.equal(blocked, true, 'creation waits on the current avatar row');
      await a.query('update public.travelers set is_active=false where id=$1', [
        tid(9),
      ]);
      await a.query('update public.travelers set is_active=true where id=$1', [
        tid(10),
      ]);
      await a.query('COMMIT');
      assert.deepEqual(await pending, { code: '42501' });
      assert.equal(
        (await q('select count(*) n from public.guilds where id=$1', [g]))
          .rows[0].n,
        '0',
      );
      // Restore only this isolated identity fixture, not hosted data or game values.
      await q('update public.travelers set is_active=false where id=$1', [
        tid(10),
      ]);
      await q('update public.travelers set is_active=true where id=$1', [
        tid(9),
      ]);
      // The normal updated_at trigger runs on these two synthetic identity rows.
      // gameData excludes only their timestamps; every game value and all other rows stay exact.
    },
  );
  await check(
    'rollback refuses to erase multiple memberships or new audit records',
    async () => {
      await rejects(
        () =>
          q(
            `BEGIN;${sql('packages/database/proposals/rpg-dev-010a2-recovery-empty.sql')}\nCOMMIT;`,
          ),
        'P0001',
      );
      await q('ROLLBACK');
    },
  );
  await check(
    'contained writes fail closed while multi-Guild reads remain usable',
    async () => {
      await q(
        `BEGIN;${sql('packages/database/proposals/rpg-dev-010a2-containment.sql')}\nCOMMIT;`,
      );
      await rejects(() => create(3, uid(307)), '55000');
      await rejects(
        () =>
          gov(1, 'revoke_leadership', uid(3), {
            reason: 'Contained administrative command',
          }),
        '55000',
      );
      await rejects(
        () =>
          ebd(3, g1, 'teacher', tid(2), 2, {
            active: true,
            publish: true,
            attend: true,
          }),
        '55000',
      );
      await rejects(
        () =>
          as(3, 'select public.guild_scoped_create_invite($1,$2,$3)', [
            tid(3),
            g1,
            randomUUID(),
          ]),
        '55000',
      );
      assert(
        (
          await as(3, 'select public.guild_scoped_contexts($1) result', [
            tid(3),
          ])
        ).rows[0].result.guilds.length >= 3,
      );
      assert.equal(
        (await as(3, 'select public.guild_scoped_status() result')).rows[0]
          .result.writesEnabled,
        false,
      );
    },
  );
  await check(
    'all original Guild and leader membership rows remain byte-equivalent',
    async () => {
      for (const g of beforeGuilds)
        assert.deepEqual(
          (await q('select * from public.guilds where id=$1', [g.id])).rows[0],
          g,
        );
      for (const m of beforeMembers)
        assert.deepEqual(
          (await q('select * from public.guild_members where id=$1', [m.id]))
            .rows[0],
          m,
        );
    },
  );
  await check(
    'no XP coins stats inventory chests or economic permissions changed',
    async () => {
      assert.equal(await gameData(), beforeGame);
      for (const t of [
        'inventory',
        'wallets',
        'traveler_stats',
        'equipped_items',
        'traveler_chests',
      ])
        assert.equal(
          (
            await q(
              "select has_table_privilege('authenticated',$1,'INSERT,UPDATE,DELETE') x",
              ['public.' + t],
            )
          ).rows[0].x,
          false,
        );
      assert.equal(
        (await q('select count(*) n from public.guild_ebd_reward_pending'))
          .rows[0].n,
        '0',
      );
    },
  );
  fs.writeFileSync(
    root + '/postgres-results.json',
    JSON.stringify(
      {
        pass: true,
        checks,
        syntheticData: true,
        hostedProof: false,
        productionProof: false,
        realGrants: false,
        postgres: '17.10',
        clusterStoppedInFinally: true,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({ pass: true, checks: checks.length, hostedProof: false }),
  );
} catch (e) {
  fs.writeFileSync(
    root + '/postgres-failure-' + Date.now() + '.json',
    JSON.stringify(
      { checks, error: { code: e.code, message: e.message, where: e.where } },
      null,
      2,
    ),
  );
  throw e;
} finally {
  for (const c of connections) await c.end().catch(() => {});
  await db.end().catch(() => {});
  execFileSync(
    path.join(bin, 'pg_ctl.exe'),
    ['-D', cluster, '-m', 'fast', '-w', 'stop'],
    { windowsHide: true, stdio: 'ignore', timeout: 10000 },
  );
}
