import assert from 'node:assert/strict';
import {
  readFile,
  writeFile,
  mkdir,
  symlink,
  copyFile,
} from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = path.join(root, 'build/task-0065-mobile-release');
await mkdir(out, { recursive: true });
const git = (...args) =>
  execFileSync('git', args, {
    cwd: root,
    windowsHide: true,
    maxBuffer: 40 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const read = async (name) =>
  JSON.parse(await readFile(path.join(out, name), 'utf8'));
const write = async (name, data) =>
  writeFile(path.join(out, name), JSON.stringify(data, null, 2) + '\n');
const mode = process.argv[2];
const runtime = [
  'apps/web/features/auth/auth.module.css',
  ...[
    'arena-stage.module.css',
    'diary-experience.module.css',
    'equipment-portal.module.css',
    'guild-artwork.tsx',
    'guild-experience.module.css',
    'shell.tsx',
    'snake-chase-game.tsx',
    'mobile-game-mode.module.css',
    'responsive-panel.tsx',
    'responsive-panel.test.tsx',
  ].map((file) => 'apps/web/features/journey/components/' + file),
  'apps/web/features/journey/journey.module.css',
  'apps/web/features/journey/equipment-overlays.test.tsx',
  ...['arena', 'create', 'equipment', 'home', 'phase'].map(
    (file) => `apps/web/features/journey/screens/${file}.tsx`,
  ),
  ...[
    'diary-experience',
    'equipment-portal',
    'guild-experience-v2',
    'snake-playthrough',
    'mobile-game-mode',
  ].map((file) => `tests/e2e/${file}.spec.ts`),
  ...[
    'bootstrap',
    'audit',
    'performance',
    'review',
    'webkit-navigation',
    'acceptance',
  ].map((file) => `scripts/mobile-game-mode-${file}.mjs`),
  'scripts/mobile-game-release.mjs',
  'playwright.game-mode.config.ts',
  'playwright.release-mobile.config.ts',
];
const documents = [
  'docs/architecture/TASK-0064-MOBILE-GAME-MODE-REPORT.md',
  'tasks/completed/TASK-0064-mobile-game-mode-v1.md',
  'tasks/active/TASK-0065-publish-mobile-game-mode.md',
  'docs/architecture/TASK-0065-MOBILE-RELEASE-REPORT.md',
  'docs/security/TASK-0065-PRODUCTION-REVIEW.md',
];
if (mode === 'plan') {
  assert.equal(
    git('diff', '--cached', '--name-only').toString().trim(),
    '',
    'Preserve existing staging',
  );
  const candidates = [...runtime, ...documents];
  for (const file of candidates) await readFile(path.join(root, file));
  const paths = git(
    'ls-files',
    '-z',
    '--cached',
    '--others',
    '--exclude-standard',
  )
    .toString()
    .split('\0')
    .filter(Boolean);
  const baseline = {};
  for (const file of new Set(paths)) {
    try {
      baseline[file] = sha(await readFile(path.join(root, file)));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      baseline[file] = null;
    }
  }
  await write('preservation-before.json', {
    commit: git('rev-parse', 'HEAD').toString().trim(),
    hashes: baseline,
  });
  await write('release-plan.json', {
    branch: 'main',
    baseCommit: git('rev-parse', 'HEAD').toString().trim(),
    candidates,
    runtime,
    excludedSharedDocs: [
      '.agent/memory/CURRENT_STATE.md',
      'docs/architecture/EQUIPMENT-MASTER-CHECKLIST-V1.md',
    ],
    reason:
      'Shared docs contain prior uncommitted history; preserve locally and publish dedicated release records.',
    privateEnvironmentIncluded: false,
  });
  console.log(
    JSON.stringify({
      candidates: candidates.length,
      baseline: Object.keys(baseline).length,
    }),
  );
} else if (mode === 'snapshot') {
  const plan = await read('release-plan.json');
  const snapshot = path.join(out, 'release-snapshot-' + Date.now());
  await mkdir(snapshot);
  const privateIndex = path.join(out, 'snapshot-index-' + Date.now());
  const env = { ...process.env, GIT_INDEX_FILE: privateIndex };
  const run = (args) =>
    execFileSync('git', args, {
      cwd: root,
      env,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  run(['read-tree', plan.baseCommit]);
  run([
    'checkout-index',
    '--all',
    '--prefix=' + snapshot.replaceAll('\\', '/') + '/',
  ]);
  for (const file of plan.candidates) {
    await mkdir(path.dirname(path.join(snapshot, file)), { recursive: true });
    await copyFile(path.join(root, file), path.join(snapshot, file));
  }
  await symlink(
    path.join(root, 'node_modules'),
    path.join(snapshot, 'node_modules'),
    'junction',
  );
  await write('snapshot-location.json', {
    snapshot,
    privateEnvironmentCopied: false,
    dependencies: 'Existing node_modules reused; no installation',
    files: plan.candidates,
  });
  console.log(JSON.stringify({ snapshot, privateEnvironmentCopied: false }));
} else if (mode === 'preserve') {
  const baseline = await read('preservation-before.json');
  const permitted = new Set([
    'apps/web/features/journey/equipment-overlays.test.tsx',
    '.agent/memory/CURRENT_STATE.md',
    'docs/architecture/EQUIPMENT-MASTER-CHECKLIST-V1.md',
    'tasks/active/TASK-0065-publish-mobile-game-mode.md',
    'docs/architecture/TASK-0065-MOBILE-RELEASE-REPORT.md',
    'docs/security/TASK-0065-PRODUCTION-REVIEW.md',
    'scripts/mobile-game-release.mjs',
  ]);
  const unexpected = [],
    changed = [];
  let unchanged = 0;
  for (const [file, digest] of Object.entries(baseline.hashes)) {
    let actual = null;
    try {
      actual = sha(await readFile(path.join(root, file)));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (actual === digest) unchanged++;
    else if (permitted.has(file)) changed.push(file);
    else unexpected.push(file);
  }
  await write('preservation-final.json', {
    pass: unexpected.length === 0,
    baselineFiles: Object.keys(baseline.hashes).length,
    unchanged,
    permittedChanges: changed,
    unexpected,
  });
  assert.deepEqual(unexpected, []);
  console.log(
    JSON.stringify({ pass: true, unchanged, permittedChanges: changed.length }),
  );
} else if (mode === 'index') {
  const plan = await read('release-plan.json');
  const snapshot = await read('snapshot-location.json');
  const staged = git('diff', '--cached', '--name-only', '-z')
    .toString()
    .split('\0')
    .filter(Boolean);
  assert.deepEqual(new Set(staged), new Set(plan.candidates));
  const findings = [],
    sizes = [];
  const patterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[A-Z0-9]{16}|sk-proj-[A-Za-z0-9_-]{30,}|sb_secret_[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{20,})\b/,
    /(?:postgres(?:ql)?|mysql):\/\/[^\s:]+:[^\s@]{4,}@/,
  ];
  const norm = (bytes) => bytes.toString('utf8').replaceAll('\r\n', '\n');
  for (const file of staged) {
    const bytes = git('show', ':' + file);
    sizes.push({ file, bytes: bytes.length });
    if (
      bytes.length > 1024 * 1024 ||
      /(?:\.env|\.png$|\.ogg$|\.vercel\/|trace\.zip|task-0059|TASK-0059)/.test(
        file,
      )
    )
      findings.push({ file, reason: 'UNEXPECTED_PRIVATE_MEDIA_OR_SCOPE' });
    if (patterns.some((pattern) => pattern.test(bytes.toString())))
      findings.push({ file, reason: 'SECRET_PATTERN' });
    for (const token of bytes
      .toString()
      .matchAll(
        /\beyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]{15,}\b/g,
      )) {
      try {
        if (
          JSON.parse(Buffer.from(token[1], 'base64url').toString()).role ===
          'service_role'
        )
          findings.push({ file, reason: 'PRIVILEGED_JWT' });
      } catch {
        /* Do not print token. */
      }
    }
    if (plan.runtime.includes(file))
      assert.equal(
        norm(bytes),
        norm(await readFile(path.join(snapshot.snapshot, file))),
        'Tested source differs: ' + file,
      );
  }
  const policy = JSON.parse(
    await readFile(
      path.join(root, 'docs/architecture/PROTOTYPE-AUDIO-ISOLATION-V1.json'),
      'utf8',
    ),
  );
  const indexPaths = git('ls-files', '-z').toString().split('\0');
  for (const item of policy.items) {
    assert(!indexPaths.includes(item.originalPath));
    assert.equal(sha(git('show', ':' + item.sourcePath)), item.sha256);
  }
  const result = {
    pass: findings.length === 0,
    stagedPaths: staged,
    sizes,
    findings,
    runtimeMatchesSnapshot: true,
    restrictedSourcesPreserved: 8,
    limitation:
      'Targeted review and heuristic secret scan, not all secret formats.',
  };
  await write('index-review.json', result);
  assert(result.pass, JSON.stringify(findings));
  git('diff', '--cached', '--check');
  console.log(
    JSON.stringify({
      pass: true,
      files: staged.length,
      restrictedSourcesPreserved: 8,
      runtimeMatchesSnapshot: true,
    }),
  );
} else throw Error('Expected plan/snapshot/preserve/index');
