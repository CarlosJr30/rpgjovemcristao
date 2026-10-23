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

test('product audio controls persist, navigation stays silent without approved media and Tower gate remains intact', async ({
  page,
  context,
}, info) => {
  await context.addInitScript(() => {
    const state = window as unknown as Window & { nativeAudioCalls: number };
    state.nativeAudioCalls = 0;
    HTMLMediaElement.prototype.play = function () {
      state.nativeAudioCalls++;
      return Promise.resolve();
    };
  });
  let audioRequests = 0;
  context.on('request', (request) => {
    if (/\.(ogg|mp3|wav|m4a)(\?|$)/.test(request.url())) audioRequests++;
  });
  await mock(context, {
    opened: false,
    confirmed: false,
    calls: 0,
    operationKey: '',
  });
  await login(page);
  await page.getByRole('button', { name: 'Configurações de áudio' }).click();
  const dialog = page.getByRole('dialog', { name: 'Áudio' });
  await page.getByRole('checkbox', { name: 'Música', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Efeitos', exact: true }).check();
  await page
    .getByRole('slider', { name: 'Volume geral', exact: true })
    .press('End');
  await page
    .getByRole('slider', { name: 'Volume geral', exact: true })
    .press('ArrowLeft');
  await expect(
    page.getByRole('slider', { name: 'Volume geral', exact: true }),
  ).toHaveValue('99');
  await page
    .getByRole('checkbox', { name: 'Música durante leitura e estudo' })
    .check();
  await fit(page);
  await page.screenshot({
    path: `build/task-0089-dynamic-audio/${info.project.name}-product-settings.png`,
  });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Configurações de áudio' }).click();
  await expect(
    page.getByRole('slider', { name: 'Volume geral', exact: true }),
  ).toHaveValue('99');
  await expect(
    page.getByRole('checkbox', { name: 'Música durante leitura e estudo' }),
  ).toBeChecked();
  await page.getByRole('checkbox', { name: 'Silenciar tudo' }).check();
  await page.keyboard.press('Escape');
  await page.goto('/journey/arena');
  await expect(
    page.getByRole('link', { name: 'Torre dos 7 Desafios', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Torre dos 7 Desafios', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Entrar no andar', exact: true }),
  ).toBeDisabled();
  await page.goto('/journey/guild/ebd');
  await page.getByRole('button', { name: 'Configurações de áudio' }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Silenciar tudo' }),
  ).toBeChecked();
  await page.keyboard.press('Escape');
  expect(
    await page.evaluate(
      () =>
        (window as unknown as Window & { nativeAudioCalls: number })
          .nativeAudioCalls,
    ),
  ).toBe(0);
  expect(audioRequests).toBe(0);
});

type AudioSnapshot = {
  src: string;
  volume: number;
  loop: boolean;
  paused: boolean;
  plays: number;
}[];
async function audioSnapshot(page: Page): Promise<AudioSnapshot> {
  return JSON.parse(await page.getByTestId('audio-snapshot').innerText());
}
test('isolated singleton transitions, video priority, data saving, study and rarity effects without audio files', async ({
  page,
  context,
}, info) => {
  let audioRequests = 0;
  context.on('request', (r) => {
    if (/\.(ogg|mp3|wav|m4a)/.test(r.url())) audioRequests++;
  });
  await context.route('**/*', (r) =>
    ['127.0.0.1', 'localhost'].includes(new URL(r.request().url()).hostname)
      ? r.continue()
      : r.abort(),
  );
  await page.goto('http://127.0.0.1:3197');
  await expect(page.getByTestId('audio-snapshot')).toHaveText('[]');
  await page.getByRole('button', { name: 'Ativar ensaio' }).click();
  await expect
    .poll(
      async () =>
        (await audioSnapshot(page)).filter(
          (m) => m.loop && !m.paused && m.volume > 0.3,
        ).length,
    )
    .toBe(1);
  await page
    .getByRole('button', { name: 'Torre inicial', exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await audioSnapshot(page)).find((m) => m.src.includes('tower'))
          ?.volume,
    )
    .toBeGreaterThan(0.2);
  await page.waitForTimeout(700);
  const low = (await audioSnapshot(page)).find((m) => m.src.includes('tower'))!;
  await page
    .getByRole('button', { name: 'Torre superior', exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await audioSnapshot(page)).find((m) => m.src.includes('tower'))
          ?.volume,
    )
    .toBeGreaterThan(low.volume);
  await page.getByRole('button', { name: 'Campeão', exact: true }).click();
  await page.waitForTimeout(750);
  await expect
    .poll(async () =>
      (await audioSnapshot(page))
        .filter((m) => m.loop && !m.paused)
        .map((m) => m.src),
    )
    .toEqual([expect.stringContaining('boss')]);
  await page.getByRole('button', { name: 'Carregar vídeo de youtube' }).click();
  await expect
    .poll(
      async () =>
        (await audioSnapshot(page)).filter((m) => m.loop && !m.paused).length,
    )
    .toBe(0);
  await page.getByRole('button', { name: 'Simular aba oculta' }).click();
  await page
    .getByRole('button', { name: 'Fechar vídeo e retomar ambiente' })
    .click();
  await expect
    .poll(
      async () =>
        (await audioSnapshot(page)).filter((m) => m.loop && !m.paused).length,
    )
    .toBe(0);
  await page.getByRole('button', { name: 'Retomar aba' }).click();
  await expect
    .poll(
      async () =>
        (await audioSnapshot(page)).filter((m) => m.loop && !m.paused).length,
    )
    .toBe(1);
  await page
    .getByRole('button', { name: 'Economia de dados', exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await audioSnapshot(page)).filter((m) => m.loop && !m.paused).length,
    )
    .toBe(0);
  await page.getByRole('button', { name: 'Liberar dados' }).click();
  for (const rarity of ['comum', 'incomum', 'raro', 'épico', 'lendário'])
    await page
      .getByRole('button', { name: `Prêmio ${rarity}`, exact: true })
      .click();
  await expect
    .poll(async () =>
      (await audioSnapshot(page)).some((m) =>
        m.src.includes('chest_extraordinary'),
      ),
    )
    .toBe(true);
  const snapshots = await audioSnapshot(page);
  for (const key of ['common', 'uncommon', 'rare', 'epic', 'extraordinary'])
    expect(snapshots.some((m) => m.src.includes(`chest_${key}`))).toBe(true);
  await page.getByRole('button', { name: 'Estudo', exact: true }).click();
  await page.waitForTimeout(750);
  expect(
    (await audioSnapshot(page)).filter((m) => m.loop && !m.paused),
  ).toHaveLength(0);
  await page
    .getByRole('button', { name: 'Configurar áudio', exact: true })
    .click();
  await page
    .getByRole('checkbox', { name: 'Música durante leitura e estudo' })
    .check();
  await expect
    .poll(
      async () =>
        (await audioSnapshot(page)).filter((m) => m.loop && !m.paused).length,
    )
    .toBe(1);
  await fit(page);
  await page.screenshot({
    path: `build/task-0089-dynamic-audio/${info.project.name}-harness-settings.png`,
  });
  await page.keyboard.press('Escape');
  expect(audioRequests).toBe(0);
  await page.screenshot({
    path: `build/task-0089-dynamic-audio/${info.project.name}-harness-events.png`,
    fullPage: true,
  });
});
