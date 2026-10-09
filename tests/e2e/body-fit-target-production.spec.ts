import { expect, test } from '@playwright/test';
test('TASK-0052B target sources and review remain unavailable in production', async ({
  request,
}) => {
  for (const route of [
    '/assets-source/body-fit-v2-targets/armor_traveler_uncommon_female_v2.png',
    '/build/task-0052b-body-fit-target-validation/review/index.html',
    '/build/task-0052b-body-fit-target-validation/review/references/female_short_moss_medium.png',
  ])
    expect((await request.get(route)).status()).toBe(404);
});
