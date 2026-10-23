import { expect, test } from '@playwright/test';
import {
  loginAuthorityAccount,
  mockAuthorityAccount,
} from '../fixtures/authority-browser-account';
import { EQUIPMENT_CATALOG } from '../../apps/web/features/journey/data/equipmentCatalog';

// Synthetic HTTP transport only. These tests do not claim hosted Auth/RLS or
// permission to mutate the real Teste Chat A. PostgreSQL is verified separately.
test('confirmed equipment survives reload, updates attributes and never consumes inventory', async ({
  page,
  context,
}, info) => {
  await mockAuthorityAccount(context);
  const actor = '10000000-0000-4000-8000-000000000001';
  const equipped: Record<string, string> = { boots: 'traveler-boots' };
  const inventory = EQUIPMENT_CATALOG.map((item, index) => ({
    id: `fixture-${index}`,
    traveler_id: actor,
    item_id: item.id,
    quantity: 1,
    metadata: {},
  }));
  const commands: Record<string, unknown>[] = [];
  let failure = false;
  await context.route('**/rest/v1/**', async (route) => {
    const endpoint = new URL(route.request().url()).pathname.split('/').at(-1);
    if (endpoint === 'inventory') return route.fulfill({ json: inventory });
    if (endpoint === 'equipped_items')
      return route.fulfill({
        json: Object.entries(equipped).map(([slot, item_id]) => ({
          traveler_id: actor,
          slot,
          item_id,
        })),
      });
    if (endpoint === 'set_owned_equipment') {
      const body = route.request().postDataJSON();
      commands.push(body);
      if (failure)
        return route.fulfill({
          status: 409,
          json: { code: '40001', message: 'Equipment changed' },
        });
      expect(body.p_traveler_id).toBe(actor);
      expect(body.p_expected_item_id).toBe(equipped[body.p_slot] ?? null);
      expect(Object.keys(body).sort()).toEqual([
        'p_expected_item_id',
        'p_item_id',
        'p_slot',
        'p_traveler_id',
      ]);
      if (body.p_item_id === null) delete equipped[body.p_slot];
      else equipped[body.p_slot] = body.p_item_id;
      return route.fulfill({ json: equipped });
    }
    return route.fallback();
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await loginAuthorityAccount(page);
  const equipmentLink = page.getByRole('link', {
    name: 'Equipamentos',
    exact: true,
  });
  if (!(await equipmentLink.isVisible()))
    await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await equipmentLink.click();
  await expect(
    page.getByRole('heading', { name: 'Arsenal do Viajante' }),
  ).toBeVisible();
  let power = page.locator('[data-current-power]');
  const before = Number(await power.textContent());
  let strength = page.locator('[data-current-attribute="strength"]');
  await expect(strength).toHaveText('1');
  // Open the selected slot through the visible UI on compact screens.
  await page.getByRole('button', { name: 'Arma', exact: true }).click();
  let card = page.locator('article').filter({
    has: page.getByRole('heading', {
      name: 'Espada do Caminho',
      exact: true,
    }),
  });
  await card.getByRole('button', { name: 'Equipar', exact: true }).click();
  await expect(
    page.getByText(
      'Equipamento confirmado pelo servidor. Mochila e atributos atualizados.',
    ),
  ).toBeVisible();
  await expect(strength).toHaveText('3');
  expect(Number(await power.textContent())).toBeGreaterThan(before);
  await expect(card).toHaveAttribute('data-equipped', 'true');
  const reloadEquipment = async () => {
    if (info.project.name === 'webkit390') {
      // WebKit reports canceled Next prefetches on full document unload. A new
      // document in the same context verifies persistence without canceling the
      // old page's in-flight resources; no page errors are filtered.
      page = await context.newPage();
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto('/journey/equipment');
    } else await page.reload();
    power = page.locator('[data-current-power]');
    strength = page.locator('[data-current-attribute="strength"]');
    card = page
      .locator('article')
      .filter({
        has: page.getByRole('heading', {
          name: 'Espada do Caminho',
          exact: true,
        }),
      });
  };
  await reloadEquipment();
  await expect(strength).toHaveText('3');
  await page.getByRole('button', { name: 'Arma', exact: true }).click();
  failure = true;
  await card.getByRole('button', { name: 'Desequipar', exact: true }).click();
  await expect(
    page.getByText(/O equipamento mudou em outra aba ou há um combate ativo/),
  ).toBeVisible();
  await expect(strength).toHaveText('3');
  await expect(card).toHaveAttribute('data-equipped', 'true');
  failure = false;
  await card.getByRole('button', { name: 'Desequipar', exact: true }).click();
  await expect(strength).toHaveText('1');
  await expect(card).toHaveAttribute('data-equipped', 'false');
  await expect(power).toHaveText(String(before));
  await reloadEquipment();
  await expect(strength).toHaveText('1');
  expect(commands).toHaveLength(3);
  expect(inventory.every((i) => i.quantity === 1)).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: `build/fix-prod-002/${info.project.name}-equipment.png`,
    fullPage: true,
  });
});
