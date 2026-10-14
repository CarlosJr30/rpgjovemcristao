import { expect, test, type BrowserContext } from '@playwright/test';

// Deterministic SDK integration tests. These do not prove hosted Auth configuration.
async function mockSupabase(
  context: BrowserContext,
  options = { confirmation: false, saveFailure: false },
) {
  const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const user = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'ana@example.com',
    user_metadata: { display_name: 'Ana' },
    created_at: new Date().toISOString(),
  };
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const session = {
    access_token: `${encode({ alg: 'HS256' })}.${encode({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.test`,
    refresh_token: 'synthetic-test-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    user,
  };
  let hero: Record<string, unknown> | null = null;
  await context.route('**/auth/v1/**', async (route) => {
    const endpoint = new URL(route.request().url()).pathname;
    const body = endpoint.endsWith('/user')
      ? user
      : options.confirmation
        ? { user, session: null }
        : session;
    await route.fulfill({ json: body });
  });
  await context.route('**/rest/v1/**', async (route) => {
    const request = route.request();
    const endpoint = new URL(request.url()).pathname.split('/').at(-1);
    const payload =
      request.method() === 'GET' ? {} : (request.postDataJSON() ?? {});
    if (endpoint === 'create_traveler') {
      if (options.saveFailure) {
        await route.fulfill({
          status: 403,
          json: { code: '42501', message: 'permission denied' },
        });
        return;
      }
      hero = {
        id: payload.p_id,
        user_id: userId,
        name: payload.p_name,
        body_type: payload.p_body_type,
        skin_tone: payload.p_skin_tone,
        hair_style: payload.p_hair_style,
        hair_color: payload.p_hair_color,
        avatar_variant: payload.p_avatar_variant,
        xp: 0,
        level: 1,
        is_active: true,
        journey_progress: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await route.fulfill({ json: hero.id });
      return;
    }
    if (endpoint === 'travelers' && request.method() === 'PATCH' && hero)
      Object.assign(hero, payload);
    let body: unknown = null;
    if (endpoint === 'travelers')
      body = request.headers().accept?.includes('object')
        ? hero
        : hero
          ? [hero]
          : [];
    if (endpoint === 'traveler_stats')
      body = {
        traveler_id: hero?.id,
        base_life: 1,
        base_strength: 1,
        base_defense: 1,
        base_wisdom: 1,
      };
    if (endpoint === 'wallets') body = { traveler_id: hero?.id, coins: 0 };
    if (endpoint === 'inventory' || endpoint === 'equipped_items') body = [];
    await route.fulfill({ json: body });
  });
  return { hero: () => hero };
}

async function register(page: import('@playwright/test').Page) {
  await page.goto('/auth');
  await page.getByRole('button', { name: 'Ainda não tenho conta' }).click();
  await page.getByLabel('Nome de exibição').fill('Ana');
  await page.getByLabel('E-mail').fill('ana@example.com');
  await page.getByLabel('Senha').fill('synthetic-test-password');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
}

test('cadastro → herói pronto → primeira missão → novo login recupera avatar e progresso', async ({
  page,
  context,
}) => {
  const remote = await mockSupabase(context);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await register(page);
  await expect(page).toHaveURL('/journey/create');
  await expect(
    page.getByRole('button', { name: 'Começar aventura' }),
  ).toBeEnabled();
  await expect(page.getByLabel('Nome do Viajante')).toBeHidden();
  await page.getByLabel('Viajante do Horizonte').check({ force: true });
  await expect(page.locator('[data-avatar-body-type]')).toHaveAttribute(
    'data-avatar-body-type',
    'female',
  );
  await expect
    .poll(() =>
      page.locator('[data-avatar-base]').evaluate((element) => {
        const img = element as HTMLImageElement;
        return img.complete && img.naturalWidth > 0;
      }),
    )
    .toBe(true);
  await page.screenshot({
    path: test.info().outputPath('ready-hero.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Começar aventura' }).click();
  await expect(page).toHaveURL('/journey/phases/o-jardim-e-a-escolha');
  expect(remote.hero()?.body_type).toBe('female');
  expect(remote.hero()?.name).toBe('Ana');
  await page.getByRole('button', { name: /Entrar no jardim/ }).click();
  await expect
    .poll(
      () =>
        (remote.hero()?.journey_progress as { gardenStep?: string })
          ?.gardenStep,
    )
    .toBe('explore');
  await page.reload();
  await expect(
    page.getByRole('button', { name: /Entrar no jardim/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('application', { name: 'Área explorável do Jardim' }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('mission-return.png'),
    fullPage: true,
  });
  // New browser storage exercises recovery from the backend rather than local saves.
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/auth');
  await page.getByLabel('E-mail').fill('ana@example.com');
  await page.getByLabel('Senha').fill('synthetic-test-password');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Bem-vindo à jornada, Ana.' }),
  ).toBeVisible();
  await page.goto('/journey/phases/o-jardim-e-a-escolha');
  await expect(
    page.getByRole('application', { name: 'Área explorável do Jardim' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Entrar no jardim/ }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test('personalização é opcional e só avança quando o avatar é salvo', async ({
  page,
  context,
}) => {
  await mockSupabase(context, { confirmation: false, saveFailure: true });
  await register(page);
  await expect(page).toHaveURL('/journey/create');
  await page.getByRole('button', { name: 'Personalizar (opcional)' }).click();
  await page.getByLabel('Nome do Viajante').fill('Bia');
  await page.getByRole('button', { name: 'Começar aventura' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Não conseguimos salvar',
  );
  await expect(page).toHaveURL('/journey/create');
});

test('não inventa sessão quando o serviço exige confirmação', async ({
  page,
  context,
}) => {
  await mockSupabase(context, { confirmation: true, saveFailure: false });
  await register(page);
  await expect(page.getByRole('status')).toContainText(
    'Não conseguimos iniciar',
  );
  await expect(page).toHaveURL('/auth');
});

test('cadastro e personalização funcionam em celulares pequenos e em landscape', async ({
  page,
  context,
}) => {
  const remote = await mockSupabase(context);
  await register(page);
  await expect(page).toHaveURL('/journey/create');
  for (const [width, height] of [
    [320, 568],
    [360, 800],
    [390, 844],
    [430, 932],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(
      page.getByRole('button', { name: 'Começar aventura' }),
    ).toBeEnabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: test.info().outputPath(`create-${width}x${height}.png`),
      fullPage: true,
    });
  }
  await page.getByRole('button', { name: 'Personalizar (opcional)' }).click();
  await page.getByLabel('Nome do Viajante').fill('Bia');
  await page.getByLabel('Feminino', { exact: true }).check({ force: true });
  await page.getByLabel('Cacheado', { exact: true }).check({ force: true });
  await page.getByRole('button', { name: 'Começar aventura' }).click();
  await expect(page).toHaveURL('/journey/phases/o-jardim-e-a-escolha');
  expect(remote.hero()?.name).toBe('Bia');
  expect(remote.hero()?.hair_style).toBe('cacheado');
});
