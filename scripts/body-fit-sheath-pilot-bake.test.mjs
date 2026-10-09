import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { bakeSwordBytes } from './body-fit-bake.mjs';
import {
  OUTPUT,
  SWORD,
  AVATAR,
  validatePilotSettings,
  retainHilt,
  occludeArm,
  makePilot,
} from './body-fit-sheath-pilot-bake.mjs';
const settings = JSON.parse(
  await readFile(OUTPUT + '/source/attempt-03-settings.json', 'utf8'),
);
test('Settings cannot escape staging or process an unapproved target/source', () => {
  assert.throws(
    () => validatePilotSettings({ ...settings, attempt: '../outside' }),
    /Unsafe/,
  );
  assert.throws(
    () => validatePilotSettings({ ...settings, sheathSource: SWORD }),
    /pilot staging/,
  );
  assert.throws(
    () =>
      validatePilotSettings({
        ...settings,
        sheathSource: 'build/task-0058-sword-sheath-pilot/source/../avatar.png',
      }),
    /pilot staging/,
  );
});
test('Non-finite landmarks and excessive offline rotation are rejected', () => {
  assert.throws(
    () => validatePilotSettings({ ...settings, rotation: 26 }),
    /Moderate/,
  );
  assert.throws(
    () => validatePilotSettings({ ...settings, scale: Infinity }),
    /scale/,
  );
  assert.throws(
    () => validatePilotSettings({ ...settings, guard: [NaN, 100] }),
    /landmarks/,
  );
});
test('Blade exclusion preserves every retained hilt pixel from the original design', async () => {
  const meta = JSON.parse(
    await readFile(OUTPUT + '/baked/attempt-03/bake-metadata.json', 'utf8'),
  );
  const positioned = await bakeSwordBytes(
    await readFile(SWORD),
    meta.transforms.sword,
  );
  const result = await retainHilt(
    positioned,
    settings.guard,
    settings.swordRotation,
    settings.hiltLimit,
  );
  const before = await sharp(positioned).raw().toBuffer(),
    after = await sharp(result.bytes).raw().toBuffer();
  const angle = ((32.93075306356095 - settings.swordRotation) * Math.PI) / 180;
  let preserved = 0,
    removed = 0;
  for (let y = 0; y < 1536; y++)
    for (let x = 0; x < 1024; x++) {
      const k = (y * 1024 + x) * 4;
      if (
        (x - settings.guard[0]) * Math.sin(angle) +
          (y - settings.guard[1]) * Math.cos(angle) <=
        settings.hiltLimit
      ) {
        assert.equal(after.readUInt32LE(k), before.readUInt32LE(k));
        if (before[k + 3] >= 128) preserved++;
      } else {
        assert.equal(after.readUInt32LE(k), 0);
        if (before[k + 3]) removed++;
      }
    }
  assert(preserved > 3000);
  assert(removed > 10000);
});
test('Refined arm mask leaves cloak-colour equipment intact and stays localized', async () => {
  const dir = OUTPUT + '/baked/attempt-03';
  const { mask } = await occludeArm(
    await readFile(dir + '/unoccluded-equipment.png'),
    await readFile(AVATAR),
    settings.maskMethod,
  );
  const pixels = await sharp(mask).raw().toBuffer(),
    base = await sharp(AVATAR).raw().toBuffer();
  let warm = 0,
    cloak = 0;
  for (let y = 690; y < 765; y++)
    for (let x = 720; x < 825; x++) {
      const k = (y * 1024 + x) * 4;
      if (base[k] < base[k + 1] + 10) {
        assert.equal(pixels[k + 3], 0);
        cloak++;
      } else if (pixels[k + 3] > 128) warm++;
    }
  assert(warm > 1000);
  assert(cloak > 100);
  assert.equal(pixels[(1000 * 1024 + 500) * 4 + 3], 0);
});
test('Existing bake attempts refuse overwriting', async () => {
  await assert.rejects(makePilot(settings), { code: 'EEXIST' });
});
