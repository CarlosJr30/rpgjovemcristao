// Isolated PostgreSQL fixture. Never a hosted Supabase or player session.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { Client } from 'pg';
const root = path.resolve('build/rpg-dev-008');
fs.mkdirSync(root, { recursive: true });
const bin = path.resolve('../rpgjovemcristao-rpg-dev-007/build/rpg-dev-007/postgres-tool/node_modules/@embedded-postgres/windows-x64/native/bin');
const data = path.join(root, `isolated-pg-${Date.now()}`);
assert(data.startsWith(root + path.sep));
assert(fs.existsSync(path.join(bin, 'postgres.exe')), 'Existing pinned PostgreSQL tool required');
const port = await new Promise(resolve => { const server = net.createServer(); server.listen(0, '127.0.0.1', () => { const p = server.address().port; server.close(() => resolve(p)); }); });
execFileSync(path.join(bin, 'initdb.exe'), ['-D', data, '-U', 'postgres', '-A', 'trust', '--encoding=UTF8', '--locale=C', '--no-sync'], { windowsHide: true, stdio: 'pipe' });
execFileSync(path.join(bin, 'pg_ctl.exe'), ['-D', data, '-l', path.join(data, 'server.log'), '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start'], { windowsHide: true, stdio: 'ignore', timeout: 10000 });
const db = new Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres' });
const results = [], sql = file => fs.readFileSync(file, 'utf8');
const uid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const tid = n => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const migration = sql('supabase/migrations/20261027095417_rpg_dev_008_story_progress_read.sql');
async function check(name, run) { await run(); results.push({ name, passed: true }); }
async function as(role, actor, query, anonymous = false) {
  await db.query('BEGIN');
  try {
    await db.query(`SET LOCAL ROLE ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)", [actor ?? '', JSON.stringify({ is_anonymous: anonymous })]);
    return await db.query(query);
  } finally { await db.query('ROLLBACK'); }
}
async function fingerprint() {
  const tables = (await db.query("select schemaname,tablename from pg_tables where schemaname in ('public','economy_private','story_private') order by 1,2")).rows;
  const values = [];
  for (const t of tables) {
    assert(/^[a-z_0-9]+$/.test(t.schemaname + t.tablename));
    values.push((await db.query(`select count(*) rows,md5(coalesce(string_agg(md5(to_jsonb(t)::text),'' order by md5(to_jsonb(t)::text)),'')) hash from "${t.schemaname}"."${t.tablename}" t`)).rows[0]);
  }
  return JSON.stringify(values);
}
try {
  await db.connect();
  assert.equal((await db.query('SHOW listen_addresses')).rows[0].listen_addresses, '127.0.0.1');
  const bootstrap = sql('tests/fixtures/offline-authority-postgres.ts').match(/query\(`(CREATE ROLE anon[\s\S]+?CREATE PUBLICATION supabase_realtime;)`\);/)[1];
  await db.query(bootstrap);
  for (const name of ['consolidation-002', 'consolidation-004']) for (const step of JSON.parse(sql(`packages/database/reviewed/${name}.lock.json`)).steps) {
    const source = sql(step.source); assert.equal(createHash('sha256').update(source.replaceAll('\r\n', '\n')).digest('hex'), step.sha256);
    await db.query(/^\s*BEGIN;\s*$/m.test(source) ? source : `BEGIN;${source}\nCOMMIT;`);
  }
  for (const n of [1, 2, 3]) {
    await db.query('insert into auth.users(id,is_anonymous) values($1,$2)', [uid(n), n === 3]);
    await db.query("insert into public.travelers(id,user_id,name,body_type,skin_tone,hair_style,avatar_variant) values($1,$2,$3,'male','medio','curto','musgo')", [tid(n), uid(n), `Isolated ${n}`]);
  }
  await db.query(`BEGIN;${sql('supabase/migrations/20261024151503_release_ebd_001_isolation.sql')}\nCOMMIT;`);
  await db.query("insert into public.story_progress(traveler_id,story_id,completed_steps) values($1,'creation',ARRAY['reading'])", [tid(1)]);
  const before = await fingerprint();
  const meta = async () => (await db.query("select relacl::text acl from pg_class where oid='public.story_progress'::regclass")).rows[0].acl;
  const aclBefore = await meta();
  await check('migration and recovery probe preserve all datasets and release scope', async () => {
    await db.query(`BEGIN;${migration}\nCOMMIT;`);
    assert.equal(await fingerprint(), before);
    assert.equal((await db.query('select public.release_scope() scope')).rows[0].scope, 'guild-ebd-001');
  });
  await check('owner reads existing partial progress, without completing it', async () => {
    const rows = (await as('authenticated', uid(1), 'select * from public.story_progress')).rows;
    assert.equal(rows.length, 1); assert.equal(rows[0].traveler_id, tid(1)); assert.deepEqual(rows[0].completed_steps, ['reading']); assert.equal(rows[0].completed_at, null);
  });
  await check('unfiltered foreign owner query returns no other player data', async () => assert.deepEqual((await as('authenticated', uid(2), 'select * from public.story_progress')).rows, []));
  await check('explicit foreign avatar query is empty', async () => assert.deepEqual((await as('authenticated', uid(2), `select * from public.story_progress where traveler_id='${tid(1)}'`)).rows, []));
  await check('anonymous Auth user cannot read owner data', async () => assert.deepEqual((await as('authenticated', uid(1), 'select * from public.story_progress', true)).rows, []));
  await check('missing subject cannot read', async () => assert.deepEqual((await as('authenticated', null, 'select * from public.story_progress')).rows, []));
  for (const role of ['anon', 'service_role']) await check(`${role} denied SELECT`, async () => assert.rejects(() => as(role, uid(1), 'select * from public.story_progress'), e => e.code === '42501'));
  for (const [name, query] of [
    ['insert', `insert into public.story_progress(traveler_id,story_id) values('${tid(1)}','babel')`],
    ['update', 'update public.story_progress set completed_at=now()'],
    ['delete', 'delete from public.story_progress'],
    ['complete RPC', `select public.complete_story('${tid(1)}','creation')`],
  ]) await check(`${name} stays denied`, async () => assert.rejects(() => as('authenticated', uid(1), query), e => e.code === '42501'));
  await check('economic writes and authority stay denied', async () => {
    for (const t of ['inventory','wallets','equipped_items','traveler_stats']) assert.equal((await db.query("select has_table_privilege('authenticated',$1,'INSERT,UPDATE,DELETE') allowed", ['public.' + t])).rows[0].allowed, false);
    assert.equal((await db.query("select has_function_privilege('authenticated','public.arena_authority_v3(uuid,uuid,text,jsonb)','EXECUTE') allowed")).rows[0].allowed, false);
  });
  await check('compensation restores exact baseline ACL and preserves data', async () => {
    const granted = await meta(); await db.query('BEGIN');
    await db.query('revoke select on public.story_progress from authenticated');
    assert.equal(await meta(), aclBefore); assert.equal(await fingerprint(), before);
    await db.query('ROLLBACK'); assert.equal(await meta(), granted);
  });
  await check('duplicate migration fails without partial change', async () => {
    await assert.rejects(() => db.query(`BEGIN;${migration}\nCOMMIT;`), /read-closed baseline/); await db.query('ROLLBACK');
    assert.equal(await fingerprint(), before);
  });
  await check('all tested reads and denials preserve data', async () => assert.equal(await fingerprint(), before));
  fs.writeFileSync(path.join(root, 'postgres-results.json'), JSON.stringify({ passed: true, isolated: true, hostedProof: false, version: (await db.query('select version()')).rows[0].version, results }, null, 2));
  console.log(JSON.stringify({ passed: true, checks: results.length, hostedProof: false }));
} finally {
  await db.end();
  if (fs.existsSync(path.join(data, 'postmaster.pid'))) execFileSync(path.join(bin, 'pg_ctl.exe'), ['-D', data, '-m', 'fast', '-w', 'stop'], { windowsHide: true, stdio: 'ignore', timeout: 10000 });
}
