import { expect, test, type Page } from '@playwright/test';

const screens = [
  { name: 'phone-360x800', width: 360, height: 800, kind: 'phone' },
  { name: 'phone-390x844', width: 390, height: 844, kind: 'phone' },
  { name: 'phone-412x915', width: 412, height: 915, kind: 'phone' },
  { name: 'landscape-844x390', width: 844, height: 390, kind: 'landscape' },
  { name: 'tablet-768x1024', width: 768, height: 1024, kind: 'tablet' },
  { name: 'desktop-1440x900', width: 1440, height: 900, kind: 'desktop' },
] as const;

async function openSnakeGame(page: Page) {
  await page.addInitScript(() => localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'));
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

test('Fuga da Serpente usa viewport real, DPR limitado e controles legíveis', async ({ page }, testInfo) => {
  await page.setViewportSize(screens[0]);
  await openSnakeGame(page);

  for (const screen of screens) {
    await page.setViewportSize({ width: screen.width, height: screen.height });
    await page.goto('/journey/phases/o-jardim-e-a-escolha');
    await page.getByRole('button', { name: 'Começar perseguição' }).click();
    const canvas = page.getByRole('application', { name: 'Fuga da Serpente, jogo de perseguição' });
    await expect(canvas).toBeVisible();
    if (screen.kind === 'phone' || screen.kind === 'landscape') {
      await expect.poll(() => page.evaluate(() => document.body.dataset.snakeGameActive)).toBe('true');
    }
    await expect.poll(() => canvas.evaluate((element) => {
      const surface = element as HTMLCanvasElement;
      return surface.width / surface.clientWidth;
    })).toBeGreaterThanOrEqual(0.99);

    const metrics = await canvas.evaluate((element) => {
      const surface = element as HTMLCanvasElement;
      const stage = surface.parentElement!;
      const game = stage.parentElement!;
      const hud = game.querySelector('[class*="arcadeHud"]') as HTMLElement;
      const message = game.querySelector('[class*="arcadeMessage"]') as HTMLElement;
      const controls = Array.from(game.querySelectorAll<HTMLButtonElement>('button[aria-label^="Mover para"]'));
      const rect = surface.getBoundingClientRect();
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
        smallestControl: Math.min(...controls.map((control) => Math.min(control.getBoundingClientRect().width, control.getBoundingClientRect().height))),
        bodyMode: document.body.dataset.snakeGameActive,
        bodyOverflow: getComputedStyle(document.body).overflow,
        gameWidth: game.getBoundingClientRect().width,
        gameHeight: game.getBoundingClientRect().height,
        controls: controls.map((control) => {
          const controlRect = control.getBoundingClientRect();
          return { top: controlRect.top, right: controlRect.right, bottom: controlRect.bottom, left: controlRect.left };
        }),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        criticalMessagesFit,
        messageWhiteSpace: getComputedStyle(message).whiteSpace,
      };
    });

    expect(metrics.backingScaleX).toBeGreaterThanOrEqual(1);
    expect(metrics.backingScaleX).toBeLessThanOrEqual(2.01);
    expect(metrics.backingScaleY).toBeGreaterThanOrEqual(1);
    expect(metrics.backingScaleY).toBeLessThanOrEqual(2.01);
    expect(metrics.smallestControl).toBeGreaterThanOrEqual(48);
    for (const control of metrics.controls) {
      expect(control.top).toBeGreaterThanOrEqual(0);
      expect(control.left).toBeGreaterThanOrEqual(0);
      expect(control.right).toBeLessThanOrEqual(metrics.viewportWidth);
      expect(control.bottom).toBeLessThanOrEqual(metrics.viewportHeight);
    }
    if (screen.kind === 'phone' || screen.kind === 'landscape') {
      expect(metrics.criticalMessagesFit).toBe(true);
      expect(metrics.messageWhiteSpace).toBe('normal');
    }

    if (screen.kind === 'phone') {
      expect(metrics.bodyMode).toBe('true');
      expect(metrics.bodyOverflow).toBe('hidden');
      expect(metrics.gameWidth).toBeGreaterThanOrEqual(screen.width - 1);
      expect(metrics.gameHeight).toBeGreaterThanOrEqual(screen.height - 1);
      expect(metrics.width).toBeGreaterThanOrEqual(screen.width - 30);
      expect(metrics.stageHeight).toBeGreaterThanOrEqual(screen.height * 0.62);
      expect(metrics.stageHeight).toBeLessThanOrEqual(screen.height * 0.8);
      expect(metrics.hudHeight).toBeLessThanOrEqual(90);
      await expect(page.locator('header')).toBeHidden();
    } else if (screen.kind === 'landscape') {
      expect(metrics.bodyMode).toBe('true');
      expect(metrics.bodyOverflow).toBe('hidden');
      expect(metrics.gameWidth).toBeGreaterThanOrEqual(screen.width - 1);
      expect(metrics.gameHeight).toBeGreaterThanOrEqual(screen.height - 1);
      expect(metrics.width).toBeGreaterThanOrEqual(500);
      expect(metrics.stageHeight).toBeGreaterThanOrEqual(screen.height * 0.7);
      expect(metrics.stageHeight).toBeLessThanOrEqual(screen.height);
      expect(metrics.documentWidth).toBeLessThanOrEqual(screen.width);
    } else if (screen.kind === 'tablet') {
      expect(metrics.width).toBeGreaterThanOrEqual(700);
      expect(metrics.stageHeight).toBeGreaterThanOrEqual(560);
    } else {
      expect(metrics.width / metrics.height).toBeCloseTo(12 / 7, 1);
    }

    await page.screenshot({ path: testInfo.outputPath(`snake-${screen.name}.png`), fullPage: true });
    if (screen.name === 'phone-360x800') {
      await page.getByRole('button', { name: 'Sair', exact: true }).first().click();
      await expect.poll(() => page.evaluate(() => document.body.dataset.snakeGameActive)).toBe('false');
      await expect(page.locator('header')).toBeVisible();
    }
  }
});
