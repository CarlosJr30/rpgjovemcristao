import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
const policy = 'scripts/vercel-preview-branch-policy.mjs';
function result(environment, branch) {
  const run = spawnSync(process.execPath, [policy], {
    env: { ...process.env, VERCEL_ENV: environment, VERCEL_GIT_COMMIT_REF: branch },
    encoding: 'utf8'
  });
  assert.equal(run.error, undefined);
  return run.status;
}
test('Production: keep current Vercel build behavior', () => {
  assert.equal(result('production', 'main'), 1);
  assert.equal(result('production', 'preview/example'), 1);
});
test('Preview: allow dedicated preview branches', () => {
  assert.equal(result('preview', 'preview/task-0076e'), 1);
  assert.equal(result('preview', 'preview/arena-mobile'), 1);
});
test('Preview: ignore other branches', () => {
  for (const branch of ['main', 'cloud/preview-automation-setup', 'automation/github-quality-checks', 'feature/arena', '', 'preview/../main'])
    assert.equal(result('preview', branch), 0, branch);
});
test('Unknown Vercel environment: skip build', () => {
  assert.equal(result('development', 'preview/arena'), 0);
  assert.equal(result('', 'preview/arena'), 0);
});
