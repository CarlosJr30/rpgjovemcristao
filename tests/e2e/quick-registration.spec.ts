import { expect, test, type BrowserContext } from '@playwright/test';
import QRCode from 'qrcode';

// Deterministic SDK integration tests. These do not prove hosted Auth configuration.
async function mockSupabase(
  context: BrowserContext,
  options = { confirmation: false, saveFailure: false },
  initialHero: Record<string, unknown> | null = null,
) {
  await context.route('**/*', (route) =>
    ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort(),
  );
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
  let hero: Record<string, unknown> | null = initialHero;
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
    if (
      endpoint === 'inventory' ||
      endpoint === 'equipped_items' ||
      endpoint === 'story_progress'
    )
      body = [];
    await route.fulfill({ json: body });
  });
  return { hero: () => hero };
}

async function register(page: import('@playwright/test').Page, path = '/auth') {
  await page.goto(path);
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await page.getByLabel('Nome de exibição').fill('Ana');
  await page.getByLabel('E-mail').fill('ana@example.com');
  await page.getByLabel('Senha').fill('synthetic-test-password');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
}

async function openLegacyGarden(page: import('@playwright/test').Page) {
  const menu = page.getByRole('button', { name: 'Abrir menu', exact: true });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('link', { name: 'Missões', exact: true })
    .click();
  await expect(page).toHaveURL('/journey/phases/o-jardim-e-a-escolha');
}

