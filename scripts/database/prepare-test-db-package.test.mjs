import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  realpathSync,
  rmSync,
  existsSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve, sep, basename } from 'node:path';
import {
  LOCK_PATH,
  prepareDatabasePackage,
  verifyDatabasePackage,
} from './prepare-test-db-package.mjs';

const roots = [];
function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), 'rpg-consolidation002-'));
  roots.push(root);
  const lock = JSON.parse(readFileSync(LOCK_PATH, 'utf8'));
  for (const path of [
    LOCK_PATH,
    lock.journal.source,
    ...lock.steps.map((s) => s.source),
  ]) {
    const target = resolve(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, readFileSync(path));
  }
  return { root, lock };
}
after(() => {
  for (const root of roots) {
    const absolute = realpathSync(root);
    assert.equal(absolute, resolve(root));
    assert.ok(absolute.startsWith(realpathSync(tmpdir()) + sep));
    assert.ok(basename(absolute).startsWith('rpg-consolidation002-'));
    rmSync(absolute, { recursive: true });
  }
});
test('package copies exactly the reviewed SQL with a stable identity and safely reuses identical output', () => {
  const { root } = fixture();
  const a = prepareDatabasePackage(root, 'package-a'),
    b = prepareDatabasePackage(root, 'package-b');
  assert.equal(a.packageId, b.packageId);
  assert.deepEqual(
    readFileSync(resolve(a.output, 'manifest.json')),
    readFileSync(resolve(b.output, 'manifest.json')),
  );
  assert.deepEqual(prepareDatabasePackage(root, 'package-a'), a);
  assert.equal(
    verifyDatabasePackage(root, a.output).steps.filter((s) => s.journaled)
      .length,
    9,
  );
  assert.equal(a.remoteApplyAuthorized, false);
  assert.equal(a.previewGo, false);
});
test('changed SQL is refused before output is created; source and old package are never overwritten', () => {
  const { root, lock } = fixture(),
    path = resolve(root, lock.steps[0].source);
  const before = readFileSync(path);
  writeFileSync(
    path,
    Buffer.concat([before, Buffer.from('\n-- unreviewed change\n')]),
  );
  assert.throws(() => prepareDatabasePackage(root), /Unreviewed source change/);
  assert.equal(
    existsSync(resolve(root, 'build/task-consolidation-002/db-package')),
    false,
  );
});
test('tampered SQL or manifest is rejected and traversal cannot choose an output outside build', () => {
  const { root, lock } = fixture(),
    a = prepareDatabasePackage(root);
  const target = resolve(a.output, lock.steps[0].source);
  writeFileSync(target, '-- damaged');
  assert.throws(
    () => verifyDatabasePackage(root, a.output),
    /Corrupt packaged file/,
  );
  assert.throws(() => prepareDatabasePackage(root), /Existing package differs/);
  const b = prepareDatabasePackage(root, 'second');
  const manifest = verifyDatabasePackage(root, b.output);
  manifest.previewGo = true;
  writeFileSync(resolve(b.output, 'manifest.json'), JSON.stringify(manifest));
  assert.throws(
    () => verifyDatabasePackage(root, b.output),
    /Package manifest differs/,
  );
  assert.throws(() => prepareDatabasePackage(root, '../unsafe'));
  const c = prepareDatabasePackage(root, 'third');
  writeFileSync(resolve(c.output, 'unreviewed.sql'), 'SELECT 1;');
  assert.throws(
    () => verifyDatabasePackage(root, c.output),
    /Unexpected packaged file/,
  );
  assert.throws(
    () => prepareDatabasePackage(root, 'third'),
    /Unexpected packaged file/,
  );
  const redirected = resolve(root, 'redirected');
  mkdirSync(redirected);
  symlinkSync(
    redirected,
    resolve(root, 'build/task-consolidation-002/linked'),
    'junction',
  );
  assert.throws(
    () => prepareDatabasePackage(root, 'linked'),
    /Package output links/,
  );
  assert.equal(existsSync(resolve(redirected, 'manifest.json')), false);
});
