import { expect, test, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const sizes = [
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
];
const dir = 'build/task-0066-serpent-mobile-first';
const baseline = process.env.SERPENT_QA_STAGE === 'before';
test.beforeAll(async () => {
  await mkdir(dir, { recursive: true });
});
async function open(page: Page) {
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
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Swipe QA');
  await page
    .getByRole('button', { name: 'Criar Viajante', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: /Entrar na jornada/ }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.locator('main [data-avatar-base]').evaluateAll((images) =>
        images.every((i) => {
          const image = i as HTMLImageElement;
          return image.complete && image.naturalWidth > 0;
        }),
      ),
    )
    .toBe(true);
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1',
      save = JSON.parse(localStorage.getItem(key)!);
    const p = save.travelers[0].progress;
    p.gardenStep = 'snake';
    p.gardenFragments = 3;
    p.bibleReading.genesis2Confirmed = true;
    p.bibleReading.genesis3Confirmed = true;
    p.bibleReading.comprehensionCompleted = true;
    p.devotionalCompleted = true;
    p.snakeTutorialCompleted = true;
    localStorage.setItem(key, JSON.stringify(save));
  });
}
async function start(page: Page) {
  if (!page.url().endsWith('/journey/phases/o-jardim-e-a-escolha')) {
    await page.waitForLoadState('networkidle');
    await page.goto('/journey/phases/o-jardim-e-a-escolha');
  }
  await page.getByRole('button', { name: 'Começar', exact: true }).click();
  if (!baseline)
    await expect(page.locator('[data-serpent-mode]')).toHaveAttribute(
      'data-status',
      'playing',
    );
  await expect(page.getByRole('application')).toBeVisible();
}
async function position(page: Page) {
  return page.getByRole('application').evaluate((e) => ({
    x: Number((e as HTMLElement).dataset.playerX),
    y: Number((e as HTMLElement).dataset.playerY),
  }));
}
async function gesture(page: Page, dx: number, dy: number, cancel = false) {
  const canvas = page.getByRole('application');
  const box = (await canvas.boundingBox())!;
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  if (test.info().project.name === 'android') {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ ...point, id: 1 }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: point.x + dx, y: point.y + dy, id: 1 }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: cancel ? 'touchCancel' : 'touchEnd',
      touchPoints: [],
    });
    await cdp.detach();
  } else {
    // WebKit lacks CDP touch-drag: its real mouse produces captured PointerEvents.
    await canvas.evaluate((element) =>
      element.addEventListener(
        'pointerdown',
        (event) =>
          element.setAttribute(
            'data-qa-pointer-id',
            String((event as PointerEvent).pointerId),
          ),
        { once: true },
      ),
    );
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + dx, point.y + dy, { steps: 3 });
    if (cancel)
      await canvas.dispatchEvent('pointercancel', {
        pointerId: Number(await canvas.getAttribute('data-qa-pointer-id')),
        pointerType: 'mouse',
      });
    await page.mouse.up();
  }
}

