// Reuse the reviewed synthetic governance baseline/scenarios, exercising PROD SQL.
// No network endpoints or hosted credentials. Runtime/tools are supplied explicitly.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const pgPath = process.env.RPG_POSTGRES_TOOL_ROOT;
if (!pgPath || !process.env.RPG_POSTGRES_BIN) throw Error('Explicit disposable PostgreSQL tools required');
let source = fs.readFileSync('tests/hosted/community-043b-creation-postgres.mjs', 'utf8').replaceAll('\r\n', '\n');
const replace = (before, after) => {
  if (source.split(before).length !== 2) throw Error('Harness boundary changed: ' + before.slice(0, 80));
  source = source.replace(before, () => after);
};
replace("import { Client } from 'pg';", `import pg from '${pathToFileURL(require.resolve(path.join(pgPath, 'node_modules/pg'))).href}'; const { Client } = pg;`);
replace("path.resolve('build/community-043b-impl-1')", "path.resolve('build/community-043b-production')");
replace("sql = (f) => fs.readFileSync(f, 'utf8').replaceAll('\\r\\n', '\\n'),", `sql = (f) => {
 const sources = ${JSON.stringify(JSON.parse(fs.readFileSync('packages/database/deployments/community043b/production-package.json','utf8')).testSources.map(s=>s.path))};
 const candidates = ${JSON.stringify(JSON.parse(fs.readFileSync('packages/database/deployments/community043b/production-package.json','utf8')).candidateMigrations.map(s=>'packages/database/deployments/community043b/sql/'+s.file))};
 const i=sources.indexOf(f);
 const text=fs.readFileSync(i<0?f:candidates[i], 'utf8').replaceAll('\\r\\n','\\n');
 return i<0?text:text.replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,'');
},`);
const start=source.indexOf('  const legacyDefinitions = await definitions();');
const end=source.indexOf('  await q(\n    "insert into public.guilds(id,name,created_by_user_id,leader_traveler_id) select',start);
if(start<0||end<0)throw Error('Installation harness boundaries changed');
source=source.slice(0,start)+`  await q("create or replace function public.release_scope() returns text language sql immutable as $$select 'guild-ebd-001'::text$$");
  const legacyDefinitions = await definitions();
  const securitySnapshot=async()=>JSON.stringify((await q("select jsonb_build_object('rls',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'rls',c.relrowsecurity,'force',c.relforcerowsecurity) order by n.nspname,c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname in ('public','guild_admin_private','guild_invite_private','ebd_class_private')),'policies',(select jsonb_agg(to_jsonb(p) order by schemaname,tablename,policyname) from pg_policies p),'roles',(select jsonb_agg(jsonb_build_object('role',rolname,'super',rolsuper,'bypass',rolbypassrls,'create_role',rolcreaterole) order by rolname) from pg_roles where rolname in ('anon','authenticated','service_role','postgres'))) snapshot")).rows[0].snapshot);
  const beforeSecurity=await securitySnapshot();
  const manifest=JSON.parse(sql('packages/database/deployments/community043b/production-package.json'));
  const stageKeys=['install','quotas_install','request_quotas_install'];
  for(const key of stageKeys) await q("select set_config('rpg.community043b.'||$1,'reviewed-production',false)",[key]);
  await q("select set_config('rpg.community043b.target_project','wkdvdzfkbwvhyjmamrsg',false)");
  await check('PROD foundation rejects wrong project and leaves no columns', async()=>{
    await rejects(()=>q(sql(manifest.testSources[0].path)), '42501');await q('ROLLBACK');
    assert.equal((await q("select count(*)::int n from information_schema.columns where table_schema='guild_admin_private' and table_name='multiguild_control' and column_name like 'community_%'")).rows[0].n,0);
  });
  await q("select set_config('rpg.community043b.target_project','wspafhlbtlpabypzymjo',false)");
  await check('PROD rejects request migration before foundation',async()=>{
    await rejects(()=>q(sql(manifest.testSources[2].path)),'P0001');await q('ROLLBACK');
  });
  await check('PROD installs all three migrations in order with defaults closed',async()=>{
    for(const entry of manifest.candidateMigrations){
      const bytes=fs.readFileSync('packages/database/deployments/community043b/sql/'+entry.file);
      assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);
      await q(bytes.toString('utf8'));
    }
    const state=(await q('select community_creation_enabled,community_environment from guild_admin_private.multiguild_control')).rows[0];
    assert.deepEqual(state,{community_creation_enabled:false,community_environment:'disabled'});
  });
  await check('PROD repeated installation fails without partial changes',async()=>{
    await rejects(()=>q('BEGIN;'+sql(manifest.testSources[0].path)+'COMMIT;'),'P0001');await q('ROLLBACK');
    assert.equal((await q("select count(*)::int n from pg_trigger where tgname in ('guild_members_enforce_community_quotas','guild_join_requests_enforce_community_quotas')")).rows[0].n,2);
  });
  await check('RLS policies and global role privileges remain identical',async()=>{
    assert.equal(await securitySnapshot(),beforeSecurity);
  });
  await check('disabled controls preserve legacy membership and request behavior',async()=>{
    await q('BEGIN');
    try {
      for(let i=1200;i<1206;i++){
        await q("insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'member','active')",[uid(i),tid(152)]);
        await q("insert into public.guild_join_requests(guild_id,traveler_id) values($1,$2)",[uid(i),tid(151)]);
      }
      assert.equal((await q('select count(*)::int n from public.guild_members where traveler_id=$1',[tid(152)])).rows[0].n,6);
      assert.equal((await q('select count(*)::int n from public.guild_join_requests where traveler_id=$1',[tid(151)])).rows[0].n,6);
    } finally {await q('ROLLBACK');}
  });
  await check('disabled controls issue unversioned legacy links',async()=>{
    await auth(db,3);
    try {
      const result=(await q('select public.guild_scoped_create_invite($1,$2,$3) result',[tid(3),uid(203),randomUUID()])).rows[0].result;
      // Inspect private metadata as the disposable operator, never as the player.
      await q('RESET ROLE');
      assert.equal((await q('select community_quota_version from guild_invite_private.link_invites where id=$1',[result.id])).rows[0].community_quota_version,null);
    } finally {await q('ROLLBACK');}
  });
  await q("update guild_admin_private.multiguild_control set community_creation_enabled=true,community_environment='production'");
`+source.slice(end);
source=source.replaceAll("rpg.community043b.install='local-test'", "rpg.community043b.install='reviewed-production'");
source=source.replaceAll("community_environment='local'", "community_environment='production'");
replace('  const newCommunityInvite = (', `  await q("update guild_admin_private.multiguild_control set community_creation_enabled=true,community_environment='production'");
  const newCommunityInvite = (`);
