import { expect, test } from '@playwright/test';
import { EQUIPMENT_CATALOG } from '../../apps/web/features/journey/data/equipmentCatalog';
import { equipmentReward } from '../../apps/web/features/journey/data/equipmentCinematic';
import { travelerBattleSnapshot } from '../../apps/web/features/journey/data/arena';
import type { Traveler } from '../../apps/web/features/journey/domain/traveler';

const viewports = [
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 844, height: 390 },
  { width: 915, height: 412 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
for (const viewport of viewports)
  test(`Arsenal ${viewport.width}x${viewport.height}: comparison, slots, filters and equip`, async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile' && viewport.width !== 390,
      'Desktop covers the full matrix; mobile verifies touch.',
    );
    await page.setViewportSize(viewport);
    await page.addInitScript(() =>
      localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
    );
    await page.goto('/journey/create');
    await page
      .getByLabel('Nome do Viajante', { exact: true })
      .fill('Viajante do Arsenal');
    await page.getByRole('button', { name: 'Criar Viajante' }).click();
    await expect(page).not.toHaveURL(/\/create$/);
    const traveler = (await page.evaluate((items) => {
      const key = 'rpg-jovem-cristao:journey:v1',
        save = JSON.parse(localStorage.getItem(key)!);
      const t = save.travelers[0];
      t.inventory = items;
      t.equipped = {};
      t.avatar.equippedItems = {};
      localStorage.setItem(key, JSON.stringify(save));
      return t;
    }, EQUIPMENT_CATALOG)) as Traveler;
    await page.goto('/journey/equipment');
    await expect(
      page.getByRole('heading', { name: 'Arsenal do Viajante' }),
    ).toBeVisible();
    await expect(page.locator('[data-current-power]')).toHaveText(
      String(travelerBattleSnapshot(traveler).combatPower),
    );
    await expect(page.locator('[data-slot]')).toHaveCount(6);
    await expect(page.locator('[data-slot="weapon"]')).toContainText(
      'Slot vazio',
    );
    await page.locator('[data-slot="weapon"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-slot="weapon"]')).toBeFocused();
    const item = EQUIPMENT_CATALOG.find((i) => i.slot === 'weapon')!;
    const card = page
      .locator('article')
      .filter({
        has: page.getByRole('heading', { name: item.name, exact: true }),
      });
    await card.locator('summary').click();
    const reward = equipmentReward(traveler, item);
    const powerCells = card.locator('[data-comparison-power] td');
    await expect(powerCells).toHaveText([
      String(reward.beforePower),
      String(reward.afterPower),
      `+${reward.powerDelta}`,
    ]);
    const link = card.getByRole('link', { name: /Abrir na Bíblia/ });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(await link.getAttribute('href')).toMatch(/^https:\/\//);
    await expect(
      card.locator('[data-visual-overlay-unavailable="true"]'),
    ).toContainText('Visual corporal em preparação');
    await page.screenshot({
      path: testInfo.outputPath(
        `portal-${viewport.width}x${viewport.height}.png`,
      ),
      fullPage: true,
    });
    const measures = await page
      .locator('[data-slot], article > button, select, summary')
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getBoundingClientRect().height),
      );
    expect(measures.every((height) => height >= 44)).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const avatar = await page.locator('[data-body-type]').boundingBox();
    expect(avatar!.width / avatar!.height).toBeCloseTo(2 / 3, 2);
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await card.getByRole('button', { name: 'Equipar', exact: true }).click();
    await page.clock.runFor(400);
    await expect(page.locator('[data-equipment-cinematic]')).toHaveAttribute(
      'data-stage',
      'REWARD_REVEAL',
    );
    await page.screenshot({
      path: testInfo.outputPath(
        `cinematic-${viewport.width}x${viewport.height}.png`,
      ),
      animations: 'disabled',
    });
    const bounds = await page
      .locator('[id^="equipment-reward-"]')
      .boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThan(viewport.height - 65);
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    await page.keyboard.press('Escape');
    await expect(card).toHaveAttribute('data-equipped', 'true');
    await expect(page.locator('[data-slot="weapon"]')).toContainText(item.name);
    await expect(page.locator('[data-current-power]')).toHaveText(
      String(reward.afterPower),
    );
    await expect(page.getByRole('status')).toContainText(
      `${reward.beforePower} → ${reward.afterPower}`,
    );
    await expect(page.locator('[data-overlay-slot]')).toHaveCount(0);
    await page
      .getByRole('combobox', { name: 'Mostrar', exact: true })
      .selectOption('equipped');
    await expect(page.locator('article')).toHaveCount(1);
    await page
      .getByRole('combobox', { name: 'Raridade', exact: true })
      .selectOption(item.rarity);
    await expect(page.locator('article')).toHaveCount(1);
    await page
      .getByRole('combobox', { name: 'Mostrar', exact: true })
      .selectOption('available');
    await expect(card).toHaveCount(0);
    await page
      .getByRole('combobox', { name: 'Mostrar', exact: true })
      .selectOption('all');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await card.getByRole('button', { name: 'Desequipar', exact: true }).click();
    await page.clock.runFor(120);
    await expect(page.locator('[data-current-power]')).toHaveText(
      String(reward.beforePower),
    );
    await card.getByRole('button', { name: 'Equipar', exact: true }).click();
    await expect(page.locator('[data-equipment-cinematic]')).toHaveAttribute(
      'data-reduced-motion',
      'true',
    );
    await expect(page.locator('[data-equipment-flight]')).toHaveCount(0);
    await page.clock.runFor(560);
    await expect(
      card.getByRole('button', { name: 'Desequipar', exact: true }),
    ).toBeEnabled();
    await page.reload();
    await expect(page.locator('[data-slot="weapon"]')).toContainText(item.name);
    await expect(page.locator('[data-current-power]')).toHaveText(
      String(reward.afterPower),
    );
  });

test('Missing artwork preserves avatar fallback, equip action and comparison', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() =>
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
  );
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Lia');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(page).not.toHaveURL(/\/create$/);
  await page.route('**/assets/**', (route) => route.abort());
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1',
      save = JSON.parse(localStorage.getItem(key)!);
    save.travelers[0].equipped = {};
    save.travelers[0].avatar.equippedItems = {};
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.goto('/journey/equipment');
  await page.getByRole('button', { name: 'Botas', exact: true }).click();
  const card = page.locator('article').first();
  await card.locator('summary').click();
  await expect(card.locator('table')).toBeVisible();
  await expect(page.locator('[data-body-type] svg')).toBeVisible();
  await expect(card.locator('img')).toBeHidden();
  await page.screenshot({
    path: testInfo.outputPath('fallback-art.png'),
    fullPage: true,
  });
  await card.getByRole('button', { name: 'Equipar', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(
    card.getByRole('button', { name: 'Desequipar', exact: true }),
  ).toBeEnabled();
  await expect(page.locator('[data-current-power]')).toBeVisible();
});
