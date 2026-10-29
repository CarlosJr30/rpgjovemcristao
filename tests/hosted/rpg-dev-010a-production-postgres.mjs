// Production package rehearsal, loopback with synthetic accounts only. Never hosted proof.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { Client } from 'pg';

const root = path.resolve('build/rpg-dev-010a-production');
const bin = path.resolve(
  process.env.RPG_POSTGRES_BIN ??
    '../rpgjovemcristao-rpg-dev-007/build/rpg-dev-007/postgres-tool/node_modules/@embedded-postgres/windows-x64/native/bin',
);
const read = (p) => fs.readFileSync(p, 'utf8').replaceAll('\r\n', '\n');
const foundation = read(
  'supabase/migrations/20261029082857_rpg_dev_010a_governance_production.sql',
);
const compatibility = read(
  'supabase/migrations/20261029082907_rpg_dev_010a2_multiguild_production.sql',
);
const proposal = (n) =>
  read(`packages/database/proposals/rpg-dev-010a-production-${n}.sql`);
const baseline = JSON.parse(
  read('tests/fixtures/rpg-dev-010a-production-functions.json'),
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
};
const db = new Client(options),
  connections = [],
  checks = [];
const q = (s, p) => db.query(s, p);
const check = async (name, fn) => {
  await fn();
  checks.push({ name, pass: true });
  fs.writeFileSync(
    path.join(root, 'progress.json'),
    JSON.stringify({ checks }, null, 2),
  );
};
const tx = async (s, p) => {
  try {
    await q('BEGIN');
    const r = await q(s, p);
    await q('COMMIT');
    return r;
  } catch (e) {
    await q('ROLLBACK');
    throw e;
  }
};
const denied = (fn, code) => assert.rejects(fn, (e) => e.code === code);
const as = async (n, s, p = [], role = 'authenticated') => {
  await q('BEGIN');
  try {
    await q('SET LOCAL ROLE ' + role);
    await q(
      "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
      [n === null ? '' : uid(n), JSON.stringify({ is_anonymous: false })],
    );
    const r = await q(s, p);
    await q('COMMIT');
    return r;
  } catch (e) {
    await q('ROLLBACK');
    throw e;
  }
};
const definitions = async () =>
  (
    await q(
      "select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) args,pg_get_functiondef(p.oid) definition,p.proacl::text acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('public','economy_private','story_private','guild_ops','ebd_ops','guild_invite_private','guild_chat_private','release_ebd','guild_admin_private') order by 1,2,3",
    )
  ).rows;
const originalSecurity = async () =>
  (
    await q(
      "select jsonb_build_object('tables',(select jsonb_agg(jsonb_build_object('name',n.nspname||'.'||c.relname,'rls',c.relrowsecurity,'forced',c.relforcerowsecurity,'acl',c.relacl,'columns',(select jsonb_agg(jsonb_build_object('name',attname,'type',format_type(atttypid,atttypmod),'acl',attacl) order by attnum) from pg_attribute where attrelid=c.oid and attnum>0 and not attisdropped)) order by n.nspname,c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname in('public','economy_private','story_private','guild_ops','ebd_ops','guild_chat_private','guild_invite_private','release_ebd')),'policies',(select jsonb_agg(to_jsonb(p) order by schemaname,tablename,policyname) from pg_policies p where schemaname<>'guild_admin_private')) snapshot",
    )
  ).rows[0].snapshot;
const data = async () =>
  (
    await q(
      "select jsonb_build_object('travelers',(select jsonb_agg(to_jsonb(t) order by id) from public.travelers t),'wallets',(select jsonb_agg(to_jsonb(t) order by traveler_id) from public.wallets t),'stats',(select jsonb_agg(to_jsonb(t) order by traveler_id) from public.traveler_stats t),'inventory',(select jsonb_agg(to_jsonb(t) order by id) from public.inventory t),'guilds',(select jsonb_agg(to_jsonb(t) order by id) from public.guilds t),'members',(select jsonb_agg(to_jsonb(t) order by id) from public.guild_members t)) x",
    )
  ).rows[0].x;