replace("  await check('default disabled', async () => rejects(() => call(2), '55000'));", `  await q("update guild_admin_private.multiguild_control set community_creation_enabled=false,community_environment='disabled'");
  await check('disabled PROD creation denies even valid session', async () => rejects(() => call(2), '55000'));`);
// The original negative changes TEST to PROD; invert it for the PROD authority.
replace(`  await q(
    "create or replace function public.release_scope() returns text language sql immutable as $$select 'guild-ebd-001'::text$$",
  );
  await check('PROD scope denied even if TEST switches enabled'`, `  await q(
    "create or replace function public.release_scope() returns text language sql immutable as $$select 'hero-equipment-006'::text$$",
  );
  await check('TEST scope denied even if PROD switches enabled'`);
replace("$$select 'hero-equipment-006'::text$$;update guild_admin_private.multiguild_control set community_creation_enabled=false", "$$select 'guild-ebd-001'::text$$;update guild_admin_private.multiguild_control set community_creation_enabled=false");
// Keep all original quota, ownership, concurrency, replay and historical assertions.
fs.mkdirSync('build/community-043b-production', { recursive: true });
const generated = path.resolve('build/community-043b-production/scenarios.mjs');
fs.writeFileSync(generated, source);
await import(pathToFileURL(generated).href);
const manifestPath='packages/database/deployments/community043b/production-package.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const checks=JSON.parse(fs.readFileSync('build/community-043b-production/postgres-progress.json','utf8')).checks;
if(checks.length!==49 || checks.some(c=>c.pass!==true))throw Error('Incomplete PostgreSQL evidence');
const postgresVersion=execFileSync(path.join(process.env.RPG_POSTGRES_BIN,'postgres.exe'),['--version'],{encoding:'utf8',windowsHide:true}).trim();
if(!postgresVersion.includes(' 17.'))throw Error('PostgreSQL 17 required');
const migrations=manifest.candidateMigrations.map(entry=>{
 const actual=createHash('sha256').update(fs.readFileSync('packages/database/deployments/community043b/sql/'+entry.file)).digest('hex');
 if(actual!==entry.sha256)throw Error('SQL changed during validation');
 return {...entry,validation:'postgresql17-isolated-pass'};
});
const evidence={task:'GUILD-028C',postgresVersion,checks,hostedProof:false,migrations,limitations:['Synthetic Auth/JWT/session fixtures; not hosted Auth validation','Versioned governance baseline, not a PROD clone','ECONOMY-041 full activation package not installed; economic tables and unrelated functions compared','Empty recovery covers creation foundation; not a verified PROD backup/restore']};
fs.writeFileSync('packages/database/deployments/community043b/validation-summary.json',JSON.stringify(evidence,null,2)+'\n');
manifest.candidateMigrations=migrations;
manifest.validation={status:'postgresql17-isolated-pass',checks:checks.length,postgresVersion,evidence:'validation-summary.json'};
manifest.status='blocked'; manifest.migrations=[];
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
