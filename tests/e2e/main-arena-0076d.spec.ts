import { expect, test } from '@playwright/test';
import { replayCardBattle } from '@rpg/game-engine';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
} from '../../apps/web/features/journey/domain/traveler';
for (const [width, height] of [
  [406, 904],
  [904, 406],
  [320, 568],
])
  test(`TASK-0076D mobile ${width}x${height}: characters, equipment, cards and turn`, async ({
    page,
    baseURL,
  }, info) => {
    const traveler = createTraveler(
      'Viajante Mobile',
      DEFAULT_APPEARANCE,
      '00000000-0000-4000-8000-00000000007d',
      '2026-10-17T00:00:00.000Z',
    );
    traveler.progress.introCompleted = true;
    const external: string[] = [];
    await page.context().route('**/*', (route) => {
      if (new URL(route.request().url()).origin !== new URL(baseURL!).origin) {
        external.push(new URL(route.request().url()).hostname);
        return route.abort();
      }
      return route.continue();
    });
    await page.addInitScript((traveler) => {
      localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local');
      localStorage.setItem(
        'rpg-jovem-cristao:journey:v1',
        JSON.stringify({ version: 2, travelers: [traveler] }),
      );
      localStorage.setItem(
        'rpg-jovem-cristao:active-traveler-id:v1',
        traveler.id,
      );
      localStorage.setItem('rpg-jovem-cristao:active-traveler:v1', 'active');
      Object.defineProperty(crypto, 'getRandomValues', {
        value: (array: Uint32Array) => {
          array[0] = 123;
          return array;
        },
      });
    }, traveler);
    await page.setViewportSize({ width, height });
    await page.goto('/journey/arena');
    await page
      .getByRole('button', {
        name: 'Treinar com Davi, o Aprendiz',
        exact: true,
      })
      .tap();
    const field = page.getByLabel('Campo de batalha', { exact: true });
    await field.scrollIntoViewIfNeeded();
    for (const image of await field.locator('img').all()) {
      await expect(image).toHaveJSProperty('complete', true);
      expect(
        await image.evaluate((n: HTMLImageElement) => n.naturalWidth),
      ).toBeGreaterThan(0);
    }
    const r = await field.evaluate((n) => ({
      field: n.getBoundingClientRect().toJSON(),
      images: Array.from(n.querySelectorAll('img')).map((n) =>
        n.getBoundingClientRect().toJSON(),
      ),
    }));
    for (const img of r.images) {
      expect(img.left).toBeGreaterThanOrEqual(r.field.left - 1);
      expect(img.right).toBeLessThanOrEqual(r.field.right + 1);
      expect(img.bottom).toBeLessThanOrEqual(r.field.bottom + 1);
    }
    const bars = await field
      .locator('progress')
      .evaluateAll((ns) => ns.map((n) => n.getBoundingClientRect().top));
    expect(Math.abs(bars[0] - bars[1])).toBeLessThanOrEqual(1);
    await expect(page.locator('[data-card-id]')).toHaveCount(5);
    await expect(
      page.getByLabel('Energia 3 de 3', { exact: true }),
    ).toBeVisible();
    const transcript = await page.evaluate(
      () =>
        JSON.parse(
          localStorage.getItem(
            Object.keys(localStorage).find((k) =>
              k.startsWith('rpg-jovem-cristao:card-arena:v1:'),
            )!,
          )!,
        ).transcript,
    );
    const session = replayCardBattle(transcript, traveler.id)!;
    expect(session).not.toBeNull();
    expect(
      session.hand.length + session.draw.length + session.discard.length,
    ).toBe(20);
    await page.screenshot({
      path: info.outputPath(`main-arena-${width}x${height}.png`),
      fullPage: true,
    });
    await page
      .getByRole('button', { name: /^Ampliar Golpe Rápido/ })
      .first()
      .tap();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Jogar carta', exact: true }).tap();
    await expect(
      page.getByLabel('Energia 2 de 3', { exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Encerrar turno', exact: true })
      .tap();
    await expect(
      page.getByLabel('Energia 3 de 3', { exact: true }),
    ).toBeVisible();
    await expect(page.locator('[data-card-id]')).toHaveCount(5);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
    const saved = await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('rpg-jovem-cristao:journey:v1')!)
          .travelers[0],
    );
    expect(saved).toEqual(traveler);
    expect(external).toEqual([]);
  });