const setScope = (s) =>
  q(
    `create or replace function public.release_scope() returns text language sql immutable as $$select '${s}'::text$$`,
  );
const apply = async () => {
  await tx(foundation);
  await q(
    "insert into supabase_migrations.schema_migrations(version,name) values('20990101000000','rpg_dev_010a_governance_production')",
  );
  await tx(compatibility);
};
try {
  await db.connect();
  assert.equal(
    (await q('SHOW listen_addresses')).rows[0].listen_addresses,
    '127.0.0.1',
  );
  await q(
    read('tests/fixtures/offline-authority-postgres.ts').match(
      /query\(`(CREATE ROLE anon[\s\S]+?CREATE PUBLICATION supabase_realtime;)`\);/,
    )[1],
  );
  await q(
    'alter table auth.users add column email text,add column email_confirmed_at timestamptz',
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
  await tx(
    read('supabase/migrations/20261026192057_rpg_dev_007_owned_cards_read.sql'),
  );
  await tx(
    read(
      'supabase/migrations/20261027095417_rpg_dev_008_story_progress_read.sql',
    ),
  );
  // Exact reviewed production function metadata; no production account or game rows are loaded.
  await q('SET check_function_bodies=off');
  for (const f of baseline.functions) {
    await q(f.definition);
    await q(
      `REVOKE ALL ON FUNCTION ${f.signature} FROM PUBLIC,anon,authenticated,service_role`,
    );
    for (const acl of f.acl ?? []) {
      const role = acl.split('=')[0];
      assert(
        ['postgres', 'anon', 'authenticated', 'service_role', ''].includes(
          role,
        ),
      );
      if (role !== 'postgres')
        await q(
          `GRANT EXECUTE ON FUNCTION ${f.signature} TO ${role || 'PUBLIC'}`,
        );
    }
  }
  await q('SET check_function_bodies=on');
  await q(
    'CREATE SCHEMA supabase_migrations;CREATE TABLE supabase_migrations.schema_migrations(version text primary key,name text);insert into supabase_migrations.schema_migrations(version) select generate_series(1,8)::text',
  );
  for (const n of [1, 2]) {
    await q('insert into auth.users values($1,false,$2,now())', [
      uid(n),
      `production-fixture-${n}@fixtures.invalid`,
    ]);
    await q(
      "insert into public.travelers(id,user_id,name,body_type,skin_tone,hair_style,avatar_variant,is_active,level) values($1,$2,$3,'male','medio','curto','musgo',true,$4)",
      [tid(n), uid(n), 'Synthetic ' + n, n === 1 ? 50 : 1],
    );
  }
  await q(
    'insert into public.guilds(id,name,created_by_user_id,leader_traveler_id) values($1,$2,$3,$4)',
    [uid(100), 'Legacy fixture', uid(1), tid(1)],
  );
  await q(
    "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'leader','active')",
    [uid(100), tid(1)],
  );
  const beforeData = await data(),
    beforeDefinitions = await definitions(),
    beforeSecurity = await originalSecurity();
  await check('production package rejects TEST scope before DDL', async () => {
    await setScope('hero-equipment-006');
    await denied(() => tx(foundation), 'P0001');
    assert.equal(
      (await q("select to_regnamespace('guild_admin_private') x")).rows[0].x,
      null,
    );
    await q(
      baseline.functions.find((f) => f.signature === 'release_scope()')
        .definition,
    );
  });
  await check(
    'production package rejects changed preexisting ACL',
    async () => {
      await q(
        'grant execute on function public.create_guild(uuid,text,text) to anon',
      );
      await denied(() => tx(foundation), 'P0001');
      await q(
        'revoke execute on function public.create_guild(uuid,text,text) from anon',
      );
    },
  );
  await check(
    'production package rejects unexpected migration history',
    async () => {
      await q(
        "insert into supabase_migrations.schema_migrations(version) values('unexpected')",
      );
      await denied(() => tx(foundation), 'P0001');
      await q(
        "delete from supabase_migrations.schema_migrations where version='unexpected'",
      );
    },
  );
  await check(
    'foundation-only failure recovery restores exact legacy metadata and data',
    async () => {
      await tx(foundation);
      fs.writeFileSync(
        path.join(root, 'foundation-functions.json'),
        JSON.stringify(
          (
            await q(
              "select p.oid::regprocedure::text signature,md5(pg_get_functiondef(p.oid)) md5,to_jsonb(p.proacl) acl,pg_get_userbyid(p.proowner) owner from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='guild_admin_private' or p.proname in('guild_governance_status','guild_governance_command','guild_leadership_preview','guild_governance_workspace','guild_governance_history') order by 1",
            )
          ).rows,
          null,
          2,
        ),
      );
      await tx(proposal('foundation-recovery-empty'));
      assert.deepEqual(await definitions(), beforeDefinitions);
      assert.deepEqual(await data(), beforeData);
    },
  );
  await check(
    'compatibility rejects a foreign migration name despite valid schema and row count',
    async () => {
      await tx(foundation);
      await q(
        "insert into supabase_migrations.schema_migrations(version,name) values('20990101000000','unapproved_foreign_foundation')",
      );
      await denied(() => tx(compatibility), 'P0001');
      assert.equal(
        (
          await q(
            "select to_regclass('guild_admin_private.multiguild_control') x",
          )
        ).rows[0].x,
        null,
      );
      // Local synthetic history only; remote compensation must append a new migration.
      await q(
        "delete from supabase_migrations.schema_migrations where version='20990101000000'",
      );
      await tx(proposal('foundation-recovery-empty'));
      assert.deepEqual(await definitions(), beforeDefinitions);
    },
  );
  await check(
    'independent package accepts connector-assigned version with exact reviewed migration name',
    async () => {
      await apply();
      assert.deepEqual(await data(), beforeData);
      assert.equal(
        (
          await q(
            'select count(*)::int n from guild_admin_private.admin_grants',
          )
        ).rows[0].n,
        0,
      );
      assert.equal(
        (await q('select count(*)::int n from guild_admin_private.audit'))
          .rows[0].n,
        0,
      );
    },
  );
  await check(
    'first production install uses corrected locking and nonretryable conflicts',
    async () => {
      assert.equal(
        (
          await q(
            "select provolatile v from pg_proc where oid='public.guild_scoped_ebd_workspace(uuid,uuid,integer)'::regprocedure",
          )
        ).rows[0].v,
        'v',
      );
      const s = (
        await q(
          "select pg_get_functiondef('ebd_ops.command(uuid,uuid,text,uuid,integer,jsonb)'::regprocedure) s",
        )
      ).rows[0].s;
      assert.equal((s.match(/ERRCODE='PT409'/g) || []).length, 8);
      assert(!s.includes('40001'));
    },
  );
  await check(
    'preexisting table column grants RLS and policies remain exact',
    async () => {
      assert.deepEqual(await originalSecurity(), beforeSecurity);
    },
  );
  await check(
    'all 68 installed authority surfaces match final hosted TEST definitions and ACLs',
    async () => {
      const contract = JSON.parse(
        read('tests/fixtures/rpg-dev-010a-production-contract.json'),
      );
      assert.equal(contract.functions.length, 68);
      for (const f of contract.functions) {
        const actual = (
          await q(
            'select md5(pg_get_functiondef(oid)) hash,to_jsonb(proacl) proacl from pg_proc where oid=$1::regprocedure',
            [f.signature],
          )
        ).rows[0];
        assert.equal(actual.hash, f.definitionMD5, f.signature);
        assert.deepEqual(actual.proacl, f.acl, f.signature);
      }
    },
  );
  await check('legacy level50 leader is not inferred to be Admin', async () => {
    const s = (await as(1, 'select public.guild_scoped_status() x')).rows[0].x;
    assert.equal(s.administrator, false);
    assert.equal(s.permissions.length, 0);
  });
  await check(
    'writes start contained while old membership reads remain available',
    async () => {
      assert.equal(
        (
          await q(
            'select writes_enabled from guild_admin_private.multiguild_control',
          )
        ).rows[0].writes_enabled,
        false,
      );
      assert.equal(
        (await as(1, 'select public.guild_scoped_contexts($1) x', [tid(1)]))
          .rows[0].x.guilds.length,
        1,
      );
      await denied(
        () =>
          as(1, 'select public.create_guild($1,$2,$3)', [
            tid(1),
            'Forbidden',
            'No grant',
          ]),
        '55000',
      );
    },
  );
  await check(
    'anon service and direct bootstrap application access remain denied',
    async () => {
      for (const role of ['anon', 'service_role'])
        await denied(
          () => as(null, 'select public.guild_scoped_status()', [], role),
          '42501',
        );
      await denied(
        () =>
          as(1, 'select guild_admin_private.bootstrap_admin($1,$2,$3,$4)', [
            uid(1),
            ['admins.manage'],
            'Forbidden application bootstrap',
            randomUUID(),
          ]),
        '42501',
      );
    },
  );
  await check(
    'private tables retain RLS and no application data grants',
    async () => {
      assert.equal(
        (
          await q(
            "select count(*)::int n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='guild_admin_private' and relkind='r' and relrowsecurity",
          )
        ).rows[0].n,
        6,
      );
      for (const role of ['anon', 'authenticated', 'service_role'])
        assert.equal(
          (
            await q(
              "select has_table_privilege($1,'guild_admin_private.admin_grants','SELECT,INSERT,UPDATE,DELETE') allowed",
              [role],
            )
          ).rows[0].allowed,
          false,
        );
    },
  );
  await check(
    'empty recovery restores all preexisting function bodies ACLs index and data',
    async () => {
      await tx(proposal('recovery-empty'));
      assert.deepEqual(await definitions(), beforeDefinitions);
      assert.deepEqual(await data(), beforeData);
      assert(
        (
          await q(
            "select to_regclass('public.guild_members_one_active_guild_per_traveler_idx') x",
          )
        ).rows[0].x,
      );
      await q(
        "delete from supabase_migrations.schema_migrations where version='20990101000000'",
      );
    },
  );
  await check(
    'same independent package reinstalls after empty local roundtrip',
    async () => {
      await apply();
      assert.deepEqual(await data(), beforeData);
    },
  );
  await check(
    'bootstrap template refuses absence of owner approval reference',
    () => denied(() => tx(proposal('bootstrap')), 'P0001'),
  );
  await check(
    'activation refuses absence of exact release metadata and Admin',
    () => denied(() => tx(proposal('activate')), 'P0001'),
  );
  await check(
    'explicit synthetic owner designation creates only grant and immutable audit',
    async () => {
      await q('BEGIN');
      await q(
        "select set_config('rpg010a.owner_approved','true',true),set_config('rpg010a.approved_admin_uid',$1,true),set_config('rpg010a.confirmed_avatar_id',$2,true),set_config('rpg010a.approved_request_id',$3,true),set_config('rpg010a.approval_reference','Synthetic isolated owner designation only',true)",
        [uid(1), tid(1), randomUUID()],
      );
      await q(proposal('bootstrap'));
      await q('COMMIT');
      assert.deepEqual(await data(), beforeData);
      assert.equal(
        (await q('select count(*)::int n from guild_admin_private.audit'))
          .rows[0].n,
        1,
      );
    },
  );
  await check('issued bootstrap forbids destructive recovery', () =>
    denied(() => tx(proposal('recovery-empty')), 'P0001'),
  );
  await check(
    'approved exact synthetic release metadata permits controlled activation',
    async () => {
      await q('BEGIN');
      await q(
        "select set_config('rpg010a.approved_sha',$1,true),set_config('rpg010a.ready_sha',$1,true),set_config('rpg010a.security_gates_passed','true',true)",
        ['1'.repeat(40)],
      );
      await q(proposal('activate'));
      await q('COMMIT');
      assert.equal(
        (
          await q(
            'select writes_enabled from guild_admin_private.multiguild_control',
          )
        ).rows[0].writes_enabled,
        true,
      );
    },
  );
  await check('Admin designation does not grant leadership creation', () =>
    denied(
      () =>
        as(1, 'select public.create_guild($1,$2,$3)', [
          tid(1),
          'Forbidden',
          'No leadership grant',
        ]),
      '42501',
    ),
  );
  // These are intentionally synthetic local rows solely to exercise preservation under containment.
  await q(
    'insert into public.guilds(id,name,created_by_user_id,leader_traveler_id) values($1,$2,$3,$4)',
    [uid(101), 'Second synthetic', uid(2), tid(2)],
  );
  await q(
    "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'member','active'),($1,$3,'leader','active')",
    [uid(101), tid(1), tid(2)],
  );
  const multiData = await data(),
    issued = (await q('select * from guild_admin_private.audit order by id'))
      .rows;
  await check(
    'multiple memberships prevent restoration of the global unique index',
    () => denied(() => tx(proposal('recovery-empty')), 'P0001'),
  );
  await check(
    'preserving containment keeps every multiguild link data and audit row',
    async () => {
      await tx(proposal('containment'));
      assert.equal(
        (
          await q(
            'select writes_enabled from guild_admin_private.multiguild_control',
          )
        ).rows[0].writes_enabled,
        false,
      );
      assert.deepEqual(await data(), multiData);
      assert.deepEqual(
        (await q('select * from guild_admin_private.audit order by id')).rows,
        issued,
      );
      assert.equal(
        (await as(1, 'select public.guild_scoped_contexts($1) x', [tid(1)]))
          .rows[0].x.guilds.length,
        2,
      );
    },
  );
  await check('application cannot reactivate contained management', () =>
    denied(() => as(1, proposal('activate')), 'P0001'),
  );
  await check(
    'containment immediately blocks already authenticated legacy and scoped writes',
    async () => {
      await denied(
        () => as(1, 'select public.leave_guild($1)', [tid(1)]),
        '55000',
      );
      await denied(
        () =>
          as(1, 'select public.guild_scoped_command($1,$2,$3,$4,$5,$6)', [
            tid(1),
            uid(101),
            'leave',
            tid(1),
            randomUUID(),
            {},
          ]),
        '55000',
      );
      assert.deepEqual(await data(), multiData);
    },
  );
  await check(
    'economic and progression authorities remain denied',
    async () => {
      assert.equal(
        (
          await q(
            "select has_function_privilege('authenticated','public.complete_story(uuid,text)','EXECUTE') allowed",
          )
        ).rows[0].allowed,
        false,
      );
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
  fs.writeFileSync(
    path.join(root, 'final-functions.json'),
    JSON.stringify(await definitions(), null, 2),
  );
  const result = {
    environment: 'isolated PostgreSQL17.10 loopback',
    productionProof: false,
    syntheticData: true,
    productionAccountOrDataImported: false,
    checks,
    total: checks.length,
    pass: checks.every((c) => c.pass),
    remoteMigrationExecuted: false,
  };
  fs.writeFileSync(
    path.join(root, 'postgres-results.json'),
    JSON.stringify(result, null, 2),
  );
  console.log(
    JSON.stringify({
      state: 'PRODUCTION_PACKAGE_ISOLATED_PASS',
      checks: checks.length,
    }),
  );
} finally {
  await db.query('ROLLBACK').catch(() => {});
  for (const c of connections) await c.end().catch(() => {});
  await db.end().catch(() => {});
  execFileSync(
    path.join(bin, 'pg_ctl.exe'),
    ['-D', cluster, '-m', 'fast', '-w', 'stop'],
    { windowsHide: true, stdio: 'ignore', timeout: 10000 },
  );
}
