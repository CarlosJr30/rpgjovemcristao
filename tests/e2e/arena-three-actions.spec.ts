import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
} from '../../apps/web/features/journey/domain/traveler';
async function mock(context: BrowserContext) {
  const actor = '10000000-0000-4000-8000-000000000001';
  const userId = '00000000-0000-4000-8000-000000000001';
  const name = 'Lia';
  const player = createTraveler(name, DEFAULT_APPEARANCE, actor, date);
  const hero = {
    id: actor,
    user_id: userId,
    name,
    body_type: 'male',
    skin_tone: 'medio',
    hair_style: 'curto',
    hair_color: null,
    avatar_variant: 'musgo',
    xp: 0,
    level: 1,
    is_active: true,
    journey_progress: player.progress,
    created_at: date,
    updated_at: date,
  };
  const user = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    is_anonymous: false,
    email: 'fixture@fixture.invalid',
    user_metadata: { display_name: name },
    created_at: date,
  };
  const enc = (v: unknown) =>
    Buffer.from(JSON.stringify(v)).toString('base64url');
  const session = {
    access_token: `${enc({ alg: 'HS256' })}.${enc({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.synthetic`,
    refresh_token: 'synthetic-refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user,
  };
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
    const req = route.request();
    const endpoint = new URL(req.url()).pathname.split('/').at(-1);
    let data: unknown = [];
    if (endpoint === 'travelers')
      data = req.headers().accept?.includes('object') ? hero : [hero];
    if (endpoint === 'traveler_stats')
      data = {
        traveler_id: actor,
        base_life: 1,
        base_strength: 1,
        base_defense: 1,
        base_wisdom: 1,
      };
    if (endpoint === 'wallets') data = { traveler_id: actor, coins: 0 };
    // Unknown IDs and metadata never become playable cards without catalog approval.
    if (endpoint === 'inventory')
      data = Array.from({ length: 40 }, (_, i) => ({
        id: randomUUID(),
        traveler_id: actor,
        item_id: `fixture-card-${i + 1}`,
        quantity: 1,
        metadata: { kind: 'card' },
        acquired_at: date,
      }));
    await route.fulfill({ json: data });
  });
}
const date = '2026-10-20T12:00:00Z';
async function login(page: Page) {
  await page.goto('/auth');
  await page.getByLabel('E-mail').fill('fixture@fixture.invalid');
  await page.getByLabel('Senha').fill('synthetic-password');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Bem-vindo à jornada, Lia.' }),
  ).toBeVisible();
}
async function fit(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
test('actual authenticated Arena exposes deck and fails closed without approved cards', async ({
  page,
  context,
}, info) => {
  await mock(context);
  await login(page);
  await page.goto('/journey/collection');
  await page.getByRole('link', { name: 'Meu Baralho — Arena →' }).click();
  await expect(page.getByText('Cartas selecionadas: 0/7')).toBeVisible();
  await expect(page.getByText(/Você precisa de sete cartas/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Salvar baralho' }),
  ).toBeDisabled();
  await fit(page);
  await page.screenshot({
    path: `build/task-0085-arena-cards/${info.project.name}-actual-empty.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page
    .getByRole('link', { name: 'Voltar à Arena', exact: true })
    .last()
    .click();
  await page.getByRole('button', { name: /Davi, o Aprendiz/ }).click();
  await expect(
    page.getByRole('button', { name: 'Iniciar batalha' }),
  ).toBeDisabled();
  await expect(page.getByText(/Monte um baralho com sete/)).toBeVisible();
  await fit(page);
});
test('isolated special cards use exactly three product controls, keep Foco/usage on reload, serialize tabs and reset only on rematch', async ({
  page,
  context,
}, info) => {
  const url = 'http://127.0.0.1:3189';
  await page.goto(url);
  await expect(
    page.getByRole('button', { name: 'Nova batalha' }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Preparar baralho sintético' })
    .click();
  await expect(page.getByText('Cartas selecionadas: 7/7')).toBeVisible();
  await page.getByRole('button', { name: 'Nova batalha' }).click();
  const identity = await page.getByLabel('Identidade da batalha').textContent();
  const actions = page.getByRole('group', { name: 'Ações da batalha' });
  await expect(actions.getByRole('button')).toHaveCount(3);
  for (const name of ['ATACAR', 'DEFENDER', 'CARTAS'])
    await expect(
      actions.getByRole('button', { name, exact: true }),
    ).toBeVisible();
  await expect(page.getByRole('button', { name: /ESPECIAIS/ })).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Cartas desta batalha' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'CARTAS', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Cartas desta batalha' });
  await expect(panel.getByRole('article')).toHaveCount(7);
  const strike = page.getByRole('article', {
    name: 'Carta: Teste: Golpe do Caminho',
    exact: true,
  });
  await expect(
    strike.getByText('Custo: 2 Foco · Nível mínimo: 2'),
  ).toBeVisible();
  await expect(strike.getByRole('button')).toBeDisabled();
  await page.getByRole('button', { name: 'ATACAR', exact: true }).click();
  await expect(
    strike.getByText('Você precisa de mais 1 ponto de Foco.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'DEFENDER', exact: true }).click();
  await expect(strike.getByRole('button')).toBeEnabled();
  await expect(page.getByText('USADA', { exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'CARTAS', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'CARTAS', exact: true }).click();
  const tab = await context.newPage();
  await tab.goto(url);
  await tab.getByRole('button', { name: 'CARTAS', exact: true }).click();
  await Promise.all([
    strike.getByRole('button').click(),
    tab
      .getByRole('button', {
        name: 'Usar carta Teste: Golpe do Caminho',
        exact: true,
      })
      .click(),
  ]);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const k = Object.keys(localStorage).find((k) =>
          k.startsWith('rpg-jovem-cristao:arena-deck:'),
        )!;
        return JSON.parse(localStorage.getItem(k)!).journal.actions;
      }),
    )
    .toEqual(['attack', 'defend', 'card:fixture-special-path-strike']);
  await tab.close();
  await page.reload();
  await expect(page.getByLabel('Identidade da batalha')).toHaveText(identity!);
  await expect(page.getByText('Rodada 4', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'CARTAS', exact: true }).click();
  await expect(strike.getByText('USADA', { exact: true })).toBeVisible();
  await expect(strike.getByRole('button')).toBeDisabled();
  await expect(panel.getByRole('article')).toHaveCount(7);
  await expect(
    page.getByRole('button', { name: 'Preparar baralho sintético' }),
  ).toBeDisabled();
  await fit(page);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: `build/task-0085-arena-cards/${info.project.name}-three-actions.png`,
    fullPage: true,
    animations: 'disabled',
  });
  for (let i = 0; i < 30; i++) {
    if ((await actions.count()) === 0) break;
    const state = page
      .getByRole('status')
      .filter({ hasText: /^Rodada |^Batalha encerrada/ });
    const previous = await state.textContent();
    await page.getByRole('button', { name: 'ATACAR', exact: true }).click();
    await expect(state).not.toHaveText(previous!);
  }
  await expect(
    page.getByText('Batalha encerrada', { exact: true }),
  ).toBeVisible();
  await expect(panel.getByRole('button')).toHaveCount(7);
  for (const button of await panel.getByRole('button').all())
    await expect(button).toBeDisabled();
  await page.getByLabel('Nível sintético', { exact: true }).selectOption('1');
  await page.getByRole('button', { name: 'Nova batalha' }).click();
  await expect(page.getByLabel('Identidade da batalha')).not.toHaveText(
    identity!,
  );
  await page.getByRole('button', { name: 'CARTAS', exact: true }).click();
  await expect(panel.getByRole('article')).toHaveCount(7);
  await expect(page.getByText('USADA', { exact: true })).toHaveCount(0);
  await expect(
    strike.getByText('Carta disponível após atingir o nível 2.'),
  ).toBeVisible();
  await expect(strike.getByRole('button')).toBeDisabled();
  await expect(
    page.getByRole('button', {
      name: 'Usar carta Carta de teste 1',
      exact: true,
    }),
  ).toBeEnabled();
  await fit(page);
  await page.screenshot({
    path: `build/task-0085-arena-cards/${info.project.name}-level-gate.png`,
    fullPage: true,
    animations: 'disabled',
  });
});