test('fullscreen recalculates real surface and camera across orientation; fallback remains playable', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await start(page);
  await page
    .getByRole('button', { name: 'Entrar em tela cheia', exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Boolean(document.fullscreenElement) ||
          /indisponível|não abriu tela cheia/.test(
            document.querySelector('[class*="arcadeMessage"]')?.textContent ??
              '',
          ),
      ),
    )
    .toBe(true);
  const supported = await page.evaluate(() =>
    Boolean(document.fullscreenElement),
  );
  const samples = [];
  const fullscreenCdp =
    supported && info.project.name === 'android'
      ? await page.context().newCDPSession(page)
      : null;
  if (supported) {
    for (const size of [
      { width: 390, height: 844 },
      { width: 915, height: 412 },
    ]) {
      if (info.project.name === 'android') {
        const cdp = fullscreenCdp!;
        await cdp.send('Emulation.setDeviceMetricsOverride', {
          ...size,
          deviceScaleFactor: 3,
          mobile: true,
          screenWidth: size.width,
          screenHeight: size.height,
          screenOrientation: {
            type:
              size.width > size.height ? 'landscapePrimary' : 'portraitPrimary',
            angle: size.width > size.height ? 90 : 0,
          },
        });
      } else await page.setViewportSize(size);
      const canvas = page.getByRole('application');
      await expect
        .poll(() =>
          page.evaluate(() => ({ width: innerWidth, height: innerHeight })),
        )
        .toEqual(size);
      await expect
        .poll(() =>
          canvas.evaluate((element) => {
            const c = element as HTMLCanvasElement;
            return (
              Math.abs(
                c.width -
                  Math.round(
                    c.clientWidth *
                      Number(
                        c.dataset.renderDpr ?? Math.min(2, devicePixelRatio),
                      ),
                  ),
              ) <= 1
            );
          }),
        )
        .toBe(true);
      const metric = await canvas.evaluate((element) => {
        const c = element as HTMLCanvasElement,
          r = c.getBoundingClientRect();
        const scale = c.dataset.cellPixels
          ? Number(c.dataset.cellPixels) / 36
          : Math.min(c.clientWidth / 864, c.clientHeight / 504);
        return {
          viewport: { width: innerWidth, height: innerHeight },
          canvas: r.toJSON(),
          cellPixels: scale * 36,
          areaRatio: (r.width * r.height) / (innerWidth * innerHeight),
          worldWidth: Number(c.dataset.worldWidth ?? 864),
          worldHeight: Number(c.dataset.worldHeight ?? 504),
          cameraX: Number(c.dataset.cameraX ?? 0),
          cameraY: Number(c.dataset.cameraY ?? 0),
        };
      });
      if (!baseline) {
        expect(metric.cellPixels).toBeGreaterThanOrEqual(40);
        expect(metric.areaRatio).toBeGreaterThan(0.5);
        expect(metric.cameraX + metric.worldWidth).toBeLessThanOrEqual(864.1);
        expect(metric.cameraY + metric.worldHeight).toBeLessThanOrEqual(504.1);
      }
      samples.push(metric);
      const screenshotPath = `${dir}/${baseline ? 'before' : 'after'}-fullscreen-${info.project.name}-${size.width}x${size.height}.png`;
      if (info.project.name === 'android') {
        const cdp = fullscreenCdp!;
        const { data } = await cdp.send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: true,
          clip: {
            x: 0,
            y: 0,
            width: size.width,
            height: size.height,
            scale: 1,
          },
        });
        await writeFile(screenshotPath, Buffer.from(data, 'base64'));
      } else await page.screenshot({ path: screenshotPath, scale: 'css' });
    }
    await page
      .getByRole('button', { name: 'Sair da tela cheia', exact: true })
      .click();
  } else
    await expect(
      page.getByText(/indisponível|não abriu tela cheia/),
    ).toBeVisible();
  await fullscreenCdp?.detach();
  await page.getByRole('button', { name: 'Sair', exact: true }).first().click();
  await writeFile(
    `${dir}/${baseline ? 'before' : 'after'}-fullscreen-${info.project.name}.json`,
    JSON.stringify({ supported, samples, physicalDevice: false }, null, 2),
  );
});

test('performance observations during camera follow and reduced motion', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await start(page);
  if (baseline) await page.keyboard.down('ArrowRight');
  else await gesture(page, 70, 0);
  await page.waitForTimeout(2000); // Warm up asset caches and adaptive backing resolution.
  const metric = await page.evaluate(async () => {
    const intervals: number[] = [];
    let cls: number | null = null;
    let observer: PerformanceObserver | null = null;
    if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
      cls = 0;
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            hadRecentInput: boolean;
            value: number;
          };
          if (!shift.hadRecentInput) cls = (cls ?? 0) + shift.value;
        }
      });
      observer.observe({ type: 'layout-shift' });
    }
    const started = performance.now();
    let last = started;
    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        intervals.push(now - last);
        last = now;
        if (now - started < 3000) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    observer?.disconnect();
    intervals.sort((a, b) => a - b);
    const canvas = document.querySelector(
      'canvas[role="application"]',
    ) as HTMLCanvasElement;
    const memory = (
      performance as Performance & {
        memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
      }
    ).memory;
    return {
      durationMs: last - started,
      frames: intervals.length,
      p50Ms: intervals[Math.floor(intervals.length * 0.5)],
      p95Ms: intervals[Math.floor(intervals.length * 0.95)],
      framesOver33ms: intervals.filter((n) => n > 33.4).length,
      cls,
      heapUsedBytes: memory?.usedJSHeapSize ?? null,
      canvasBackingBytes: canvas.width * canvas.height * 4,
      renderDpr: canvas.width / canvas.clientWidth,
      warmupMs: 2000,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      host: 'Windows browser emulation, no CPU/network throttle; not POCO X7 measurement',
    };
  });
  expect(metric.frames).toBeGreaterThan(0);
  expect(metric.reducedMotion).toBe(true);
  await writeFile(
    `${dir}/${baseline ? 'before-' : ''}performance-${info.project.name}.json`,
    JSON.stringify(metric, null, 2),
  );
  await page.getByRole('button', { name: 'Sair', exact: true }).first().click();
});

