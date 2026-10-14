import { expect, test } from '@playwright/test';
import { EQUIPMENT_CATALOG } from '../../apps/web/features/journey/data/equipmentCatalog';
import { APPROVED_BODY_FIT_V3 } from '../../apps/web/features/journey/data/equipmentBodyFitV3';
import { calculateTotalAttributes } from '../../apps/web/features/journey/data/attributes';
import type { Traveler } from '../../apps/web/features/journey/domain/traveler';
const key = 'rpg-jovem-cristao:journey:v1';
const sizes = [
  [320, 568],
  [360, 800],
  [375, 812],
  [390, 844],
  [412, 915],
  [430, 932],
  [844, 390],
  [915, 412],
  [768, 1024],
  [1440, 900],
  [1920, 1080],
];
for (const [width, height] of sizes)
  test(`Body Fit ${width}x${height}: preview, stats, save and safe fallback`, async ({
    page,
  }, info) => {
    test.skip(
      info.project.name === 'desktop' && width !== 1440,
      'Touch engines cover matrix; desktop checks keyboard',
    );
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
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
      .fill('QA equipamentos');
    await page
      .getByRole('button', { name: 'Criar Viajante', exact: true })
      .click();
    await page.getByRole('button', { name: /Entrar na jornada/ }).waitFor();
    const initial = (await page.evaluate(
      ({ key, items }) => {
        const save = JSON.parse(localStorage.getItem(key)!);
        const t = save.travelers[0];
        t.avatar.gender = 'female';
        t.appearance = { hair: 'curto', outfit: 'musgo', skin: 'medio' };
        t.inventory = items;
        t.equipped = {};
        t.avatar.equippedItems = {};
        localStorage.setItem(key, JSON.stringify(save));
        return t;
      },
      { key, items: EQUIPMENT_CATALOG },
    )) as Traveler;
    await page.waitForLoadState('networkidle');
    await page.goto('/journey/equipment');
    const base = calculateTotalAttributes(initial).total;
    for (const [attr, value] of Object.entries(base))
      await expect(
        page.locator(`[data-current-attribute="${attr}"]`),
      ).toHaveText(String(value));
    await page.locator('[data-slot="armor"]').click();
    const item = EQUIPMENT_CATALOG.find(
      (i) => i.id === APPROVED_BODY_FIT_V3.itemId,
    )!;
    const card = page.locator('article').filter({
      has: page.getByRole('heading', { name: item.name, exact: true }),
    });
    const storedBefore = await page.evaluate(
      (key) => localStorage.getItem(key),
      key,
    );
    const tryOn = card.getByRole('button', {
      name: 'Experimentar',
      exact: true,
    });
    await tryOn.click();
    const dialog = page.getByRole('dialog', { name: /Experimentar/ });
    await expect(dialog).toBeVisible();
    expect(
      await dialog
        .locator('[data-preview-before]')
        .evaluate(
          (n) =>
            n.querySelector('[data-avatar-runtime]')!.getBoundingClientRect()
              .height <=
            n.clientHeight + 1,
        ),
    ).toBe(true);
    await expect(dialog.locator('[data-overlay-item]')).toHaveAttribute(
      'src',
      APPROVED_BODY_FIT_V3.asset,
    );
    await dialog.getByRole('button', { name: 'Antes', exact: true }).click();
    await expect(dialog.locator('[data-overlay-item]')).toHaveCount(0);
    await dialog.getByLabel('Zoom', { exact: true }).selectOption('3');
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
      storedBefore,
    );
    await dialog.getByRole('button', { name: 'Depois', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(tryOn).toBeFocused();
    await tryOn.click();
    await dialog
      .getByRole('button', { name: 'Equipar este item', exact: true })
      .click();
    await expect(card).toHaveAttribute('data-equipped', 'true');
    await expect(dialog).not.toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-equipment-cinematic]')).toHaveCount(0);
    const total = calculateTotalAttributes({
      ...initial,
      equipped: { armor: item.id },
    }).total;
    for (const [attr, value] of Object.entries(total))
      await expect(
        page.locator(`[data-current-attribute="${attr}"]`),
      ).toHaveText(String(value));
    await expect(
      page.locator('[data-mobile-screen="equipment"] [data-overlay-item]'),
    ).toHaveCount(1);
    await page.screenshot({
      path: info.outputPath('equipped.png'),
      fullPage: true,
    });
    await info.attach('horizontal-layout', {
      body: JSON.stringify(
        await page.evaluate(() => ({
          width: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          active: document.activeElement?.outerHTML.slice(0, 500),
          scrollers: Array.from(document.querySelectorAll('body *'))
            .filter((n) => n.checkVisibility() && n.scrollWidth > n.clientWidth)
            .map((n) => ({
              tag: n.tagName,
              class: n.className,
              scrollWidth: n.scrollWidth,
              clientWidth: n.clientWidth,
              outline: getComputedStyle(n).outline,
              outlineOffset: getComputedStyle(n).outlineOffset,
              overflow: getComputedStyle(n).overflow,
            })),
          outside: Array.from(document.querySelectorAll('body *'))
            .filter((n) => n.checkVisibility())
            .map((n) => ({
              tag: n.tagName,
              class: n.className,
              x: n.getBoundingClientRect().x,
              right: n.getBoundingClientRect().right,
              width: n.getBoundingClientRect().width,
            }))
            .filter((n) => n.right > innerWidth + 1),
        })),
      ),
      contentType: 'application/json',
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.reload();
    await expect(
      page.locator('[data-mobile-screen="equipment"] [data-overlay-item]'),
    ).toHaveCount(1);
    await page.locator('[data-slot="armor"]').click();
    await expect(card).toHaveAttribute('data-equipped', 'true');
    await card.getByRole('button', { name: 'Desequipar', exact: true }).click();
    await expect(
      page.locator('[data-mobile-screen="equipment"] [data-overlay-item]'),
    ).toHaveCount(0);
    for (const [attr, value] of Object.entries(base))
      await expect(
        page.locator(`[data-current-attribute="${attr}"]`),
      ).toHaveText(String(value));
    await page.waitForLoadState('networkidle');
    await page.evaluate((key) => {
      const save = JSON.parse(localStorage.getItem(key)!);
      save.travelers[0].appearance.hair = 'longo';
      save.travelers[0].equipped.armor = 'traveler-armor-uncommon';
      localStorage.setItem(key, JSON.stringify(save));
    }, key);
    await page.reload();
    await expect(
      page.locator('[data-mobile-screen="equipment"] [data-overlay-item]'),
    ).toHaveCount(0);
    for (const [attr, value] of Object.entries(total))
      await expect(
        page.locator(`[data-current-attribute="${attr}"]`),
      ).toHaveText(String(value));
    await page.waitForLoadState('networkidle');
  });
