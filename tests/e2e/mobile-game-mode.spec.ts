import { expect, test, type Page } from '@playwright/test';
import { EQUIPMENT_CATALOG } from '../../apps/web/features/journey/data/equipmentCatalog';

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
test.beforeEach(async ({ context, page }) => {
  await context.route('**/*', (route) =>
    new URL(route.request().url()).hostname === '127.0.0.1'
      ? route.continue()
      : route.abort(),
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
});
async function create(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
  );
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Lia Mobile');
  await page
    .getByRole('button', { name: 'Criar Viajante', exact: true })
    .click();
  await expect(page).toHaveURL('/journey/intro');
}
test('activity-first layout: useful avatar, six slots and battle actions in the 11 viewports', async ({
  page,
}, info) => {
  test.setTimeout(300_000);
  await create(page);
  const results: unknown[] = [];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const avatar = page.locator('main [data-avatar-base]').first();
    await expect(avatar).toBeVisible();
    const bounds = await avatar.boundingBox();
    if (width <= 1024) {
      expect(bounds!.height).toBeGreaterThanOrEqual(135);
      const next = page.getByRole('link', { name: /Continuar jornada/ });
      const cta = await next.boundingBox();
      const nav = await page
        .getByRole('navigation', { name: 'Navegação do jogo', exact: true })
        .boundingBox();
      if (height >= 568)
        expect(cta!.y + cta!.height).toBeLessThanOrEqual(nav!.y + 1);
      for (const link of await page
        .getByRole('navigation', { name: 'Navegação do jogo', exact: true })
        .getByRole('link')
        .all()) {
        const rect = await link.boundingBox();
        expect(rect!.width).toBeGreaterThanOrEqual(44);
        expect(rect!.height).toBeGreaterThanOrEqual(44);
      }
    }
    await page.goto('/journey/equipment');
    const slots = page
      .getByLabel('Slots de equipamentos', { exact: true })
      .locator('button');
    await expect(slots).toHaveCount(6);
    await slots.first().click();
    for (const select of await page
      .locator('#equipment-inventory select')
      .all()) {
      const rect = await select.boundingBox();
      expect(rect!.x + rect!.width).toBeLessThanOrEqual(width + 1);
    }
    await page.goto('/journey/arena');
    await page.getByRole('button', { name: /Davi,/ }).click();
    await page
      .getByRole('button', { name: 'Iniciar batalha', exact: true })
      .click();
    if (width > 1024) await page.evaluate(() => scrollTo(0, 0));
    else await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    const actions = await page
      .getByLabel('Ações da batalha', { exact: true })
      .boundingBox();
    const field = await page.getByTestId('arena-stage').boundingBox();
    if (width <= 1024) {
      const nav = await page
        .getByRole('navigation', { name: 'Navegação do jogo', exact: true })
        .boundingBox();
      expect(field!.y).toBeGreaterThanOrEqual(0);
      expect(field!.y + field!.height).toBeLessThanOrEqual(nav!.y + 1);
      expect(
        actions!.y + actions!.height,
        `${width}x${height}: actions should be visible above navigation; field=${JSON.stringify(field)}, actions=${JSON.stringify(actions)}`,
      ).toBeLessThanOrEqual(nav!.y + 1);
      expect(field!.width).toBeGreaterThan(
        width < 768 ? width * 0.85 : width * 0.55,
      );
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    results.push({ width, height, avatar: bounds, field, actions });
  }
  await info.attach('usable-area-matrix', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });
});
test('touch navigation, keyboard menu, traveler switch focus and equipment panel', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await create(page);
  await page.evaluate((items) => {
    const key = 'rpg-jovem-cristao:journey:v1',
      save = JSON.parse(localStorage.getItem(key)!);
    save.travelers[0].inventory = items;
    localStorage.setItem(key, JSON.stringify(save));
  }, EQUIPMENT_CATALOG);
  await page.goto('/');
  const nav = page.getByRole('navigation', {
    name: 'Navegação do jogo',
    exact: true,
  });
  if (info.project.name === 'desktop')
    await nav.getByRole('link', { name: 'Equipar', exact: true }).click();
  else await nav.getByRole('link', { name: 'Equipar', exact: true }).tap();
  await expect(page).toHaveURL('/journey/equipment');
  const weapon = page.locator('[data-slot="weapon"]');
  await weapon.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#equipment-inventory')).toHaveAttribute(
    'open',
    '',
  );
  await page.getByText('Comparar com o atual', { exact: true }).first().click();
  await page
    .getByRole('button', { name: 'Equipar', exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: /equipado/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await expect(page.locator('#journey-sidebar a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Abrir menu', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Abrir Herói', exact: true }).click();
  await page
    .getByRole('menuitem', { name: 'Trocar Viajante', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByRole('button', { name: 'Cancelar', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(
    dialog.getByRole('button', { name: 'Trocar Viajante', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Abrir Herói', exact: true }),
  ).toBeFocused();
});
test('login and devotional stay scrollable in a reduced viewport; private diary persists locally', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 440 });
  await page.goto('/auth');
  await page.getByLabel('E-mail', { exact: true }).fill('qa@example.invalid');
  expect(
    await page
      .getByLabel('E-mail', { exact: true })
      .evaluate((n) => parseFloat(getComputedStyle(n).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  await create(page);
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1',
      save = JSON.parse(localStorage.getItem(key)!);
    const p = save.travelers[0].progress;
    p.gardenStep = 'reflection';
    p.gardenFragments = 3;
    p.bibleReading.genesis2Confirmed = true;
    p.bibleReading.genesis3Confirmed = true;
    p.bibleReading.comprehensionCompleted = true;
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.goto('/journey/phases/o-jardim-e-a-escolha');
  await page
    .locator('textarea')
    .fill('Quero cuidar das pessoas nas minhas escolhas.');
  await page
    .getByRole('button', { name: /Salvar reflexão e continuar/ })
    .click();
  await page.goto('/journey/diary');
  await page.getByText('Ver minha reflexão privada', { exact: true }).click();
  await expect(page.locator('[data-private-reflection]')).toContainText(
    'Quero cuidar',
  );
  await expect(page.locator('[data-private-reflection]')).toHaveCSS(
    'font-size',
    '16px',
  );
});
