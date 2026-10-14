import { expect, test, type Page } from '@playwright/test';

async function setup(page: Page, step: 'explore' | 'snake' | 'quiz') {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  await page
    .context()
    .route('**/*', (route) =>
      new URL(route.request().url()).origin === origin
        ? route.continue()
        : route.abort(),
    );
  await page.addInitScript(() =>
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
  );
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Jornada QA');
  await page
    .getByRole('button', { name: 'Criar Viajante', exact: true })
    .click();
  await page.getByRole('button', { name: /Entrar na jornada/ }).waitFor();
  await page.evaluate((step) => {
    const key = 'rpg-jovem-cristao:journey:v1',
      save = JSON.parse(localStorage.getItem(key)!);
    const p = save.travelers[0].progress;
    p.gardenStep = step;
    p.gardenFragments = 0;
    p.snakeTutorialCompleted = false;
    p.bibleReading.genesis2Confirmed = true;
    p.bibleReading.genesis3Confirmed = true;
    p.bibleReading.comprehensionCompleted = true;
    p.devotionalCompleted = true;
    localStorage.setItem(key, JSON.stringify(save));
  }, step);
  await page.goto('/journey/phases/o-jardim-e-a-escolha');
  await expect(page.locator(`[data-phase-step="${step}"]`)).toBeVisible();
}
async function choose(page: Page, id: string, action: string) {
  await page.locator(`[data-garden-point="${id}"]`).click();
  const button = page
    .getByRole('dialog')
    .getByRole('button', { name: action, exact: true });
  if (await button.isVisible()) await button.click();
}

