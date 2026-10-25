import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const version = JSON.parse(
  readFileSync(resolve(root, 'node_modules/next/package.json'), 'utf8'),
).version;
assert.equal(
  version,
  '16.4.2',
  'Review RPG-DEV-005 patch before changing Next version',
);
const helper = readFileSync(
  new URL('./patches/next-rsc-departure.txt', import.meta.url),
  'utf8',
).replaceAll('\r\n', '\n');
const signature = 'function fetchInternal(input, init) {';
const guarded =
  signature +
  `
    if (isDocumentDeparting && init?.priority === 'low' && !init?.signal?.aborted) {
        return deferPrefetchRequest(input, init);
    }`;
const suffix = '\n' + helper;
const targets = [
  [
    'client',
    '378770d930578c5103083c029f8e388c4315ec67666d5843b2ddfc8af9469061',
  ],
  [
    'esm/client',
    'c654815886065d532207f212ad58a2198fa2c58cef9ca13d7a6bc66fa4c5abdb',
  ],
];
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const restore = process.argv.includes('--restore');
const check = process.argv.includes('--check');
// Validate every target before any write. Unknown or partially modified sources
// fail closed; no downloads, shell commands, fuzzy patches or version ranges.
const changes = targets.map(([format, expected]) => {
  const path = resolve(
    root,
    'node_modules/next/dist',
    format,
    'components/segment-cache/fetch.js',
  );
  const current = readFileSync(path, 'utf8');
  const patched = current.includes(guarded) && current.endsWith(suffix);
  const original = patched
    ? current.slice(0, -suffix.length).replace(guarded, signature)
    : current;
  assert.equal(sha256(original), expected, 'Unexpected Next source: ' + format);
  assert.equal(original.split(signature).length, 2, 'Ambiguous patch anchor');
  if (check) assert.ok(patched, 'RSC departure patch missing: ' + format);
  return {
    path,
    current,
    desired: restore ? original : original.replace(signature, guarded) + suffix,
  };
});
if (!check)
  for (const { path, current, desired } of changes) {
    if (current !== desired) writeFileSync(path, desired);
  }
console.log(
  `Next ${version} RSC departure patch: ${check ? 'verified' : restore ? 'restored for diagnostic control' : 'applied'} (${changes.length} module formats)`,
);
