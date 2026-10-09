import { expect, test } from '@playwright/test';
import {
  EQUIPMENT_CATALOG,
  RARITIES,
} from '../../apps/web/features/journey/data/equipmentCatalog';
import {
  EQUIPMENT_SLOT_LABELS,
  RARITY_PRESENTATION,
} from '../../apps/web/features/journey/data/equipmentCinematic';

const viewports = [
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
const sword = EQUIPMENT_CATALOG.find((item) => item.slot === 'weapon')!;
const ceremonyItems = RARITIES.map((rarity, index) => ({
  ...sword,
  id: `cinematic-test-${index}`,
  name:
    index === 4
      ? 'Espada Extraordinária da Perseverança do Viajante'
      : `Espada de teste ${rarity}`,
  rarity,
  power: 5 - index,
  stats: { strength: 6 - index, defense: index % 2 },
}));

for (const body of ['female', 'male'] as const)
  for (const viewport of viewports) {
    test(`${body}: cinematic five rarities ${viewport.width}x${viewport.height}`, async ({
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name === 'mobile' && viewport.width !== 390,
        'The desktop project covers the remaining viewport matrix; mobile verifies touch at 390.',
      );
      await page.setViewportSize(viewport);
      await page.addInitScript(() =>
        localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
      );
      await page.goto('/journey/create');
      await page
        .getByLabel('Nome do Viajante', { exact: true })
        .fill('Viajante Cinema');
      await page
        .getByRole('radio', {
          name: body === 'female' ? 'Feminino' : 'Masculino',
          exact: true,
        })
        .check();
      await page.getByRole('button', { name: 'Criar Viajante' }).click();
      await expect(page).not.toHaveURL(/\/create$/);
      await page.evaluate(
        (items) => {
          const key = 'rpg-jovem-cristao:journey:v1',
            save = JSON.parse(localStorage.getItem(key)!);
          save.travelers[0].inventory = items;
          save.travelers[0].equipped = {};
          save.travelers[0].avatar.equippedItems = {};
          localStorage.setItem(key, JSON.stringify(save));
        },
        [...EQUIPMENT_CATALOG, ...ceremonyItems],
      );
      await page.goto('/journey/equipment');
      await page.clock.install();
      await page.clock.pauseAt(new Date(Date.now() + 1000));
      const base = await page
        .locator('[data-body-type]')
        .getByRole('img', { name: 'Avatar do Viajante', exact: true })
        .elementHandle();
      const measurements = [];
      for (const item of ceremonyItems) {
        const config = RARITY_PRESENTATION[item.rarity];
        const card = page.locator('article').filter({
          has: page.getByRole('heading', { name: item.name, exact: true }),
        });
        await card
          .getByRole('button', { name: 'Equipar', exact: true })
          .click();
        await expect(
          page.locator('[data-equipment-cinematic]'),
        ).toHaveAttribute('data-stage', 'PREPARE');
        await page.clock.runFor(config.timings.PREPARE + config.timings.FOCUS);
        const scene = page.locator('[data-equipment-cinematic]');
        await expect(scene).toHaveAttribute('data-stage', 'REWARD_REVEAL');
        await expect(page.getByRole('dialog')).toContainText(config.label);
        await expect(page.getByRole('dialog')).toContainText(
          `+${item.stats.strength} Força`,
        );
        const bounds = await scene.evaluate((element) => {
          const icon = element
            .querySelector('[data-cinematic-icon]')!
            .getBoundingClientRect();
          const text = element
            .querySelector('[id^="equipment-reward-"]')!
            .getBoundingClientRect();
          return {
            icon: {
              x: icon.x,
              y: icon.y,
              width: icon.width,
              height: icon.height,
            },
            text: {
              x: text.x,
              y: text.y,
              right: text.right,
              bottom: text.bottom,
            },
            parentIsBody: element.parentElement === document.body,
            rootOverflow: document.documentElement.scrollWidth > innerWidth,
            power: element
              .querySelector('[data-power-delta]')
              ?.getAttribute('data-power-delta'),
          };
        });
        expect(bounds.parentIsBody).toBe(true);
        expect(bounds.rootOverflow).toBe(false);
        expect(bounds.text.x).toBeGreaterThanOrEqual(0);
        expect(bounds.text.right).toBeLessThanOrEqual(viewport.width);
        expect(bounds.text.bottom).toBeLessThan(viewport.height - 65);
        expect(bounds.icon.x + bounds.icon.width / 2).toBeCloseTo(
          viewport.width / 2,
          0,
        );
        if (item !== ceremonyItems[0]) {
          await expect(page.getByRole('dialog')).toContainText('Substitui');
          expect(Number(bounds.power)).toBeLessThan(0);
        }
        await page.screenshot({
          path: testInfo.outputPath(
            `${body}-${viewport.width}-${item.rarity}-reveal.png`,
          ),
          animations: 'disabled',
        });
        measurements.push({
          rarity: item.rarity,
          duration: config.duration,
          ...bounds,
        });
        await page.clock.runFor(config.timings.REWARD_REVEAL);
        await expect(scene).toHaveAttribute('data-stage', 'FLY_TO_TARGET');
        await expect(page.locator('[data-equipment-flight]')).toHaveAttribute(
          'src',
          /_icon\.png$/,
        );
        await page.clock.runFor(config.timings.FLY_TO_TARGET);
        await expect(scene).toHaveAttribute('data-stage', 'EQUIP_CONFIRM');
        await expect(page.locator('[data-overlay-slot]')).toHaveCount(0);
        await page.clock.runFor(config.timings.EQUIP_CONFIRM);
        await expect(scene).toHaveCount(0);
        await expect(
          card.getByRole('button', { name: 'Desequipar', exact: true }),
        ).toBeEnabled();
        await expect(page.getByRole('status')).toContainText(
          'Camada corporal pendente',
        );
        expect(await base!.evaluate((node) => node.isConnected)).toBe(true);
      }
      // Escape from PREPARE and actual touch/click from reward both complete immediately.
      const firstCard = page.locator('article').filter({
        has: page.getByRole('heading', {
          name: ceremonyItems[0].name,
          exact: true,
        }),
      });
      await firstCard
        .getByRole('button', { name: 'Equipar', exact: true })
        .click();
      await page.keyboard.press('Escape');
      await expect(
        firstCard.getByRole('button', { name: 'Desequipar', exact: true }),
      ).toBeEnabled();
      await expect(page.locator('[data-equipment-cinematic]')).toHaveCount(0);
      await firstCard
        .getByRole('button', { name: 'Desequipar', exact: true })
        .click();
      await page.clock.runFor(120);
      await firstCard
        .getByRole('button', { name: 'Equipar', exact: true })
        .click();
      await page.clock.runFor(200);
      if (testInfo.project.name === 'mobile')
        await page.getByRole('dialog').tap({ position: { x: 20, y: 20 } });
      else await page.getByRole('dialog').click({ position: { x: 20, y: 20 } });
      await expect(
        firstCard.getByRole('button', { name: 'Desequipar', exact: true }),
      ).toBeEnabled();
      await firstCard
        .getByRole('button', { name: 'Desequipar', exact: true })
        .click();
      await page.clock.runFor(120);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const [slot, label] of Object.entries(EQUIPMENT_SLOT_LABELS)) {
        await page.getByRole('button', { name: label, exact: true }).click();
        const item = EQUIPMENT_CATALOG.find((entry) => entry.slot === slot)!;
        const card = page.locator('article').filter({
          has: page.getByRole('heading', { name: item.name, exact: true }),
        });
        await card
          .getByRole('button', { name: 'Equipar', exact: true })
          .click();
        await page.clock.runFor(120);
        await expect(page.getByRole('dialog')).toContainText(item.name);
        await expect(page.locator('[data-equipment-flight]')).toHaveCount(0);
        await expect(page.locator('[data-equipment-impact]')).toHaveCount(0);
        await page.clock.runFor(440);
        await expect(
          card.getByRole('button', { name: 'Desequipar', exact: true }),
        ).toBeEnabled();
        await expect(page.locator('[data-overlay-slot]')).toHaveCount(0);
      }
      await page.reload();
      await expect(page.locator('[data-overlay-slot]')).toHaveCount(0);
      await page.getByRole('button', { name: 'Arma', exact: true }).click();
      await expect(
        page
          .locator('article')
          .filter({
            has: page.getByRole('heading', { name: sword.name, exact: true }),
          })
          .getByRole('button', { name: 'Desequipar', exact: true }),
      ).toBeEnabled();
      await testInfo.attach('cinematic-measurements', {
        body: JSON.stringify(measurements, null, 2),
        contentType: 'application/json',
      });
    });
  }
