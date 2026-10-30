// Synthetic PostgreSQL loopback proof. No Supabase session or player data imported.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execFileSync } from 'node:child_process';
import { randomUUID, createHash } from 'node:crypto';
import { Client } from 'pg';

const lessonCases = process.env.RPG_010B3_CASES === '1';
const root = path.resolve(
    lessonCases ? 'build/rpg-dev-010b3' : 'build/rpg-dev-010b',
  ),
  bin = path.resolve(
    process.env.RPG_POSTGRES_BIN ??
      '../rpgjovemcristao-rpg-dev-007/build/rpg-dev-007/postgres-tool/node_modules/@embedded-postgres/windows-x64/native/bin',
  );
const productionPackage = process.env.RPG_010B_PRODUCTION_PACKAGE === '1';
const mapped = productionPackage
  ? {
      'supabase/migrations/20261030105539_rpg_dev_010b_classes_test.sql':
        'supabase/migrations/20261030212748_rpg_dev_010b_classes_production.sql',
      'supabase/migrations/20261030110258_rpg_dev_010b_member_invites_test.sql':
        'supabase/migrations/20261030212801_rpg_dev_010b_member_invites_production.sql',
      'supabase/migrations/20261030131230_rpg_dev_010b_legacy_invites_test.sql':
        'supabase/migrations/20261030212807_rpg_dev_010b_legacy_invites_production.sql',
      'packages/database/proposals/rpg-dev-010b-classes-recovery-empty.sql':
        'packages/database/proposals/rpg-dev-010b-production-recovery-empty.sql',
      'packages/database/proposals/rpg-dev-010b-classes-containment.sql':
        'packages/database/proposals/rpg-dev-010b-production-containment.sql',
    }
  : {};
const read = (p) =>
  fs.readFileSync(mapped[p] ?? p, 'utf8').replaceAll('\r\n', '\n');
const migration = read(
  'supabase/migrations/20261030105539_rpg_dev_010b_classes_test.sql',
);
const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const tid = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
fs.mkdirSync(root, { recursive: true });
const cluster = path.join(root, 'isolated-' + Date.now());
const port = await new Promise((resolve) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => {
    const p = s.address().port;
    s.close(() => resolve(p));
  });
});
const options = {
  host: '127.0.0.1',
  port,
  user: 'postgres',
  database: 'postgres',
};
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
const db = new Client(options),
  checks = [],
  connections = [];
