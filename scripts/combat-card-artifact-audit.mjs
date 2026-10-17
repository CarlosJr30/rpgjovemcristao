import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const origin = process.argv[2] ?? 'http://127.0.0.1:3176';
if (origin !== 'http://127.0.0.1:3176')
  throw Error('Audit is restricted to the owned local production build');
const out = path.join(root, 'build/task-0076-combat-card-system');
await mkdir(out, { recursive: true });
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function files(dir) {
  const all = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) all.push(...(await files(p)));
    else if (entry.isFile()) all.push(p);
  }
  return all;
}
const findings = [];
const traceFindings = [];
let traces = 0;
for (const file of await files(path.join(root, 'apps/web/.next'))) {
  if (!file.endsWith('.nft.json')) continue;
  traces++;
  const trace = JSON.parse(await readFile(file, 'utf8'));
  for (const dependency of trace.files ?? []) {
    if (/(?:assets-source|build[\\/]task-|\.env(?:\.|$))/.test(dependency))
      traceFindings.push({ file: path.relative(root, file), dependency });
  }
}
let chunks = 0;
for (const file of await files(path.join(root, 'apps/web/.next/static'))) {
  if (!/\.(js|css)$/.test(file)) continue;
  chunks++;
  const text = await readFile(file, 'utf8');
  if (/sb_secret_[A-Za-z0-9_-]{16,}/.test(text))
    findings.push({
      file: path.relative(root, file),
      kind: 'SECRET_KEY_PATTERN',
    });
  for (const jwt of text.matchAll(
    /eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g,
  )) {
    try {
      if (
        JSON.parse(Buffer.from(jwt[1], 'base64url').toString()).role ===
        'service_role'
      )
        findings.push({
          file: path.relative(root, file),
          kind: 'SERVICE_ROLE_JWT',
        });
    } catch {}
  }
}
const policy = JSON.parse(
  await readFile(
    path.join(root, 'docs/architecture/PROTOTYPE-AUDIO-ISOLATION-V1.json'),
    'utf8',
  ),
);
const checks = [
  ...policy.items.map((item) => ({
    path: item.originalPath.replace('apps/web/public', ''),
    expected: 404,
  })),
  ...[
    '/.env',
    '/.env.local',
    '/build/task-0076-combat-card-system/production-security-reaudit.json',
    '/build/task-0075-body-fit-final-review/review/index.html',
    '/dev/arena-lab',
    '/dev/avatar-runtime-lab',
  ].map((p) => ({ path: p, expected: 404 })),
];
const http = [];
for (const item of checks) {
  const response = await fetch(origin + item.path);
  await response.arrayBuffer();
  http.push({
    ...item,
    status: response.status,
    pass: response.status === item.expected,
  });
}
const protectedPaths = [
  'apps/web/public',
  'assets-source',
  'packages/database',
  'apps/web/lib/supabase',
  'apps/web/features/journey/components/snake-chase-game.tsx',
  'apps/web/features/journey/data/snake*',
  'docs/architecture/*approval*',
];
const protectedDiff = execFileSync(
  'git',
  ['diff', '--name-only', 'HEAD', '--', ...protectedPaths],
  { cwd: root, encoding: 'utf8' },
)
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);
const newSources = [
  'packages/game-engine/src/combat-card-system.ts',
  'apps/web/features/journey/components/card-arena.tsx',
  'apps/web/features/journey/components/card-arena.module.css',
  'apps/web/features/journey/persistence/card-arena-storage.ts',
  'apps/web/features/journey/data/card-arena-reward.ts',
];
const sources = Object.fromEntries(
  await Promise.all(
    newSources.map(async (p) => [p, hash(await readFile(path.join(root, p)))]),
  ),
);
const report = {
  origin,
  at: new Date().toISOString(),
  buildId: (
    await readFile(path.join(root, 'apps/web/.next/BUILD_ID'), 'utf8')
  ).trim(),
  chunksScanned: chunks,
  findings,
  tracesScanned: traces,
  traceFindings,
  http,
  protectedDiff,
  sources,
  artifactPass:
    findings.length === 0 &&
    traceFindings.length === 0 &&
    http.every((item) => item.pass) &&
    protectedDiff.length === 0,
  productionSecurityGate:
    'BLOCKED: pre-existing SEC-ECONOMY-001; artifact scan is not a database authorization audit',
};
await writeFile(
  path.join(out, 'artifact-audit.json'),
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify({
    artifactPass: report.artifactPass,
    chunksScanned: chunks,
    tracesScanned: traces,
    privateTraceFindings: traceFindings.length,
    httpPass: http.filter((item) => item.pass).length,
    httpTotal: http.length,
    protectedFilesChanged: protectedDiff.length,
    credentialFindings: findings.length,
    productionSecurityGate: report.productionSecurityGate,
  }),
);
process.exitCode = report.artifactPass ? 0 : 1;