test('eleven viewports: useful surface, readable cells, bounded camera and optional controls', async ({
  page,
}, info) => {
  await mkdir(dir, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const samples = [];
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await start(page);
    const canvas = page.getByRole('application');
    if (width > 1024) await canvas.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        canvas.evaluate((element) => {
          const c = element as HTMLCanvasElement,
            dpr = Number(
              c.dataset.renderDpr ?? Math.min(2, Math.max(1, devicePixelRatio)),
            );
          return (
            Math.abs(c.width - Math.round(c.clientWidth * dpr)) <= 1 &&
            Math.abs(c.height - Math.round(c.clientHeight * dpr)) <= 1
          );
        }),
      )
      .toBe(true);
    if (!baseline) {
      await expect
        .poll(() =>
          canvas.evaluate((element) => {
            const c = element as HTMLCanvasElement,
              w = c.clientWidth,
              h = c.clientHeight;
            const desired = Math.max(40, Math.min(48, Math.min(w, h) / 8));
            const expected =
              innerWidth <= 1024
                ? Math.max(desired, (36 * w) / 864, (36 * h) / 504)
                : 36 * Math.min(w / 864, h / 504);
            return Math.abs(Number(c.dataset.cellPixels) - expected) < 0.02;
          }),
        )
        .toBe(true);
    }
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            performance
              .getEntriesByType('resource')
              .filter((v) => v.name.includes('/minigame/')).length,
        ),
      )
      .toBeGreaterThan(10);
    const metric = await canvas.evaluate((element) => {
      const c = element as HTMLCanvasElement,
        r = c.getBoundingClientRect(),
        s = c.dataset;
      const hud = element
        .closest('[class*="arcadeGame"]')!
        .querySelector('[class*="arcadeHud"]')!
        .getBoundingClientRect();
      const scale = s.cellPixels
        ? Number(s.cellPixels) / 36
        : Math.min(c.clientWidth / 864, c.clientHeight / 504);
      return {
        width: innerWidth,
        height: innerHeight,
        canvas: r.toJSON(),
        cellPixels: 36 * scale,
        playerPixels: s.playerPixels
          ? Number(s.playerPixels)
          : 26 * 1.2 * scale,
        visibleColumns: s.worldWidth ? Number(s.worldWidth) / 36 : 24,
        visibleRows: s.worldHeight ? Number(s.worldHeight) / 36 : 14,
        cameraX: Number(s.cameraX ?? 0),
        cameraY: Number(s.cameraY ?? 0),
        worldWidth: Number(s.worldWidth ?? 864),
        worldHeight: Number(s.worldHeight ?? 504),
        follow: s.cameraFollow ?? 'false',
        occupied: s.cellPixels
          ? Math.min(1, (864 * scale) / c.clientWidth) *
            Math.min(1, (504 * scale) / c.clientHeight)
          : (864 * 504 * scale * scale) / (c.clientWidth * c.clientHeight),
        hudGap: r.y - hud.bottom,
        areaRatio: (r.width * r.height) / (innerWidth * innerHeight),
        overflow: document.documentElement.scrollWidth - innerWidth,
        dpr: c.width / c.clientWidth,
      };
    });
    expect(metric.overflow).toBeLessThanOrEqual(1);
    expect(metric.dpr).toBeLessThanOrEqual(2.01);
    if (!baseline && width <= 1024) {
      expect(metric.cellPixels).toBeGreaterThanOrEqual(40);
      expect(metric.playerPixels).toBeGreaterThanOrEqual(32);
      expect(metric.follow).toBe('true');
      expect(metric.occupied).toBeCloseTo(1);
      expect(metric.areaRatio).toBeGreaterThan(0.5);
      expect(metric.canvas.y).toBeGreaterThanOrEqual(0);
      expect(metric.canvas.bottom).toBeLessThanOrEqual(height + 1);
      expect(metric.cameraX).toBeGreaterThanOrEqual(0);
      expect(metric.cameraX + metric.worldWidth).toBeLessThanOrEqual(864.01);
      expect(metric.cameraY + metric.worldHeight).toBeLessThanOrEqual(504.01);
    }
    if (!baseline && width > 1024) {
      expect(metric.follow).toBe('false');
      expect(metric.visibleColumns).toBe(24);
      expect(metric.visibleRows).toBe(14);
    }
    samples.push(metric);
    await page.screenshot({
      path: `${dir}/${baseline ? 'before' : 'after'}-${info.project.name}-${width}x${height}.png`,
      scale: 'css',
    });
    if (!baseline && width <= 1024) {
      if (
        (await page
          .locator('[data-serpent-mode]')
          .getAttribute('data-controls')) !== 'true'
      )
        await page
          .getByRole('button', { name: 'Direcional', exact: true })
          .click();
      await expect(
        page.getByRole('button', { name: /Mover para/ }),
      ).toHaveCount(4);
      for (const button of await page
        .getByRole('button', { name: /Mover para/ })
        .all()) {
        await expect(button).toBeVisible();
        const b = (await button.boundingBox())!;
        expect(b.width).toBeGreaterThanOrEqual(48);
        expect(b.height).toBeGreaterThanOrEqual(48);
        expect(b.y + b.height).toBeLessThanOrEqual(height + 1);
      }
    }
    await page
      .getByRole('button', { name: 'Sair', exact: true })
      .first()
      .click();
    await expect
      .poll(() => page.evaluate(() => document.body.dataset.snakeGameActive))
      .toBe('false');
  }
  await writeFile(
    `${dir}/${baseline ? 'before' : 'after'}-${info.project.name}-metrics.json`,
    JSON.stringify({ samples, errors }, null, 2),
  );
  expect(errors).toEqual([]);
});

