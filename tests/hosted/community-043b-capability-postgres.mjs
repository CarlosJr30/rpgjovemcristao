// Loopback-only synthetic accounts/Guilds. No hosted proof, designation or rewards.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
const pgModule=await import(process.env.RPG_PG_MODULE ?? 'pg'); const Client=pgModule.Client ?? pgModule.default.Client;
const root = path.resolve('build/community-043b-capability'),
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
async function gameData() {
  return JSON.stringify(
    (
      await q(
        "select jsonb_build_object('travelers',(select jsonb_agg(case when id in ('10000000-0000-4000-8000-000000000009','10000000-0000-4000-8000-000000000010','10000000-0000-4000-8000-000000000146','10000000-0000-4000-8000-000000000152','10000000-0000-4000-8000-000000000155') then to_jsonb(x)-'updated_at' else to_jsonb(x) end order by id) from public.travelers x),'wallets',(select jsonb_agg(to_jsonb(x) order by traveler_id) from public.wallets x),'stats',(select jsonb_agg(to_jsonb(x) order by traveler_id) from public.traveler_stats x),'inventory',(select jsonb_agg(to_jsonb(x) order by id) from public.inventory x),'chests',(select jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text) from public.traveler_chests x)) result",
      )
    ).rows[0].result,
  );
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
  const capability = sql('packages/database/deployments/community043b/sql/community_own_guild_capability.sql.in');
  await q("insert into auth.sessions(id,user_id) select id,id from auth.users");
  for (const production of [false,true]) {
    const foundation=production ? 'packages/database/deployments/community043b/sql/20261113215415_community_043b_controlled_creation_production.sql' : 'supabase/migrations/20261113215415_community_043b_controlled_creation_test.sql';
    await q('BEGIN');
    try {
      if(production) {
        await q("create or replace function public.release_scope() returns text language sql immutable as $$select 'guild-ebd-001'::text$$");
        await q("select set_config('rpg.community043b.target_project','wspafhlbtlpabypzymjo',true),set_config('rpg.community043b.install','reviewed-production',true)");
      } else await q("select set_config('rpg.community043b.install','local-test',true)");
      await q(sql(foundation).replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,''));
      await q(capability);
      const read = async (actor=tid(2), session=true) => {
        await q('SET LOCAL ROLE authenticated');
        await q("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[uid(2),JSON.stringify({is_anonymous:false,...(session?{session_id:uid(2)}:{})})]);
        try {return (await q('select public.community_own_guild_capability($1) result',[actor])).rows[0].result;} finally {await q('RESET ROLE');}
      };
      const label=production?'PROD':'TEST';
      await check(label+' disabled returns exact contract',async()=>assert.deepEqual(await read(),{version:1,available:false}));
      await q("update guild_admin_private.multiguild_control set writes_enabled=true,community_creation_enabled=true,community_environment=$1",[production?'production':'local']);
      await check(label+' ordinary eligible account and read preserves game data',async()=>{const before=await gameData();assert.deepEqual(await read(),{version:1,available:true});assert.equal(await gameData(),before);});
      await q("insert into public.guild_members(guild_id,traveler_id,role,status) select id,$1,'member','active' from public.guilds limit 5",[tid(2)]);
      await check(label+' five memberships denied',async()=>assert.equal((await read()).available,false));
      await q('delete from public.guild_members where traveler_id=$1',[tid(2)]);
      await check(label+' foreign/null avatar denied',async()=>{assert.equal((await read(tid(3))).available,false);assert.equal((await read(null)).available,false);});
      await check(label+' missing session denied',async()=>assert.equal((await read(tid(2),false)).available,false));
      await q("update auth.users set banned_until=now()+interval '1 day' where id=$1",[uid(2)]);
      await check(label+' suspended account denied',async()=>assert.equal((await read()).available,false));
      await q('update auth.users set banned_until=null,email_confirmed_at=null where id=$1',[uid(2)]);
      await check(label+' unconfirmed denied',async()=>assert.equal((await read()).available,false));
      await q('update auth.users set email_confirmed_at=now() where id=$1',[uid(2)]);
      await q('update public.travelers set is_active=false where id=$1',[tid(2)]);
      await check(label+' inactive avatar denied',async()=>assert.equal((await read()).available,false));
      await q('update public.travelers set is_active=true where id=$1',[tid(2)]);
      await q('update guild_admin_private.multiguild_control set writes_enabled=false');
      await check(label+' writes disabled denied',async()=>assert.equal((await read()).available,false));
      await q('update guild_admin_private.multiguild_control set writes_enabled=true');
      await q('insert into public.guilds(id,name,created_by_user_id,leader_traveler_id) values($1,$2,$3,$4)',[uid(9999),'Creation marker',uid(2),tid(2)]);
      await check(label+' already created denied',async()=>assert.equal((await read()).available,false));
      await check(label+' ACL and wrapper privileges',async()=>{
        for(const role of ['anon','service_role']) assert.equal((await q("select has_function_privilege($1,'public.community_own_guild_capability(uuid)','EXECUTE') ok",[role])).rows[0].ok,false);
        assert.equal((await q("select prosecdef from pg_proc where oid='public.community_own_guild_capability(uuid)'::regprocedure")).rows[0].prosecdef,false);
      });
    } finally {await q('ROLLBACK');}
  }
  assert.equal(await gameData(),beforeGame);
  console.log(JSON.stringify({pass:true,checks,hostedProof:false}));
} finally {
  for (const c of connections) await c.end().catch(() => {});
  await db.end().catch(() => {});
  execFileSync(
    path.join(bin, 'pg_ctl.exe'),
    ['-D', cluster, '-m', 'fast', '-w', 'stop'],
    { windowsHide: true, stdio: 'ignore', timeout: 10000 },
  );
}
