import { expect, test, type Page } from '@playwright/test';
import { EQUIPMENT_CATALOG } from '../../apps/web/features/journey/data/equipmentCatalog';
import type { EquipmentSlot } from '../../apps/web/features/journey/domain/traveler';
import { equipmentOverlayForItem } from '../../apps/web/features/journey/data/equipmentAssets';

// Legacy visual-only IDs are exercised in isolated saves; no production items/stats are added.
const rareArmor = {
  ...EQUIPMENT_CATALOG.find((item) => item.slot === 'armor')!,
  id: 'traveler-armor-rare',
  name: 'Couraça alternativa',
};
const rareSword = {
  ...EQUIPMENT_CATALOG.find((item) => item.slot === 'weapon')!,
  id: 'traveler-sword-rare',
  name: 'Espada alternativa',
};

const viewports = [
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 844, height: 390 },
  { width: 915, height: 412 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
const labels: Record<EquipmentSlot, string> = {
  helmet: 'Elmo',
  armor: 'Armadura',
  boots: 'Botas',
  amulet: 'Medalhão',
  weapon: 'Arma',
  shield: 'Escudo',
};
const slots = Object.keys(labels) as EquipmentSlot[];

async function createLocalTraveler(page: Page, body: 'male' | 'female') {
  await page.addInitScript(() =>
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
  );
  await page.goto('/journey/create');
  await page
    .getByLabel('Nome do Viajante', { exact: true })
    .fill(body === 'male' ? 'Luca Overlays' : 'Lia Overlays');
  await page
    .getByRole('radio', {
      name: body === 'male' ? 'Masculino' : 'Feminino',
      exact: true,
    })
    .check();
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(page).not.toHaveURL(/\/create$/);
  // Seed owned items only in this isolated browser's local test save.
  await page.evaluate(
    (items) => {
      const key = 'rpg-jovem-cristao:journey:v1';
      const save = JSON.parse(localStorage.getItem(key)!);
      save.travelers[0].inventory = items;
      save.travelers[0].equipped = {};
      save.travelers[0].avatar.equippedItems = {};
      localStorage.setItem(key, JSON.stringify(save));
    },
    [...EQUIPMENT_CATALOG, rareArmor, rareSword],
  );
}

async function assertUndistortedAvatar(page: Page, body: string, layers = 0) {
  const avatar = page.locator(`[data-body-type="${body}"]`);
  await expect(avatar).toBeVisible();
  await expect(avatar.locator('[data-overlay-slot]')).toHaveCount(layers);
  for (const img of await avatar.locator('[data-overlay-slot]').all()) {
    await expect(img).toHaveAttribute(
      'src',
      /\/equipment\/overlays\/.+\.(png|webp|svg)$/,
    );
    await expect
      .poll(() =>
        img.evaluate((node) => (node as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
  }
  const base = avatar.locator('[data-avatar-base]');
  await expect(base).toHaveAttribute(
    'src',
    new RegExp(`/assets/avatar/hd/${body}/`),
  );
  await expect
    .poll(() =>
      base.evaluate((node) => (node as HTMLImageElement).naturalWidth),
    )
    .toBe(1024);
  const geometry = await avatar.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const image =
      element.querySelector<HTMLImageElement>('[data-avatar-base]')!;
    const imageBox = image.getBoundingClientRect();
    return {
      width: box.width,
      height: box.height,
      imageWidth: imageBox.width,
      imageHeight: imageBox.height,
      loaded: image.complete && image.naturalWidth > 0,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    };
  });
  expect(geometry.loaded).toBe(true);
  expect(geometry.naturalWidth).toBe(1024);
  expect(geometry.naturalHeight).toBe(1536);
  expect(geometry.height / geometry.width).toBeCloseTo(1.5, 2);
  expect(geometry.imageWidth).toBeCloseTo(geometry.width, 1);
  expect(geometry.imageHeight).toBeCloseTo(geometry.height, 1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  return avatar;
}

for (const body of ['female', 'male'] as const) {
  test(`${body}: base, six slots and complete equipment preserve Avatar and stats`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    await createLocalTraveler(page, body);
    await page.goto('/journey/hero');
    const scenarios = [
      'base',
      ...slots,
      'armor-rare',
      'weapon-rare',
      'complete',
    ] as const;
    const screens =
      testInfo.project.name === 'desktop' ? viewports : [viewports[0]];
    for (const viewport of screens) {
      await page.setViewportSize(viewport);
      for (const scenario of scenarios) {
        const items =
          scenario === 'armor-rare'
            ? [rareArmor]
            : scenario === 'weapon-rare'
              ? [rareSword]
              : scenario === 'complete'
                ? EQUIPMENT_CATALOG
                : EQUIPMENT_CATALOG.filter((item) => item.slot === scenario);
        await page.evaluate(
          (equipment) => {
            const key = 'rpg-jovem-cristao:journey:v1';
            const save = JSON.parse(localStorage.getItem(key)!);
            const traveler = save.travelers[0];
            traveler.equipped = Object.fromEntries(
              equipment.map((item) => [item.slot, item.id]),
            );
            traveler.avatar.equippedItems = { ...traveler.equipped };
            localStorage.setItem(key, JSON.stringify(save));
          },
          [...items],
        );
        await page.reload();
        const count = items.flatMap((item) =>
          equipmentOverlayForItem(item, body),
        ).length;
        const avatar = await assertUndistortedAvatar(page, body, count);
        for (const stat of ['life', 'strength', 'defense', 'wisdom'] as const) {
          const expected =
            1 + items.reduce((sum, item) => sum + (item.stats[stat] ?? 0), 0);
          await expect(
            page.locator(`[data-attribute="${stat}"] strong`),
          ).toHaveText(String(expected));
        }
        await avatar.screenshot({
          path: testInfo.outputPath(
            `${body}-${viewport.width}-${scenario}.png`,
          ),
          animations: 'disabled',
        });
        if (scenario === 'complete') {
          await page.screenshot({
            path: testInfo.outputPath(
              `${body}-${viewport.width}-full-page.png`,
            ),
            fullPage: true,
            animations: 'disabled',
          });
        }
      }
    }
    await page.goto('/journey/equipment');
    for (const slot of slots) {
      const item = EQUIPMENT_CATALOG.find((entry) => entry.slot === slot)!;
      const card = page.locator('article').filter({
        has: page.getByRole('heading', { name: item.name, exact: true }),
      });
      await page
        .getByRole('button', { name: labels[slot], exact: true })
        .click();
      await expect(
        page
          .locator('article [data-visual-quality="NEEDS_NEW_OVERLAY"]')
          .first(),
      ).toBeVisible();
      await expect(
        card.locator('[data-visual-overlay-unavailable="true"]'),
      ).toBeVisible();
      const icon = card.locator('img').first();
      await expect(icon).toHaveAttribute('src', /_icon\.png$/);
      expect(
        await icon.evaluate(
          (image) => (image as HTMLImageElement).naturalWidth,
        ),
      ).toBeGreaterThan(0);
      await card
        .getByRole('button', { name: 'Desequipar', exact: true })
        .click();
      await expect(
        card.getByRole('button', { name: 'Equipar', exact: true }),
      ).toBeVisible();
      await card.getByRole('button', { name: 'Equipar', exact: true }).click();
      const flights = page.locator('[data-cinematic-icon]');
      await expect(flights).toHaveCount(1);
      for (const flight of await flights.all())
        await expect(flight).toHaveAttribute('src', /_icon\.png$/);
      await expect(
        card.getByRole('button', { name: 'Desequipar', exact: true }),
      ).toBeVisible();
      await expect(page.locator('[data-equipment-flight]')).toHaveCount(0);
      await expect(page.locator('[data-overlay-slot]')).toHaveCount(0);
      await expect(page.getByRole('status')).toContainText(
        'Camada corporal pendente',
      );
    }
    await page.reload();
    await expect(page.locator('[data-overlay-slot]')).toHaveCount(0);
    await assertUndistortedAvatar(page, body, 0);
    // Switching a same-slot item preserves the base and equipment while V1 stays hidden.
    await page.reload();
    await page.getByRole('button', { name: 'Arma', exact: true }).click();
    const base = await page
      .locator(`[data-body-type="${body}"]`)
      .getByRole('img', { name: 'Avatar do Viajante', exact: true })
      .elementHandle();
    await page
      .locator('article')
      .filter({
        has: page.getByRole('heading', {
          name: 'Espada alternativa',
          exact: true,
        }),
      })
      .getByRole('button', { name: 'Equipar', exact: true })
      .click();
    await expect(
      page
        .locator('article')
        .filter({
          has: page.getByRole('heading', {
            name: 'Espada alternativa',
            exact: true,
          }),
        })
        .getByRole('button', { name: 'Desequipar', exact: true }),
    ).toBeEnabled();
    await expect(page.locator('[data-overlay-slot]')).toHaveCount(0);
    await expect(
      page.locator('[data-overlay-item="traveler-sword-rare"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('[data-overlay-item="traveler-sword-common"]'),
    ).toHaveCount(0);
    expect(await base!.evaluate((element) => element.isConnected)).toBe(true);
    const savedWeapon = await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('rpg-jovem-cristao:journey:v1')!)
          .travelers[0].equipped.weapon,
    );
    expect(savedWeapon).toBe('traveler-sword-rare');
  });
}
