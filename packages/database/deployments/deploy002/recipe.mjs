import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

export const TARGET = 'wkdvdzfkbwvhyjmamrsg';
export const SOURCE_SHA = 'cb66b6c4b87645cf5911a86b8b99943cc2d1664b';
export const HOLD =
  'REVOKE USAGE ON SCHEMA public FROM PUBLIC, anon, authenticated;';
export function normalized(value) {
  return value.replaceAll('\r\n', '\n');
}
export function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}
export function sourceSql(path) {
  return normalized(readFileSync(resolve(path), 'utf8'));
}
// Existing outer transactions move to the supported migration tool boundary.
// No function body or SQL statement is rewritten; HOLD is appended before commit.
export function migrationPayload(sql) {
  const begin = [...sql.matchAll(/^BEGIN;\s*$/gm)];
  const end = [...sql.matchAll(/^COMMIT;\s*$/gm)];
  if (begin.length !== end.length || begin.length > 1)
    throw Error('Unexpected transaction envelope');
  return (
    sql
      .replace(/^BEGIN;\s*$/gm, '')
      .replace(/^COMMIT;\s*$/gm, '')
      .trimEnd() +
    '\n' +
    HOLD +
    '\n'
  );
}
export function recipe() {
  const lock002 = JSON.parse(
    sourceSql('packages/database/reviewed/consolidation-002.lock.json'),
  );
  const lock004 = JSON.parse(
    sourceSql('packages/database/reviewed/consolidation-004.lock.json'),
  );
  if (!lock004.alternativeTo0078Contract0010) throw Error('Unreviewed cutover');
  const prefix = 'packages/database/deployments/deploy002/supabase/migrations/';
  const prepare = prefix + '20261021030209_deploy002_prepare_acl.sql';
  const release = prefix + '20261021030231_deploy002_release_acl.sql';
  const steps = [
    {
      name: 'deploy002_prepare_acl',
      source: prepare,
      payload: sourceSql(prepare),
    },
  ];
  for (const [i, step] of [...lock002.steps, ...lock004.steps].entries()) {
    const sql = sourceSql(step.source);
    if (digest(sql) !== step.sha256)
      throw Error('Historical SQL hash mismatch: ' + step.source);
    steps.push({
      name:
        'deploy002_' +
        String(i + 1).padStart(2, '0') +
        '_' +
        step.source
          .split('/')
          .at(-1)
          .replace(/\.sql$/, '')
          .replaceAll('-', '_'),
      source: step.source,
      sourceSha256: step.sha256,
      payload: migrationPayload(sql),
    });
  }
  steps.push({
    name: 'deploy002_release_acl',
    source: release,
    payload: sourceSql(release),
  });
  return steps.map((step, i) => ({
    ...step,
    order: i + 1,
    sourceSha256: step.sourceSha256 ?? digest(step.payload),
    payloadSha256: digest(step.payload),
  }));
}
