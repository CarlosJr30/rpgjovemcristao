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
  await page.goto('/journey/hero');
  await page
    .getByText('Como meus atributos atuam na Arena', { exact: true })
    .click();
  await expect(page.getByText(/^Vida máxima = arredondar/)).toBeVisible();
  await expect(
    page.getByText(/^Cada ponto de Força acrescenta 2,2/),
  ).toBeVisible();
  await fit(page);
  await page.screenshot({
    path: `build/task-0086-arena-descriptions/${info.project.name}-actual-attributes.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page.goto('/journey/collection');
  await page.getByRole('link', { name: 'Meu Baralho — Arena →' }).click();
  await expect(page.getByText('Cartas selecionadas: 0/7')).toBeVisible();
  await expect(page.getByText(/Você precisa de sete cartas/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Salvar baralho' }),
  ).toBeDisabled();
  await fit(page);
  await page.screenshot({
    path: `build/task-0086-arena-descriptions/${info.project.name}-actual-empty.png`,
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
test('numerical descriptions match real components and committed battle feedback on desktop/mobile', async ({
  page,
}, info) => {
  await page.goto('http://127.0.0.1:3191');
  const compare = page.getByRole('row', {
    name: /Parcela ofensiva antes da Defesa/,
  });
  await expect(compare.getByRole('cell')).toHaveText(['5,38', '9,96', '+4,58']);
  const sword = page.getByRole('article', {
    name: 'Equipamento: Espada do Caminho',
    exact: true,
  });
  await sword
    .getByText('Espada do Caminho — Valores e efeitos na Arena', {
      exact: true,
    })
    .click();
  await expect(
    sword.getByText(/Contribuição à parcela ofensiva: 0,18/),
  ).toBeVisible();
  await expect(
    sword.getByText(/Reforço do Golpe ×1,28; resposta após Defender ×1,2/),
  ).toBeVisible();
  const boots = page.getByRole('article', {
    name: 'Equipamento: Botas do Viajante',
    exact: true,
  });
  await boots
    .getByText('Botas do Viajante — Valores e efeitos na Arena', {
      exact: true,
    })
    .click();
  await expect(boots.getByText(/35% da vida máxima/)).toBeVisible();
  await fit(page);
  await page.screenshot({
    path: `build/task-0086-arena-descriptions/${info.project.name}-equipment-numbers.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page
    .getByRole('button', { name: 'Preparar baralho sintético' })
    .click();
  await page.getByRole('button', { name: 'Nova batalha' }).click();
  const actions = page.getByRole('group', { name: 'Ações da batalha' });
  await expect(actions.getByRole('button')).toHaveCount(3);
  await page.getByRole('button', { name: 'CARTAS', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Cartas desta batalha' });
  await expect(panel.getByRole('article')).toHaveCount(7);
  const strike = panel.getByRole('article', {
    name: 'Carta: Teste: Golpe do Caminho',
    exact: true,
  });
  await expect(strike.getByText('Golpe ×1,45', { exact: true })).toBeVisible();
  await expect(
    strike.getByText(/Usos disponíveis nesta batalha: 1/),
  ).toBeVisible();
  await strike.getByText('Como funciona esta carta', { exact: true }).click();
  await expect(
    strike.getByText(/antes do arredondamento e da guarda/),
  ).toBeVisible();
  await expect(strike.getByRole('button')).toBeDisabled();
  await page.getByRole('button', { name: 'ATACAR', exact: true }).click();
  await page.getByRole('button', { name: 'DEFENDER', exact: true }).click();
  await expect(strike.getByRole('button')).toBeEnabled();
  await strike.getByRole('button').click();
  await expect(strike.getByText('USADA', { exact: true })).toBeVisible();
  await expect(
    page.getByText(/Consumiu 2 Foco; Foco após a ação: 0/),
  ).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'CARTAS', exact: true }).click();
  await expect(
    strike.getByText(/Usos disponíveis nesta batalha: 0/),
  ).toBeVisible();
  await expect(strike.getByRole('button')).toBeDisabled();
  await page
    .getByText('Como meus atributos atuam na Arena', { exact: true })
    .click();
  await expect(page.getByText(/^Vida máxima = arredondar/)).toBeVisible();
  await fit(page);
  await strike.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `build/task-0086-arena-descriptions/${info.project.name}-cards-numbers.png`,
    animations: 'disabled',
  });
});
