import { expect, test } from '@playwright/test';
test('isolated candidate uses seven proposals, resumes the consumed card and restores it next floor without grants', async ({
  page,
  context,
}, info) => {
  await context.route('**/*', (route) =>
    ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort(),
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:3193/?candidate=003a');
  await page
    .getByRole('button', { name: 'Preparar baralho sintético', exact: true })
    .click();
  for (let floor = 0; floor < 2; floor++) {
    await expect(
      page.getByText(`Torre local: ${floor}/7 desafios concluídos.`, {
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Entrar no andar', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Iniciar batalha', exact: true })
      .click();
    await page.getByRole('button', { name: 'CARTAS', exact: true }).click();
    const card = page.getByRole('article', {
      name: 'Carta: Golpe Medido',
      exact: true,
    });
    await expect(
      page
        .getByRole('region', { name: 'Cartas desta batalha' })
        .getByRole('article'),
    ).toHaveCount(7);
    await expect(
      card.getByText('Golpe Medido ×1,15', { exact: true }),
    ).toBeVisible();
    await expect(
      card.getByText('Custo: 1 Foco · Nível mínimo: 1', { exact: true }),
    ).toBeVisible();
    await expect(card.getByRole('button')).toBeDisabled();
    await page.getByRole('button', { name: 'DEFENDER', exact: true }).click();
    await expect(card.getByRole('button')).toBeEnabled();
    await card.getByRole('button').click();
    await expect(card.getByText('USADA', { exact: true })).toBeVisible();
    await expect(card.getByRole('button')).toBeDisabled();
    if (floor === 0) {
      await page.reload();
      await page
        .getByRole('button', { name: 'Retomar batalha', exact: true })
        .click();
      await page.getByRole('button', { name: 'CARTAS', exact: true }).click();
      await expect(card.getByText('USADA', { exact: true })).toBeVisible();
      await expect(card.getByRole('button')).toBeDisabled();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `build/task-consolidation-003a/${info.project.name}-candidate-used.png`,
        fullPage: true,
        animations: 'disabled',
      });
    }
    for (let turn = 0; turn < 30; turn++) {
      const outcome = page.getByText(/Resultado demonstrativo registrado/);
      const attack = page.getByRole('button', { name: 'ATACAR', exact: true });
      await expect
        .poll(
          async () => (await outcome.count()) > 0 || (await attack.isEnabled()),
        )
        .toBe(true);
      if (await outcome.count()) break;
      await attack.click();
    }
    await expect(
      page.getByText(/Resultado demonstrativo registrado/),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Voltar à Torre', exact: true })
      .click();
  }
  await expect(
    page.getByText('Torre local: 2/7 desafios concluídos.', { exact: true }),
  ).toBeVisible();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(
    keys.every(
      (key) =>
        key.startsWith('rpg-jovem-cristao:arena-deck:') ||
        key.startsWith('rpg-jovem-cristao:arena-tower'),
    ),
  ).toBe(true);
});
