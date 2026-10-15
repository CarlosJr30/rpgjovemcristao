import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const baseURL = process.env.GAMEPLAY_QA_URL ?? 'http://127.0.0.1:3175';
assert(
  ['127.0.0.1', 'rpgjovemcristao-web-inky.vercel.app'].includes(
    new URL(baseURL).hostname,
  ),
);
const origin = new URL(baseURL).origin;
const policy = JSON.parse(
  await readFile(
    path.join(root, 'docs/architecture/PROTOTYPE-AUDIO-ISOLATION-V1.json'),
    'utf8',
  ),
);
const routes = [
  '/',
  '/auth',
  '/journey',
  '/journey/arena',
  '/journey/equipment',
  '/journey/guild',
  '/journey/phases/o-jardim-e-a-escolha',
];
const dev = [
  '/tools/arena-lab/',
  '/dev/arena-lab',
  '/__arena_lab/assets',
  '/dev/avatar-hd-lab',
  '/dev/body-fit-lab',
];
const audio = policy.items.map(
  (i) => '/' + i.originalPath.replace('apps/web/public/', ''),
);
const sources = policy.items.map((i) => '/' + i.sourcePath);
const findings = [],
  results = [],
  chunks = new Set();
for (const route of [...routes, ...dev, ...audio, ...sources]) {
  let response = await fetch(origin + route, {
    redirect: 'manual',
    signal: AbortSignal.timeout(30_000),
  });
  const initialStatus = response.status;
  if (
    [307, 308].includes(response.status) &&
    response.headers.get('location')
  ) {
    const canonical = new URL(response.headers.get('location'), origin);
    assert.equal(canonical.origin, origin);
    await response.arrayBuffer();
    response = await fetch(canonical, {
      redirect: 'manual',
      signal: AbortSignal.timeout(30_000),
    });
  }
  const expected = routes.includes(route) ? 200 : 404;
  results.push({ route, initialStatus, status: response.status, expected });
  if (response.status !== expected) findings.push(`${route}:unexpected-status`);
  if (expected === 200) {
    const html = await response.text();
    if (/Vercel Authentication|Log in to Vercel/.test(html))
      findings.push(`${route}:deployment-protection`);
    for (const match of html.matchAll(/src="([^"\s]+\.js[^"\s]*)"/g))
      chunks.add(match[1].replaceAll('&amp;', '&'));
  } else await response.arrayBuffer();
}
let chatBundlePresent = false;
for (const chunk of chunks) {
  const url = new URL(chunk, origin);
  assert.equal(url.origin, origin);
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (response.status !== 200) {
    findings.push('missing-script');
    continue;
  }
  const text = await response.text();
  if (
    text.includes('Chat da célula') &&
    text.includes('send_guild_chat_message')
  )
    chatBundlePresent = true;
  if (
    /sb_secret_[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(
      text,
    )
  )
    findings.push('frontend-secret-pattern');
  for (const match of text.matchAll(
    /eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g,
  )) {
    try {
      if (
        JSON.parse(Buffer.from(match[1], 'base64url').toString()).role ===
        'service_role'
      )
        findings.push('frontend-service-role-key');
    } catch {
      /* Not every matching literal is a token. */
    }
  }
}
if (!chatBundlePresent) findings.push('chat-bundle-not-confirmed');
const result = {
  origin,
  publicRouteChecks: routes.length,
  restrictedAudio404: audio.length,
  restrictedSource404: sources.length,
  dev404: dev.length,
  frontendScriptsScanned: chunks.size,
  chatBundlePresent,
  liveTwoAccountChatAcceptance: 'NOT_EXECUTED_TASK_0072B_PENDING',
  results,
  findings,
  pass: findings.length === 0,
};
const inventory = JSON.parse(
  await readFile(
    path.join(root, 'build/task-0075-body-fit-final-review/inventory.json'),
    'utf8',
  ),
);
const privateChecks = [];
for (const p of [
  '/build/task-0075-body-fit-final-review/review/index.html',
  '/tools/equipment-body-fit-final-review.html',
  '/review/index.html',
  '/build/task-0075-body-fit-final-review/alternatives/shield_male_mount_attempt01.png',
  '/build/task-0075-body-fit-final-review/alternatives/shield_female_mount_attempt01.png',
  '/build/task-0075-body-fit-final-review/alternatives/shield_male_mount_attempt02.png',
  '/build/task-0075-body-fit-final-review/alternatives/shield_male_mount_attempt03.png',
  '/build/task-0075-body-fit-final-review/TASK-0075-revisao.zip',
  ...inventory.targets.flatMap((t) => [
    '/' + t.staging,
    '/' + t.source,
    '/assets/equipment/overlays/body-fit-v3/' + path.basename(t.staging),
  ]),
]) {
  const response = await fetch(origin + p, {
    redirect: 'manual',
    signal: AbortSignal.timeout(30_000),
  });
  await response.arrayBuffer();
  privateChecks.push({ path: p, status: response.status });
  if (response.status !== 404) findings.push('private-candidate-exposed:' + p);
}
const approved = inventory.targets.find((t) => t.verifiedHumanApproval);
const publicAsset =
  '/assets/equipment/overlays/body-fit-v3/armor_traveler_uncommon_female_approved.png';
const response = await fetch(origin + publicAsset, {
  signal: AbortSignal.timeout(30_000),
});
const publicSha = createHash('sha256')
  .update(Buffer.from(await response.arrayBuffer()))
  .digest('hex');
if (response.status !== 200 || publicSha !== approved.sha256)
  findings.push('approved-public-asset-binding');
Object.assign(result, {
  privateChecks,
  approvedPublicAsset: {
    path: publicAsset,
    status: response.status,
    sha256: publicSha,
  },
  pass: findings.length === 0,
});
await writeFile(
  path.join(
    root,
    `build/task-0075-body-fit-final-review/${new URL(origin).hostname === '127.0.0.1' ? 'local' : 'production'}-smoke.json`,
  ),
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result));
if (findings.length) process.exitCode = 1;
