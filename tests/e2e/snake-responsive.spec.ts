import { expect, test, type Page } from '@playwright/test';

const screens = [
  { name: 'phone-360x800', width: 360, height: 800, kind: 'phone' },
  { name: 'phone-390x844', width: 390, height: 844, kind: 'phone' },
  { name: 'phone-412x915', width: 412, height: 915, kind: 'phone' },
  { name: 'landscape-844x390', width: 844, height: 390, kind: 'landscape' },
  { name: 'landscape-915x412', width: 915, height: 412, kind: 'landscape' },
  { name: 'tablet-768x1024', width: 768, height: 1024, kind: 'tablet' },
  { name: 'desktop-1440x900', width: 1440, height: 900, kind: 'desktop' },
] as const;

async function openSnakeGame(page: Page) {
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
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Nina');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1';
    const save = JSON.parse(localStorage.getItem(key)!);
    const progress = save.travelers[0].progress;
    progress.gardenStep = 'snake';
    progress.gardenFragments = 3;
    progress.bibleReading.genesis2Confirmed = true;
    progress.bibleReading.genesis3Confirmed = true;
    progress.bibleReading.comprehensionCompleted = true;
    progress.devotionalCompleted = true;
    progress.snakeTutorialCompleted = true;
    localStorage.setItem(key, JSON.stringify(save));
  });
}

test('Fuga V2: câmera legível, DPR limitado e direcional opcional sem encobrir campo', async ({
  page,
}, testInfo) => {
  await page.setViewportSize(screens[0]);
  await openSnakeGame(page);
  for (const screen of screens) {
    await page.setViewportSize({ width: screen.width, height: screen.height });
    await page.goto('/journey/phases/o-jardim-e-a-escolha');
    await page.getByRole('button', { name: 'Começar', exact: true }).click();
    const canvas = page.getByRole('application', {
      name: 'Fuga da Serpente, jogo de perseguição',
    });
    if (screen.kind === 'desktop') await canvas.scrollIntoViewIfNeeded();
    await expect
      .poll(() => canvas.getAttribute('data-cell-pixels'))
      .not.toBeNull();
    if (
      (await page
        .locator('[data-serpent-mode]')
        .getAttribute('data-controls')) !== 'true'
    )
      await page
        .getByRole('button', { name: 'Direcional', exact: true })
        .click();
    await expect(page.getByRole('button', { name: /Mover para/ })).toHaveCount(
      4,
    );
    const metrics = await canvas.evaluate((element) => {
      const c = element as HTMLCanvasElement,
        r = c.getBoundingClientRect();
      return {
        cell: Number(c.dataset.cellPixels),
        follow: c.dataset.cameraFollow,
        dpr: c.width / c.clientWidth,
        width: r.width,
        height: r.height,
        overflow: document.documentElement.scrollWidth - innerWidth,
        worldWidth: Number(c.dataset.worldWidth),
        worldHeight: Number(c.dataset.worldHeight),
        cameraX: Number(c.dataset.cameraX),
        cameraY: Number(c.dataset.cameraY),
      };
    });
    expect(metrics.dpr).toBeGreaterThanOrEqual(0.99);
    expect(metrics.dpr).toBeLessThanOrEqual(2.01);
    expect(metrics.overflow).toBeLessThanOrEqual(1);
    if (screen.kind !== 'desktop') {
      expect(metrics.cell).toBeGreaterThanOrEqual(40);
      expect(metrics.follow).toBe('true');
      expect(metrics.height).toBeGreaterThan(screen.height * 0.45);
      expect(metrics.cameraX + metrics.worldWidth).toBeLessThanOrEqual(864.01);
      expect(metrics.cameraY + metrics.worldHeight).toBeLessThanOrEqual(504.01);
    } else {
      expect(metrics.follow).toBe('false');
      expect(metrics.worldWidth).toBe(864);
      expect(metrics.worldHeight).toBe(504);
    }
    for (const button of await page
      .getByRole('button', { name: /Mover para/ })
      .all()) {
      if (screen.kind === 'desktop') await button.scrollIntoViewIfNeeded();
      const box = (await button.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(48);
      expect(box.height).toBeGreaterThanOrEqual(48);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(screen.height + 1);
      expect(
        await button.evaluate((b) => {
          const r = b.getBoundingClientRect();
          return (
            document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) ===
            b
          );
        }),
      ).toBe(true);
    }
    await testInfo.attach('snake-' + screen.name + '-metrics', {
      body: JSON.stringify(metrics),
      contentType: 'application/json',
    });
    await page.screenshot({
      path: testInfo.outputPath('snake-' + screen.name + '.png'),
      scale: 'css',
    });
    await page
      .getByRole('button', { name: 'Sair', exact: true })
      .first()
      .click();
    await expect
      .poll(() => page.evaluate(() => document.body.dataset.snakeGameActive))
      .toBe('false');
  }
});

