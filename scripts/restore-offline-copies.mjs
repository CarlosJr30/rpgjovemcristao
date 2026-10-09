import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const restore = process.argv.includes('--restore');
assert(process.argv.slice(2).every((arg) => arg === '--restore'));
const manifest = JSON.parse(
  await fs.readFile(path.join(root, 'docs/architecture/TASK-0061-OFFLINE-COPIES.json'), 'utf8'),
);
const digest = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
let missing = 0;
let created = 0;
const resolveInside = (relative) => {
  assert(!path.isAbsolute(relative));
  const resolved = path.resolve(root, relative);
  assert(resolved.startsWith(root + path.sep));
  return resolved;
};

// Validate every input and existing target before writing anything.
const pending = [];
for (const entry of manifest.copies) {
  assert(entry.path.startsWith('build/'));
  assert(entry.source.startsWith('apps/web/public/') || entry.source.startsWith('assets-source/'));
  const source = resolveInside(entry.source);
  const target = resolveInside(entry.path);
  const bytes = await fs.readFile(source);
  assert.equal(digest(bytes), entry.sha256, `Source hash mismatch: ${entry.source}`);
  try {
    assert.equal(digest(await fs.readFile(target)), entry.sha256, `Existing target differs: ${entry.path}`);
  } catch (cause) {
    if (cause.code !== 'ENOENT') throw cause;
    missing++;
    pending.push({ target, source });
  }
}
if (restore) {
  for (const { target, source } of pending) {
    await fs.mkdir(path.dirname(target), { recursive: true });
    // Exclusive creation: an existing file is never overwritten.
    await fs.copyFile(source, target, constants.COPYFILE_EXCL);
    created++;
  }
}
console.log(JSON.stringify({ checked: manifest.copies.length, missing, created, mode: restore ? 'restore' : 'check' }));
