import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('..', import.meta.url));
const out = path.join(root, 'build/task-0074-equipment-body-fit-v3');
const inventory = JSON.parse(
  await readFile(path.join(out, 'inventory.json'), 'utf8'),
);
if (inventory.findings.length) throw Error('Audit must pass before review');
const images = {};
for (const t of inventory.targets)
  for (const [file, expected] of [
    [t.avatar, t.avatarSha256],
    [t.staging, t.sha256],
  ]) {
    if (images[file]) continue;
    const bytes = await readFile(path.join(root, file));
    if (createHash('sha256').update(bytes).digest('hex') !== expected)
      throw Error('Review asset hash mismatch');
    images[file] = 'data:image/png;base64,' + bytes.toString('base64');
  }
const payload = { base: inventory.base, targets: inventory.targets, images };
const template = await readFile(
  path.join(root, 'tools/equipment-body-fit-v3-review.html'),
  'utf8',
);
const html = template.replace(
  '__BODY_FIT_REVIEW_DATA__',
  JSON.stringify(payload).replaceAll('<', '\\u003c'),
);
await mkdir(path.join(out, 'review'), { recursive: true });
await writeFile(path.join(out, 'review/index.html'), html);
console.log(
  JSON.stringify({
    targets: inventory.targets.length,
    images: Object.keys(images).length,
    bytes: Buffer.byteLength(html),
    scope: 'PRIVATE_OFFLINE_LOCAL_ONLY',
    remoteRequests: 0,
    humanApprovalsCreated: 0,
  }),
);
