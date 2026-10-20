import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const LOCK_PATH =
  'packages/database/reviewed/consolidation-002.lock.json';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const normalized = (bytes) =>
  Buffer.from(
    bytes
      .toString('utf8')
      .replace(/^\uFEFF/, '')
      .replaceAll('\r\n', '\n'),
  );
function inside(root, path) {
  const rel = relative(root, path);
  assert.ok(
    rel && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel),
    'Path outside intended package root',
  );
}
function recipe(repoRoot) {
  const lock = JSON.parse(readFileSync(resolve(repoRoot, LOCK_PATH), 'utf8'));
  assert.equal(lock.format, 1);
  assert.equal(lock.task, 'TASK-CONSOLIDATION-002');
  assert.equal(lock.steps.length, 13);
  assert.equal(lock.previewGo, false);
  assert.equal(lock.remoteApplyAuthorized, false);
  assert.deepEqual(
    lock.steps.map((s) => s.order),
    Array.from({ length: 13 }, (_, i) => i + 1),
  );
  assert.equal(new Set(lock.steps.map((s) => s.source)).size, 13);
  const payload = `${JSON.stringify(lock, null, 2)}\n`;
  return { ...lock, packageId: digest(payload) };
}
function sourceBytes(repoRoot, entry) {
  assert.ok(
    /^packages\/database\/(?:migrations|proposals)\/[a-zA-Z0-9_./-]+\.(?:sql|json)$/.test(
      entry.source,
    ),
  );
  const file = resolve(repoRoot, entry.source);
  inside(repoRoot, realpathSync(file));
  const bytes = normalized(readFileSync(file));
  assert.equal(
    digest(bytes),
    entry.sha256,
    `Unreviewed source change: ${entry.source}`,
  );
  assert.equal(bytes.length, entry.bytes);
  return bytes;
}
const readme = `TASK-CONSOLIDATION-002: OFFLINE REVIEW PACKAGE ONLY
This package is not a remote SQL applier and is not approved for hosted installation.
Read manifest.json; apply the 13 existing SQL files in steps order only in the disposable local test.
The Drizzle journal has nine entries. QR0080 and proposals0081-0083 are not registered as applied.
Do not reapply CREATE statements to a non-empty target. Confirm the target and histories first.
Use a transaction wrapper for files without their own BEGIN/COMMIT. Keep existing SQL unchanged.
Baseline economic writes remain a P1 gate; previewGo=false. This is not economy hardening0078.
No test identities, lessons, cards, videos, passwords or production credentials are packaged.
Remote project creation, Auth/env changes, migrations and deployment require specific authorization.
Before commit: rollback the failed transaction. After commit: suspend module and preserve evidence;
do not DROP tables, run destructive down files or re-enable revoked legacy write RPCs.
`;

function rejectExtraFiles(directory, allowed, root = directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    assert.ok(!entry.isSymbolicLink(), 'Package links are not allowed');
    if (entry.isDirectory()) rejectExtraFiles(path, allowed, root);
    else
      assert.ok(
        allowed.has(relative(root, path).split(sep).join('/')),
        `Unexpected packaged file: ${entry.name}`,
      );
  }
}

export function prepareDatabasePackage(
  repoDirectory = process.cwd(),
  name = 'db-package',
) {
  assert.match(name, /^[a-z][a-z0-9-]{0,60}$/);
  const repoRoot = realpathSync(repoDirectory),
    manifest = recipe(repoRoot);
  // Validate every source before creating output, so bad inputs cannot leave a partial reviewed package.
  const files = [manifest.journal, ...manifest.steps].map((entry) => [
    entry.source,
    sourceBytes(repoRoot, entry),
  ]);
  files.push(
    ['manifest.json', Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`)],
    ['README.txt', Buffer.from(readme)],
  );
  const output = resolve(repoRoot, 'build/task-consolidation-002', name);
  inside(resolve(repoRoot, 'build/task-consolidation-002'), output);
  // Check existing ancestors before mkdir: a junction must not redirect output.
  let ancestor = repoRoot;
  for (const segment of relative(repoRoot, output).split(sep)) {
    ancestor = resolve(ancestor, segment);
    if (existsSync(ancestor))
      assert.ok(
        !lstatSync(ancestor).isSymbolicLink(),
        'Package output links are not allowed',
      );
  }
  rejectExtraFiles(output, new Set(files.map(([path]) => path)));
  // Existing differing output is never overwritten or deleted.
  for (const [path, bytes] of files) {
    const file = resolve(output, path);
    inside(output, file);
    if (existsSync(file))
      assert.deepEqual(
        readFileSync(file),
        bytes,
        `Existing package differs: ${path}`,
      );
  }
  mkdirSync(output, { recursive: true });
  inside(repoRoot, realpathSync(output));
  for (const [path, bytes] of files) {
    const file = resolve(output, path);
    if (existsSync(file)) continue;
    mkdirSync(dirname(file), { recursive: true });
    const directory = realpathSync(dirname(file));
    if (directory !== realpathSync(output))
      inside(realpathSync(output), directory);
    writeFileSync(file, bytes, { flag: 'wx' });
  }
  verifyDatabasePackage(repoRoot, output);
  return {
    output,
    packageId: manifest.packageId,
    sqlFiles: manifest.steps.length,
    remoteApplyAuthorized: false,
    previewGo: false,
  };
}

export function verifyDatabasePackage(repoDirectory, directory) {
  const repoRoot = realpathSync(repoDirectory),
    output = realpathSync(directory),
    expected = recipe(repoRoot);
  const actual = JSON.parse(
    readFileSync(resolve(output, 'manifest.json'), 'utf8'),
  );
  assert.deepEqual(
    actual,
    expected,
    'Package manifest differs from reviewed lock',
  );
  rejectExtraFiles(
    output,
    new Set([
      expected.journal.source,
      ...expected.steps.map((s) => s.source),
      'manifest.json',
      'README.txt',
    ]),
  );
  for (const entry of [expected.journal, ...expected.steps]) {
    const file = realpathSync(resolve(output, entry.source));
    inside(output, file);
    const bytes = readFileSync(file);
    assert.equal(
      digest(bytes),
      entry.sha256,
      `Corrupt packaged file: ${entry.source}`,
    );
    assert.equal(bytes.length, entry.bytes);
  }
  assert.equal(readFileSync(resolve(output, 'README.txt'), 'utf8'), readme);
  return actual;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  assert.equal(
    process.argv.length,
    2,
    'This command has no remote target or apply mode',
  );
  console.log(JSON.stringify(prepareDatabasePackage()));
}
