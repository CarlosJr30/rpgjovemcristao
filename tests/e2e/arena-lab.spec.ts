import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const dir = path.resolve(
  process.env.ARENA_EVIDENCE_DIR ?? 'build/task-0041-evidence/screenshots',
);
async function open(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem('arena-lab-preservation-sentinel', 'unchanged'),
  );
  await page.goto('/tools/arena-lab/');
  await expect(
    page.getByRole('heading', { name: 'Arena Visual Lab' }),
  ).toBeVisible();
}
async function composition(page: Page) {
  const issues = await page.getByTestId('arena-stage').evaluate((stage) => {
    const rect = stage.getBoundingClientRect(),
      issues: string[] = [];
    for (const fighter of Array.from(
      stage.querySelectorAll<HTMLElement>('[data-side]'),
    )) {
      const hud = fighter.children[0].getBoundingClientRect();
      const actor = fighter.children[1].getBoundingClientRect();
      if (actor.top < hud.bottom - 3)
        issues.push(
          `HUD/fighter overlap: ${fighter.dataset.side} HUD bottom=${hud.bottom - rect.top}, fighter top=${actor.top - rect.top}, hud height=${hud.height}, actor height=${actor.height}`,
        );
      for (const [label, r] of [
        ['HUD', hud],
        ['fighter', actor],
      ] as const)
        if (
          r.left < rect.left - 4 ||
          r.right > rect.right + 4 ||
          r.top < rect.top - 4 ||
          r.bottom > rect.bottom + 4
        )
          issues.push(label + ' outside stage');
    }
    return issues;
  });
  expect(issues).toEqual([]);
  for (const feedback of await page.locator('[data-feedback-side]').all()) {
    const box = await feedback.boundingBox();
    const stage = await page.getByTestId('arena-stage').boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(stage!.y + stage!.height - 1);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const targets = await page
    .locator('[aria-label="Ações da batalha"] button')
    .evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().height));
  expect(targets.every((h) => h >= 48)).toBe(true);
  expect(
    await page
      .locator('[data-fx], [data-layer], [aria-hidden="true"]')
      .evaluateAll((nodes) =>
        nodes
          .filter(
            (n) =>
              n instanceof HTMLElement && n.matches('[data-fx], [data-layer]'),
          )
          .every((n) => getComputedStyle(n).pointerEvents === 'none'),
      ),
  ).toBe(true);
}
test('matriz representativa: 11 combinações, cinco viewports e quatro adversários', async ({
  page,
}) => {
  test.setTimeout(180000);
  await fs.mkdir(dir, { recursive: true });
  await open(page);
  const cases = [
    {
      name: 'davi-basic',
      opponent: '0',
      state: 'attack',
      ability: 'basic',
      side: 'opponent',
    },
    {
      name: 'davi-dodge',
      opponent: '0',
      state: 'dodge',
      ability: 'basic',
      side: 'player',
    },
    {
      name: 'elias-special',
      opponent: '1',
      state: 'special',
      ability: 'path-strike',
      side: 'opponent',
    },
    {
      name: 'mara-defense',
      opponent: '2',
      state: 'defend',
      ability: 'steadfast-guard',
      side: 'opponent',
    },
    {
      name: 'noemi-discernment',
      opponent: '3',
      state: 'special',
      ability: 'discernment',
      side: 'opponent',
    },
    {
      name: 'player-strike',
      opponent: '1',
      state: 'special',
      ability: 'path-strike',
      side: 'player',
    },
    {
      name: 'player-guard',
      opponent: '2',
      state: 'special',
      ability: 'steadfast-guard',
      side: 'player',
    },
    {
      name: 'player-step',
      opponent: '0',
      state: 'special',
      ability: 'pilgrim-step',
      side: 'player',
    },
    {
      name: 'victory',
      opponent: '0',
      state: 'victory',
      ability: 'basic',
      side: 'player',
    },
    {
      name: 'defeat',
      opponent: '1',
      state: 'defeat',
      ability: 'basic',
      side: 'opponent',
    },
    {
      name: 'unlock',
      opponent: '0',
      state: 'unlock',
      ability: 'path-strike',
      side: 'player',
    },
  ];
  for (const [width, height] of [
    [390, 844],
    [412, 915],
    [768, 1024],
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    for (const c of cases) {
      await page
        .getByLabel('Oponente', { exact: true })
        .selectOption(c.opponent);
      await page.getByLabel('Estado', { exact: true }).selectOption(c.state);
      await page
        .getByLabel('Habilidade', { exact: true })
        .selectOption(c.ability);
      await page.getByLabel('Ator', { exact: true }).selectOption(c.side);
      await page
        .getByRole('region', { name: 'Preview Arena', exact: true })
        .evaluate(async (node) => {
          await Promise.all(
            node
              .getAnimations({ subtree: true })
              .map((animation) => animation.finished.catch(() => undefined)),
          );
        });
      await composition(page);
      await page
        .getByRole('region', { name: 'Preview Arena', exact: true })
        .screenshot({ path: path.join(dir, `${width}-${c.name}.png`) });
    }
  }
});

test('pack real: quatro NPCs, estados, variantes responsivas e falha controlada', async ({
  page,
}) => {
  test.setTimeout(240000);
  await fs.mkdir(dir, { recursive: true });
  await open(page);
  const audit = await page.request.get('/__arena_lab/assets');
  const slots = (await audit.json()) as { status: string }[];
  test.skip(
    !slots.every((slot) => slot.status === 'READY'),
    'Gate real de mídia ainda não está READY',
  );
  const preview = page.getByRole('region', {
    name: 'Preview Arena',
    exact: true,
  });
  const names = ['davi', 'elias', 'mara', 'noemi'];
  const abilities = [
    'path-strike',
    'path-strike',
    'steadfast-guard',
    'discernment',
  ];
  for (const [width, height] of [
    [390, 844],
    [412, 915],
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    for (let index = 0; index < names.length; index++) {
      await page
        .getByLabel('Oponente', { exact: true })
        .selectOption(String(index));
      await page.getByLabel('Ator', { exact: true }).selectOption('opponent');
      await page
        .getByLabel('Habilidade', { exact: true })
        .selectOption(abilities[index]);
      const states =
        width === 390 || width === 1920
          ? [
              'idle',
              'attack',
              'defend',
              'dodge',
              'special',
              'hit',
              'victory',
              'defeat',
            ]
          : ['idle'];
      for (const state of states) {
        await page.getByLabel('Estado', { exact: true }).selectOption(state);
        await page
          .getByLabel('Fase congelada')
          .selectOption(state === 'special' ? 'execution' : 'impact');
        await preview.evaluate(async (node) => {
          await Promise.all(
            node
              .getAnimations({ subtree: true })
              .map((animation) => animation.finished.catch(() => undefined)),
          );
        });
        const portrait = preview.locator('[data-portrait-side="opponent"] img');
        await expect(portrait).toHaveAttribute(
          'src',
          `/assets/characters/arena/arena_${names[index]}.png`,
        );
        await expect
          .poll(() =>
            portrait.evaluate(
              (node) => (node as HTMLImageElement).naturalWidth,
            ),
          )
          .toBe(1024);
        await expect(portrait).toHaveCSS('object-fit', 'contain');
        await expect(
          preview.locator('[data-portrait-side="opponent"] > div'),
        ).toHaveCSS('transform', 'matrix(-1, 0, 0, 1, 0, 0)');
        const scene = preview.locator('[data-layer="background"] img');
        await expect
          .poll(() =>
            scene.evaluate((node) => (node as HTMLImageElement).currentSrc),
          )
          .toContain(
            width <= 760
              ? 'arena_training_courtyard_960.webp'
              : 'arena_training_courtyard.webp',
          );
        await expect(scene).toHaveCSS('object-fit', 'cover');
        await expect
          .poll(() =>
            scene.evaluate((node) => (node as HTMLImageElement).naturalWidth),
          )
          .toBe(width <= 760 ? 960 : 1920);
        await expect(
          preview.locator('[data-portrait-side="player"] picture'),
        ).toHaveCount(0);
        await composition(page);
        if (state === 'idle')
          await preview.screenshot({
            path: path.join(dir, `${width}-real-${names[index]}-idle.png`),
          });
      }
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByLabel('Movimento', { exact: true }).selectOption('reduced');
  await page.getByLabel('Estado', { exact: true }).selectOption('special');
  await expect(page.getByTestId('arena-stage')).toHaveCSS('transform', 'none');
  await expect(preview.locator('[data-fx="special-reveal"]').first()).toHaveCSS(
    'animation-name',
    'none',
  );
  await composition(page);
  await page.route('**/assets/characters/arena/*.png', (route) =>
    route.abort(),
  );
  await page.route('**/assets/world/arena/*.webp', (route) => route.abort());
  await page.reload();
  await expect(preview.locator('[data-portrait-side="opponent"] b')).toHaveText(
    'D',
  );
  await expect(
    preview.locator('[data-portrait-side="opponent"] img'),
  ).toHaveCount(0);
  await expect(preview.locator('[data-layer="background"] img')).toHaveCount(0);
  await composition(page);
  await preview.screenshot({
    path: path.join(dir, 'real-assets-controlled-fallback.png'),
  });
  await page.getByRole('button', { name: 'Reproduzir sequência' }).click();
  await expect(
    page.getByRole('button', { name: 'ATACAR', exact: true }),
  ).toBeEnabled();
});
test('isolamento, status, áudio sem playback, teclado, motion e cleanup', async ({
  page,
}) => {
  const external: string[] = [],
    absent: string[] = [],
    errors: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname))
      external.push(url.href);
    if (/assets\/(world|characters)\/arena\//.test(url.pathname))
      absent.push(url.pathname);
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  const audit = await page.request.get('/__arena_lab/assets');
  expect(audit.ok()).toBe(true);
  const statuses = (await audit.json()) as {
    label: string;
    file: string;
    status: string;
  }[];
  const approvedPaths = new Set(
    statuses
      .filter((s) => s.status === 'READY')
      .map((s) => `/assets/${s.file}`),
  );
  const before = await page.evaluate(() => ({ ...localStorage }));
  expect(statuses).toHaveLength(6);
  for (const asset of statuses)
    await expect(
      page
        .getByRole('region', { name: 'Asset status', exact: true })
        .getByText(`${asset.label} · ${asset.status}`, { exact: true }),
    ).toBeVisible();
  await page.getByLabel('Estado', { exact: true }).selectOption('special');
  await page.getByLabel('Movimento', { exact: true }).selectOption('reduced');
  await page.getByRole('button', { name: 'Reproduzir sequência' }).click();
  await expect(page.getByTestId('arena-stage')).toHaveAttribute(
    'data-motion-preference',
    'reduced',
  );
  await expect(
    page
      .getByRole('region', { name: 'Eventos de áudio DEV' })
      .getByText('special · path-strike', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'ATACAR', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'ESPECIAIS', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('region', { name: 'Golpes especiais' }),
  ).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('region', { name: 'Golpes especiais' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'ESPECIAIS', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Reproduzir sequência' }).click();
  await page.getByRole('button', { name: 'Parar / congelar' }).click();
  await expect(
    page.getByRole('button', { name: 'ATACAR', exact: true }),
  ).toBeEnabled();
  for (const focus of ['0', '1', '2', '3']) {
    await page.getByLabel('Estado', { exact: true }).selectOption('idle');
    await page.getByLabel('Foco inicial').selectOption(focus);
    await expect(
      page.getByRole('meter', { name: 'Foco de Viajante DEV' }),
    ).toHaveAttribute('aria-valuenow', focus);
  }
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before);
  expect(await page.locator('audio').count()).toBe(0);
  expect(external).toEqual([]);
  expect(absent.filter((file) => !approvedPaths.has(file))).toEqual([]);
  expect(errors).toEqual([]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByLabel('Estado', { exact: true }).selectOption('special');
  await page.getByLabel('Fase congelada').selectOption('execution');
  await page.getByLabel('Movimento', { exact: true }).selectOption('normal');
  const fx = page.locator('[data-fx="special-reveal"]').first();
  await expect(fx).not.toHaveCSS('animation-name', 'none');
  await page.getByTestId('arena-stage').evaluate(async (node) => {
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
  const normal = await page
    .locator('[data-side="player"] > div:nth-child(2)')
    .boundingBox();
  await page.getByLabel('Movimento', { exact: true }).selectOption('reduced');
  await expect(fx).toHaveCSS('animation-name', 'none');
  const reduced = await page
    .locator('[data-side="player"] > div:nth-child(2)')
    .boundingBox();
  expect(Math.abs(normal!.x - reduced!.x)).toBeGreaterThan(1);
  await page.getByLabel('Viewport/preview').selectOption('portrait');
  await expect(page.getByTestId('arena-stage')).toHaveAttribute(
    'data-layout',
    'mobile',
  );
  expect(
    await page
      .getByTestId('arena-stage')
      .evaluate((node) => getComputedStyle(node).height),
  ).toBe('390px');
  await page.getByLabel('Viewport/preview').selectOption('auto');
  await page.setViewportSize({ width: 844, height: 390 });
  await composition(page);
  await page.getByLabel('Estado', { exact: true }).selectOption('buffs');
  await page.setViewportSize({ width: 390, height: 844 });
  const badges = page.locator('[data-fighter-status="player"] span');
  await expect(badges).toHaveCount(5);
  const status = await page
    .locator('[data-fighter-status="player"]')
    .boundingBox();
  for (const badge of await badges.all()) {
    const box = await badge.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(
      status!.y + status!.height + 1,
    );
  }
  await composition(page);
  await page
    .getByRole('region', { name: 'Preview Arena', exact: true })
    .screenshot({ path: path.join(dir, '390-stacked-buffs.png') });
});
