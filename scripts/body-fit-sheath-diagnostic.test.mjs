import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { bakeSwordBytes, sha256 } from './body-fit-bake.mjs';
import {
  PLANS,
  OUTPUT,
  diagnosticTransform,
  sheathState,
  createDiagnostics,
} from './body-fit-sheath-diagnostic.mjs';
import { projectSwordPoint } from './body-fit-sword-bake.mjs';
const inventory = JSON.parse(
  await readFile(OUTPUT + '/diagnostic-inventory.json', 'utf8'),
);
test('Missing sheath/support overrides alignment and prevents FIT_PASS', () => {
  assert.equal(
    sheathState({
      sheathPresent: false,
      supportPresent: true,
      fitReviewed: true,
    }),
    'NEEDS_NEW_SHEATH_ART',
  );
  assert.equal(
    sheathState({
      sheathPresent: true,
      supportPresent: false,
      fitReviewed: true,
    }),
    'NEEDS_NEW_SHEATH_ART',
  );
  assert.equal(
    sheathState({
      sheathPresent: true,
      supportPresent: true,
      fitReviewed: false,
    }),
    'NEEDS_REWORK',
  );
  assert.equal(
    sheathState({
      sheathPresent: true,
      supportPresent: true,
      fitReviewed: true,
      issues: ['arm crossing'],
    }),
    'NEEDS_REWORK',
  );
});
test('Unauthorized target and degenerate blade geometry rejected', () => {
  assert.throws(() => diagnosticTransform({ ...PLANS[0], id: 'other_sword' }));
  assert.throws(() => diagnosticTransform({ ...PLANS[0], tip: PLANS[0].root }));
});
for (const s of PLANS)
  test(
    s.id +
      ': deterministic bake, downward blade, grip above guard, proxy not a fixation',
    async () => {
      const m = inventory.assets.find((a) => a.id === s.id),
        t = diagnosticTransform(s),
        root = projectSwordPoint(s.root, t),
        tip = projectSwordPoint(s.tip, t),
        grip = projectSwordPoint(s.grip, t),
        guard = projectSwordPoint(s.guard, t);
      assert(Math.abs(root[0] - tip[0]) < 1e-8);
      assert(tip[1] > root[1]);
      assert(grip[1] < guard[1]);
      assert(
        Math.hypot(guard[0] - s.hipProxy[0], guard[1] - s.hipProxy[1]) < 1e-8,
      );
      assert.equal(
        sha256(await bakeSwordBytes(await readFile(m.source.path), t)),
        m.diagnostic.output.sha256,
      );
      assert.equal(m.hip.fixationVerified, false);
      assert.equal(m.finalSheathedOutput, null);
      assert.equal(m.ready, false);
    },
  );
test('A repeated run refuses to overwrite existing diagnostics or historical candidates', async () => {
  const before = await Promise.all(
    inventory.assets.map((m) => readFile(m.diagnostic.output.path)),
  );
  await assert.rejects(createDiagnostics(), (e) => e.code === 'EEXIST');
  for (let i = 0; i < inventory.assets.length; i++)
    assert.deepEqual(
      await readFile(inventory.assets[i].diagnostic.output.path),
      before[i],
    );
});