for (const [width, height] of [
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
]) {
  test(`mapa e HUD utilizáveis em ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await setup(page, 'explore');
    const points = page.locator('[data-garden-point]');
    await expect(points).toHaveCount(10);
    const overlaps = await points.evaluateAll((nodes) => {
      let count = 0;
      for (let i = 0; i < nodes.length; i++)
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i].getBoundingClientRect(),
            b = nodes[j].getBoundingClientRect();
          if (
            a.left < b.right &&
            a.right > b.left &&
            a.top < b.bottom &&
            a.bottom > b.top
          )
            count++;
        }
      return count;
    });
    expect(overlaps).toBe(0);
    if (width <= 1024)
      await expect(points.first().locator('small')).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => {
      const key = 'rpg-jovem-cristao:journey:v1',
        save = JSON.parse(localStorage.getItem(key)!);
      save.travelers[0].progress.gardenStep = 'snake';
      localStorage.setItem(key, JSON.stringify(save));
    });
    await page.reload();
    await page.getByRole('button', { name: 'Começar', exact: true }).click();
    await expect(page.locator('[data-status="playing"]')).toBeVisible();
    await page.waitForTimeout(3400);
    const message = page.locator('[class*="arcadeMessage"]');
    expect(
      await message.evaluate((n) => n.scrollHeight <= n.clientHeight + 1),
    ).toBe(true);
    const hud = page.locator('[class*="arcadeHud"]');
    expect(
      await hud
        .locator('strong')
        .evaluateAll((nodes) =>
          nodes.every((n) => n.scrollWidth <= n.clientWidth + 1),
        ),
    ).toBe(true);
    if (width <= 1024) {
      expect(
        await hud
          .locator('b')
          .first()
          .evaluate((n) => parseFloat(getComputedStyle(n).fontSize)),
      ).toBeGreaterThanOrEqual(12);
      expect(
        await hud
          .locator('strong')
          .first()
          .evaluate((n) => parseFloat(getComputedStyle(n).fontSize)),
      ).toBeGreaterThanOrEqual(14);
    }
    const canvas = await page.getByRole('application').boundingBox();
    expect(canvas!.width).toBeGreaterThan(250);
    expect(canvas!.height).toBeGreaterThan(120);
    await page.getByRole('button', { name: 'Direcional', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Mover para cima', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Pausar', exact: true }).click();
    await expect(
      page.getByRole('dialog', { name: 'Partida pausada' }),
    ).toBeVisible();
  });
}

test('painel único restaura foco e guarda respostas; recompensa persiste sem duplicar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page, 'explore');
  const marker = page.locator('[data-garden-point="water"]');
  await choose(page, 'water', 'Investigar');
  let dialog = page.getByRole('dialog', { name: 'Desafio do cuidado' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /Água que irriga/ }).click();
  await page.keyboard.press('Escape');
  await expect(marker).toBeFocused();
  await choose(page, 'water', 'Investigar');
  dialog = page.getByRole('dialog', { name: 'Desafio do cuidado' });
  await expect(
    dialog.getByRole('button', { name: '✓ Água que irriga' }),
  ).toBeVisible();
  await dialog
    .getByRole('button', { name: /Solo que pode ser cultivado/ })
    .click();
  await dialog
    .getByRole('button', { name: /Vegetação a ser guardada/ })
    .click();
  await dialog.getByRole('button', { name: 'Concluir observação' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await choose(page, 'wind-pattern', 'Observar');
  dialog = page.getByRole('dialog', { name: 'Desafio de observação' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Pedras', exact: true }).click();
  await expect(dialog.getByText(/As marcas não reagiram/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Folhas', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const before = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('rpg-jovem-cristao:journey:v1')!)
        .travelers[0],
  );
  expect(before.progress.gardenFragments).toBe(1);
  await page.reload();
  await page.locator('[data-garden-point="wind-pattern"]').click();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('button', { name: 'Concluído', exact: true }),
  ).toBeDisabled();
  const after = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('rpg-jovem-cristao:journey:v1')!)
        .travelers[0],
  );
  expect(after.coins).toBe(before.coins);
  expect(after.progress.gardenFragments).toBe(1);
});

test('Serpente com texto 200% mantém intro, ações e valores completos', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await setup(page, 'snake');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await page.getByRole('button', { name: 'Começar', exact: true }).click();
  await expect(page.locator('[data-status="playing"]')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const hud = page.locator('[class*="arcadeHud"]');
  expect(
    await hud
      .locator('strong')
      .evaluateAll((nodes) =>
        nodes.every(
          (n) =>
            n.scrollWidth <= n.clientWidth + 1 &&
            n.scrollHeight <= n.clientHeight + 1,
        ),
      ),
  ).toBe(true);
  const canvas = await page.getByRole('application').boundingBox();
  expect(canvas!.height).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Continuar partida', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Como jogar', exact: true }).click();
  await expect(page.getByRole('dialog', { name: /Como jogar/ })).toBeVisible();
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Objetivo', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page
    .getByRole('button', { name: 'Continuar partida', exact: true })
    .click();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Começar', exact: true }),
  ).toBeVisible();
});

test('tutorial opcional, pausa, foco contido e fullscreen mantêm estado', async ({
  page,
}) => {
  await setup(page, 'snake');
  await expect(page.getByRole('application')).toHaveCount(0);
  await page.getByRole('button', { name: 'Como jogar', exact: true }).click();
  const dialog = page.getByRole('dialog', {
    name: 'Como jogar — Fuga da Serpente',
  });
  await expect(dialog.getByText('Etapa 1 de 2')).toBeVisible();
  await dialog.getByRole('button', { name: 'Próximo' }).click();
  await expect(dialog.getByText('Etapa 2 de 2')).toBeVisible();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    expect(
      await dialog.evaluate((n) => n.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Como jogar', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Começar', exact: true }).click();
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  const before = await page
    .getByRole('application')
    .getAttribute('data-player-x');
  await page.getByRole('button', { name: 'Como jogar', exact: true }).click();
  await page.keyboard.press('Escape');
  expect(
    await page.getByRole('application').getAttribute('data-player-x'),
  ).toBe(before);
  await page.getByRole('button', { name: 'Entrar em tela cheia' }).click();
  await expect(
    page.getByRole('button', { name: 'Sair', exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Sair da tela cheia' })
    .click()
    .catch(() => {});
  await page
    .getByRole('button', { name: 'Continuar partida', exact: true })
    .click();
  await expect(page.locator('[data-status="playing"]')).toBeVisible();
});

test('quiz legível, alternativa única e retorno não duplicam progresso', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await setup(page, 'quiz');
  const choices = page.locator('[class*="choiceCard"]');
  await expect(choices).toHaveCount(4);
  const boxes = await choices.evaluateAll((nodes) =>
    nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return { x: r.x, width: r.width, height: r.height };
    }),
  );
  expect(
    boxes.every((b) => b.height >= 48 && Math.abs(b.x - boxes[0].x) < 2),
  ).toBe(true);
  await choices.first().click();
  await expect(page.locator('[class*="quizFeedback"]')).toBeVisible();
  await expect(choices.first()).toBeVisible();
  expect(
    await choices.evaluateAll((nodes) =>
      nodes.every((n) => (n as HTMLButtonElement).disabled),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Próxima →', exact: true }).click();
  await expect(
    page.getByText('Quiz bíblico · 2/5', { exact: true }),
  ).toBeVisible();
  expect(
    await choices.evaluateAll((nodes) =>
      nodes.every((n) => !(n as HTMLButtonElement).disabled),
    ),
  ).toBe(true);
});

test('texto ampliado, sequência preservada e retorno à Jornada', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await setup(page, 'explore');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await choose(page, 'stones', 'Investigar');
  let dialog = page.getByRole('dialog', { name: 'Desafio do limite' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Liberdade', exact: true }).click();
  await expect(dialog.getByText('Sequência 1 / 3')).toBeVisible();
  await dialog.getByRole('button', { name: 'Fechar painel' }).click();
  await choose(page, 'stones', 'Investigar');
  dialog = page.getByRole('dialog', { name: 'Desafio do limite' });
  await expect(dialog.getByText('Sequência 1 / 3')).toBeVisible();
  expect(
    await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await dialog.getByRole('button', { name: 'Orientação', exact: true }).click();
  await dialog.getByRole('button', { name: 'Limite', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });
  await page
    .getByRole('link', { name: 'Jornada', exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/journey$/);
  await page
    .getByRole('link', { name: 'Continuar jornada', exact: true })
    .click();
  await expect(page.locator('[data-garden-point="stones"]')).toHaveAttribute(
    'aria-label',
    'Sinais do limite: concluído',
  );
  const fragments = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('rpg-jovem-cristao:journey:v1')!)
        .travelers[0].progress.gardenFragments,
  );
  expect(fragments).toBe(1);
});
