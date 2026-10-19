import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
} from '../../apps/web/features/journey/domain/traveler';
import { STORY_STEPS } from '../../apps/web/features/story/catalog';

// Synthetic SDK/Data API fixtures. No hosted Auth, real accounts or external network.
const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const travelerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
async function fixture(
  context: BrowserContext,
  options = { error: false, completed: false, legacy: false },
) {
  const player = createTraveler(
    'Lia',
    DEFAULT_APPEARANCE,
    travelerId,
    '2026-10-19T12:00:00Z',
  );
  player.progress.gardenCompleted = options.legacy;
  player.progress.gardenStep = options.legacy ? 'done' : 'opening';
  const hero = {
    id: travelerId,
    user_id: userId,
    name: 'Lia',
    body_type: 'male',
    skin_tone: 'medio',
    hair_style: 'curto',
    hair_color: null,
    avatar_variant: 'musgo',
    xp: 0,
    level: 1,
    is_active: true,
    journey_progress: player.progress,
    created_at: player.createdAt,
    updated_at: player.createdAt,
  };
  const user = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    is_anonymous: false,
    email: 'fixture@example.invalid',
    user_metadata: { display_name: 'Lia' },
    created_at: player.createdAt,
  };
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const session = {
    access_token: `${encode({ alg: 'HS256' })}.${encode({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.synthetic`,
    refresh_token: 'synthetic-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    user,
  };
  const records = options.completed
    ? [
        {
          traveler_id: travelerId,
          story_id: 'creation',
          completed_steps: [...STORY_STEPS],
          video_completed: true,
          reward_receipt: 'synthetic:creation',
          completed_at: player.createdAt,
        },
      ]
    : [];
  const writes: string[] = [];
  await context.route('**/*', (route) =>
    ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort(),
  );
  await context.route('**/auth/v1/**', (route) =>
    route.fulfill({
      json: new URL(route.request().url()).pathname.endsWith('/user')
        ? user
        : session,
    }),
  );
  await context.route('**/rest/v1/**', async (route) => {
    const request = route.request();
    const endpoint = new URL(request.url()).pathname.split('/').at(-1);
    if (request.method() !== 'GET') writes.push(endpoint ?? 'unknown');
    if (endpoint === 'story_progress') {
      await route.fulfill(
        options.error
          ? { status: 404, json: { message: 'synthetic missing table' } }
          : { json: records },
      );
      return;
    }
    let body: unknown = null;
    if (endpoint === 'travelers')
      body = request.headers().accept?.includes('object') ? hero : [hero];
    if (endpoint === 'traveler_stats')
      body = {
        traveler_id: travelerId,
        base_life: 1,
        base_strength: 1,
        base_defense: 1,
        base_wisdom: 1,
      };
    if (endpoint === 'wallets') body = { traveler_id: travelerId, coins: 0 };
    if (
      ['inventory', 'equipped_items', 'traveler_chests'].includes(
        endpoint ?? '',
      )
    )
      body = [];
    await route.fulfill({ json: body });
  });
  return writes;
}
async function login(page: Page) {
  await page.goto('/auth');
  await page.getByLabel('E-mail').fill('fixture@example.invalid');
  await page.getByLabel('Senha').fill('synthetic-test-only');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Bem-vindo à jornada, Lia.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: /Modo História · ver mundos/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Nove mundos. Um caminho seu.' }),
  ).toBeVisible();
}
async function fits(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
test('home → map → world → story, reload, mobile layout and keyboard', async ({
  page,
  context,
}) => {
  const writes = await fixture(context);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page);
  await expect(
    page.getByRole('list', { name: 'Mundos bíblicos' }).locator(':scope > li'),
  ).toHaveCount(9);
  await fits(page);
  await page.screenshot({
    animations: 'disabled',
    path: test.info().outputPath('world-map.png'),
    fullPage: true,
  });
  await page.getByRole('link', { name: 'Ver mundo 1: As Origens' }).click();
  await expect(
    page.getByRole('heading', { name: 'As Origens', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Ver história/ })).toHaveCount(5);
  await fits(page);
  await page.screenshot({
    animations: 'disabled',
    path: test.info().outputPath('origins.png'),
    fullPage: true,
  });
  await page
    .getByRole('link', { name: /Ver história/ })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: 'A Criação', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Concluir história' }),
  ).toBeDisabled();
  await expect(page.locator('iframe, video')).toHaveCount(0);
  await page.reload();
  await expect(page.getByText(/Aguardando seleção de um vídeo/)).toBeVisible();
  await fits(page);
  const back = page.getByRole('link', { name: '← Histórias de As Origens' });
  await back.focus();
  await expect(back).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/journey\/worlds\/origins$/);
  expect(
    writes.filter((item) =>
      ['complete_story', 'claim_chest_reward', 'story_progress'].includes(item),
    ),
  ).toEqual([]);
  expect(errors).toEqual([]);
});
test('completed story can be revisited and next chapter unlocks without Guild', async ({
  page,
  context,
}) => {
  const writes = await fixture(context, {
    error: false,
    completed: true,
    legacy: false,
  });
  await login(page);
  await page.getByRole('link', { name: 'Ver mundo 1: As Origens' }).click();
  await expect(page.getByText('20% · 1/5 histórias concluídas')).toBeVisible();
  await page.getByRole('link', { name: /Revisitar/ }).click();
  await expect(
    page.getByRole('button', { name: 'História concluída' }),
  ).toBeDisabled();
  await page.getByRole('link', { name: /Próxima história/ }).click();
  await expect(
    page.getByRole('heading', {
      name: 'O Jardim do Éden e a Queda',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Continuar atividades do Jardim/ }),
  ).toBeVisible();
  await fits(page);
  expect(
    writes.filter(
      (item) => item === 'complete_story' || item === 'claim_chest_reward',
    ),
  ).toEqual([]);
});
test('missing backend stays visible; legacy Garden never asks leader to advance', async ({
  page,
  context,
}) => {
  await fixture(context, { error: true, completed: false, legacy: true });
  await login(page);
  await expect(
    page.getByRole('alert').filter({ hasText: 'Não foi possível consultar' }),
  ).toContainText('Não foi possível consultar');
  await page.goto('/journey/phases/o-jardim-e-a-escolha');
  await expect(
    page.getByText('Seu histórico de atividades foi preservado.'),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Ver história e requisitos/ }),
  ).toBeVisible();
  await expect(
    page.getByText(/liberada após a validação|aguardando aprovação do líder/i),
  ).toHaveCount(0);
  await page.getByRole('link', { name: /Ver história e requisitos/ }).click();
  await expect(
    page.getByRole('button', { name: 'Concluir história' }),
  ).toBeDisabled();
  await fits(page);
  await page.screenshot({
    animations: 'disabled',
    path: test.info().outputPath('garden-pending-video.png'),
    fullPage: true,
  });
});
