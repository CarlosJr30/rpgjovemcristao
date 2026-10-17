import { test, expect, type Page } from '@playwright/test';
async function isolate(page: Page, baseURL: string) {
  const attempts: string[] = [],
    errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.context().route('**/*', (route) => {
    if (new URL(route.request().url()).origin !== new URL(baseURL).origin) {
      attempts.push(new URL(route.request().url()).hostname);
      return route.abort();
    }
    const token = process.env.TASK_0076C_URL && process.env.VERCEL_OIDC_TOKEN;
    return route.continue(
      token
        ? {
            headers: {
              ...route.request().headers(),
              'x-vercel-trusted-oidc-idp-token': token,
            },
          }
        : undefined,
    );
  });
  await page.addInitScript(() => {
    localStorage.setItem('TASK0076C-sentinel', 'unchanged');
    const record = window as unknown as { demoWrites: string[] };
    record.demoWrites = [];
    for (const method of ['setItem', 'removeItem', 'clear'] as const)
      Storage.prototype[method] = function (key?: string) {
        record.demoWrites.push(method + ':' + key + ':' + new Error().stack);
        throw Error('Persistence forbidden in demo');
      };
    Object.defineProperty(indexedDB, 'open', {
      value: () => {
        record.demoWrites.push('indexedDB');
        throw Error('Database forbidden in demo');
      },
    });
    Object.defineProperty(crypto, 'getRandomValues', {
      value: (array: Uint32Array) => {
        array[0] = 123;
        return array;
      },
    });
  });
  return async () => {
    expect(attempts).toEqual([]);
    expect(errors).toEqual([]);
    expect(
      await page.evaluate(
        () => (window as unknown as { demoWrites: string[] }).demoWrites,
      ),
    ).toEqual([]);
    expect(await page.evaluate(() => ({ ...localStorage }))).toEqual({
      'TASK0076C-sentinel': 'unchanged',
    });
  };
}
for (const [width, height] of [
  [406, 904],
  [904, 406],
  [320, 568],
])
  test(`mobile layout and card touch ${width}x${height}`, async ({
    page,
    baseURL,
  }, info) => {
    const check = await isolate(page, baseURL!);
    await page.setViewportSize({ width, height });
    await page.goto('/arena-demo');
    await page
      .getByRole('button', { name: 'Iniciar demonstração', exact: true })
      .tap();
    const field = page.getByLabel('Campo de batalha', { exact: true });
    await field.scrollIntoViewIfNeeded();
    for (const image of await field.locator('img').all()) {
      await expect(image).toHaveJSProperty('complete', true);
      expect(
        await image.evaluate((n: HTMLImageElement) => n.naturalWidth),
      ).toBeGreaterThan(0);
    }
    await expect(page.locator('[data-card-id]')).toHaveCount(5);
    const rects = await field.evaluate((n) => ({
      field: n.getBoundingClientRect().toJSON(),
      images: Array.from(n.querySelectorAll('img')).map((i) =>
        i.getBoundingClientRect().toJSON(),
      ),
    }));
    for (const r of rects.images) {
      expect(r.left).toBeGreaterThanOrEqual(rects.field.left - 1);
      expect(r.right).toBeLessThanOrEqual(rects.field.right + 1);
      expect(r.bottom).toBeLessThanOrEqual(rects.field.bottom + 1);
    }
    const bars = await field
      .locator('progress')
      .evaluateAll((ns) => ns.map((n) => n.getBoundingClientRect().top));
    expect(Math.abs(bars[0] - bars[1])).toBeLessThanOrEqual(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
    await page.screenshot({
      path: info.outputPath(`arena-${width}x${height}.png`),
      fullPage: true,
    });
    for (const card of await page.locator('[data-card-id]').all()) {
      await card.tap();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page
        .getByRole('button', { name: 'Fechar carta', exact: true })
        .tap();
    }
    await check();
  });
test('play, complete turn, rotate and reload without persistent changes', async ({
  page,
  baseURL,
}, info) => {
  const check = await isolate(page, baseURL!);
  await page.setViewportSize({ width: 406, height: 904 });
  await page.goto('/arena-demo');
  await page
    .getByRole('button', { name: 'Iniciar demonstração', exact: true })
    .tap();
  await page
    .getByRole('button', { name: /^Ampliar Golpe Rápido/ })
    .first()
    .tap();
  await page.getByRole('button', { name: 'Jogar carta', exact: true }).tap();
  await expect(
    page.getByLabel('Energia 2 de 3', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-card-id]')).toHaveCount(4);
  await page.getByRole('button', { name: 'Encerrar turno', exact: true }).tap();
  await expect(
    page.getByLabel('Energia 3 de 3', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-card-id]')).toHaveCount(5);
  await page.setViewportSize({ width: 904, height: 406 });
  await page.locator('[data-card-id]').first().tap();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Fechar carta', exact: true }).tap();
  await check();
  await page.reload();
  await expect(page.locator('[data-card-id]')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Iniciar demonstração', exact: true }),
  ).toBeVisible();
  await check();
  await page.screenshot({ path: info.outputPath('reloaded-demo.png') });
});
test('victory and defeat dialogs close and restart without rewards', async ({
  page,
  baseURL,
}, info) => {
  const check = await isolate(page, baseURL!);
  await page.setViewportSize({ width: 406, height: 904 });
  await page.goto('/arena-demo');
  await page.getByText('Cenários de validação visual', { exact: true }).tap();
  for (const kind of ['vitória', 'derrota']) {
    await page
      .getByRole('button', { name: `Ensaiar ${kind}`, exact: true })
      .tap();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/Nenhuma moeda, XP, carta ou progresso/);
    await expect(dialog.getByRole('heading')).toHaveText(
      kind === 'vitória'
        ? 'Vitória na demonstração!'
        : 'Derrota na demonstração',
    );
    await page.screenshot({
      path: info.outputPath(
        `result-${kind === 'vitória' ? 'victory' : 'defeat'}.png`,
      ),
    });
    await page
      .getByRole('button', { name: 'Fechar resultado', exact: true })
      .tap();
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Iniciar demonstração', exact: true }),
    ).toBeEnabled();
    await check();
  }
  await page
    .getByRole('button', { name: 'Iniciar demonstração', exact: true })
    .tap();
  await expect(page.locator('[data-card-id]')).toHaveCount(5);
  await check();
});
test('server denies economic operations and routes legacy/auth navigation to demo', async ({
  page,
  baseURL,
  request,
}) => {
  const check = await isolate(page, baseURL!);
  await page.goto('/journey/arena');
  await expect(page).toHaveURL(/\/arena-demo$/);
  for (const path of ['/api/economy', '/arena-demo']) {
    const r = await request.post(path, {
      data: { action: 'reward', coins: 9999 },
      headers:
        process.env.TASK_0076C_URL && process.env.VERCEL_OIDC_TOKEN
          ? { 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN }
          : undefined,
    });
    expect(r.status()).toBe(403);
  }
  const authHeaders =
    process.env.TASK_0076C_URL && process.env.VERCEL_OIDC_TOKEN
      ? { 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN }
      : undefined;
  const response = await request.get('/arena-demo', { headers: authHeaders });
  expect(response.headers()['content-security-policy']).toContain(
    "connect-src 'self'",
  );
  expect(response.headers()['x-arena-demo']).toBe('memory-only');
  await check();
});
