import { expect, test, type Page } from '@playwright/test';
import { consolidationFixture } from '../fixtures/consolidation-001';

async function navigate(page: Page, label: string) {
  const link = page.getByRole('link', { name: label, exact: true });
  if (!(await link.isVisible()))
    await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await link.click();
}

test('consolidated route navigation retains identity, empty catalog gates, silent media and logout protection', async ({
  page,
  context,
}, info) => {
  const writes = await consolidationFixture(context);
  const ownerFilters: string[] = [];
  const errors: string[] = [];
  let audioRequests = 0;
  page.on('pageerror', (error) => errors.push(error.message));
  context.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.endsWith('/travelers') && request.method() === 'GET')
      ownerFilters.push(url.searchParams.get('user_id') ?? '');
    if (/\.(ogg|mp3|wav|m4a)(\?|$)/.test(url.href)) audioRequests++;
  });
  await page.goto('/auth');
  await page.getByLabel('E-mail').fill('fixture@example.invalid');
  await page.getByLabel('Senha').fill('synthetic-test-only');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Bem-vindo à jornada, Lia.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: /Modo História · ver mundos/ }).click();
  await expect(
    page.getByRole('list', { name: 'Mundos bíblicos' }).locator(':scope > li'),
  ).toHaveCount(9);
  // Complete the mocked query before a full navigation unloads the frame.
  await expect(
    page.getByRole('status').filter({ hasText: 'Consultando seu progresso…' }),
  ).toHaveCount(0);
  await navigate(page, 'Arena');
  await page.getByRole('link', { name: 'Meu Baralho', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Meu Baralho — Arena' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Salvar baralho', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText(/aguarda catálogo e aquisição autorizados/),
  ).toBeVisible();
  await navigate(page, 'Arena');
  await page
    .getByRole('link', { name: 'Torre dos 7 Desafios', exact: true })
    .click();
  await expect(
    page
      .getByRole('list', { name: 'Sete andares da Torre' })
      .getByRole('listitem'),
  ).toHaveCount(7);
  await expect(
    page.getByRole('button', { name: 'Entrar no andar', exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath('consolidated-tower-gate.png'),
    fullPage: true,
  });
  await navigate(page, 'Mochila');
  await page.getByRole('tab', { name: /^Baús/ }).click();
  await expect(
    page.getByRole('button', { name: 'Abrir', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Configurações de áudio' }).click();
  await page.getByRole('checkbox', { name: 'Música', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Efeitos', exact: true }).check();
  await expect(
    page.getByText(/As trilhas e os sons deste mundo estão em preparação/),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Abrir Herói', exact: true }).click();
  await page
    .getByRole('menuitem', { name: 'Sair da conta', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Entrar', exact: true }),
  ).toBeVisible();
  await page.goto('/journey/guild/manage');
  await expect(page).toHaveURL(/\/auth\?next=/);
  await expect(
    page.getByRole('heading', { name: 'Painel da Guilda', exact: true }),
  ).toHaveCount(0);
  expect(ownerFilters.length).toBeGreaterThan(0);
  expect(
    ownerFilters.every(
      (filter) => filter === 'eq.aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    ),
  ).toBe(true);
  expect(
    writes.filter((endpoint) =>
      /claim|complete|grant|battle|reward|open_chest/.test(endpoint),
    ),
  ).toEqual([]);
  expect(audioRequests).toBe(0);
  expect(errors).toEqual([]);
});
