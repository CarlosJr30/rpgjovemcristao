import { expect, test } from '@playwright/test';
import { EQUIPMENT_CATALOG } from '../../apps/web/features/journey/data/equipmentCatalog';
import { APPROVED_BODY_FIT_V3_ASSETS } from '../../apps/web/features/journey/data/equipmentBodyFitV3';
import { calculateTotalAttributes } from '../../apps/web/features/journey/data/attributes';
import type { Traveler } from '../../apps/web/features/journey/domain/traveler';
const key = 'rpg-jovem-cristao:journey:v1';
for (const gender of ['female', 'male'] as const)
  for (const [width, height] of [
    [390, 844],
    [844, 390],
    [1440, 900],
  ])
    test(`Approved pair ${gender} ${width}x${height}: try-on, equipment, persistence and fallback`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/*', (route) =>
        new URL(route.request().url()).origin ===
        new URL(info.project.use.baseURL as string).origin
          ? route.continue()
          : route.abort(),
      );
      await page.addInitScript(() =>
        localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
      );
      await page.goto('/journey/create');
      await page
        .getByLabel('Nome do Viajante', { exact: true })
        .fill(`QA pair ${gender}`);
      await page
        .getByRole('button', { name: 'Criar Viajante', exact: true })
        .click();
      await page.getByRole('button', { name: /Entrar na jornada/ }).waitFor();
      await page.waitForLoadState('networkidle');
      const initial = await page.evaluate(
        ({ key, items, gender }) => {
          const save = JSON.parse(localStorage.getItem(key)!);
          const t = save.travelers[0];
          t.avatar.gender = gender;
          t.appearance = { hair: 'curto', outfit: 'musgo', skin: 'medio' };
          t.inventory = items;
          t.equipped = {};
          t.avatar.equippedItems = {};
          localStorage.setItem(key, JSON.stringify(save));
          return t as Traveler;
        },
        { key, items: EQUIPMENT_CATALOG, gender },
      );
      await page.goto('/journey/equipment');
      const avatar = page
        .locator('[data-mobile-screen="equipment"] [data-avatar-runtime]')
        .first();
      const mainLayers = page.locator(
        '[data-mobile-screen="equipment"] [data-overlay-item]',
      );
      for (const itemId of [
        'traveler-armor-uncommon',
        'traveler-sword-common',
      ]) {
        const item = EQUIPMENT_CATALOG.find((i) => i.id === itemId)!;
        const approved = APPROVED_BODY_FIT_V3_ASSETS.find(
          (a) => a.itemId === itemId && a.gender === gender,
        )!;
        await page.locator(`[data-slot="${item.slot}"]`).click();
        const card = page
          .locator('article')
          .filter({
            has: page.getByRole('heading', { name: item.name, exact: true }),
          });
        const saveBefore = await page.evaluate(
          (key) => localStorage.getItem(key),
          key,
        );
        await card
          .getByRole('button', { name: 'Experimentar', exact: true })
          .click();
        const dialog = page.getByRole('dialog', { name: /Experimentar/ });
        await expect(
          dialog.locator(`[data-overlay-item="${itemId}"]`),
        ).toHaveAttribute('src', approved.asset);
        await dialog
          .getByRole('button', { name: 'Antes', exact: true })
          .click();
        await expect(
          dialog.locator(`[data-overlay-item="${itemId}"]`),
        ).toHaveCount(0);
        await dialog.getByLabel('Zoom', { exact: true }).selectOption('3');
        expect(
          await page.evaluate((key) => localStorage.getItem(key), key),
        ).toBe(saveBefore);
        await dialog
          .getByRole('button', { name: 'Depois', exact: true })
          .click();
        await dialog
          .getByRole('button', { name: 'Equipar este item', exact: true })
          .click();
        await expect(card).toHaveAttribute('data-equipped', 'true');
        await page.keyboard.press('Escape');
      }
      await expect(mainLayers).toHaveCount(2);
      await mainLayers.evaluateAll((imgs) =>
        Promise.all(imgs.map((i) => (i as HTMLImageElement).decode())),
      );
      const expected = calculateTotalAttributes({
        ...initial,
        equipped: {
          armor: 'traveler-armor-uncommon',
          weapon: 'traveler-sword-common',
        },
      }).total;
      for (const [attr, value] of Object.entries(expected))
        await expect(
          page.locator(`[data-current-attribute="${attr}"]`),
        ).toHaveText(String(value));
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await avatar.screenshot({ path: info.outputPath('approved-pair.png') });
      await page.screenshot({
        path: info.outputPath('portal-pair.png'),
        fullPage: true,
      });
      await page.reload();
      await expect(mainLayers).toHaveCount(2);
      for (const [attr, value] of Object.entries(expected))
        await expect(
          page.locator(`[data-current-attribute="${attr}"]`),
        ).toHaveText(String(value));
      await page.waitForLoadState('networkidle');
      await page.goto('/journey');
      await expect(
        page.locator('[data-overlay-item="traveler-sword-common"]').first(),
      ).toHaveAttribute(
        'src',
        APPROVED_BODY_FIT_V3_ASSETS.find(
          (a) => a.gender === gender && a.itemId === 'traveler-sword-common',
        )!.asset,
      );
      await page.waitForLoadState('networkidle');
      await page.goto('/journey/equipment');
      for (const slot of ['weapon', 'armor']) {
        await page.locator(`[data-slot="${slot}"]`).click();
        const item = EQUIPMENT_CATALOG.find(
          (i) =>
            i.id ===
            (slot === 'weapon'
              ? 'traveler-sword-common'
              : 'traveler-armor-uncommon'),
        )!;
        await page
          .locator('article')
          .filter({
            has: page.getByRole('heading', { name: item.name, exact: true }),
          })
          .getByRole('button', { name: 'Desequipar', exact: true })
          .click();
      }
      await expect(mainLayers).toHaveCount(0);
      await page.waitForLoadState('networkidle');
      await page.evaluate((key) => {
        const save = JSON.parse(localStorage.getItem(key)!);
        save.travelers[0].appearance.hair = 'longo';
        save.travelers[0].equipped = {
          armor: 'traveler-armor-uncommon',
          weapon: 'traveler-sword-common',
        };
        localStorage.setItem(key, JSON.stringify(save));
      }, key);
      await page.reload();
      await expect(mainLayers).toHaveCount(0);
      for (const [attr, value] of Object.entries(expected))
        await expect(
          page.locator(`[data-current-attribute="${attr}"]`),
        ).toHaveText(String(value));
      expect(errors).toEqual([]);
    });
