// Dedicated loopback PostgreSQL. Accounts, emails and grants below are synthetic,
// never hosted Auth sessions, real Admin designation or production proof.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { Client } from 'pg';
const root = path.resolve('build/rpg-dev-010a'),
  bin = path.resolve(
    process.env.RPG_POSTGRES_BIN ??
      '../rpgjovemcristao-rpg-dev-007/build/rpg-dev-007/postgres-tool/node_modules/@embedded-postgres/windows-x64/native/bin',
  );
fs.mkdirSync(root, { recursive: true });
assert(
  fs.existsSync(path.join(bin, 'postgres.exe')),
  'Pinned isolated PostgreSQL required',
);
const cluster = path.join(root, 'isolated-' + Date.now());
assert(cluster.startsWith(root + path.sep));
const port = await new Promise((r) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => {
    const p = s.address().port;
    s.close(() => r(p));
  });
});
const sql = (f) => fs.readFileSync(f, 'utf8').replaceAll('\r\n', '\n'),
  migration = sql(
    'supabase/migrations/20261028110010_rpg_dev_010a_governance_foundation_test.sql',
  ),
  recovery = sql('packages/database/proposals/rpg-dev-010a-recovery-empty.sql'),
  containment = sql('packages/database/proposals/rpg-dev-010a-containment.sql');
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
  checks = [];
const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  tid = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  email = (n) => `isolated-${n}@fixtures.invalid`,
  perms = ['admins.manage', 'leadership.manage', 'guilds.read', 'audit.read'];
const q = (s, p) => db.query(s, p),
  rejects = (fn, code) => assert.rejects(fn, (e) => e.code === code),
  check = async (name, fn) => {
    await fn();
    checks.push({ name, passed: true });
    fs.writeFileSync(
      root + '/postgres-progress.json',
      JSON.stringify({ checks }, null, 2),
    );
  };
