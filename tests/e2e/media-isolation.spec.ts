import { expect, test } from '@playwright/test';

const restricted = [
  'music/arena_training.ogg',
  'effects/arena_attack.ogg',
  'effects/arena_defense.ogg',
  'effects/arena_focus.ogg',
  'effects/arena_dodge.ogg',
  'effects/player_hit.ogg',
  'effects/victory.ogg',
  'effects/defeat.ogg',
];

test('TASK-0063: restricted audio, private sources and DEV galleries are unavailable in production', async ({
  request,
}) => {
  for (const file of restricted) {
    expect((await request.get(`/assets/audio/${file}`)).status()).toBe(404);
    expect(
      (
        await request.get(`/assets-source/arena-audio-prototype/audio/${file}`)
      ).status(),
    ).toBe(404);
  }
  for (const route of [
    '/tools/arena-lab/',
    '/build/task-0059-equipment-recovery/review/index.html',
    '/build/task-0062-mobile-experience/review/index.html',
    '/assets-source/body-fit-v2-targets/armor_traveler_uncommon_female_v2.png',
  ])
    expect((await request.get(route)).status()).toBe(404);
});

test('TASK-0063: mobile login form remains readable and validates without touching remote auth', async ({
  page,
}) => {
  const authRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/auth/v1/')) authRequests.push(url.pathname);
  });
  await page.context().route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.protocol.startsWith('http') && url.hostname !== '127.0.0.1'
      ? route.abort()
      : route.continue();
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/auth');
  const email = page.getByLabel('E-mail', { exact: true });
  await expect(email).toBeVisible();
  expect(
    await email.evaluate((element) =>
      parseFloat(getComputedStyle(element).fontSize),
    ),
  ).toBeGreaterThanOrEqual(16);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await expect(
    page.getByRole('button', { name: 'Entrar', exact: true }),
  ).toBeVisible();
  await email.fill('qa@example.invalid');
  const password = page.getByLabel('Senha', { exact: true });
  // Login accepts existing credentials; signup is where the minimum applies.
  await expect(password).not.toHaveAttribute('minlength');
  await password.fill('');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  expect(
    await password.evaluate(
      (element) => (element as HTMLInputElement).validity.valueMissing,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Ainda não tenho conta' }).click();
  await page.getByLabel('Nome de exibição', { exact: true }).fill('QA Mobile');
  await expect(password).toHaveAttribute('minlength', '8');
  await password.fill('123');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  expect(
    await password.evaluate(
      (element) => (element as HTMLInputElement).validity.tooShort,
    ),
  ).toBe(true);
  expect(authRequests).toEqual([]);
  await expect(page).toHaveURL(/\/auth$/);
});
