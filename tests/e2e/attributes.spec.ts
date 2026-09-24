import { expect, test, type Page } from '@playwright/test';

async function navigate(page: Page, label: string) {
  const menu = page.getByRole('button', { name: 'Abrir menu' });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: label }).click();
}

async function expectAttributes(page: Page, expected: Record<string, number>) {
  for (const [key, value] of Object.entries(expected))
    await expect(page.locator(`[data-attribute="${key}"] strong`)).toHaveText(String(value));
}

test('equipamentos alteram atributos derivados e persistem sem acumular', async ({ page }, testInfo) => {
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Luca');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1';
    const save = JSON.parse(localStorage.getItem(key)!);
    save.travelers[0].coins = 100;
    save.travelers[0].inventory.push({
      id: 'traveler-helmet-rare', name: 'Elmo do Viajante', slot: 'helmet', rarity: 'raro', power: 2,
    });
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();

  await navigate(page, 'Loja');
  const swordOffer = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Espada do Caminho' }) });
  await expect(swordOffer).toContainText('+2 Força');
  await swordOffer.getByRole('button', { name: 'Comprar' }).click();

  await navigate(page, 'Equipamentos');
  const swordCard = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Espada do Caminho' }) });
  await expect(swordCard).toContainText('+2 Força');
  await swordCard.getByRole('button', { name: 'Equipar', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Atributos: +2 Força');
  await page.getByRole('button', { name: 'Elmo', exact: true }).click();
  const helmetCard = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Elmo do Viajante' }) });
  await expect(helmetCard).toContainText('+1 Defesa');
  await helmetCard.getByRole('button', { name: 'Equipar', exact: true }).click();
  await expect(helmetCard.getByRole('button', { name: 'Desequipar' })).toBeVisible();

  await navigate(page, 'Herói');
  await expectAttributes(page, { life: 2, strength: 3, defense: 2, wisdom: 1 });
  await expect(page.locator('[data-attribute="strength"]')).toContainText('Base 1 · Equip. +2');
  await page.screenshot({ path: testInfo.outputPath('hero-attribute-totals.png'), fullPage: true });
  await page.reload();
  await expectAttributes(page, { life: 2, strength: 3, defense: 2, wisdom: 1 });

  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sair' }).click();
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Bia');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await navigate(page, 'Herói');
  await expectAttributes(page, { life: 2, strength: 1, defense: 1, wisdom: 1 });
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sair' }).click();
  await page.locator('article').filter({ has: page.getByRole('heading', { name: 'Luca' }) }).getByRole('button', { name: 'Entrar' }).click();
  await navigate(page, 'Herói');
  await expectAttributes(page, { life: 2, strength: 3, defense: 2, wisdom: 1 });

  await navigate(page, 'Equipamentos');
  await page.getByRole('button', { name: 'Arma', exact: true }).click();
  await swordCard.getByRole('button', { name: 'Desequipar' }).click();
  await expect(page.getByRole('status')).toContainText('Atributos: -2 Força');
  await navigate(page, 'Herói');
  await expectAttributes(page, { life: 2, strength: 1, defense: 2, wisdom: 1 });
});
