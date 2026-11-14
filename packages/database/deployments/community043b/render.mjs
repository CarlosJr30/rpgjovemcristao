// Local draft renderer. No network, credentials, database execution or activation.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(dir, '../../../..');
const manifestPath = resolve(dir, 'production-package.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const names = [
  '20261113215415_community_043b_controlled_creation_production.sql',
  '20261113232954_community_043b_membership_link_quotas_production.sql',
  '20261114110000_community_043b_join_request_quotas_production.sql',
];
const settings = ['install', 'quotas_install', 'request_quotas_install'];
const active = "EXISTS (SELECT 1 FROM guild_admin_private.multiguild_control WHERE singleton AND community_creation_enabled AND community_environment='production')";
function replaceOnce(sql, before, after) {
  if (sql.split(before).length !== 2) throw Error('Unexpected source boundary: ' + before);
  return sql.replace(before, after);
}
manifest.candidateMigrations = manifest.testSources.map((source, index) => {
  const blob = execFileSync('git', ['rev-parse', `${manifest.sourceBranchSha}:${source.path}`], { cwd: root, encoding: 'utf8' }).trim();
  const filtered = execFileSync('git', ['hash-object', source.path], { cwd: root, encoding: 'utf8' }).trim();
  if (blob !== source.gitBlob || filtered !== blob) throw Error('Source Git blob mismatch');
  let sql = readFileSync(resolve(root, source.path), 'utf8').replaceAll('\r\n', '\n');
  sql = sql.replace(/^--.*\n/gm, (line) => /TEST ONLY|candidate|PR53/.test(line) ? '' : line);
  sql = sql.replaceAll("'hero-equipment-006'", "'guild-ebd-001'").replaceAll("'local-test'", "'reviewed-production'");
  if (index === 0) {
    sql = replaceOnce(sql, "('disabled','local','test')", "('disabled','production')");
    sql = replaceOnce(sql, "community_environment IN ('local','test')", "community_environment='production'");
    sql = sql.replace('Explicit local/TEST installation required', 'Reviewed production foundation required');
  }
  if (index === 1) {
    sql = replaceOnce(sql, "BEGIN\n  IF NEW.status <> 'active'", `BEGIN\n  IF NOT ${active} THEN RETURN NEW; END IF;\n  IF NEW.status <> 'active'`);
    sql = replaceOnce(sql, "issued_at + interval '7 days', 1)", `issued_at + interval '7 days', CASE WHEN ${active} THEN 1 ELSE NULL END)`);
  }
  if (index === 2) {
    sql = replaceOnce(sql, '  server_now := clock_timestamp();', `  IF NOT ${active} THEN RETURN NEW; END IF;\n  server_now := clock_timestamp();`);
  }
  const dependency = index === 0
    ? "IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='guild_admin_private' AND table_name='multiguild_control' AND column_name='community_creation_enabled') THEN RAISE EXCEPTION 'Foundation already installed'; END IF;"
    : `IF to_regprocedure('guild_admin_private.create_own_guild(uuid,uuid,text,text)') IS NULL${index === 2 ? " OR to_regprocedure('guild_admin_private.enforce_membership_quotas()') IS NULL" : ''} THEN RAISE EXCEPTION 'Previous COMMUNITY migration required'; END IF;`;
  const guard = `-- GUILD-028B PROD draft: NOT PostgreSQL-validated. Manifest remains blocked.\n-- Explicit transaction is required; this file never activates COMMUNITY.\nBEGIN;\nSET LOCAL lock_timeout='5s';\nSET LOCAL statement_timeout='60s';\nDO $prod_guard$ BEGIN\n IF session_user <> 'postgres' OR current_user <> 'postgres'\n OR current_setting('rpg.community043b.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo'\n OR current_setting('rpg.community043b.${settings[index]}',true) IS DISTINCT FROM 'reviewed-production'\n OR public.release_scope() IS DISTINCT FROM 'guild-ebd-001'\n THEN RAISE EXCEPTION 'Explicit reviewed PROD operator/project/scope required' USING ERRCODE='42501'; END IF;\n PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);\n ${dependency}\nEND $prod_guard$;\n`;
  const output = guard + sql.trim() + '\nCOMMIT;\n';
  writeFileSync(resolve(dir, 'sql', names[index]), output);
  return { order: index + 1, file: names[index], sha256: createHash('sha256').update(output).digest('hex'), validation: 'postgresql-not-executed' };
});
manifest.status = 'blocked';
manifest.migrations = [];
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest.candidateMigrations, null, 2));
