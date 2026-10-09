import { expect, test } from '@playwright/test';
import { spawnSync } from 'node:child_process';
test('production cannot serve bake sources, staging output or DEV editor', async ({
  request,
}) => {
  for (const url of [
    '/tools/body-fit-bake-lab/review.mjs',
    '/build/task-0054-body-fit-bake/review/index.html',
    '/build/task-0054-body-fit-bake/baked_overlay.png',
    '/build/task-0054-body-fit-bake/pilot/armor_traveler_uncommon_female_v2_baked.png',
    '/assets-source/body-fit-v2-targets/armor_traveler_uncommon_female_v2.png',
  ])
    expect((await request.get(url)).status()).toBe(404);
});
test('lab server refuses production environment before listening', () => {
  const result = spawnSync(process.execPath, ['scripts/arena-lab.mjs'], {
    env: { ...process.env, NODE_ENV: 'production' },
    encoding: 'utf8',
    timeout: 10000,
  });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('development-only');
});
