import { expect, test } from '@playwright/test';
test('Arena Visual Lab e endpoint de status não existem no servidor de produção', async ({
  request,
  page,
}) => {
  for (const route of [
    '/tools/arena-lab/',
    '/dev/arena-lab',
    '/__arena_lab/assets',
  ])
    expect((await request.get(route)).status()).toBe(404);
  await page.goto('/');
  await expect(
    page.getByRole('link', { name: /Arena Visual Lab/ }),
  ).toHaveCount(0);
});
