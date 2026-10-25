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
test('actual product shows seven ordered floors and keeps catalog/official reward gates closed', async ({
  page,
  context,
}, info) => {
  await mock(context);
  await login(page);
  await page.goto('/journey/arena');
  await page
    .getByRole('link', { name: 'Torre dos 7 Desafios', exact: true })
    .click();
  await expect(
    page.getByText('Torre local: 0/7 desafios concluídos.'),
  ).toBeVisible();
  await expect(
    page
      .getByRole('list', { name: 'Sete andares da Torre' })
      .getByRole('listitem'),
  ).toHaveCount(7);
  await expect(
    page.getByRole('button', { name: 'Entrar no andar', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Andar bloqueado', exact: true }),
  ).toHaveCount(6);
  await expect(
    page.getByText('Progresso local, não oficial.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Catálogo e aquisição ainda pendentes/),
  ).toBeVisible();
  await fit(page);
  await page.screenshot({
    path: `build/task-0087-arena-tower/${info.project.name}-actual-map.png`,
    fullPage: true,
    animations: 'disabled',
  });
});
async function battleId(page: Page) {
  return page.evaluate(() => {
    const k = Object.keys(localStorage).find((k) =>
      k.startsWith('rpg-jovem-cristao:arena-tower-battle:'),
    );
    return k ? JSON.parse(localStorage.getItem(k)!).journal.id : null;
  });
}
test('isolated full Tower reuses ArenaExperience, resumes and clears7 without any economic reward', async ({
  page,
  context,
}, info) => {
  await context.route('**/*', (route) =>
    ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort(),
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:3193');
  await page
    .getByRole('button', { name: 'Preparar baralho sintético', exact: true })
    .click();
  const identities: string[] = [];
  for (let i = 0; i < 7; i++) {
    await expect(
      page.getByText(`Torre local: ${i}/7 desafios concluídos.`, {
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole('button', {
        name: i === 6 ? 'Enfrentar o campeão' : 'Entrar no andar',
        exact: true,
      })
      .click();
    const begin = page.getByRole('button', {
      name: 'Iniciar batalha',
      exact: true,
    });
    await expect(begin).toBeEnabled();
    if (i === 6)
      await expect(
        page.getByText('Último desafio — Campeão da Torre', { exact: true }),
      ).toBeVisible();
    await begin.click();
    const actions = page.getByRole('group', { name: 'Ações da batalha' });
    await expect(actions.getByRole('button')).toHaveCount(3);
    const id = await battleId(page);
    expect(id).toBeTruthy();
    expect(identities).not.toContain(id);
    identities.push(id);
    if (i === 0) {
      await page.getByRole('button', { name: 'DEFENDER', exact: true }).click();
      await expect(
        page.getByRole('button', { name: 'CARTAS', exact: true }),
      ).toBeEnabled();
      await page.reload();
      await expect(
        page.getByText('Torre local: 0/7 desafios concluídos.', {
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByRole('button', { name: 'Retomar batalha', exact: true })
        .click();
      await expect(
        page.getByRole('group', { name: 'Ações da batalha' }),
      ).toBeVisible();
      expect(await battleId(page)).toBe(id);
    }
    await page.getByRole('button', { name: 'CARTAS', exact: true }).click();
    const panel = page.getByRole('region', { name: 'Cartas desta batalha' });
    await expect(panel.getByRole('article')).toHaveCount(7);
    await expect(page.getByText('USADA', { exact: true })).toHaveCount(0);
    await page
      .getByRole('button', { name: 'Usar carta Carta de teste 1', exact: true })
      .click();
    for (let retry = 0; retry < 10; retry++) {
      const outcome = page.getByText(/Resultado demonstrativo registrado/);
      await expect
        .poll(
          async () =>
            (await outcome.count()) > 0 ||
            (await page
              .getByRole('button', { name: 'ATACAR', exact: true })
              .isEnabled()),
          // The final action plays its event queue before persisting the result.
          // Keep the same outcome assertion while allowing that bounded animation.
          { timeout: 15000 },
        )
        .toBe(true);
      if (await outcome.count()) break;
      await page.getByRole('button', { name: 'ATACAR', exact: true }).click();
    }
    await expect(
      page.getByText(/Resultado demonstrativo registrado/),
    ).toBeVisible();
    await expect(page.getByText('USADA', { exact: true })).toHaveCount(1);
    if (i === 0) {
      await fit(page);
      await page.screenshot({
        path: `build/task-0087-arena-tower/${info.project.name}-fixture-battle.png`,
        fullPage: true,
        animations: 'disabled',
      });
    }
    if (i === 6)
      await expect(
        page.getByText('Campeão superado no treino local!', { exact: true }),
      ).toBeVisible();
    await page
      .getByRole('button', { name: 'Voltar à Torre', exact: true })
      .click();
  }
  await expect(
    page.getByText('Torre local: 7/7 desafios concluídos.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Campeão superado — treino local concluído!', {
      exact: true,
    }),
  ).toBeVisible();
  expect(new Set(identities).size).toBe(7);
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(
    keys.every(
      (k) =>
        k.startsWith('rpg-jovem-cristao:arena-deck:') ||
        k.startsWith('rpg-jovem-cristao:arena-tower'),
    ),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByText('Torre local: 7/7 desafios concluídos.', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Trocar conta sintética', exact: true })
    .click();
  await expect(
    page.getByText('Torre local: 0/7 desafios concluídos.', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Trocar conta sintética', exact: true })
    .click();
  await expect(
    page.getByText('Torre local: 7/7 desafios concluídos.', { exact: true }),
  ).toBeVisible();
  await fit(page);
  await page.screenshot({
    path: `build/task-0087-arena-tower/${info.project.name}-fixture-complete.png`,
    fullPage: true,
    animations: 'disabled',
  });
});
