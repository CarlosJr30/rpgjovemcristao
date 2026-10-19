import { expect, test } from '@playwright/test';

test('profile menu stays within the viewport on phones, tablets and desktop', async ({
  page,
  context,
}) => {
  await context.route('**/*', (route) =>
    new URL(route.request().url()).hostname === '127.0.0.1'
      ? route.continue()
      : route.abort(),
  );
  await page.addInitScript(() =>
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
  );
  await page.goto('/journey/create');
  await page
    .getByLabel('Nome do Viajante', { exact: true })
    .fill('Teste Mobile');
  await page
    .getByRole('button', { name: 'Criar Viajante', exact: true })
    .click();
  await page.getByRole('button', { name: /Entrar na jornada/ }).waitFor();
  await page.waitForLoadState('networkidle');
  await page.goto('/');
  for (const [width, height] of [
    [320, 568],
    [360, 800],
    [390, 844],
    [412, 915],
    [768, 1024],
    [1024, 768],
    [844, 390],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    await page
      .getByRole('button', { name: 'Abrir Herói', exact: true })
      .click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    const box = (await menu.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y + box.height).toBeLessThanOrEqual(height);
    await menu
      .getByRole('menuitem', { name: 'Criar novo Viajante' })
      .scrollIntoViewIfNeeded();
    await expect(
      menu.getByRole('menuitem', { name: 'Criar novo Viajante' }),
    ).toBeInViewport();
    await page.screenshot({ path: `test-results/profile-menu-${width}.png` });
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  }
});
