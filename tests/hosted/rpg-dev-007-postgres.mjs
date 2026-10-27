// Isolated PostgreSQL only. No Supabase URL, credential, account or hosted writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { Client } from 'pg';
import { cards } from '../fixtures/arena-deck.ts';

const root = path.resolve('build/rpg-dev-007');
const bin = path.join(root, 'postgres-tool/node_modules/@embedded-postgres/windows-x64/native/bin');
const data = path.join(root, `isolated-pg-${Date.now()}`);
assert(data.startsWith(root + path.sep));
assert(fs.existsSync(path.join(bin, 'postgres.exe')), 'Install the pinned isolated tool under build; no system service is used.');
const port = await new Promise(resolve => {
  const server = net.createServer(); server.listen(0, '127.0.0.1', () => { const value = server.address().port; server.close(() => resolve(value)); });
});
execFileSync(path.join(bin, 'initdb.exe'), ['-D', data, '-U', 'postgres', '-A', 'trust', '--encoding=UTF8', '--locale=C', '--no-sync'], { windowsHide: true, stdio: 'pipe' });
// pg_ctl applies Windows' restricted process token when starting postgres.
execFileSync(path.join(bin, 'pg_ctl.exe'), ['-D', data, '-l', path.join(data, 'server.log'), '-o', `-h 127.0.0.1 -p ${port} -c wal_level=logical`, '-w', 'start'], { windowsHide: true, stdio: 'ignore', timeout: 10000 });
let db;
const results = [];
const u = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const t = n => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const sql = name => fs.readFileSync(name, 'utf8');
const migration = sql('supabase/migrations/20261026192057_rpg_dev_007_owned_cards_read.sql');
async function test(name, action) { await action(); results.push({ name, passed: true }); }
async function as(role, actor, statement, args = []) {
  await db.query('BEGIN');
  try {
    await db.query(`SET LOCAL ROLE ${role}`);
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [actor ?? '']);
    return await db.query(statement, args);
  } finally { await db.query('ROLLBACK'); }
}
const read = n => as('authenticated', u(n), 'SELECT public.get_owned_cards($1) value', [t(n)]);
const denied = action => assert.rejects(action, error => error.code === '42501');
async function fingerprint() {
  const tables = (await db.query("select schemaname,tablename from pg_tables where schemaname in ('public','economy_private') order by 1,2")).rows;
  const hashes = [];
  for (const table of tables) {
    assert(/^[a-z_0-9]+$/.test(table.schemaname + table.tablename));
    hashes.push((await db.query(`select count(*) rows, md5(coalesce(string_agg(md5(to_jsonb(t)::text),'' order by md5(to_jsonb(t)::text)),'')) hash from "${table.schemaname}"."${table.tablename}" t`)).rows[0]);
  }
  return JSON.stringify(hashes);
}
try {
  for (let i = 0; i < 100; i++) {
    const attempt = new Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres', connectionTimeoutMillis: 500 });
    try { await attempt.connect(); db = attempt; break; } catch { await attempt.end().catch(() => {}); await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  assert(db, 'Isolated server did not start');
  assert.equal((await db.query('SHOW listen_addresses')).rows[0].listen_addresses, '127.0.0.1');
  const originalFixture = sql('tests/fixtures/offline-authority-postgres.ts');
  const bootstrap = originalFixture.match(/query\(`(CREATE ROLE anon[\s\S]+?CREATE PUBLICATION supabase_realtime;)`\);/)[1];
  await db.query(bootstrap);
  for (const lockName of ['consolidation-002', 'consolidation-004']) {
    for (const step of JSON.parse(sql(`packages/database/reviewed/${lockName}.lock.json`)).steps) {
      const source = sql(step.source);
      assert.equal(createHash('sha256').update(source.replaceAll('\r\n', '\n')).digest('hex'), step.sha256);
      await db.query(/^\s*BEGIN;\s*$/m.test(source) ? source : `BEGIN;${source}\nCOMMIT;`);
    }
  }
  for (const n of [1, 2, 3]) {
    await db.query('INSERT INTO auth.users(id,is_anonymous) VALUES($1,$2)', [u(n), n === 3]);
    await db.query("INSERT INTO public.travelers(id,user_id,name,body_type,skin_tone,hair_style,avatar_variant) VALUES($1,$2,$3,'male','medio','curto','musgo')", [t(n), u(n), `Isolated ${n}`]);
  }
  await db.query(`BEGIN;${sql('supabase/migrations/20261024151503_release_ebd_001_isolation.sql')}\nCOMMIT;`);
  const baseline = await fingerprint();
  await test('migration and its recovery probe preserve all player datasets and release scope', async () => {
    await db.query(`BEGIN;${migration}\nCOMMIT;`);
    assert.equal(await fingerprint(), baseline);
    assert.equal((await db.query('select public.release_scope() scope')).rows[0].scope, 'guild-ebd-001');
  });
  await test('anonymous role denied', () => denied(() => as('anon', null, 'select public.get_owned_cards($1)', [t(1)])));
  await test('service role denied', () => denied(() => as('service_role', u(1), 'select public.get_owned_cards($1)', [t(1)])));
  await test('authenticated without subject denied', () => denied(() => as('authenticated', null, 'select public.get_owned_cards($1)', [t(1)])));
  await test('anonymous Auth user denied', () => denied(() => read(3)));
  await test('foreign traveler denied', () => denied(() => as('authenticated', u(2), 'select public.get_owned_cards($1)', [t(1)])));
  await test('own empty collection is an honest empty result', async () => assert.deepEqual((await read(1)).rows[0].value, []));
  const card = cards[0];
  await db.query("insert into economy_private.card_catalog(version,id,definition,approval_ref,starter) values('007-isolated',$1,$2,'isolated-fixture-only',false)", [card.id, card]);
  const receipt = (await db.query("insert into public.chest_operations(traveler_id,operation_key,operation_type,source,identity_key,account_id,rewards) values($1,'007-isolated','card-starter','isolated-fixture-only','007-isolated',$2,$3) returning id", [t(1), u(1), { cardIds: [card.id] }])).rows[0].id;
  await db.query("insert into public.inventory(traveler_id,item_id,quantity,card_receipt_id,card_version) values($1,$2,1,$3,'007-isolated')", [t(1), card.id, receipt]);
  const ownedBaseline = await fingerprint();
  await test('owned receipt-backed card returns exact existing definition and never mutates data', async () => {
    assert.deepEqual((await read(1)).rows[0].value, [{ card, version: '007-isolated', receiptId: receipt }]);
    assert.equal(await fingerprint(), ownedBaseline);
  });
  await test('other owner cannot see the acquired card', async () => assert.deepEqual((await read(2)).rows[0].value, []));
  for (const [name, update] of [
    ['revoked inventory card', "update public.inventory set card_revoked_at=now()"],
    ['revoked catalog definition', "update economy_private.card_catalog set revoked_at=now()"],
    ['receipt missing item id', "update public.chest_operations set rewards='{}'"],
    ['receipt of another account', `update public.chest_operations set account_id='${u(2)}'`],
  ]) {
    await test(`${name} is excluded`, async () => {
      await db.query('BEGIN');
      try {
        await db.query(update); await db.query('SET LOCAL ROLE authenticated');
        await db.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [u(1)]);
        assert.deepEqual((await db.query('select public.get_owned_cards($1) value', [t(1)])).rows[0].value, []);
      } finally { await db.query('ROLLBACK'); }
    });
  }
  for (const update of ['update public.inventory set card_receipt_id=null', 'update public.inventory set quantity=2']) {
    await test(`provenance constraint rejects ${update.includes('quantity') ? 'invalid quantity' : 'missing receipt'} without weakening schema`, async () => {
      await db.query('BEGIN');
      try { await assert.rejects(() => db.query(update), error => error.code === '23514'); }
      finally { await db.query('ROLLBACK'); }
      assert.equal(await fingerprint(), ownedBaseline);
    });
  }
  await test('writes and combat authority remain denied', async () => {
    for (const table of ['inventory', 'equipped_items', 'wallets', 'traveler_stats']) {
      assert.equal((await db.query("select has_table_privilege('authenticated',$1,'INSERT,UPDATE,DELETE') allowed", ['public.' + table])).rows[0].allowed, false);
    }
    assert.equal((await db.query("select has_function_privilege('service_role','public.arena_authority_v3(uuid,uuid,text,jsonb)','EXECUTE') allowed")).rows[0].allowed, false);
  });
  await test('recovery removes only new endpoints and rollback restores exact definitions and ACLs', async () => {
    const meta = () => db.query("select oid::regprocedure::text signature,pg_get_functiondef(oid) definition,proacl::text acl from pg_proc where proname='get_owned_cards' order by signature");
    const before = (await meta()).rows; await db.query('BEGIN');
    await db.query('DROP FUNCTION public.get_owned_cards(uuid);DROP FUNCTION economy_private.get_owned_cards(uuid)');
    assert.equal((await meta()).rows.length, 0); assert.equal(await fingerprint(), ownedBaseline);
    await db.query('ROLLBACK'); assert.deepEqual((await meta()).rows, before);
  });
  await test('duplicate migration aborts without partially changing metadata or player data', async () => {
    await assert.rejects(() => db.query(`BEGIN;${migration}\nCOMMIT;`), /already exists/); await db.query('ROLLBACK');
    assert.equal(await fingerprint(), ownedBaseline);
  });
  fs.writeFileSync(path.join(root, 'postgres-results.json'), JSON.stringify({ passed: true, scope: 'isolated PostgreSQL on loopback only; no hosted account or acquisition', version: (await db.query('select version()')).rows[0].version, results }, null, 2));
  console.log(JSON.stringify({ passed: true, checks: results.length, hostedWrites: false }));
} finally {
  if (db) await db.end();
  if (fs.existsSync(path.join(data, 'postmaster.pid')))
    execFileSync(path.join(bin, 'pg_ctl.exe'), ['-D', data, '-m', 'fast', '-w', 'stop'], { windowsHide: true, stdio: 'ignore', timeout: 10000 });
}
