import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
} from '../../apps/web/features/journey/domain/traveler';
async function mock(
  context: BrowserContext,
  state: {
    opened: boolean;
    confirmed: boolean;
    calls: number;
    operationKey: string;
  },
) {
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
  const reward = {
    chestType: 'uncommon',
    coins: 20,
    itemId: 'traveler-armor-uncommon',
    itemName: 'Couraca do Viajante',
    source: 'mission',
    remainingQuantity: 0,
    duplicate: false,
  };
  const row = {
    id: '42345678-1234-4321-8234-123456789abc',
    traveler_id: actor,
    operation_key: '',
    operation_type: 'open',
    chest_type: 'uncommon',
    source: 'mission',
    price_paid: null,
    rewards: reward,
    created_at: date,
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
    if (endpoint === 'inventory')
      data = [
        {
          id: randomUUID(),
          traveler_id: actor,
          item_id: 'traveler-armor-uncommon',
          quantity: 1,
          metadata: {},
          acquired_at: date,
        },
      ];
    if (endpoint === 'traveler_chests')
      data = state.opened
        ? []
        : [
            {
              traveler_id: actor,
              chest_type: 'uncommon',
              quantity: 1,
              sources: ['mission'],
              created_at: date,
              updated_at: date,
            },
          ];
    if (endpoint === 'open_chest') {
      state.calls++;
      const body = req.postDataJSON();
      state.operationKey = `open:${body.p_operation_id}`;
      state.opened = true;
      data = reward;
    }
    if (endpoint === 'chest_operations') {
      const one = new URL(req.url()).searchParams.has('operation_key');
      data =
        state.opened && state.confirmed
          ? one
            ? { ...row, operation_key: state.operationKey }
            : [{ ...row, operation_key: state.operationKey }]
          : one
            ? null
            : [];
    }
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

test('product confirmed opening, two second hold, equipment comparison, reload and replay do not open again', async ({
  page,
  context,
}, info) => {
  const state = { opened: false, confirmed: true, calls: 0, operationKey: '' };
  await mock(context, state);
  await login(page);
  await page.goto('/journey/backpack');
  await page.getByRole('tab', { name: /^Baús/ }).click();
  const open = page.getByRole('button', { name: 'Abrir', exact: true });
  await open.dblclick();
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  expect(state.calls).toBe(1);
  await page.getByRole('button', { name: 'Revelar prêmio' }).click();
  const phase = page.locator('[data-phase]');
  await expect(phase).toHaveAttribute('data-phase', 'holding');
  const start = Date.now();
  await expect(phase).toHaveAttribute('data-phase', 'flipping', {
    timeout: 4000,
  });
  expect(Date.now() - start).toBeGreaterThanOrEqual(1700);
  await expect(
    page.getByRole('heading', { name: '20 Moedas do Viajante' }),
  ).toBeVisible();
  await page.waitForTimeout(2100);
  await expect(
    page.getByRole('heading', { name: '20 Moedas do Viajante' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Próximo prêmio' }).click();
  await page.getByRole('button', { name: 'Pular animação' }).click();
  await expect(
    page.getByRole('heading', { name: 'Couraça do Viajante', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await fit(page);
  await page.screenshot({
    path: `build/task-0088-chest-reveal/${info.project.name}-product-equipment.png`,
  });
  await page.getByRole('table').scrollIntoViewIfNeeded();
  const tableBox = await page.getByRole('table').boundingBox();
  expect(tableBox!.width).toBeLessThanOrEqual(info.project.use.viewport!.width);
  await page.screenshot({
    path: `build/task-0088-chest-reveal/${info.project.name}-product-comparison.png`,
  });
  await page
    .getByRole('button', { name: 'Fechar apresentação e retomar depois' })
    .click();
  await page.reload();
  await page.getByRole('tab', { name: /^Baús/ }).click();
  await page
    .getByRole('button', { name: 'Retomar apresentação registrada' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Couraça do Viajante', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ver resumo' }).click();
  await expect(
    page.getByRole('heading', { name: 'Resumo dos prêmios registrados' }),
  ).toBeVisible();
  await expect(modal.getByRole('listitem')).toHaveCount(2);
  await page.screenshot({
    path: `build/task-0088-chest-reveal/${info.project.name}-product-summary.png`,
  });
  await page.getByRole('button', { name: 'Concluir', exact: true }).click();
  await page
    .getByRole('button', { name: 'Ver novamente', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Revelar prêmio' }),
  ).toBeVisible();
  expect(state.calls).toBe(1);
  const visual = await page.evaluate(() =>
    Object.entries(localStorage).filter(([k]) => k.includes('chest-reveal:')),
  );
  expect(visual).toHaveLength(1);
  expect(visual[0][1]).not.toMatch(/coins|armor|reward|token/);
  expect(await page.getByText('Carta sintética de revelação').count()).toBe(0);
});

test('uncertain opening remains pending, reload only consults, later confirmation resumes without new RPC', async ({
  page,
  context,
}, info) => {
  const state = { opened: false, confirmed: false, calls: 0, operationKey: '' };
  await mock(context, state);
  await login(page);
  await page.goto('/journey/backpack');
  await page.getByRole('tab', { name: /^Baús/ }).click();
  await page.getByRole('button', { name: 'Abrir', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Abertura pendente de confirmação' }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await page.getByRole('tab', { name: /^Baús/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Abertura pendente de confirmação' }),
  ).toBeVisible();
  expect(state.calls).toBe(1);
  await page.screenshot({
    path: `build/task-0088-chest-reveal/${info.project.name}-product-pending.png`,
  });
  state.confirmed = true;
  await page.getByRole('button', { name: 'Consultar resultado' }).click();
  await page
    .getByRole('button', { name: 'Retomar apresentação registrada' })
    .click();
  await page.getByRole('button', { name: 'Apresentação estática' }).click();
  await expect(
    page.getByRole('heading', { name: '20 Moedas do Viajante' }),
  ).toBeVisible();
  expect(state.calls).toBe(1);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('isolated card rises holds flips; five themes, reduced motion and ordered summary', async ({
  page,
  context,
}, info) => {
  await context.route('**/*', (r) =>
    ['127.0.0.1', 'localhost'].includes(new URL(r.request().url()).hostname)
      ? r.continue()
      : r.abort(),
  );
  await page.goto('http://127.0.0.1:3195');
  await page
    .getByRole('button', { name: 'Demonstrar Raro', exact: true })
    .click();
  await expect(page.getByText(/DEMONSTRAÇÃO ISOLADA/)).toBeVisible();
  await page.getByRole('button', { name: 'Revelar prêmio' }).click();
  await expect(page.locator('[data-phase]')).toHaveAttribute(
    'data-phase',
    'holding',
  );
  await expect(
    page.getByText('JOVEM CRISTÃO', { exact: true }).locator('..'),
  ).toHaveCSS('transform', 'none');
  await page.screenshot({
    path: `build/task-0088-chest-reveal/${info.project.name}-card-back.png`,
  });
  await expect(
    page.getByRole('heading', {
      name: 'Carta sintética de revelação',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText('Custo: 2 Foco · Nível mínimo: 2')).toBeVisible();
  await fit(page);
  await page.screenshot({
    path: `build/task-0088-chest-reveal/${info.project.name}-card-details.png`,
  });
  await page.reload();
  await page
    .getByRole('button', { name: 'Demonstrar Raro', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Carta sintética de revelação',
      exact: true,
    }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Próximo prêmio' }).click();
  await expect(
    page.getByRole('heading', { name: 'Couraça do Viajante', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Próximo prêmio' }).click();
  await page.getByRole('button', { name: 'Ver resumo' }).click();
  await expect(page.getByRole('dialog').getByRole('listitem')).toHaveCount(3);
  await page.getByRole('button', { name: 'Concluir', exact: true }).click();
  await page.getByRole('checkbox').check();
  for (const [label, rarity] of [
    ['Comum', 'comum'],
    ['Incomum', 'incomum'],
    ['Raro', 'raro'],
    ['Épico', 'épico'],
    ['Extraordinário', 'lendário'],
  ]) {
    await page
      .getByRole('button', { name: `Demonstrar ${label}`, exact: true })
      .click();
    await expect(page.locator('[data-rarity]')).toHaveAttribute(
      'data-rarity',
      rarity,
    );
    await page.getByRole('button', { name: 'Revelar prêmio' }).click();
    await expect(
      page.getByRole('heading', {
        name: 'Carta sintética de revelação',
        exact: true,
      }),
    ).toBeVisible();
    if (info.project.name === 'desktop-chromium') {
      // Let static theme paint settle before recording the exported image.
      await page.waitForTimeout(250);
      await page.screenshot({
        path: `build/task-0088-chest-reveal/theme-${rarity}.png`,
      });
    }
    await page.keyboard.press('Escape');
  }
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).every((k) => k.includes('chest-reveal:')),
    ),
  ).toBe(true);
});
