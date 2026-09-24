import { expect, test, type Page } from '@playwright/test';

async function navigate(page: Page, label: string) {
  const menu = page.getByRole('button', { name: 'Abrir menu' });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: label }).click();
}

test('equipamentos encaixam no Avatar e persistem por Viajante', async ({ page }, testInfo) => {
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Luca');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1';
    const save = JSON.parse(localStorage.getItem(key)!);
    save.travelers[0].coins = 500;
    save.travelers[0].inventory.push(
      { id: 'traveler-helmet-rare', name: 'Elmo do Viajante', slot: 'helmet', rarity: 'raro', power: 2 },
      { id: 'wisdom-amulet', name: 'Medalhão do Caminho', slot: 'amulet', rarity: 'raro', power: 2 },
    );
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  await navigate(page, 'Loja');
  for (const title of ['Espada do Caminho', 'Couraça do Viajante', 'Escudo da Perseverança']) {
    await page.locator('article').filter({ has: page.getByRole('heading', { name: title }) }).getByRole('button', { name: 'Comprar' }).click();
  }
  await navigate(page, 'Equipamentos');
  for (const [slot, name] of [
    ['Arma', 'Espada do Caminho'], ['Escudo', 'Escudo da Perseverança'],
    ['Medalhão', 'Medalhão do Caminho'], ['Elmo', 'Elmo do Viajante'],
    ['Armadura', 'Couraça do Viajante'],
  ]) {
    await page.getByRole('button', { name: slot, exact: true }).click();
    await page.locator('article').filter({ has: page.getByRole('heading', { name }) }).getByRole('button', { name: 'Equipar', exact: true }).click();
    await expect(page.locator('article').filter({ has: page.getByRole('heading', { name }) }).getByRole('button', { name: 'Desequipar' })).toBeVisible();
  }
  const previewAvatar = page.getByText('PRÉVIA DO VIAJANTE').locator('..').locator('[data-body-type]');
  const previewBootPlacement = await previewAvatar.locator('[data-overlay-slot="boots"]').evaluateAll((elements) => elements.map((element) => {
    const image = element.getBoundingClientRect();
    const avatar = element.parentElement!.getBoundingClientRect();
    return { x: (image.x - avatar.x) / avatar.width, y: (image.y - avatar.y) / avatar.height, width: image.width / avatar.width };
  }));
  expect(previewBootPlacement).toHaveLength(2);
  await page.screenshot({ path: testInfo.outputPath('equipment-preview-boots.png'), fullPage: true });
  await navigate(page, 'Herói');
  const heroBootPlacement = await page.locator('[data-body-type] [data-overlay-slot="boots"]').evaluateAll((elements) => elements.map((element) => {
    const image = element.getBoundingClientRect();
    const avatar = element.parentElement!.getBoundingClientRect();
    return { x: (image.x - avatar.x) / avatar.width, y: (image.y - avatar.y) / avatar.height, width: image.width / avatar.width };
  }));
  for (const [index, placement] of heroBootPlacement.entries()) {
    expect(placement.x).toBeCloseTo(previewBootPlacement[index].x, 2);
    expect(placement.y).toBeCloseTo(previewBootPlacement[index].y, 2);
    expect(placement.width).toBeCloseTo(previewBootPlacement[index].width, 2);
  }
  await expect(page.locator('[data-overlay-slot="weapon"]')).toHaveCount(1);
  await expect(page.locator('[data-overlay-slot="shield"]')).toHaveCount(1);
  await expect(page.locator('[data-overlay-slot="helmet"]')).toHaveCount(1);
  await expect(page.locator('[data-overlay-slot="armor"]')).toHaveCount(1);
  await expect(page.locator('[data-overlay-slot="boots"]')).toHaveCount(2);
  await page.screenshot({ path: testInfo.outputPath('hero-all-equipped.png'), fullPage: true });
  for (const zoom of ['90%', '110%']) {
    await page.evaluate((value) => { document.documentElement.style.zoom = value; }, zoom);
    const grip = await page.locator('[data-overlay-slot="weapon"]').evaluate((element) => {
      const image = element.getBoundingClientRect();
      const avatar = element.parentElement!.getBoundingClientRect();
      return { x: (image.left + image.width * .28 - avatar.left) / avatar.width, y: (image.top + image.height * .73 - avatar.top) / avatar.height };
    });
    expect(grip.x).toBeCloseTo(.762, 1);
    expect(grip.y).toBeCloseTo(.545, 1);
    const zoomedBootPlacement = await page.locator('[data-body-type] [data-overlay-slot="boots"]').evaluateAll((elements) => elements.map((element) => {
      const image = element.getBoundingClientRect();
      const avatar = element.parentElement!.getBoundingClientRect();
      return { x: (image.x - avatar.x) / avatar.width, y: (image.y - avatar.y) / avatar.height, width: image.width / avatar.width };
    }));
    for (const [index, placement] of zoomedBootPlacement.entries()) {
      expect(placement.x).toBeCloseTo(heroBootPlacement[index].x, 2);
      expect(placement.y).toBeCloseTo(heroBootPlacement[index].y, 2);
      expect(placement.width).toBeCloseTo(heroBootPlacement[index].width, 2);
    }
    await page.screenshot({ path: testInfo.outputPath(`hero-zoom-${zoom.slice(0, -1)}.png`), fullPage: true });
  }
  await page.evaluate(() => { document.documentElement.style.zoom = '100%'; });
  if (testInfo.project.name === 'desktop') {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.screenshot({ path: testInfo.outputPath('hero-notebook.png'), fullPage: true });
  } else {
    await page.setViewportSize({ width: 360, height: 760 });
    await page.screenshot({ path: testInfo.outputPath('hero-360.png'), fullPage: true });
  }
  await page.reload();
  await expect(page.locator('[data-overlay-slot="weapon"]')).toHaveCount(1);
  await expect(page.locator('[data-overlay-slot="helmet"]')).toHaveCount(1);
  await expect(page.locator('[data-overlay-slot="boots"]')).toHaveCount(2);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sair' }).click();
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Bia');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await navigate(page, 'Herói');
  await expect(page.locator('[data-overlay-slot="weapon"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sair' }).click();
  await page.locator('article').filter({ has: page.getByRole('heading', { name: 'Luca' }) }).getByRole('button', { name: 'Entrar' }).click();
  await navigate(page, 'Herói');
  await expect(page.locator('[data-overlay-slot="weapon"]')).toHaveCount(1);
  await navigate(page, 'Equipamentos');
  await page.getByRole('button', { name: 'Arma', exact: true }).click();
  await page.locator('article').filter({ has: page.getByRole('heading', { name: 'Espada do Caminho' }) }).getByRole('button', { name: 'Desequipar' }).click();
  await expect(page.locator('[data-overlay-slot="weapon"]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-overlay-slot="weapon"]')).toHaveCount(0);
});

test('camadas acompanham o corpo feminino sem deformar a imagem', async ({ page }, testInfo) => {
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Bia');
  await page.getByRole('radio', { name: 'Feminino' }).check();
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1';
    const save = JSON.parse(localStorage.getItem(key)!);
    const traveler = save.travelers[0];
    const items = [
      { id: 'traveler-helmet-rare', name: 'Elmo do Viajante', slot: 'helmet', rarity: 'raro', power: 2 },
      { id: 'traveler-sword-common', name: 'Espada do Caminho', slot: 'weapon', rarity: 'comum', power: 1 },
      { id: 'traveler-shield-rare', name: 'Escudo da Perseverança', slot: 'shield', rarity: 'raro', power: 3 },
    ];
    traveler.inventory.push(...items);
    for (const item of items) traveler.equipped[item.slot] = item.id;
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  await navigate(page, 'Herói');
  await expect(page.locator('[data-body-type="female"]')).toBeVisible();
  await expect(page.locator('[data-overlay-slot="helmet"]')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('hero-female-equipped.png'), fullPage: true });
});