test('swipe: four directions, short/diagonal, cancel, pause, keyboard, restart, fullscreen and camera follow', async ({
  page,
}, info) => {
  test.skip(baseline, 'Baseline has no swipe/camera');
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await start(page);
  await expect
    .poll(async () =>
      Number(await page.getByRole('application').getAttribute('data-player-x')),
    )
    .toBeGreaterThan(0);
  const before = await position(page);
  await gesture(page, 8, 4);
  await page.waitForTimeout(180);
  expect(await position(page)).toEqual(before);
  await gesture(page, 60, 32);
  await expect
    .poll(async () => (await position(page)).x)
    .toBeGreaterThan(before.x + 20);
  const began = performance.now();
  await page.getByRole('application').evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const initialX = Number(canvas.dataset.playerX);
    let point = { x: 0, y: 0 },
      began = 0;
    canvas.addEventListener(
      'pointerdown',
      (e) => {
        point = {
          x: (e as PointerEvent).clientX,
          y: (e as PointerEvent).clientY,
        };
      },
      { once: true },
    );
    const move = (e: Event) => {
      const p = e as PointerEvent;
      if (
        !began &&
        Math.max(
          Math.abs(p.clientX - point.x),
          Math.abs(p.clientY - point.y),
        ) >= 24
      )
        began = performance.now();
    };
    canvas.addEventListener('pointermove', move);
    const observer = new MutationObserver(() => {
      if (began && Number(canvas.dataset.playerX) < initialX) {
        canvas.dataset.qaResponseMs = String(performance.now() - began);
        observer.disconnect();
        canvas.removeEventListener('pointermove', move);
      }
    });
    observer.observe(canvas, {
      attributes: true,
      attributeFilter: ['data-player-x'],
    });
    setTimeout(() => {
      observer.disconnect();
      canvas.removeEventListener('pointermove', move);
    }, 5000);
  });
  await gesture(page, -70, 0);
  await expect
    .poll(async () => (await position(page)).x)
    .toBeLessThan(before.x + 20);
  const latency = performance.now() - began;
  const browserResponseMs = Number(
    await page.getByRole('application').getAttribute('data-qa-response-ms'),
  );
  expect(browserResponseMs).toBeGreaterThan(0);
  await gesture(page, 0, -70);
  await expect
    .poll(async () => (await position(page)).y)
    .toBeLessThan(before.y - 15);
  await gesture(page, 0, 70);
  await expect
    .poll(async () => (await position(page)).y)
    .toBeGreaterThan(before.y - 10);
  await gesture(page, 0, -70, true);
  await page.waitForTimeout(120); // Diagnostic position publishes at 10 Hz.
  const cancel = await position(page);
  await page.waitForTimeout(200);
  expect(await position(page)).toEqual(cancel);
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Partida pausada' }),
  ).toBeVisible();
  await page.waitForTimeout(120);
  const paused = await position(page);
  await page.waitForTimeout(200);
  expect(await position(page)).toEqual(paused);
  await page.getByRole('button', { name: 'Retomar', exact: true }).click();
  await page.getByRole('button', { name: 'Direcional', exact: true }).click();
  const right = page.getByRole('button', {
    name: 'Mover para direita',
    exact: true,
  });
  await right.focus();
  await page.keyboard.down('Enter');
  await expect
    .poll(async () => (await position(page)).x)
    .toBeGreaterThan(paused.x + 20);
  await page.keyboard.up('Enter');
  await gesture(page, 70, 0);
  const cameraStart = Number(
    await page.getByRole('application').getAttribute('data-camera-x'),
  );
  await expect
    .poll(
      async () =>
        Number(
          await page.getByRole('application').getAttribute('data-camera-x'),
        ),
      { timeout: 8000 },
    )
    .toBeGreaterThan(cameraStart + 10);
  await page.screenshot({
    path: `${dir}/camera-follow-${info.project.name}.png`,
    scale: 'css',
  });
  await page
    .getByRole('button', { name: 'Entrar em tela cheia', exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Boolean(document.fullscreenElement) ||
          /indisponível|não abriu tela cheia/.test(
            document.querySelector('[class*="arcadeMessage"]')?.textContent ??
              '',
          ),
      ),
    )
    .toBe(true);
  const fullscreen = await page.evaluate(() =>
    Boolean(document.fullscreenElement),
  );
  if (fullscreen) {
    await expect(
      page.getByRole('button', { name: 'Sair da tela cheia' }),
    ).toBeVisible();
    await page.screenshot({
      path: `${dir}/fullscreen-${info.project.name}.png`,
      scale: 'css',
    });
    await page.getByRole('button', { name: 'Sair da tela cheia' }).click();
  } else {
    await expect(
      page
        .getByText(/tela cheia|modo de jogo/i)
        .filter({ hasText: /indisponível|não abriu/ }),
    ).toBeVisible();
  }
  await page.getByRole('button', { name: 'Sair', exact: true }).first().click();
  await page.getByRole('button', { name: 'Começar' }).click();
  await expect.poll(async () => (await position(page)).x).toBeCloseTo(90, 0);
  await writeFile(
    `${dir}/input-${info.project.name}.json`,
    JSON.stringify(
      {
        pass: true,
        automationMovementObservationMs: latency,
        pointerToDiagnosticMovementMs: browserResponseMs,
        responseLimitation:
          'Browser event to 10 Hz rendered position diagnostic; excludes physical touch/display latency.',
        fullscreen,
        physicalDevice: false,
        swipePrimitive:
          info.project.name === 'android'
            ? 'CDP native touch'
            : 'mouse-generated captured PointerEvents; synthetic cancel',
      },
      null,
      2,
    ),
  );
});

test('idle pursuit preserves three-life defeat; retry resets and never unlocks victory', async ({
  page,
}) => {
  test.skip(baseline, 'Baseline capture only');
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await start(page);
  await expect(
    page.getByText('Você foi alcançado', { exact: true }),
  ).toBeVisible({ timeout: 90000 });
  await expect(page.locator('[data-serpent-mode]')).toHaveAttribute(
    'data-status',
    'lost',
  );
  await expect(
    page
      .locator('[class*="arcadeHud"] > span')
      .filter({ hasText: 'VIDAS' })
      .locator('strong'),
  ).toHaveText('0/3');
  await expect(
    page.getByRole('button', { name: /Continuar para o Quiz/ }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Tentar novamente', exact: true })
    .click();
  await expect(page.locator('[data-serpent-mode]')).toHaveAttribute(
    'data-status',
    'playing',
  );
  await expect(
    page
      .locator('[class*="arcadeHud"] > span')
      .filter({ hasText: 'VIDAS' })
      .locator('strong'),
  ).toHaveText('3/3');
  await page.getByRole('button', { name: 'Sair', exact: true }).first().click();
});
