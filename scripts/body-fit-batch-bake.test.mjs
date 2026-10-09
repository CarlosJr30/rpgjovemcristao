import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import {
  OUTPUT,
  PILOT,
  validateBatchSettings,
  inspectPng,
} from './body-fit-batch-bake.mjs';
import { bakeBytes, sha256 } from './body-fit-bake.mjs';
const json = async (p) => JSON.parse(await readFile(p, 'utf8'));
const settings = await json(OUTPUT + '/settings.json');
const targets = (await json('docs/architecture/NEEDS_NEW_BODY_FIT_ASSET.json'))
  .assets;
const inv = await json(OUTPUT + '/inventory.json');
test('Batch rejects approved pilot even when15 filenames remain', () => {
  const invalid = structuredClone(settings);
  invalid[0].filename = PILOT;
  assert.throws(() => validateBatchSettings(invalid, targets), /Unauthorized/);
});
test('Batch rejects duplicate/missing target and cross-gender references', () => {
  assert.throws(() => validateBatchSettings(settings.slice(1), targets));
  const dup = structuredClone(settings);
  dup[1].filename = dup[0].filename;
  assert.throws(() => validateBatchSettings(dup, targets));
  const crossed = structuredClone(targets);
  crossed.find((t) => t.filename === settings[0].filename).referenceAvatar.id =
    'female_short_moss_medium';
  assert.throws(() => validateBatchSettings(settings, crossed), /Cross-gender/);
});
test('Bad landmark weights and degenerate geometry are rejected', () => {
  const invalid = structuredClone(settings);
  Object.values(invalid[0].landmarks)[0].weight = -1;
  assert.throws(() => validateBatchSettings(invalid, targets));
  for (const p of Object.values(invalid[0].landmarks)) {
    p.weight = 1;
    p.source = [1, 1];
  }
  assert.throws(() => validateBatchSettings(invalid, targets), /Degenerate/);
});
test('Dimension/alpha checks cannot pass an empty PNG', async () => {
  const empty = await sharp({
    create: { width: 1024, height: 1536, channels: 4, background: '#00000000' },
  })
    .png()
    .toBuffer();
  await assert.rejects(inspectPng(empty), /transparency/);
});
for (const a of inv.assets)
  test(a.id + ' deterministically reproduces frozen baked bytes', async () => {
    const m = await json(a.metadata),
      source = await readFile(m.source.path);
    const first = await bakeBytes(source, m.transform),
      second = await bakeBytes(source, m.transform);
    assert.equal(sha256(first), a.sha256);
    assert.deepEqual(first, second);
  });
test('Technical and visual PASS never imply human approval, READY or activation', () => {
  assert.equal(inv.assets.length, 15);
  assert(inv.assets.some((a) => a.fitStatus === 'FIT_PASS'));
  for (const a of inv.assets) {
    assert.equal(a.humanBodyFitApproved, false);
    assert.equal(a.ready, false);
    assert.equal(a.runtimeActivated, false);
    if (a.fitStatus === 'FIT_PASS')
      assert.equal(a.reviewStatus, 'HUMAN_BODY_FIT_REVIEW_PENDING');
  }
});
