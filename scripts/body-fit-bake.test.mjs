import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { approvalMatches } from './body-fit-bake-approval.mjs';
import {
  bakeBytes,
  bakePilot,
  fitStateForOutput,
  fitSimilarity,
  projectPoint,
  sha256,
  validateTransform,
  PILOT_SOURCE,
  OUTPUT,
} from './body-fit-bake.mjs';

const metadata = JSON.parse(
  await readFile(OUTPUT + '/fit-metadata.json', 'utf8'),
);
const source = await readFile(PILOT_SOURCE);

test('actual approved source is unchanged and baked output is native RGBA with true transparency', async () => {
  const before = sha256(source),
    bytes = await bakeBytes(source, metadata.transform),
    m = await sharp(bytes).metadata();
  assert.equal(before, metadata.source.sha256);
  assert.equal(sha256(await readFile(PILOT_SOURCE)), before);
  assert.equal(m.width, 1024);
  assert.equal(m.height, 1536);
  assert.equal(m.channels, 4);
  assert.equal(m.hasAlpha, true);
  assert.equal(m.format, 'png');
  const raw = await sharp(bytes).raw().toBuffer();
  let transparent = 0,
    visible = 0;
  for (let i = 3; i < raw.length; i += 4) {
    if (raw[i] === 0) transparent++;
    else visible++;
  }
  assert.ok(transparent > 1_000_000 && visible > 10_000);
});
test('re-baking exact metadata produces identical PNG bytes and saved staging hash', async () => {
  const a = await bakeBytes(source, metadata.transform),
    b = await bakeBytes(source, metadata.transform);
  assert.deepEqual(a, b);
  assert.equal(sha256(a), metadata.output.sha256);
  assert.equal(
    sha256(await readFile(OUTPUT + '/baked_overlay.png')),
    sha256(a),
  );
});
test('source coordinates are baked to output coordinates without runtime compensation', async () => {
  const raw = Buffer.alloc(1024 * 1536 * 4);
  const k = (200 * 1024 + 100) * 4;
  raw[k] = 255;
  raw[k + 3] = 255;
  const input = await sharp(raw, {
    raw: { width: 1024, height: 1536, channels: 4 },
  })
    .png()
    .toBuffer();
  const bytes = await bakeBytes(input, {
    translateX: 17,
    translateY: 23,
    scale: 1,
    rotation: 0,
  });
  const pixels = await sharp(bytes).raw().toBuffer();
  assert.equal(pixels[(223 * 1024 + 117) * 4], 255);
  assert.equal(pixels[(223 * 1024 + 117) * 4 + 3], 255);
  assert.equal(pixels[k + 3], 0);
  assert.deepEqual(
    projectPoint([100, 200], {
      translateX: 17,
      translateY: 23,
      scale: 1,
      rotation: 0,
    }),
    [117, 223],
  );
});
test('uniform fit recovers a known scale and translation without independent axes', () => {
  const pairs = {
    a: { source: [10, 20], avatar: [25, 50] },
    b: { source: [50, 70], avatar: [45, 75] },
    c: { source: [80, 40], avatar: [60, 60] },
  };
  const actual = fitSimilarity(pairs);
  const expected = {
    translateX: 20,
    translateY: 40,
    scale: 0.5,
    rotation: 0,
  };
  for (const key of Object.keys(expected))
    assert.ok(Math.abs(actual[key] - expected[key]) < 1e-9);
});
test('nonuniform, warp, nonfinite and excessive rotations cannot enter offline pipeline', () => {
  const t = { translateX: 0, translateY: 0, scale: 1, rotation: 0 };
  for (const invalid of [
    { ...t, scaleX: 1 },
    { ...t, warp: true },
    { ...t, scale: 0 },
    { ...t, scale: NaN },
    { ...t, rotation: 6 },
    { ...t, translateX: Infinity },
  ])
    assert.throws(() => validateTransform(invalid));
  assert.throws(
    () =>
      fitSimilarity({
        a: { source: [1, 1], avatar: [2, 2] },
        b: { source: [1, 1], avatar: [2, 2] },
      }),
    /Degenerate/,
  );
});
test('wrong item/source binding and a forged source hash are rejected before staging writes', async () => {
  await assert.rejects(
    () => bakePilot({ ...metadata, itemId: 'another-item' }),
    /authorized pilot/,
  );
  await assert.rejects(
    () =>
      bakePilot({
        ...metadata,
        source: { ...metadata.source, sha256: '0'.repeat(64) },
      }),
    /hash mismatch/,
  );
});
test('baked contract and review presentation have no corrective runtime transform or readiness', async () => {
  assert.deepEqual(metadata.runtime.render, {
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    transform: 'none',
  });
  assert.equal(metadata.runtime.activated, false);
  assert.equal(metadata.ready, false);
  assert.equal(metadata.humanBodyFitApproved, false);
  const review = await readFile(OUTPUT + '/review/index.html', 'utf8');
  assert.match(review, /data-baked/);
  assert.doesNotMatch(review, /data-baked[^>]*transform:/);
});
test('changed bake hash invalidates a previous FIT_PASS instead of reusing stale fit approval', () => {
  const old = { status: 'FIT_PASS', output: { sha256: 'old' } };
  assert.equal(fitStateForOutput(old, { sha256: 'old' }).status, 'FIT_PASS');
  const changed = fitStateForOutput(old, { sha256: 'new' });
  assert.equal(changed.status, 'FIT_VALIDATION_PENDING');
  assert.equal(changed.ready, false);
  assert.equal(changed.humanBodyFitApproved, false);
});
test('human approval is limited to exact baked hash, metadata, avatar and female pilot', async () => {
  const approval = JSON.parse(
    await readFile(
      'docs/architecture/TASK-0054-HUMAN-BODY-FIT-APPROVAL.json',
      'utf8',
    ),
  );
  const metaHash = sha256(await readFile(OUTPUT + '/fit-metadata.json'));
  assert.equal(approvalMatches(approval, metadata, metaHash), true);
  for (const invalid of [
    { ...approval, sha256: 'other-hash' },
    { ...approval, gender: 'male' },
    { ...approval, itemId: 'another-item' },
    { ...approval, humanBodyFitApproved: false },
    {
      ...approval,
      referenceAvatar: {
        ...approval.referenceAvatar,
        id: 'female_short_moss_dark',
      },
    },
  ])
    assert.equal(approvalMatches(invalid, metadata, metaHash), false);
  assert.equal(approvalMatches(approval, metadata, 'changed-metadata'), false);
});
