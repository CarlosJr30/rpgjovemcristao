import { expect, test, type Page } from '@playwright/test';

const screens = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
] as const;

async function createLocalTraveler(page: Page) {
  await page.addInitScript(() => localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'));
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Lia Baús');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1';
    const save = JSON.parse(localStorage.getItem(key)!);
    save.travelers[0].coins = 200;
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.goto('/journey/backpack');
}

test('Baús compram, persistem, abrem uma vez e respondem nas cinco viewports', async ({ page }) => {
  await page.setViewportSize(screens[0]);
  await createLocalTraveler(page);
  await page.getByRole('tab', { name: 'Baús' }).click();
  await page.getByRole('button', { name: 'Comprar · ◈ 40' }).click();
  await expect(page.getByRole('tab', { name: 'Baús (1)' })).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: 'Baús' }).click();
  await expect(page.getByText('Quantidade: 1')).toBeVisible();

  for (const viewport of screens) {
    await page.setViewportSize(viewport);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const card = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Baú Comum' }) }).first();
    await card.scrollIntoViewIfNeeded();
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  }

  await page.setViewportSize(screens[1]);
  const owned = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Tesouros guardados' }) });
  await owned.getByRole('button', { name: 'Abrir' }).click();
  await expect(page.getByText('VOCÊ RECEBEU')).toBeVisible();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  for (const viewport of [screens[1], screens[4]]) {
    await page.setViewportSize(viewport);
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
  }
  const receivedCoins = await page.getByText(/^\+ \d+ Moedas do Viajante$/).textContent();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.reload();
  await page.getByRole('tab', { name: 'Baús' }).click();
  await expect(page.getByText('Você ainda não possui Baús.')).toBeVisible();
  expect(receivedCoins).toMatch(/^\+ (10|25) Moedas do Viajante$/);
});

test('conclusão da fase concede exatamente um Baú persistido', async ({ page }) => {
  await createLocalTraveler(page);
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1';
    const save = JSON.parse(localStorage.getItem(key)!);
    const progress = save.travelers[0].progress;
    progress.gardenStep = 'diary';
    progress.bibleReading.genesis2Confirmed = true;
    progress.bibleReading.genesis3Confirmed = true;
    progress.bibleReading.comprehensionCompleted = true;
    progress.devotionalCompleted = true;
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.goto('/journey/phases/o-jardim-e-a-escolha');
  await page.getByRole('button', { name: 'Finalizar registro →' }).click();
  await page.goto('/journey/backpack');
  await page.getByRole('tab', { name: 'Baús' }).click();
  await expect(page.getByText('Quantidade: 1')).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: 'Baús' }).click();
  await expect(page.getByText('Quantidade: 1')).toBeVisible();
});
