import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export const TARGET = 'wspafhlbtlpabypzymjo';
export const SOURCE_SHA = '548d986c338cbf9997ba15020d2d7a58182d6551';
const roots = 'packages/database/';
const selected = [
  'migrations/0005_guild_lessons_and_schedule.sql',
  'migrations/20261019054314_guild_link_invites.sql',
  'proposals/task0081-story-progress.sql',
  'proposals/task0082-guild-missions.sql',
  'proposals/task0083-guild-ebd.sql',
  'proposals/consolidation004-expand0078.sql',
  'proposals/consolidation004-authority.sql',
];
export const digest = (s) => createHash('sha256').update(s).digest('hex');
export const normalized = (s) => s.replaceAll('\r\n', '\n');
const read = (path) => normalized(readFileSync(path, 'utf8'));
export function productionRecipe() {
  const locks = ['consolidation-002', 'consolidation-004'].flatMap(
    (name) => JSON.parse(read(`${roots}reviewed/${name}.lock.json`)).steps,
  );
  return selected.map((relative, i) => {
    const source = roots + relative;
    const expected = locks.find((s) => s.source === source);
    const original = read(source);
    if (!expected || digest(original) !== expected.sha256)
      throw Error(`Frozen migration hash mismatch: ${source}`);
    const starts = [...original.matchAll(/^BEGIN;\s*$/gm)].length;
    const ends = [...original.matchAll(/^COMMIT;\s*$/gm)].length;
    if (starts !== ends || starts > 1)
      throw Error('Unexpected transaction envelope');
    // Only the outer transaction is removed. Bodies and statements stay frozen.
    const sql =
      original
        .replace(/^BEGIN;\s*$/gm, '')
        .replace(/^COMMIT;\s*$/gm, '')
        .trimEnd() + '\n';
    return { order: i + 1, source, sourceSha256: digest(original), sql };
  });
}
export function atomicProductionSql(preflight) {
  if (!preflight.includes('DEPLOY005_BASELINE_GUARD'))
    throw Error('Reviewed production baseline guard required');
  const base = read(
    `${roots}deployments/deploy002/supabase/migrations/` +
      '20261021030209_deploy002_prepare_acl.sql',
  );
  const release = read(
    `${roots}deployments/deploy002/supabase/migrations/` +
      '20261021030231_deploy002_release_acl.sql',
  );
  return (
    `SET LOCAL lock_timeout='5s';\nSET LOCAL statement_timeout='60s';\n` +
    preflight +
    '\n' +
    base +
    '\n' +
    productionRecipe()
      .map((s) => `-- Frozen source: ${s.source} / ${s.sourceSha256}\n${s.sql}`)
      .join('\n') +
    '\n' +
    release
  );
}