test('cadastro → herói pronto → primeira missão → novo login recupera avatar e progresso', async ({
  page,
  context,
  browser,
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
  await expect(page).toHaveURL('/journey');
  await expect(
    page.getByRole('heading', { name: 'Nove mundos. Um caminho seu.' }),
  ).toBeVisible();
  // Existing Garden remains a separate compatibility path; this test exercises
  // its account recovery, not completion of the newly prepared first chapter.
  await openLegacyGarden(page);
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
  await page.getByRole('button', { name: 'Abrir Herói', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Sair da conta' }).click();
  await expect(
    page.getByRole('heading', { name: 'Entrar', exact: true }),
  ).toBeVisible();
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
  // Follow the real in-game link; a forced document navigation aborts WebKit's
  // in-flight RSC prefetch and is unrelated to session/character recovery.
  await page.getByRole('link', { name: /Modo História · ver mundos/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Nove mundos. Um caminho seu.' }),
  ).toBeVisible();
  await openLegacyGarden(page);
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
  // A separate browser context has no session or character storage from the first.
  const other = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  try {
    await mockSupabase(
      other,
      { confirmation: false, saveFailure: false },
      remote.hero(),
    );
    const second = await other.newPage();
    await second.goto(new URL('/auth', page.url()).href);
    await second.getByLabel('E-mail').fill('ana@example.com');
    await second.getByLabel('Senha').fill('synthetic-test-password');
    await second.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(
      second.getByRole('heading', { name: 'Bem-vindo à jornada, Ana.' }),
    ).toBeVisible();
    const loadedId = await second.evaluate(() =>
      localStorage.getItem('rpg-jovem-cristao:active-traveler-id:v1'),
    );
    expect(loadedId).toBe(remote.hero()?.id);
  } finally {
    await other.close();
  }
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
  await expect(page.getByRole('status')).toContainText('Cadastro recebido.');
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

test('QR → cadastro → avatar → confirmação cria somente pedido pendente', async ({
  page,
  context,
}) => {
  await mockSupabase(context);
  const token = 'a'.repeat(64);
  const path = `/guilda/convite/${token}`;
  let requests = 0;
  await context.route('**/api/guild-invites', async (route) => {
    const input = route.request().postDataJSON();
    expect(input.token).toBe(token);
    if (input.action === 'request') {
      requests++;
      await route.fulfill({
        json: { data: '11111111-1111-4111-8111-111111111111' },
      });
    } else {
      await route.fulfill({
        json: {
          data: {
            guild_name: 'Guilda do teste',
            expires_at: '2026-10-26T00:00:00Z',
          },
        },
      });
    }
  });
  await page.goto(path);
  await expect(page).toHaveURL(new RegExp('/auth\\?next='));
  await expect(
    page
      .getByRole('complementary', { name: 'Prévia do convite' })
      .getByRole('heading', { name: 'Guilda do teste' }),
  ).toBeVisible();
  expect(requests).toBe(0);
  await page.screenshot({
    path: test.info().outputPath('invite-before-login.png'),
    fullPage: true,
  });
  await register(page, page.url());
  await expect(page).toHaveURL(
    `/journey/create?next=${encodeURIComponent(path)}`,
  );
  await page.getByRole('button', { name: 'Começar aventura' }).click();
  await expect(page).toHaveURL(path);
  await expect(
    page.getByRole('heading', { name: 'Guilda do teste' }),
  ).toBeVisible();
  expect(requests).toBe(0);
  await page
    .getByRole('button', { name: 'Confirmar e solicitar entrada' })
    .click();
  await expect(page.getByRole('status')).toContainText(
    'Aguarde a aprovação do líder',
  );
  expect(requests).toBe(1);
  await expect(
    page.getByRole('button', { name: 'Confirmar e solicitar entrada' }),
  ).toHaveCount(0);
  expect((await page.request.get(path)).headers()['referrer-policy']).toBe(
    'no-referrer',
  );
  await page.screenshot({
    path: test.info().outputPath('invite-pending.png'),
    fullPage: true,
  });
});

test('líder gera QR e link compartilhável e revoga o convite no painel', async ({
  page,
  context,
}) => {
  const remote = await mockSupabase(context);
  await register(page);
  await page.getByRole('button', { name: 'Começar aventura' }).click();
  await expect(page).toHaveURL('/journey/phases/o-jardim-e-a-escolha');
  const guildId = '22222222-2222-4222-8222-222222222222';
  const inviteId = '33333333-3333-4333-8333-333333333333';
  const url = `${new URL(page.url()).origin}/guilda/convite/${'a'.repeat(64)}`;
  const svg = await QRCode.toString(url, { type: 'svg' });
  let created = false;
  let revoked = false;
  await context.route('**/rest/v1/**', async (route) => {
    const endpoint = new URL(route.request().url()).pathname.split('/').at(-1);
    if (
      [
        'travelers',
        'traveler_stats',
        'wallets',
        'inventory',
        'equipped_items',
        'profiles',
      ].includes(endpoint ?? '')
    )
      return route.fallback();
    await route.fulfill({
      json:
        endpoint === 'guild_members'
          ? {
              guild_id: guildId,
              traveler_id: remote.hero()?.id,
              role: 'leader',
              status: 'active',
            }
          : endpoint === 'guilds'
            ? {
                id: guildId,
                name: 'Guilda do teste',
                leader_traveler_id: remote.hero()?.id,
                status: 'active',
              }
            : [],
    });
  });
  await context.route('**/api/guild-invites', async (route) => {
    const input = route.request().postDataJSON();
    if (input.action === 'create') {
      created = true;
      return route.fulfill({
        json: {
          id: inviteId,
          url,
          qr: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
          expires_at: '2026-10-26T00:00:00Z',
        },
      });
    }
    if (input.action === 'revoke') {
      revoked = true;
      return route.fulfill({ json: { data: null } });
    }
    return route.fulfill({
      json: {
        data: created
          ? [
              {
                id: inviteId,
                created_at: '2026-10-19T00:00:00Z',
                expires_at: '2026-10-26T00:00:00Z',
                revoked_at: revoked ? '2026-10-19T01:00:00Z' : null,
              },
            ]
          : [],
      },
    });
  });
  await page.waitForLoadState('networkidle');
  await page.goto('/journey/guild/manage');
  await page.getByRole('button', { name: 'Convidar membros' }).click();
  await page.getByRole('button', { name: 'Gerar convite' }).click();
  const qr = page.getByRole('img', { name: 'QR Code do convite da Guilda' });
  await expect(qr).toBeVisible();
  await expect
    .poll(() =>
      qr.evaluate((element) => (element as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(page.getByLabel('Link do convite')).toHaveValue(url);
  await expect(
    page.getByRole('link', { name: 'Compartilhar pelo WhatsApp' }),
  ).toHaveAttribute('href', `https://wa.me/?text=${encodeURIComponent(url)}`);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath('leader-invite-qr.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Revogar convite' }).click();
  await expect(
    page
      .getByRole('region', { name: 'Convites da Guilda' })
      .getByRole('status'),
  ).toContainText('Convite revogado');
  await expect(qr).toHaveCount(0);
  expect(revoked).toBe(true);
});
