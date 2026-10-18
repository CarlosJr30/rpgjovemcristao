import { expect, test, type Page } from '@playwright/test';
async function navigation(page: Page, name: 'Arena' | 'Jornada') {
  const mobile = page.getByRole('navigation', {
    name: 'Navegação do jogo',
    exact: true,
  });
  if (await mobile.isVisible())
    return mobile.getByRole('link', { name, exact: true }).click();
  const desktop = page.getByRole('navigation', {
    name: 'Navegação principal',
    exact: true,
  });
  if (!(await desktop.isVisible()))
    await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await desktop.getByRole('link', { name, exact: true }).click();
}
test.beforeEach(async ({ page, baseURL }) => {
  await page
    .context()
    .route('**/*', (route) =>
      new URL(route.request().url()).origin === new URL(baseURL!).origin
        ? route.continue()
        : route.abort(),
    );
  await page.goto('/auth');
  await page
    .getByRole('button', { name: 'Continuar somente neste navegador' })
    .click();
  await page.goto('/journey/create');
  await page.getByLabel(/Nome do Viajante/i).fill('Viajante Jornada');
  await page
    .getByRole('button', { name: 'Criar Viajante', exact: true })
    .click();
  await page.getByRole('button', { name: /Entrar na jornada/ }).click();
  await expect(page).toHaveURL('/journey');
});
test('TASK-0076D Jornada abre Arena de Cartas e retorna preservando personagem e equipamentos', async ({
  page,
}, info) => {
  const before = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('rpg-jovem-cristao:journey:v1')!)
        .travelers[0],
  );
  await navigation(page, 'Arena');
  await expect(page).toHaveURL('/journey/arena');
  await expect(
    page.getByRole('heading', { name: 'Duelo de Cartas', exact: true }),
  ).toBeVisible();
  await expect(page.locator('a[href*="/arena/legacy"]')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Arena clássica', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Treinar com Davi, o Aprendiz', exact: true })
    .click();
  await expect(page.locator('[data-card-id]')).toHaveCount(5);
  await expect(
    page.getByLabel('Energia 3 de 3', { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath('journey-main-arena.png'),
    fullPage: true,
  });
  await navigation(page, 'Jornada');
  await expect(page).toHaveURL('/journey');
  const after = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('rpg-jovem-cristao:journey:v1')!)
        .travelers[0],
  );
  expect(after).toEqual(before);
});
test('TASK-0076D rota clássica redireciona para a Arena principal', async ({
  page,
}) => {
  await page.goto('/journey/arena/legacy');
  await expect(page).toHaveURL('/journey/arena');
  await expect(
    page.getByRole('heading', { name: 'Duelo de Cartas', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Iniciar batalha/ }),
  ).toHaveCount(0);
  await expect(page.locator('a[href*="/arena/legacy"]')).toHaveCount(0);
});
