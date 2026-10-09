import { test, expect } from '@playwright/test';
import { EQUIPMENT_CATALOG } from '../../apps/web/features/journey/data/equipmentCatalog.ts';
for (const gender of ['female', 'male'])
  test(`${gender}: sword cinematic reduced motion preserves equip/reload and no staging overlay`, async ({
    page,
  }, info) => {
    await page.addInitScript(() =>
      localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/journey/create');
    await page
      .getByLabel('Nome do Viajante', { exact: true })
      .fill('Teste local bainha');
    await page
      .getByRole('radio', {
        name: gender === 'female' ? 'Feminino' : 'Masculino',
        exact: true,
      })
      .check();
    await page.getByRole('button', { name: 'Criar Viajante' }).click();
    await expect(page).not.toHaveURL(/\/create$/);
    await page.evaluate((items) => {
      const key = 'rpg-jovem-cristao:journey:v1',
        s = JSON.parse(localStorage.getItem(key));
      s.travelers[0].inventory = items;
      s.travelers[0].equipped = {};
      s.travelers[0].avatar.equippedItems = {};
      localStorage.setItem(key, JSON.stringify(s));
    }, EQUIPMENT_CATALOG);
    await page.goto('/journey/equipment');
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await page.getByRole('button', { name: 'Arma', exact: true }).click();
    const sword = EQUIPMENT_CATALOG.find((i) => i.slot === 'weapon');
    const card = page
      .locator('article')
      .filter({
        has: page.getByRole('heading', { name: sword.name, exact: true }),
      });
    await card.getByRole('button', { name: 'Equipar', exact: true }).click();
    await page.clock.runFor(120);
    await expect(page.getByRole('dialog')).toContainText(sword.name);
    await expect(page.locator('[data-equipment-flight]')).toHaveCount(0);
    await expect(page.locator('[data-equipment-impact]')).toHaveCount(0);
    await page.clock.runFor(440);
    await expect(
      card.getByRole('button', { name: 'Desequipar', exact: true }),
    ).toBeEnabled();
    await expect(page.locator('[data-overlay-slot]')).toHaveCount(0);
    await page.screenshot({
      path: info.outputPath(`reduced-motion-${gender}.png`),
    });
    await page.reload();
    await page.getByRole('button', { name: 'Arma', exact: true }).click();
    await expect(
      card.getByRole('button', { name: 'Desequipar', exact: true }),
    ).toBeEnabled();
    await expect(page.locator('img[src*="task-0057"]')).toHaveCount(0);
  });
