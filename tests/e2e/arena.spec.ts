import { expect, test, type Page } from '@playwright/test';

async function openArena(page: Page) {
  const menu = page.getByRole('button', { name: 'Abrir menu' });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('navigation', { name: /principal/i }).getByRole('link', { name: 'Arena' }).click();
}

test('Arena completa um treino e persiste histórico e recompensa', async ({ page }, testInfo) => {
  await page.goto('/journey/create');
  await page.getByLabel(/Nome do Viajante/i).fill('Ariel');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await openArena(page);
  await expect(page.getByRole('heading', { name: 'Arena dos Viajantes' })).toBeVisible();
  await expect(page.getByText('PvP online em preparação')).toBeVisible();
  await page.getByRole('button', { name: /Davi, o Aprendiz/ }).click();
  await expect(page.getByRole('heading', { name: 'Confronto de treino' })).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar batalha' }).click();
  await expect(page.getByText(/RODADA 1/)).toBeVisible();
  for (let round = 0; round < 30; round += 1) {
    const attack = page.getByRole('button', { name: /ATACAR/ });
    if (!(await attack.isVisible())) break;
    await attack.click();
  }
  await expect(page.getByRole('heading', { name: /Treino concluído|Uma nova estratégia/ })).toBeVisible();
  await expect(page.getByText(/rodadas/).first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('arena-result.png'), fullPage: true });
  await page.getByRole('button', { name: 'Voltar à Arena' }).click();
  await expect(page.getByRole('heading', { name: 'Últimos treinos' })).toBeVisible();
  await expect(page.getByText('vs Davi, o Aprendiz')).toBeVisible();
  await page.reload();
  await expect(page.getByText('vs Davi, o Aprendiz')).toBeVisible();
});

test('Arena mantém ações legíveis no viewport móvel', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'validação específica mobile');
  await page.goto('/journey/create');
  await page.getByLabel(/Nome do Viajante/i).fill('Noa');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await openArena(page);
  await page.getByRole('button', { name: /Davi, o Aprendiz/ }).click();
  await page.getByRole('button', { name: 'Iniciar batalha' }).click();
  for (const action of ['ATACAR', 'DEFENDER', 'FOCAR', 'HABILIDADE']) await expect(page.getByRole('button', { name: new RegExp(action) })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('arena-mobile.png'), fullPage: true });
});
