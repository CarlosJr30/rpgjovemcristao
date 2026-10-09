import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import {
  bakeBytes,
  bakeSwordBytes,
  validateSwordTransform,
  sha256,
} from './body-fit-bake.mjs';
import {
  solveDownward,
  projectSwordPoint,
  applyOcclusion,
  OUTPUT,
} from './body-fit-sword-bake.mjs';
const json = async (p) => JSON.parse(await readFile(p, 'utf8'));
const settings = await json(OUTPUT + '/attempt-02/settings.json');
const inventory = await json(OUTPUT + '/attempt-02/inventory.json');
test('Existing pilot retains small-rotation restriction; sword entry rejects unsafe transforms', async () => {
  const source = await readFile(inventory.assets[0].source.path);
  await assert.rejects(
    bakeBytes(source, {
      scale: 0.4,
      rotation: 149,
      translateX: 0,
      translateY: 0,
    }),
    /limits/,
  );
  for (const rotation of [181, -181, NaN, Infinity])
    assert.throws(() =>
      validateSwordTransform({
        scale: 0.4,
        rotation,
        translateX: 0,
        translateY: 0,
      }),
    );
  assert.throws(() =>
    validateSwordTransform({
      scale: -0.4,
      rotation: 180,
      translateX: 0,
      translateY: 0,
    }),
  );
  assert.throws(
    () => solveDownward({ ...settings[0], root: [2, 2], tip: [2, 2] }),
    /landmarks/,
  );
});
test('Large rotation changes actual raster direction without clipping the sword', async () => {
  const m = inventory.assets.find((a) => a.id === 'sword_path_common_male_v2'),
    raw = await sharp(m.output.path).raw().toBuffer();
  // Source blade tip was at top-right. In output its tip must lie well below the hand,
  // while the old upward/torso position must be transparent.
  const [x, y] = m.landmarks.tip.projected.map(Math.round);
  let visible = false;
  for (let dy = -8; dy <= 8; dy++)
    for (let dx = -8; dx <= 8; dx++)
      if (raw[((y + dy) * 1024 + x + dx) * 4 + 3] >= 128) visible = true;
  assert(visible);
  assert.equal(raw[(450 * 1024 + 450) * 4 + 3], 0);
  assert(y > m.landmarks.grip.projected[1] + 450);
});
for (const s of settings) {
  test(
    s.id + ': downward axis, palm registration, deterministic RGBA output',
    async () => {
      const m = inventory.assets.find((a) => a.id === s.id),
        t = solveDownward(s),
        root = projectSwordPoint(s.root, t),
        tip = projectSwordPoint(s.tip, t);
      assert(Math.abs(tip[0] - root[0]) < 1e-8);
      assert(tip[1] > root[1]);
      const palm = projectSwordPoint(s.grip, t);
      assert(Math.hypot(palm[0] - s.palm[0], palm[1] - s.palm[1]) < 1e-8);
      const bytes = await bakeSwordBytes(await readFile(m.source.path), t);
      assert.equal(sha256(bytes), m.output.sha256);
      const meta = await sharp(bytes).metadata();
      assert.deepEqual(
        [meta.width, meta.height, meta.channels],
        [1024, 1536, 4],
      );
    },
  );
  test(
    s.id +
      ': mask only removes sword alpha within hand region and never changes RGB elsewhere',
    async () => {
      const m = inventory.assets.find((a) => a.id === s.id),
        baked = await readFile(m.output.path),
        mask = await readFile(m.occlusionExperiment.maskPath);
      const result = await applyOcclusion(baked, mask);
      assert.equal(sha256(result.bytes), m.occlusionExperiment.sha256);
      const before = await sharp(baked).raw().toBuffer(),
        after = await sharp(result.bytes).raw().toBuffer(),
        maskRaw = await sharp(mask).raw().toBuffer();
      let changed = 0;
      for (let k = 0; k < before.length; k += 4) {
        assert(after[k + 3] <= before[k + 3]);
        if (maskRaw[k + 3] === 0)
          assert(before.subarray(k, k + 4).equals(after.subarray(k, k + 4)));
        if (after[k + 3] !== before[k + 3]) changed++;
      }
      assert(changed > 0);
      assert.equal(sha256(await readFile(m.avatar.path)), m.avatar.sha256);
    },
  );
}
test('Direction and technical success do not promote visual/human/READY gates', async () => {
  for (const m of inventory.assets) {
    const dir = m.output.path.substring(0, m.output.path.lastIndexOf('/')),
      r = await json(dir + '/fit-report.json');
    assert.equal(r.orientation, 'DOWNWARD_VERTICAL');
    assert.equal(r.status, 'NEEDS_REWORK');
    assert.equal(r.actualHandHoldsGrip, false);
    assert.equal(r.humanBodyFitApproved, false);
    assert.equal(r.ready, false);
    assert.equal(r.runtimeActivated, false);
  }
});