test('Fuga mobile: quatro orientações, hold, slide, multitouch, cancel, fullscreen e saída', async ({
  page,
}, testInfo) => {
  await openSnakeGame(page);
  const cdp = await page.context().newCDPSession(page);
  for (const size of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 412, height: 915 },
    { width: 915, height: 412 },
  ]) {
    await page.setViewportSize(size);
    await page.goto('/journey/phases/o-jardim-e-a-escolha');
    await page.getByRole('button', { name: 'Começar', exact: true }).click();
    if (
      (await page
        .locator('[data-serpent-mode]')
        .getAttribute('data-controls')) !== 'true'
    )
      await page
        .getByRole('button', { name: 'Direcional', exact: true })
        .click();
    const directions = ['cima', 'baixo', 'esquerda', 'direita'] as const;
    const scrollBeforeTouch = await page.evaluate(() => window.scrollY);
    const centers = await Promise.all(
      directions.map(async (direction, id) => {
        const r = await page
          .getByRole('button', { name: `Mover para ${direction}` })
          .boundingBox();
        return { x: r!.x + r!.width / 2, y: r!.y + r!.height / 2, id };
      }),
    );
    for (let i = 0; i < directions.length; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [centers[i]],
      });
      await expect(
        page.getByRole('button', { name: `Mover para ${directions[i]}` }),
      ).toHaveAttribute('aria-pressed', 'true');
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await expect(
        page.getByRole('button', { name: `Mover para ${directions[i]}` }),
      ).toHaveAttribute('aria-pressed', 'false');
    }
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [centers[0]],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ ...centers[3], id: 0 }],
    });
    await expect(
      page.getByRole('button', { name: 'Mover para cima' }),
    ).toHaveAttribute('aria-pressed', 'false');
    await expect(
      page.getByRole('button', { name: 'Mover para direita' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { ...centers[3], id: 0 },
        { ...centers[0], id: 4 },
      ],
    });
    await expect(
      page.getByRole('button', { name: 'Mover para cima' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ ...centers[3], id: 0 }],
    });
    await expect(
      page.getByRole('button', { name: 'Mover para direita' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchCancel',
      touchPoints: [],
    });
    await expect(
      page.getByRole('button', { name: 'Mover para direita' }),
    ).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBeforeTouch);
    await page.getByRole('button', { name: 'Entrar em tela cheia' }).click();
    await expect(
      page.getByRole('button', { name: 'Sair da tela cheia' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.fullscreenElement?.querySelector('canvas') !== null,
      ),
    ).toBe(true);
    expect(
      await page
        .getByRole('button', { name: 'Mover para direita' })
        .evaluate((button) => {
          const r = button.getBoundingClientRect();
          return (
            r.bottom <= window.innerHeight &&
            r.right <= window.innerWidth &&
            document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) ===
              button
          );
        }),
    ).toBe(true);
    await page.getByRole('button', { name: 'Sair da tela cheia' }).click();
    await page
      .getByRole('button', { name: 'Sair', exact: true })
      .first()
      .click();
    await expect(page.getByRole('banner')).toBeVisible();
    expect(
      await page.evaluate(() => getComputedStyle(document.body).touchAction),
    ).not.toBe('none');
    await page.screenshot({
      path: testInfo.outputPath(`exit-${size.width}x${size.height}.png`),
    });
  }
});
