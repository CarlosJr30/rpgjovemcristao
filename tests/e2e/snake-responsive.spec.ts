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

test('Fuga da Serpente usa viewport real, DPR limitado e controles legíveis', async ({
  page,
}, testInfo) => {
  await page.setViewportSize(screens[0]);
  await openSnakeGame(page);

  for (const screen of screens) {
    await page.setViewportSize({ width: screen.width, height: screen.height });
    await page.goto('/journey/phases/o-jardim-e-a-escolha');
    await page.getByRole('button', { name: 'Começar perseguição' }).click();
    const canvas = page.getByRole('application', {
      name: 'Fuga da Serpente, jogo de perseguição',
    });
    await expect(canvas).toBeVisible();
    if (screen.kind === 'desktop') {
      await canvas.evaluate((element) =>
        element.parentElement?.parentElement?.scrollIntoView({
          block: 'center',
        }),
      );
    }
    if (screen.kind === 'phone' || screen.kind === 'landscape') {
      await expect
        .poll(() => page.evaluate(() => document.body.dataset.snakeGameActive))
        .toBe('true');
    }
    await expect
      .poll(() =>
        canvas.evaluate((element) => {
          const surface = element as HTMLCanvasElement;
          return surface.width / surface.clientWidth;
        }),
      )
      .toBeGreaterThanOrEqual(0.99);

    const metrics = await canvas.evaluate((element) => {
      const surface = element as HTMLCanvasElement;
      const stage = surface.parentElement!;
      const game = stage.parentElement!;
      const hud = game.querySelector('[class*="arcadeHud"]') as HTMLElement;
      const message = game.querySelector(
        '[class*="arcadeMessage"]',
      ) as HTMLElement;
      const controls = Array.from(
        game.querySelectorAll<HTMLButtonElement>(
          'button[aria-label^="Mover para"]',
        ),
      );
      const controlPad = game.querySelector(
        '[aria-label="Controles touch"]',
      ) as HTMLElement;
      const rect = surface.getBoundingClientRect();
      const hudRect = hud.getBoundingClientRect();
      const messageRect = message.getBoundingClientRect();
      const controlRect = controlPad.getBoundingClientRect();
      const gameRect = game.getBoundingClientRect();
      const mapScale = Math.min(rect.width / 864, rect.height / 504);
      const mapWidth = 864 * mapScale;
      const mapHeight = 504 * mapScale;
      const mapRect = {
        left: rect.left + (rect.width - mapWidth) / 2,
        top: rect.top + (rect.height - mapHeight) / 2,
        right: rect.left + (rect.width + mapWidth) / 2,
        bottom: rect.top + (rect.height + mapHeight) / 2,
        width: mapWidth,
        height: mapHeight,
      };
      const criticalMessages = [
        'Você perdeu uma vida · reapareceu em segurança com proteção temporária.',
        'ESCUDO QUEBRADO · você continua protegido por alguns instantes.',
        'PORTAL ATIVADO · Escape!',
        'Fragmento encontrado · 2 / 3',
      ];
      const messageProbe = message.cloneNode() as HTMLElement;
      messageProbe.style.position = 'fixed';
      messageProbe.style.visibility = 'hidden';
      messageProbe.style.width = `${String(message.getBoundingClientRect().width)}px`;
      game.append(messageProbe);
      const criticalMessagesFit = criticalMessages.every((text) => {
        messageProbe.textContent = text;
        return messageProbe.scrollHeight <= messageProbe.clientHeight + 1;
      });
      messageProbe.remove();
      return {
        width: rect.width,
        height: rect.height,
        stageHeight: stage.getBoundingClientRect().height,
        hudHeight: hud.getBoundingClientRect().height,
        backingScaleX: surface.width / surface.clientWidth,
        backingScaleY: surface.height / surface.clientHeight,
        smallestControl: Math.min(
          ...controls.map((control) =>
            Math.min(
              control.getBoundingClientRect().width,
              control.getBoundingClientRect().height,
            ),
          ),
        ),
        bodyMode: document.body.dataset.snakeGameActive,
        bodyOverflow: getComputedStyle(document.body).overflow,
        gameWidth: game.getBoundingClientRect().width,
        gameHeight: game.getBoundingClientRect().height,
        gameTop: gameRect.top,
        gameRight: gameRect.right,
        gameBottom: gameRect.bottom,
        gameLeft: gameRect.left,
        controls: controls.map((control) => {
          const controlRect = control.getBoundingClientRect();
          return {
            top: controlRect.top,
            right: controlRect.right,
            bottom: controlRect.bottom,
            left: controlRect.left,
          };
        }),
        hudBottom: hudRect.bottom,
        messageBottom: messageRect.bottom,
        controlPad: {
          top: controlRect.top,
          right: controlRect.right,
          bottom: controlRect.bottom,
          left: controlRect.left,
        },
        mapRect,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        criticalMessagesFit,
        messageWhiteSpace: getComputedStyle(message).whiteSpace,
        controlsReceiveTouch: controls.every((control) => {
          const r = control.getBoundingClientRect();
          return (
            document.elementFromPoint(
              r.left + r.width / 2,
              r.top + r.height / 2,
            ) === control
          );
        }),
        controlsTouchAction: controls.every(
          (control) => getComputedStyle(control).touchAction === 'none',
        ),
      };
    });

    expect(metrics.backingScaleX).toBeGreaterThanOrEqual(1);
    expect(metrics.backingScaleX).toBeLessThanOrEqual(2.01);
    expect(metrics.backingScaleY).toBeGreaterThanOrEqual(1);
    expect(metrics.backingScaleY).toBeLessThanOrEqual(2.01);
    expect(metrics.smallestControl).toBeGreaterThanOrEqual(48);
    expect(metrics.controlsReceiveTouch).toBe(true);
    expect(metrics.controlsTouchAction).toBe(true);
    for (const control of metrics.controls) {
      expect(control.top).toBeGreaterThanOrEqual(0);
      expect(control.left).toBeGreaterThanOrEqual(0);
      expect(control.right).toBeLessThanOrEqual(metrics.viewportWidth);
      expect(control.bottom).toBeLessThanOrEqual(metrics.viewportHeight);
    }
    expect(metrics.mapRect.left).toBeGreaterThanOrEqual(0);
    expect(metrics.mapRect.top).toBeGreaterThanOrEqual(
      metrics.messageBottom - 1,
    );
    expect(metrics.mapRect.right).toBeLessThanOrEqual(metrics.viewportWidth);
    expect(metrics.mapRect.bottom).toBeLessThanOrEqual(metrics.viewportHeight);
    expect(metrics.mapRect.width / metrics.mapRect.height).toBeCloseTo(
      12 / 7,
      5,
    );
    if (screen.kind === 'landscape') {
      expect(metrics.controlPad.right).toBeLessThanOrEqual(
        metrics.mapRect.left + 1,
      );
    } else {
      expect(metrics.mapRect.bottom).toBeLessThanOrEqual(
        metrics.controlPad.top + 1,
      );
    }
    if (screen.kind === 'phone' || screen.kind === 'landscape') {
      expect(metrics.gameTop).toBeGreaterThanOrEqual(0);
      expect(metrics.gameLeft).toBeGreaterThanOrEqual(0);
      expect(metrics.gameRight).toBeLessThanOrEqual(metrics.viewportWidth + 1);
      expect(metrics.gameBottom).toBeLessThanOrEqual(
        metrics.viewportHeight + 1,
      );
      expect(metrics.criticalMessagesFit).toBe(true);
      expect(metrics.messageWhiteSpace).toBe('normal');
    }

    if (screen.kind === 'phone') {
      expect(metrics.bodyMode).toBe('true');
      expect(metrics.bodyOverflow).toBe('hidden');
      expect(metrics.gameWidth).toBeGreaterThanOrEqual(screen.width - 1);
      expect(metrics.gameHeight).toBeGreaterThanOrEqual(screen.height - 1);
      expect(metrics.width).toBeGreaterThanOrEqual(screen.width - 30);
      expect(metrics.stageHeight).toBeGreaterThanOrEqual(190);
      expect(metrics.stageHeight).toBeLessThanOrEqual(240);
      expect(metrics.hudHeight).toBeLessThanOrEqual(90);
      await expect(page.locator('header')).toBeHidden();
    } else if (screen.kind === 'landscape') {
      expect(metrics.bodyMode).toBe('true');
      expect(metrics.bodyOverflow).toBe('hidden');
      expect(metrics.gameWidth).toBeGreaterThanOrEqual(screen.width - 1);
      expect(metrics.gameHeight).toBeGreaterThanOrEqual(screen.height - 1);
      expect(metrics.width).toBeGreaterThanOrEqual(430);
      expect(metrics.stageHeight).toBeGreaterThanOrEqual(screen.height * 0.55);
      expect(metrics.stageHeight).toBeLessThanOrEqual(screen.height);
      expect(metrics.documentWidth).toBeLessThanOrEqual(screen.width);
    } else if (screen.kind === 'tablet') {
      expect(metrics.width).toBeGreaterThanOrEqual(700);
      expect(metrics.stageHeight).toBeGreaterThanOrEqual(400);
    } else {
      expect(metrics.width / metrics.height).toBeCloseTo(12 / 7, 1);
    }

    await testInfo.attach(`snake-${screen.name}-metrics`, {
      body: JSON.stringify({
        canvas: { width: metrics.width, height: metrics.height },
        mapRect: metrics.mapRect,
      }),
      contentType: 'application/json',
    });
    await page.screenshot({
      path: testInfo.outputPath(`snake-${screen.name}.png`),
    });
    if (screen.name === 'phone-360x800') {
      await page
        .getByRole('button', { name: 'Sair', exact: true })
        .first()
        .click();
      await expect
        .poll(() => page.evaluate(() => document.body.dataset.snakeGameActive))
        .toBe('false');
      await expect(page.locator('header')).toBeVisible();
    }
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
    await page.getByRole('button', { name: 'Começar perseguição' }).click();
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
    await expect(page.locator('header')).toBeVisible();
    expect(
      await page.evaluate(() => getComputedStyle(document.body).touchAction),
    ).not.toBe('none');
    await page.screenshot({
      path: testInfo.outputPath(`exit-${size.width}x${size.height}.png`),
    });
  }
});
