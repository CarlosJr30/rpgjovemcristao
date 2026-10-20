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
    path: `build/task-0084-arena-deck/${info.project.name}-actual-empty.png`,
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
test('isolated40-card fixture selects7, resumes used cards, serializes tabs and starts a fresh rematch', async ({
  page,
  context,
}, info) => {
  await page.goto('http://127.0.0.1:3187');
  await expect(page.getByRole('article')).toHaveCount(40);
  await expect(
    page.getByRole('button', { name: 'Nova batalha' }),
  ).toBeDisabled();
  for (let i = 1; i <= 7; i++)
    await page
      .getByRole('article', { name: `Carta: Carta de teste ${i}`, exact: true })
      .getByRole('button', { name: 'Selecionar carta' })
      .click();
  await expect(page.getByText('Cartas selecionadas: 7/7')).toBeVisible();
  await expect(
    page
      .getByRole('article', { name: 'Carta: Carta de teste 8', exact: true })
      .getByRole('button'),
  ).toBeDisabled();
  await page
    .getByLabel('Filtrar por raridade', { exact: true })
    .selectOption('raro');
  await expect(page.getByRole('article')).toHaveCount(20);
  await page
    .getByLabel('Filtrar por raridade', { exact: true })
    .selectOption('');
  await page.getByRole('button', { name: 'Salvar baralho' }).click();
  await expect(page.getByText('Baralho salvo neste navegador.')).toBeVisible();
  await page.evaluate(() => scrollTo(0, 0));
  await fit(page);
  await page.screenshot({
    path: `build/task-0084-arena-deck/${info.project.name}-fixture-editor.png`,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Nova batalha' }).click();
  const identity = await page.getByLabel('Identidade da batalha').textContent();
  await page
    .getByRole('button', { name: 'Usar carta Carta de teste 1', exact: true })
    .click();
  await expect(page.getByText('USADA', { exact: true })).toHaveCount(1);
  await page.reload();
  await expect(page.getByLabel('Identidade da batalha')).toHaveText(identity!);
  await expect(
    page.getByRole('button', {
      name: 'Usar carta Carta de teste 1',
      exact: true,
    }),
  ).toBeDisabled();
  const tab = await context.newPage();
  await tab.goto('http://127.0.0.1:3187');
  await Promise.all([
    page
      .getByRole('button', { name: 'Usar carta Carta de teste 2', exact: true })
      .click(),
    tab
      .getByRole('button', { name: 'Usar carta Carta de teste 2', exact: true })
      .click(),
  ]);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const k = Object.keys(localStorage).find((k) =>
          k.startsWith('rpg-jovem-cristao:arena-deck:'),
        );
        return k
          ? JSON.parse(localStorage.getItem(k)!).journal.actions.length
          : 0;
      }),
    )
    .toBe(2);
  await page.reload();
  await expect(page.getByText('USADA', { exact: true })).toHaveCount(2);
  await tab.close();
  await fit(page);
  await page.screenshot({
    path: `build/task-0084-arena-deck/${info.project.name}-fixture-used.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Trocar conta sintética' }).click();
  await expect(page.getByText('Cartas selecionadas: 0/7')).toBeVisible();
  await expect(page.getByLabel('Identidade da batalha')).toHaveCount(0);
  await page.getByRole('button', { name: 'Trocar conta sintética' }).click();
  await expect(page.getByLabel('Identidade da batalha')).toHaveText(identity!);
  for (let i = 0; i < 30; i++) {
    const attack = page.getByRole('button', {
      name: 'Ataque básico',
      exact: true,
    });
    if (await attack.isDisabled()) break;
    const state = page
      .getByRole('status')
      .filter({ hasText: /^Rodada |^Batalha encerrada/ });
    const before = await state.textContent();
    await attack.click();
    await expect(state).not.toHaveText(before!);
  }
  await expect(
    page.getByText('Batalha encerrada', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Usar carta Carta de teste 3',
      exact: true,
    }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Nova batalha' }).click();
  await expect(page.getByLabel('Identidade da batalha')).not.toHaveText(
    identity!,
  );
  await expect(page.getByText('USADA', { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('button', {
      name: 'Usar carta Carta de teste 1',
      exact: true,
    }),
  ).toBeEnabled();
});