const q = (s, p) => db.query(s, p);
async function tx(s, p) {
  try {
    await q('BEGIN');
    const r = await q(s, p);
    await q('COMMIT');
    return r;
  } catch (e) {
    await q('ROLLBACK');
    throw e;
  }
}
async function as(n, s, p, role = 'authenticated', client = db) {
  try {
    await client.query('BEGIN');
    await client.query('SET LOCAL ROLE ' + role);
    await client.query(
      "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
      [n === null ? '' : uid(n), JSON.stringify({ is_anonymous: false })],
    );
    const r = await client.query(s, p);
    await client.query('COMMIT');
    return r;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
}
const denied = async (fn, code) => {
  await assert.rejects(fn, (e) => e.code === code);
};
const check = async (name, fn) => {
  await fn();
  checks.push({ name, pass: true });
  fs.writeFileSync(
    path.join(root, 'postgres-progress.json'),
    JSON.stringify({ checks }, null, 2),
  );
};
const cmd = (
  n,
  g,
  c,
  action,
  revision,
  data,
  request = randomUUID(),
  client = db,
) =>
  as(
    n,
    'select public.ebd_classes_command($1,$2,$3,$4,$5,$6,$7) x',
    [tid(n), uid(g), uid(c), action, request, revision, data],
    'authenticated',
    client,
  ).then((r) => r.rows[0].x);
const workspace = (n, g, c = null) =>
  as(n, 'select public.ebd_classes_workspace($1,$2,$3) x', [
    tid(n),
    uid(g),
    c === null ? null : uid(c),
  ]).then((r) => r.rows[0].x);
const snapshot = async () =>
  (
    await q(
      "select jsonb_build_object('travelers',(select jsonb_agg(to_jsonb(x) order by id) from public.travelers x),'wallets',(select jsonb_agg(to_jsonb(x) order by traveler_id) from public.wallets x),'stats',(select jsonb_agg(to_jsonb(x) order by traveler_id) from public.traveler_stats x),'inventory',(select jsonb_agg(to_jsonb(x) order by id) from public.inventory x),'lessons',(select jsonb_agg(to_jsonb(x) order by id) from public.guild_lessons x)) x",
    )
  ).rows[0].x;
try {
  await db.connect();
  assert.equal(
    (await q('show listen_addresses')).rows[0].listen_addresses,
    '127.0.0.1',
  );
  await q(
    read('tests/fixtures/offline-authority-postgres.ts').match(
      /query\(`(CREATE ROLE anon[\s\S]+?CREATE PUBLICATION supabase_realtime;)`\);/,
    )[1],
  );
  await q(
    'alter table auth.users add column email text,add column email_confirmed_at timestamptz,add column deleted_at timestamptz',
  );
  for (const lock of ['consolidation-002', 'consolidation-004'])
    for (const step of JSON.parse(
      read(`packages/database/reviewed/${lock}.lock.json`),
    ).steps) {
      const s = read(step.source);
      assert.equal(createHash('sha256').update(s).digest('hex'), step.sha256);
      await q(/^\s*BEGIN;\s*$/m.test(s) ? s : `BEGIN;${s}\nCOMMIT;`);
    }
  await tx(
    read('supabase/migrations/20261024151503_release_ebd_001_isolation.sql'),
  );
  await q(
    "create or replace function public.release_scope() returns text language sql immutable as $$select 'hero-equipment-006'::text$$",
  );
  await tx(
    read(
      'supabase/migrations/20261028110010_rpg_dev_010a_governance_foundation_test.sql',
    ),
  );
  await tx(
    read(
      'supabase/migrations/20261028213600_rpg_dev_010a2_multiguild_test.sql',
    ),
  );
  await tx(
    read(
      'supabase/migrations/20261029063610_rpg_dev_010a2_workspace_locking_test.sql',
    ),
  );
  await tx(read('packages/database/proposals/rpg-dev-010a2-containment.sql'));
  await tx(
    read(
      'supabase/migrations/20261029070620_rpg_dev_010a2_ebd_conflict_test.sql',
    ),
  );
  await q(
    'update guild_admin_private.multiguild_control set writes_enabled=true,revision=revision+1',
  );
  for (let n = 1; n <= 104; n++) {
    await q('insert into auth.users values($1,false,$2,now())', [
      uid(n),
      `qa-${n}@fixtures.invalid`,
    ]);
    await q(
      "insert into public.travelers(id,user_id,name,body_type,skin_tone,hair_style,avatar_variant,is_active) values($1,$2,$3,'male','medio','curto','musgo',true)",
      [tid(n), uid(n), 'Synthetic ' + n],
    );
  }
  for (const g of [100, 101]) {
    await q(
      'insert into public.guilds(id,name,created_by_user_id,leader_traveler_id) values($1,$2,$3,$4)',
      [uid(g), 'Fixture ' + g, uid(1), tid(1)],
    );
    for (const n of [1, 2, 3])
      await q(
        "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,$3,'active')",
        [uid(g), tid(n), n === 1 ? 'leader' : 'member'],
      );
  }
  if (productionPackage)
    await q(
      "create or replace function public.release_scope() returns text language sql immutable as $$select 'guild-ebd-001'::text$$",
    );
  const before = await snapshot();
  await check('reject productive scope before DDL', async () => {
    await q(
      `create or replace function public.release_scope() returns text language sql immutable as $$select '${productionPackage ? 'hero-equipment-006' : 'guild-ebd-001'}'::text$$`,
    );
    await denied(() => tx(migration), 'P0001');
    await q(
      `create or replace function public.release_scope() returns text language sql immutable as $$select '${productionPackage ? 'guild-ebd-001' : 'hero-equipment-006'}'::text$$`,
    );
  });
  await check(
    'empty recovery restores preexisting functions, tables and data',
    async () => {
      const defs = async () =>
        (
          await q(
            "select oid::regprocedure::text signature,pg_get_functiondef(oid) definition,proacl::text acl from pg_proc where pronamespace in('public'::regnamespace,'ebd_ops'::regnamespace,'guild_admin_private'::regnamespace,'guild_invite_private'::regnamespace) order by 1",
          )
        ).rows;
      const beforeDefs = await defs();
      await tx(migration);
      await tx(
        read(
          'supabase/migrations/20261030110258_rpg_dev_010b_member_invites_test.sql',
        ),
      );
      await tx(
        read(
          'supabase/migrations/20261030131230_rpg_dev_010b_legacy_invites_test.sql',
        ),
      );
      if (!productionPackage)
        await tx(
          read(
            'packages/database/proposals/rpg-dev-010b-legacy-recovery-empty.sql',
          ),
        );
      await tx(
        read(
          'packages/database/proposals/rpg-dev-010b-classes-recovery-empty.sql',
        ),
      );
      assert.deepEqual(await defs(), beforeDefs);
      assert.deepEqual(await snapshot(), before);
    },
  );
  await tx(migration);
  if (lessonCases) {
    await tx(
      read(
        'supabase/migrations/20261030110258_rpg_dev_010b_member_invites_test.sql',
      ),
    );
    await tx(
      read(
        'supabase/migrations/20261030131230_rpg_dev_010b_legacy_invites_test.sql',
      ),
    );
    await (
      await import('./rpg-dev-010b3-cases.mjs')
    ).run({ q, tx, as, check, denied, uid, tid, options, connections, read });
  } else {
    await check('migration cannot run twice', () =>
      denied(() => tx(migration), 'P0001'),
    );
    await check('private tables deny direct reads and writes', async () => {
      for (const role of ['anon', 'authenticated', 'service_role'])
        for (const table of [
          'classes',
          'members',
          'teachers',
          'history',
          'commands',
        ]) {
          await denied(
            () => as(2, `select * from ebd_class_private.${table}`, [], role),
            '42501',
          );
          await denied(
            () => as(2, `delete from ebd_class_private.${table}`, [], role),
            '42501',
          );
        }
    });
    await check('anon and service cannot call class wrappers', async () => {
      for (const role of ['anon', 'service_role'])
        await denied(
          () =>
            as(
              null,
              'select public.ebd_classes_workspace($1,$2,null)',
              [tid(1), uid(100)],
              role,
            ),
          '42501',
        );
    });
    await check('owned active identity required', () =>
      denied(
        () =>
          as(2, 'select public.ebd_classes_workspace($1,$2,null)', [
            tid(1),
            uid(100),
          ]),
        '42501',
      ),
    );
    const request = randomUUID();
    await check(
      'same leader creates two classes in one Guild and another Guild',
      async () => {
        for (const [g, c] of [
          [100, 200],
          [100, 201],
          [101, 202],
        ])
          await cmd(
            1,
            g,
            c,
            'save',
            0,
            { name: 'Class ' + c, description: 'Synthetic' },
            c === 200 ? request : randomUUID(),
          );
        assert.equal((await workspace(1, 100)).classes.length, 2);
        assert.equal((await workspace(1, 101)).classes.length, 1);
      },
    );
    await check(
      'creation replay does not create a duplicate class or history',
      async () => {
        const h = (
          await q('select count(*)::int n from ebd_class_private.history')
        ).rows[0].n;
        assert.equal(
          (
            await cmd(
              1,
              100,
              200,
              'save',
              0,
              { name: 'Class 200', description: 'Synthetic' },
              request,
            )
          ).replayed,
          true,
        );
        assert.equal(
          (await q('select count(*)::int n from ebd_class_private.history'))
            .rows[0].n,
          h,
        );
      },
    );
    await check('same request different payload rejected', () =>
      denied(
        () =>
          cmd(
            1,
            100,
            200,
            'save',
            0,
            { name: 'Changed', description: '' },
            request,
          ),
        '22023',
      ),
    );
    await check('no leader privilege inferred for ordinary member', () =>
      denied(
        () => cmd(2, 100, 203, 'save', 0, { name: 'Denied', description: '' }),
        '42501',
      ),
    );
    await check('cross Guild class id rejected', () =>
      denied(() => cmd(1, 101, 200, 'state', 1, { status: 'paused' }), '42501'),
    );
    await check('members see no classes before explicit enrollment', async () =>
      assert.equal((await workspace(2, 100)).classes.length, 0),
    );
    await check(
      'same student joins classes in multiple Guilds without losing links',
      async () => {
        for (const [g, c] of [
          [100, 200],
          [100, 201],
          [101, 202],
        ])
          await cmd(1, g, c, 'member', 0, { travelerId: tid(2), active: true });
        assert.equal((await workspace(2, 100)).classes.length, 2);
        assert.equal((await workspace(2, 101)).classes.length, 1);
      },
    );
    await check(
      'class teacher grant does not grant legacy Guild teacher or leadership',
      async () => {
        await cmd(1, 100, 200, 'teacher', 0, {
          travelerId: tid(2),
          active: true,
          publish: true,
          attend: true,
        });
        assert.equal(
          (await workspace(2, 100, 200)).classes.find((c) => c.id === uid(200))
            .role,
          'teacher',
        );
        assert.equal(
          (await q('select count(*)::int n from public.guild_ebd_teachers'))
            .rows[0].n,
          0,
        );
        await denied(
          () =>
            cmd(2, 100, 200, 'teacher', 0, {
              travelerId: tid(3),
              active: true,
              publish: true,
              attend: true,
            }),
          '42501',
        );
      },
    );
    await check('teacher roster isolated to assigned class', async () => {
      assert.equal((await workspace(2, 100, 200)).members.length, 1);
      assert(
        (await workspace(2, 100, 201)).members.every((m) => m.id === tid(2)),
      );
    });
    await check(
      'teacher revocation immediate with same subject and JWT claims',
      async () => {
        await cmd(1, 100, 200, 'teacher', 1, {
          travelerId: tid(2),
          active: false,
          publish: false,
          attend: false,
        });
        assert(
          (await workspace(2, 100, 200)).members.every((m) => m.id === tid(2)),
        );
        assert.equal(
          (await workspace(2, 100, 200)).classes.find((c) => c.id === uid(200))
            .role,
          'student',
        );
      },
    );
    await check(
      'student leaves only selected class, history and other classes preserved',
      async () => {
        await cmd(2, 100, 200, 'leave', 1, {});
        await denied(() => workspace(2, 100, 200), '42501');
        assert.equal((await workspace(2, 100)).classes.length, 1);
        assert.equal((await workspace(2, 101)).classes.length, 1);
      },
    );
    await check(
      'removed member loses class access without changing another Guild',
      async () => {
        await cmd(1, 100, 201, 'member', 1, {
          travelerId: tid(2),
          active: false,
        });
        await denied(() => workspace(2, 100, 201), '42501');
        assert.equal((await workspace(2, 101)).classes.length, 1);
      },
    );
    await check(
      'simultaneous edits produce one success and one PT409, no retry code40001',
      async () => {
        const a = new Client(options),
          b = new Client(options);
        await a.connect();
        await b.connect();
        connections.push(a, b);
        const results = await Promise.allSettled([
          cmd(1, 100, 200, 'state', 1, { status: 'paused' }, randomUUID(), a),
          cmd(1, 100, 200, 'state', 1, { status: 'archived' }, randomUUID(), b),
        ]);
        assert.equal(results.filter((x) => x.status === 'fulfilled').length, 1);
        assert.deepEqual(
          results
            .filter((x) => x.status === 'rejected')
            .map((x) => x.reason.code),
          ['PT409'],
        );
      },
    );
    await check(
      'Guild removal revokes only its class memberships and teacher grants permanently',
      async () => {
        await cmd(1, 101, 202, 'teacher', 0, {
          travelerId: tid(2),
          active: true,
          publish: true,
          attend: true,
        });
        await as(1, 'select public.guild_scoped_command($1,$2,$3,$4,$5,$6)', [
          tid(1),
          uid(101),
          'remove',
          tid(2),
          randomUUID(),
          {},
        ]);
        assert.equal(
          (
            await q(
              'select active from ebd_class_private.teachers where class_id=$1 and traveler_id=$2',
              [uid(202), tid(2)],
            )
          ).rows[0].active,
          false,
        );
        await q(
          "update public.guild_members set status='active' where guild_id=$1 and traveler_id=$2",
          [uid(101), tid(2)],
        );
        assert.equal((await workspace(2, 101)).classes.length, 0);
      },
    );
    await tx(
      read(
        'supabase/migrations/20261030110258_rpg_dev_010b_member_invites_test.sql',
      ),
    );
    await (
      await import('./rpg-dev-010b-invites-cases.mjs')
    ).run({ q, as, cmd, check, denied, uid, tid, options, connections });
    await tx(
      read(
        'supabase/migrations/20261030131230_rpg_dev_010b_legacy_invites_test.sql',
      ),
    );
    await (
      await import('./rpg-dev-010b-legacy-cases.mjs')
    ).run({
      q,
      as,
      check,
      denied,
      uid,
      tid,
      options,
      connections,
      recoverySQL: productionPackage
        ? read(
            'packages/database/proposals/rpg-dev-010b-classes-recovery-empty.sql',
          )
        : read(
            'packages/database/proposals/rpg-dev-010b-legacy-recovery-empty.sql',
          ),
    });
    await check(
      'recovery refuses to erase issued classes, grants or audit',
      () =>
        denied(
          () =>
            tx(
              read(
                'packages/database/proposals/rpg-dev-010b-classes-recovery-empty.sql',
              ),
            ),
          'P0001',
        ),
    );
    await check(
      'containment preserves reads and state but denies class writes',
      async () => {
        const count = (
          await q('select count(*)::int n from ebd_class_private.history')
        ).rows[0].n;
        await tx(
          read(
            'packages/database/proposals/rpg-dev-010b-classes-containment.sql',
          ),
        );
        await denied(
          () =>
            cmd(1, 100, 204, 'save', 0, { name: 'Denied', description: '' }),
          '42501',
        );
        assert.equal((await workspace(1, 100)).classes.length, 2);
        assert.equal(
          (await q('select count(*)::int n from ebd_class_private.history'))
            .rows[0].n,
          count,
        );
      },
    );
    await check(
      'all preexisting game data unchanged; no XP or economic execution',
      async () => {
        assert.deepEqual(await snapshot(), before);
        assert.equal(
          (
            await q(
              "select has_function_privilege('authenticated','public.economy_authority(uuid,uuid,text,jsonb)','EXECUTE') allowed",
            )
          ).rows[0].allowed,
          false,
        );
      },
    );
    await check(
      'reviewed legacy EBD and invitation definitions and ACLs are unchanged',
      async () => {
        const baseline = JSON.parse(
          read('tests/fixtures/rpg-dev-010b-baseline.json'),
        );
        for (const f of baseline.functions) {
          const actual = (
            await q(
              'select md5(pg_get_functiondef($1::regprocedure)) hash,to_jsonb(proacl) acl from pg_proc where oid=$1::regprocedure',
              [f.signature],
            )
          ).rows[0];
          if (
            ![
              'guild_invite_private.request_invite(text,uuid)',
              'guild_invite_private.revoke_invite(uuid,uuid,uuid)',
            ].includes(f.signature)
          )
            assert.equal(actual.hash, f.hash, f.signature);
          assert.deepEqual(actual.acl, f.acl, f.signature);
        }
      },
    );
  }
  const result = {
    syntheticData: true,
    productionProof: false,
    environment: 'PostgreSQL17.10 loopback',
    remoteMigrationExecuted: false,
    productionPackage,
    total: checks.length,
    pass: true,
    checks,
  };
  fs.writeFileSync(
    path.join(
      root,
      productionPackage
        ? 'postgres-production-results.json'
        : 'postgres-results.json',
    ),
    JSON.stringify(result, null, 2),
  );
  console.log(
    JSON.stringify({
      state: lessonCases
        ? '010B3_LESSONS_ISOLATED_PASS'
        : '010B_CLASSES_ISOLATED_PASS',
      checks: checks.length,
    }),
  );
} finally {
  await q('ROLLBACK').catch(() => {});
  for (const c of connections) await c.end().catch(() => {});
  await db.end().catch(() => {});
  execFileSync(
    path.join(bin, 'pg_ctl.exe'),
    ['-D', cluster, '-m', 'fast', '-w', 'stop'],
    { windowsHide: true, stdio: 'ignore', timeout: 10000 },
  );
}