async function beginAuth(client, role, n, claims = { is_anonymous: false }) {
  assert(['authenticated', 'anon', 'service_role'].includes(role));
  await client.query('BEGIN');
  await client.query('SET LOCAL ROLE ' + role);
  await client.query(
    "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
    [n === null ? '' : uid(n), JSON.stringify(claims)],
  );
}
async function as(
  role,
  n,
  s,
  p = [],
  commit = false,
  claims = { is_anonymous: false },
  client = db,
) {
  await beginAuth(client, role, n, claims);
  try {
    const r = await client.query(s, p);
    await client.query(commit ? 'COMMIT' : 'ROLLBACK');
    return r;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
}
const commandSql = 'select public.guild_governance_command($1,$2,$3,$4) result',
  statusSql = 'select public.guild_governance_status() result';
const command = (
  n,
  action,
  id,
  data,
  request = randomUUID(),
  commit = true,
  client = db,
) =>
  as(
    'authenticated',
    n,
    commandSql,
    [action, id, request, data],
    commit,
    { is_anonymous: false },
    client,
  );
const issue = (n, target = 3, request = randomUUID(), id = randomUUID()) =>
  command(
    n,
    'issue_leadership',
    id,
    {
      recipientEmail: typeof target === 'number' ? email(target) : target,
      expiresInDays: 7,
      reason: 'Isolated approved leadership invitation',
    },
    request,
  );
const accept = (
  n,
  inv,
  request = randomUUID(),
  client = db,
  traveler = tid(n),
) =>
  command(
    n,
    'accept_leadership',
    inv.id,
    { token: inv.token, travelerId: traveler },
    request,
    true,
    client,
  );
const invite = (r) => r.rows[0].result;
async function legacyData() {
  return JSON.stringify(
    (
      await q(
        "select jsonb_build_object('travelers',(select jsonb_agg(to_jsonb(t) order by id) from public.travelers t),'wallets',(select jsonb_agg(to_jsonb(t) order by traveler_id) from public.wallets t),'inventory',(select jsonb_agg(to_jsonb(t) order by id) from public.inventory t),'guilds',(select jsonb_agg(to_jsonb(t) order by id) from public.guilds t),'members',(select jsonb_agg(to_jsonb(t) order by id) from public.guild_members t),'story',(select jsonb_agg(to_jsonb(t) order by traveler_id,story_id) from public.story_progress t)) x",
      )
    ).rows[0].x,
  );
}
async function legacyFunctions() {
  return JSON.stringify(
    (
      await q(
        "select p.oid::regprocedure::text signature,pg_get_functiondef(p.oid) definition,p.proacl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','guild_ops','ebd_ops','guild_chat_private','guild_invite_private','release_ebd') and p.proname not like 'guild_governance_%' and p.proname<>'guild_leadership_preview' order by signature",
      )
    ).rows,
  );
}
async function waitBlocked(client) {
  const started = Date.now();
  while (Date.now() - started < 3000) {
    if (
      (
        await q(
          "select wait_event='advisory' blocked from pg_stat_activity where pid=$1",
          [client.processID],
        )
      ).rows[0]?.blocked
    )
      return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw Error('Concurrent transaction never reached lock');
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
    'alter table auth.users add column email text, add column email_confirmed_at timestamptz',
  );
  for (const lock of ['consolidation-002', 'consolidation-004'])
    for (const step of JSON.parse(
      sql(`packages/database/reviewed/${lock}.lock.json`),
    ).steps) {
      const s = sql(step.source);
      assert.equal(createHash('sha256').update(s).digest('hex'), step.sha256);
      await q(/^\s*BEGIN;\s*$/m.test(s) ? s : `BEGIN;${s}\nCOMMIT;`);
    }
  for (const n of [1, 2, 3, 4, 5, 6]) {
    await q(
      'insert into auth.users(id,is_anonymous,email,email_confirmed_at) values($1,$2,$3,$4)',
      [uid(n), n === 5, email(n), n === 6 ? null : new Date()],
    );
    await q(
      "insert into public.travelers(id,user_id,name,body_type,skin_tone,hair_style,avatar_variant,is_active,level) values($1,$2,$3,'male','medio','curto','musgo',true,$4)",
      [
        tid(n),
        uid(n),
        n === 4 ? 'Administrator fixture' : 'Isolated ' + n,
        n === 4 ? 50 : 1,
      ],
    );
  }
  await q(
    "insert into public.travelers(id,user_id,name,body_type,skin_tone,hair_style,avatar_variant,is_active) values($1,$2,'Inactive fixture','male','medio','curto','musgo',false)",
    [tid(7), uid(3)],
  );
  for (const n of [3, 4]) {
    await q(
      'insert into public.guilds(id,name,created_by_user_id,leader_traveler_id) values($1,$2,$3,$4)',
      [uid(200 + n), 'Existing isolated ' + n, uid(n), tid(n)],
    );
    await q(
      "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'leader','active')",
      [uid(200 + n), tid(n)],
    );
  }
  await q(
    `BEGIN;${sql('supabase/migrations/20261024151503_release_ebd_001_isolation.sql')}\nCOMMIT;`,
  );
  const oldData = await legacyData(),
    oldFunctions = await legacyFunctions();
  await check('production scope rejected before new DDL', async () => {
    await rejects(() => q(`BEGIN;${migration}\nCOMMIT;`), 'P0001');
    await q('ROLLBACK');
    assert.equal(
      (await q("select to_regnamespace('guild_admin_private') x")).rows[0].x,
      null,
    );
  });
  await q(
    "create or replace function public.release_scope() returns text language sql immutable as $$select 'hero-equipment-006'::text$$",
  );
  await check(
    'additive foundation starts with no grants invites authorizations or audit',
    async () => {
      await q(`BEGIN;${migration}\nCOMMIT;`);
      for (const t of [
        'admin_grants',
        'leadership_invites',
        'leader_authorizations',
        'audit',
      ])
        assert.equal(
          (await q('select count(*) n from guild_admin_private.' + t)).rows[0]
            .n,
          '0',
        );
      assert.equal(await legacyData(), oldData);
    },
  );
  await check(
    'empty recovery removes only new objects and preserves old data',
    async () => {
      await q(`BEGIN;${recovery}`);
      assert.equal(
        (await q("select to_regnamespace('guild_admin_private') x")).rows[0].x,
        null,
      );
      assert.equal(await legacyData(), oldData);
      await q('ROLLBACK');
    },
  );
  await check(
    'no administrator inferred from level50 name existing guild leadership or metadata',
    async () => {
      const r = (
        await as('authenticated', 4, statusSql, [], false, {
          is_anonymous: false,
          user_metadata: { role: 'admin' },
          app_metadata: { role: 'admin' },
        })
      ).rows[0].result;
      assert.equal(r.administrator, false);
      assert.equal(r.leadership, 'none');
      assert.equal(r.multiGuildReady, false);
      assert.equal(r.economicRewardsEnabled, false);
      await rejects(() => issue(4), '42501');
    },
  );
  await check('missing subject and anonymous identity denied', async () => {
    await rejects(() => as('authenticated', null, statusSql), '42501');
    await rejects(() => as('authenticated', 5, statusSql), '42501');
    await rejects(
      () =>
        as('authenticated', 1, statusSql, [], false, { is_anonymous: true }),
      '42501',
    );
  });
  for (const role of ['anon', 'service_role'])
    await check(role + ' cannot read status or mutate governance', async () => {
      await rejects(() => as(role, 1, statusSql), '42501');
      await rejects(
        () => as(role, 1, commandSql, ['set_admin', uid(1), randomUUID(), {}]),
        '42501',
      );
    });
  for (const role of ['anon', 'authenticated', 'service_role'])
    await check(
      role + ' cannot directly mint privileges or read private records',
      async () => {
        for (const t of [
          'admin_grants',
          'leadership_invites',
          'leader_authorizations',
          'audit',
        ])
          await rejects(
            () => as(role, 1, 'select * from guild_admin_private.' + t),
            '42501',
          );
        await rejects(
          () =>
            as(
              role,
              1,
              'insert into guild_admin_private.admin_grants(user_id,permissions,active,revision) values($1,$2,true,1)',
              [uid(1), perms],
            ),
          '42501',
        );
        await rejects(
          () =>
            as(
              role,
              1,
              'select guild_admin_private.bootstrap_admin($1,$2,$3,$4)',
              [uid(1), perms, 'Forged bootstrap attempt', randomUUID()],
            ),
          '42501',
        );
      },
    );
  await check(
    'anonymous or unconfirmed identity cannot receive protected bootstrap',
    async () => {
      for (const n of [5, 6])
        await rejects(
          () =>
            q('select guild_admin_private.bootstrap_admin($1,$2,$3,$4)', [
              uid(n),
              perms,
              'Invalid isolated bootstrap target',
              randomUUID(),
            ]),
          '55000',
        );
    },
  );
  await check(
    'protected synthetic bootstrap creates one explicit grant and immutable audit',
    async () => {
      await q('select guild_admin_private.bootstrap_admin($1,$2,$3,$4)', [
        uid(1),
        perms,
        'ISOLATED FIXTURE owner approval only',
        randomUUID(),
      ]);
      const r = (await as('authenticated', 1, statusSql)).rows[0].result;
      assert.equal(r.administrator, true);
      assert.deepEqual(r.permissions, perms);
      assert.equal(
        (await q('select count(*) n from guild_admin_private.audit')).rows[0].n,
        '1',
      );
    },
  );
  await check(
    'bootstrap cannot be repeated or used as general privilege API',
    () =>
      rejects(
        () =>
          q('select guild_admin_private.bootstrap_admin($1,$2,$3,$4)', [
            uid(2),
            perms,
            'Another isolated bootstrap',
            randomUUID(),
          ]),
        '55000',
      ),
  );
  await check(
    'admin reason required and unexpected fields rejected',
    async () => {
      await rejects(
        () =>
          command(1, 'issue_leadership', randomUUID(), {
            recipientEmail: email(3),
            expiresInDays: 7,
            reason: '',
          }),
        '22023',
      );
      await rejects(
        () =>
          command(1, 'issue_leadership', randomUUID(), {
            recipientEmail: email(3),
            expiresInDays: 7,
            reason: 'Valid fixture reason',
            role: 'admin',
          }),
        '22023',
      );
    },
  );
  await check('leadership invite expiry and recipient validated', async () => {
    await rejects(
      () =>
        command(1, 'issue_leadership', randomUUID(), {
          recipientEmail: email(3),
          expiresInDays: 8,
          reason: 'Invalid expiry fixture',
        }),
      '22023',
    );
    await rejects(() => issue(1, 'invalid-address'), '22023');
  });
  const issueRequest = randomUUID(),
    issueId = randomUUID(),
    inv = invite(await issue(1, 3, issueRequest, issueId));
  await check(
    'secure one-time token issued while only digest persists',
    async () => {
      assert.match(inv.token, /^[a-f0-9]{64}$/);
      const r = (
        await q(
          "select encode(token_hash,'hex') hash from guild_admin_private.leadership_invites where id=$1",
          [inv.id],
        )
      ).rows[0];
      assert.notEqual(r.hash, inv.token);
      assert.equal(
        r.hash,
        createHash('sha256').update(inv.token).digest('hex'),
      );
      const audit = JSON.stringify(
        (await q('select * from guild_admin_private.audit')).rows,
      );
      assert(!audit.includes(inv.token));
      assert(!audit.includes(email(3)));
    },
  );
  await check(
    'issue replay returns same ID without recovering raw token or issuing another row',
    async () => {
      const r = invite(await issue(1, 3, issueRequest, issueId));
      assert.equal(r.id, inv.id);
      assert.equal(r.token, null);
      assert.equal(r.replayed, true);
      assert.equal(
        (
          await q(
            'select count(*) n from guild_admin_private.leadership_invites',
          )
        ).rows[0].n,
        '1',
      );
    },
  );
  await check(
    'idempotency UUID cannot be reused with another command payload',
    () => rejects(() => issue(1, 4, issueRequest, issueId), '22023'),
  );
  await check(
    'pre-login preview contains no email account ID or grant',
    async () => {
      const r = (
        await as(
          'anon',
          null,
          'select public.guild_leadership_preview($1) result',
          [inv.token],
        )
      ).rows[0].result;
      assert.deepEqual(Object.keys(r).sort(), ['expiresAt', 'id', 'kind']);
      assert.equal(r.kind, 'leadership');
      assert.equal(
        (
          await q(
            'select count(*) n from guild_admin_private.leader_authorizations',
          )
        ).rows[0].n,
        '0',
      );
    },
  );
  await check(
    'invitation is not authentication and cannot be transferred to another account',
    async () => {
      await rejects(
        () =>
          as('anon', null, commandSql, [
            'accept_leadership',
            inv.id,
            randomUUID(),
            { token: inv.token, travelerId: tid(3) },
          ]),
        '42501',
      );
      await rejects(() => accept(4, inv), 'P0002');
    },
  );
  await check(
    'inactive or foreign avatar cannot consume invitation',
    async () => {
      await rejects(() => accept(3, inv, randomUUID(), db, tid(7)), '42501');
      await rejects(() => accept(3, inv, randomUUID(), db, tid(4)), '42501');
    },
  );
  const acceptNonce = randomUUID();
  await check(
    'recipient consumes invite once and receives only leadership authorization',
    async () => {
      const r = invite(await accept(3, inv, acceptNonce));
      assert.equal(r.status, 'accepted');
      const s = (await as('authenticated', 3, statusSql)).rows[0].result;
      assert.equal(s.administrator, false);
      assert.equal(s.leadership, 'active');
      assert.equal(s.canCreateAdditionalGuilds, false);
      assert.equal(await legacyData(), oldData);
    },
  );
  await check(
    'exact accepted-command replay has no second grant or audit',
    async () => {
      const before = (
        await q('select count(*) n from guild_admin_private.audit')
      ).rows[0].n;
      const r = invite(await accept(3, inv, acceptNonce));
      assert.equal(r.replayed, true);
      assert.equal(
        (await q('select count(*) n from guild_admin_private.audit')).rows[0].n,
        before,
      );
    },
  );
  await check(
    'consumed invite cannot be reused under new request or previewed',
    async () => {
      await rejects(() => accept(3, inv), 'P0002');
      await rejects(
        () =>
          as('anon', null, 'select public.guild_leadership_preview($1)', [
            inv.token,
          ]),
        'P0002',
      );
    },
  );
  await check(
    'leader authorization does not grant administrative functions',
    async () => {
      await rejects(() => issue(3, 4), '42501');
      await rejects(
        () =>
          as('authenticated', 3, 'select public.guild_governance_history(0)'),
        '42501',
      );
    },
  );
  const revoked = invite(await issue(1));
  await check('revoked invite cannot be consumed', async () => {
    await command(1, 'revoke_invite', revoked.id, {
      reason: 'Isolated invitation revoked',
    });
    await rejects(() => accept(3, revoked), 'P0002');
  });
  const expired = invite(await issue(1));
  await check('expired invite cannot be consumed', async () => {
    await q(
      "update guild_admin_private.leadership_invites set created_at=now()-interval '2 days',expires_at=now()-interval '1 day' where id=$1",
      [expired.id],
    );
    await rejects(() => accept(3, expired), 'P0002');
  });
  const pending = invite(await issue(1));
  await check('unconfirmed recipient cannot accept', async () => {
    const u = invite(await issue(1, 6));
    await rejects(() => accept(6, u), 'P0002');
  });
  await check(
    'concurrent consumption permits one success and rejects the competing new nonce',
    async () => {
      const clients = [new Client(options), new Client(options)];
      await Promise.all(clients.map((c) => c.connect()));
      try {
        const results = await Promise.allSettled(
          clients.map((c) => accept(3, pending, randomUUID(), c)),
        );
        assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
        assert.equal(
          results.find((r) => r.status === 'rejected').reason.code,
          'P0002',
        );
        assert.equal(
          (
            await q(
              'select count(*) n from guild_admin_private.leader_authorizations where user_id=$1',
              [uid(3)],
            )
          ).rows[0].n,
          '1',
        );
      } finally {
        await Promise.all(clients.map((c) => c.end()));
      }
    },
  );
  await check(
    'expiry is rechecked after waiting for the governance lock',
    async () => {
      const x = invite(await issue(1)),
        c = new Client(options);
      await c.connect();
      try {
        await q(
          "update guild_admin_private.leadership_invites set expires_at=clock_timestamp()+interval '1 second' where id=$1",
          [x.id],
        );
        await q('BEGIN;select pg_advisory_xact_lock(1010,1)');
        const waiting = accept(3, x, randomUUID(), c);
        const rejected = rejects(() => waiting, 'P0002');
        await waitBlocked(c);
        await new Promise((r) => setTimeout(r, 1100));
        await q('COMMIT');
        await rejected;
      } finally {
        await q('ROLLBACK');
        await c.end();
      }
    },
  );
  await check(
    'normal administrative revocation wins before waiting consumption commits',
    async () => {
      const x = invite(await issue(1)),
        admin = new Client(options),
        recipient = new Client(options);
      await Promise.all([admin.connect(), recipient.connect()]);
      try {
        await beginAuth(admin, 'authenticated', 1);
        await admin.query(commandSql, [
          'revoke_invite',
          x.id,
          randomUUID(),
          { reason: 'Concurrent authorized revocation' },
        ]);
        const rejected = rejects(
          () => accept(3, x, randomUUID(), recipient),
          'P0002',
        );
        await waitBlocked(recipient);
        await admin.query('COMMIT');
        await rejected;
      } finally {
        await admin.query('ROLLBACK');
        await Promise.all([admin.end(), recipient.end()]);
      }
    },
  );
  await check(
    'unknown-at-issue recipient binds only after its email is verified',
    async () => {
      const future = 'future-recipient@fixtures.invalid',
        x = invite(await issue(1, future));
      assert.equal(
        (
          await q(
            'select target_uid from guild_admin_private.leadership_invites where id=$1',
            [x.id],
          )
        ).rows[0].target_uid,
        null,
      );
      try {
        await q('update auth.users set email=$1 where id=$2', [future, uid(3)]);
        await accept(3, x);
        assert.equal(
          (
            await q(
              'select target_uid from guild_admin_private.leadership_invites where id=$1',
              [x.id],
            )
          ).rows[0].target_uid,
          uid(3),
        );
      } finally {
        await q('update auth.users set email=$1 where id=$2', [
          email(3),
          uid(3),
        ]);
      }
    },
  );
  await check(
    'known recipient invitation does not transfer when its old email is reassigned',
    async () => {
      const x = invite(await issue(1));
      try {
        await q('update auth.users set email=$1 where id=$2', [
          'changed@fixtures.invalid',
          uid(3),
        ]);
        await q('update auth.users set email=$1 where id=$2', [
          email(3),
          uid(4),
        ]);
        await rejects(() => accept(4, x), 'P0002');
      } finally {
        await q('update auth.users set email=$1 where id=$2', [
          email(4),
          uid(4),
        ]);
        await q('update auth.users set email=$1 where id=$2', [
          email(3),
          uid(3),
        ]);
      }
    },
  );
  await check(
    'administrative permission is rechecked after concurrent revocation and invalidates its outstanding invitations',
    async () => {
      await command(1, 'set_admin', uid(2), {
        permissions: ['leadership.manage'],
        active: true,
        reason: 'Isolated invitation manager grant',
      });
      const old = invite(await issue(2)),
        admin = new Client(options),
        issuer = new Client(options);
      await Promise.all([admin.connect(), issuer.connect()]);
      try {
        await beginAuth(admin, 'authenticated', 1);
        await admin.query(commandSql, [
          'set_admin',
          uid(2),
          randomUUID(),
          {
            permissions: ['leadership.manage'],
            active: false,
            reason: 'Concurrent administrative grant revocation',
          },
        ]);
        const rejected = rejects(
          () =>
            command(
              2,
              'issue_leadership',
              randomUUID(),
              {
                recipientEmail: email(3),
                expiresInDays: 7,
                reason: 'Issued while permission revocation pending',
              },
              randomUUID(),
              true,
              issuer,
            ),
          '42501',
        );
        await waitBlocked(issuer);
        await admin.query('COMMIT');
        await rejected;
        await rejects(() => accept(3, old), 'P0002');
      } finally {
        await admin.query('ROLLBACK');
        await Promise.all([admin.end(), issuer.end()]);
      }
    },
  );
  await check(
    'leadership revocation is immediate without touching guild memberships',
    async () => {
      await command(1, 'revoke_leadership', uid(3), {
        reason: 'Isolated authorization revoked',
      });
      assert.equal(
        (await as('authenticated', 3, statusSql)).rows[0].result.leadership,
        'revoked',
      );
      assert.equal(await legacyData(), oldData);
    },
  );
  await check(
    'limited administrative grant only allows its explicit permissions',
    async () => {
      await command(1, 'set_admin', uid(2), {
        permissions: ['guilds.read'],
        active: true,
        reason: 'Isolated read-only administrative review',
      });
      const w = (
        await as(
          'authenticated',
          2,
          'select public.guild_governance_workspace(0) result',
        )
      ).rows[0].result;
      assert.equal(w.guilds.length, 2);
      assert(!JSON.stringify(w).includes(email(3)));
      await rejects(() => issue(2), '42501');
      await rejects(
        () =>
          command(2, 'set_admin', uid(2), {
            permissions: perms,
            active: true,
            reason: 'Attempted privilege escalation',
          }),
        '42501',
      );
    },
  );
  await check(
    'invalid or duplicate permission names cannot grant administration',
    async () => {
      for (const permissions of [
        ['service_role'],
        ['guilds.read', 'guilds.read'],
        [],
      ])
        await rejects(
          () =>
            command(1, 'set_admin', uid(2), {
              permissions,
              active: true,
              reason: 'Invalid isolated permission list',
            }),
          '22023',
        );
    },
  );
  await check('last administrative manager cannot revoke itself', () =>
    rejects(
      () =>
        command(1, 'set_admin', uid(1), {
          permissions: perms,
          active: false,
          reason: 'Attempted final administrator removal',
        }),
      '55000',
    ),
  );
  await check(
    'administrative revocation does not depend on refreshing JWT metadata',
    async () => {
      await command(1, 'set_admin', uid(2), {
        permissions: ['guilds.read'],
        active: false,
        reason: 'Read-only administrator revoked',
      });
      await rejects(
        () =>
          as('authenticated', 2, 'select public.guild_governance_workspace(0)'),
        '42501',
      );
    },
  );
  await check(
    'permission audit preserves before and after sets and revocation cannot rewrite them',
    async () => {
      await command(1, 'set_admin', uid(2), {
        permissions: ['guilds.read'],
        active: true,
        reason: 'Restore isolated read-only administrative grant',
      });
      const r = invite(
        await command(1, 'set_admin', uid(2), {
          permissions: [],
          active: false,
          reason: 'Revoke while preserving original permission set',
        }),
      );
      assert.deepEqual(r.before.permissions, ['guilds.read']);
      assert.deepEqual(r.after.permissions, ['guilds.read']);
      assert.equal(r.before.active, true);
      assert.equal(r.after.active, false);
      const h = (
        await q(
          "select result from guild_admin_private.audit where action='set_admin' and resource_id=$1 order by id desc limit 1",
          [uid(2)],
        )
      ).rows[0].result;
      assert.deepEqual(h.before, r.before);
      assert.deepEqual(h.after, r.after);
    },
  );
  await check('audit is immutable even to accidental owner updates', () =>
    rejects(
      () => q("update guild_admin_private.audit set reason='altered fixture'"),
      '42501',
    ),
  );
  await check(
    'recovery refuses to discard grants invites or immutable audit',
    async () => {
      await rejects(() => q(`BEGIN;${recovery}\nCOMMIT;`), 'P0001');
      await q('ROLLBACK');
    },
  );
  await check(
    'containment denies new RPCs and preserves every governance row',
    async () => {
      const before = JSON.stringify(
        (
          await q(
            'select id,action,reason,result from guild_admin_private.audit order by id',
          )
        ).rows,
      );
      await q(
        `BEGIN;${containment}\nSAVEPOINT access_probe;SET LOCAL ROLE authenticated;`,
      );
      await rejects(() => q(statusSql), '42501');
      await q('ROLLBACK TO SAVEPOINT access_probe');
      assert.equal(
        JSON.stringify(
          (
            await q(
              'select id,action,reason,result from guild_admin_private.audit order by id',
            )
          ).rows,
        ),
        before,
      );
      assert.equal(await legacyData(), oldData);
      await q('ROLLBACK');
    },
  );
  await check(
    'legacy functions and single-guild constraint remain intact in this foundation',
    async () => {
      const now = JSON.parse(await legacyFunctions()).filter(
          (x) => x.signature !== 'release_scope()',
        ),
        before = JSON.parse(oldFunctions).filter(
          (x) => x.signature !== 'release_scope()',
        );
      assert.deepEqual(now, before);
      assert(
        (
          await q(
            "select to_regclass('public.guild_members_one_active_guild_per_traveler_idx') x",
          )
        ).rows[0].x,
      );
      assert.equal(await legacyData(), oldData);
    },
  );
  await check('no economic permissions or grants introduced', async () => {
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
      (
        await q(
          "select has_function_privilege('authenticated','public.apply_guild_mission_reward(uuid,uuid)','EXECUTE') x",
        )
      ).rows[0].x,
      false,
    );
  });
  fs.writeFileSync(
    root + '/postgres-results.json',
    JSON.stringify(
      {
        passed: true,
        checks,
        isolated: true,
        hostedProof: false,
        realGrants: false,
        syntheticData: true,
        scope: '010A.1 only; no legacy multi-guild release',
        version: (await q('select version()')).rows[0].version,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({ passed: true, checks: checks.length, hostedProof: false }),
  );
} finally {
  await db.end();
  if (fs.existsSync(path.join(cluster, 'postmaster.pid')))
    execFileSync(
      path.join(bin, 'pg_ctl.exe'),
      ['-D', cluster, '-m', 'fast', '-w', 'stop'],
      { windowsHide: true, stdio: 'ignore', timeout: 10000 },
    );
}
