import { expect, test } from '@playwright/test';

test('isolated real state commands preserve inventory, approved composition and persistence', async ({
  page,
  context,
}, info) => {
  // No fixture request may reach a hosted service.
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === 'http://127.0.0.1:3197'
      ? route.continue()
      : route.abort(),
  );
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  const snapshot = async () =>
    JSON.parse((await page.getByTestId('snapshot').textContent())!);
  const before = await snapshot();
  const armor = page.locator('[data-overlay-item="traveler-armor-uncommon"]');
  const sword = page.locator('[data-overlay-item="traveler-sword-common"]');
  const hand = page.locator('[data-overlay-occlusion]');
  await expect(armor).toHaveCount(1);
  const armorStyle = await armor.getAttribute('style');
  await page.getByRole('button', { name: 'Equipar espada aprovada' }).click();
  await expect(sword).toHaveCount(1);
  await expect(hand).toHaveCount(1);
  await expect(sword).toHaveAttribute(
    'src',
    /sword_female_long_blue_dark_grip_approved.png$/,
  );
  expect(
    await sword.evaluate((el) => (el as HTMLElement).style.transform),
  ).toBe('translate(-2.3%, 11.7%) scale(0.65, 0.65)');
  const equipped = await snapshot();
  expect(equipped.attributes.strength).toBe(before.attributes.strength + 2);
  expect(equipped.inventory).toEqual(before.inventory);
  expect(equipped.avatarEquipped).toEqual(equipped.equipped);
  await page.reload();
  await expect(sword).toHaveCount(1);
  expect(await snapshot()).toEqual(equipped);
  await page.screenshot({
    path: `build/rpg-dev-001/equipment-${info.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Trocar por variante sintética' })
    .click();
  await expect(sword).toHaveCount(0);
  await expect(hand).toHaveCount(0);
  const swapped = await snapshot();
  expect(swapped.equipped.weapon).toBe('offline-sword-alternate');
  expect(swapped.attributes.strength).toBe(before.attributes.strength + 4);
  expect(swapped.inventory).toEqual(before.inventory);
  await page.reload();
  expect(await snapshot()).toEqual(swapped);
  await page.getByRole('button', { name: 'Desequipar arma' }).click();
  await page.reload();
  expect(await snapshot()).toEqual(before);
  await expect(armor).toHaveAttribute('style', armorStyle!);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
