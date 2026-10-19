import { expect, test, type Page } from '@playwright/test';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
} from '../../apps/web/features/journey/domain/traveler';
import { EQUIPMENT_CATALOG } from '../../apps/web/features/journey/data/equipmentCatalog';
import {
  travelerBattleSnapshot,
  TRAINING_OPPONENTS,
} from '../../apps/web/features/journey/data/arena';
import { createCardBattle } from '@rpg/game-engine';

const key = 'rpg-jovem-cristao:journey:v1';
async function setup(page: Page, equipped = true) {
  const traveler = createTraveler(
    'Viajante Cartas',
    DEFAULT_APPEARANCE,
    '00000000-0000-4000-8000-000000000076',
    '2026-10-15T00:00:00.000Z',
  );
  traveler.coins = 100;
  traveler.progress.introCompleted = true;
  if (equipped) {
    traveler.inventory = EQUIPMENT_CATALOG.map((item) => ({
      ...item,
      quantity: 1,
    }));
    traveler.equipped = Object.fromEntries(
      traveler.inventory.map((item) => [item.slot, item.id]),
    );
    traveler.avatar.equippedItems = traveler.equipped;
  }
  const snapshot = travelerBattleSnapshot(traveler);
  let seed = 0;
  while (seed < 10000) {
    const hand = createCardBattle(
      snapshot,
      TRAINING_OPPONENTS[0],
      seed,
      'fixture',
    ).hand;
    if (
      hand.filter((card) => card.cardId === 'powerful').length === 2 &&
      hand.some((card) => card.cardId === 'quick')
    )
      break;
    seed++;
  }
  const origin = new URL(test.info().project.use.baseURL!).origin;
  await page
    .context()
    .route('**/*', (route) =>
      new URL(route.request().url()).origin === origin
        ? route.continue()
        : route.abort(),
    );
  await page.addInitScript(
    ({ traveler, seed }) => {
      localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local');
      if (!localStorage.getItem('rpg-jovem-cristao:journey:v1')) {
        localStorage.setItem(
          'rpg-jovem-cristao:journey:v1',
          JSON.stringify({ version: 2, travelers: [traveler] }),
        );
        localStorage.setItem(
          'rpg-jovem-cristao:active-traveler-id:v1',
          traveler.id,
        );
        localStorage.setItem('rpg-jovem-cristao:active-traveler:v1', 'active');
      }
      Object.defineProperty(crypto, 'getRandomValues', {
        value: (array: Uint32Array) => {
          array[0] = seed;
          return array;
        },
      });
    },
    { traveler, seed },
  );
  await page.goto('/journey/arena');
  await expect(
    page.getByRole('heading', { name: 'Duelo de Cartas', exact: true }),
  ).toBeVisible();
  return traveler;
}
async function begin(page: Page, name = 'Davi, o Aprendiz') {
  await page
    .getByRole('button', { name: `Treinar com ${name}`, exact: true })
    .click();
  await expect(page.locator('[data-card-arena-state]')).toHaveAttribute(
    'data-card-arena-state',
    'player',
  );
  await expect(page.locator('[data-card-id]')).toHaveCount(5);
}
async function transcript(page: Page) {
  return page.evaluate(() => {
    const k = Object.keys(localStorage).find((key) =>
      key.startsWith('rpg-jovem-cristao:card-arena:v1:'),
    )!;
    return JSON.parse(localStorage.getItem(k)!);
  });
}
async function win(page: Page) {
  for (let i = 0; i < 45; i++) {
    const arena = page.locator('[data-card-arena-state]');
    if ((await arena.getAttribute('data-card-arena-state')) === 'finished')
      return;
    await expect
      .poll(async () => arena.getAttribute('data-card-arena-state'))
      .not.toBe('enemy');
    if ((await arena.getAttribute('data-card-arena-state')) === 'finished')
      return;
    const attacks = page.locator(
      '[data-card-id][data-unavailable="false"][data-category="attack"], [data-card-id][data-unavailable="false"][data-category="special"]',
    );
    const available = (await attacks.count())
      ? attacks
      : page.locator('[data-card-id][data-unavailable="false"]');
    if (await available.count()) {
      await available.first().click();
      await page
        .getByRole('button', { name: 'Jogar carta', exact: true })
        .click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
    } else
      await page
        .getByRole('button', { name: 'Encerrar turno', exact: true })
        .click();
  }
  throw Error('Battle did not finish within the scripted action budget');
}
test('20 cards, preview, energy, rapid input, persistence, victory and reward only once', async ({
  page,
}, info) => {
  await setup(page);
  await begin(page);
  await page
    .getByRole('button', { name: /^Ampliar Golpe Poderoso/ })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page
    .getByRole('button', { name: 'Jogar carta', exact: true })
    .evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const first = await transcript(page);
  expect(first.transcript.commands).toHaveLength(1);
  await expect(
    page.getByLabel('Energia 1 de 3', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Energia 1 de 3', { exact: true }).locator('b'),
  ).toHaveCSS('animation-name', /energyChange/);
  await page.screenshot({
    path: info.outputPath('heavy-action.png'),
    fullPage: true,
  });
  await page
    .getByRole('button', { name: /^Ampliar Golpe Poderoso/ })
    .first()
    .click();
  await expect(
    page
      .getByRole('dialog')
      .getByText('Energia insuficiente.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Jogar carta', exact: true }),
  ).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByLabel('Energia 1 de 3', { exact: true }),
  ).toBeVisible();
  expect((await transcript(page)).transcript).toEqual(first.transcript);
  const mirror = await page.context().newPage();
  await mirror.goto('/journey/arena');
  await expect(
    mirror.getByLabel('Energia 1 de 3', { exact: true }),
  ).toBeVisible();
  await win(page);
  await expect(
    page.getByRole('heading', { name: 'Vitória no treino!' }),
  ).toBeVisible();
  await expect(page.getByTestId('card-reward')).toHaveText(
    'Recompensa registrada: +8 XP · +3 moedas',
  );
  await expect(mirror.getByTestId('card-reward')).toHaveText(
    'Recompensa registrada: +8 XP · +3 moedas',
  );
  await mirror.close();
  await page.screenshot({
    path: info.outputPath('victory.png'),
    fullPage: true,
  });
  const after = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).travelers[0],
    key,
  );
  expect(after.coins).toBe(103);
  expect(after.xp).toBe(8);
  await page.reload();
  await expect(page.getByTestId('card-reward')).toHaveText(
    'Recompensa registrada: +8 XP · +3 moedas',
  );
  const reloaded = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).travelers[0],
    key,
  );
  expect(reloaded.coins).toBe(103);
  expect(reloaded.xp).toBe(8);
  expect(reloaded.inventory).toEqual(after.inventory);
  expect(reloaded.equipped).toEqual(after.equipped);
  const old = (await transcript(page)).transcript.id;
  await page
    .getByRole('button', { name: 'Tentar novamente', exact: true })
    .click();
  await expect(page.locator('[data-card-id]')).toHaveCount(5);
  expect((await transcript(page)).transcript.id).not.toBe(old);
  expect((await transcript(page)).transcript.commands).toEqual([]);
  const mobileNavigation = page.getByRole('navigation', {
    name: 'Navegação do jogo',
    exact: true,
  });
  if (await mobileNavigation.isVisible())
    await mobileNavigation
      .getByRole('link', { name: 'Jornada', exact: true })
      .click();
  else {
    const navigation = page.getByRole('navigation', {
      name: 'Navegação principal',
      exact: true,
    });
    if (!(await navigation.isVisible()))
      await page
        .getByRole('button', { name: 'Abrir menu', exact: true })
        .click();
    await navigation
      .getByRole('link', { name: 'Jornada', exact: true })
      .click();
  }
  await expect(page).toHaveURL('/journey');
});
test('mobile matrix, fixed HD identity, equipment cards, text 200%, keyboard and reduced motion', async ({
  page,
}, info) => {
  const fixture = await setup(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await begin(page);
  const field = page.getByLabel('Campo de batalha', { exact: true });
  await expect(
    field.locator('[data-side="player"] [data-avatar-runtime="hd-v1"]'),
  ).toHaveCount(1);
  await expect(field.locator('[data-overlay-item]')).toHaveCount(0);
  await page
    .getByText('Cartas de equipamento · 6 equipadas', { exact: true })
    .click();
  for (const item of fixture.inventory)
    await expect(
      page.getByRole('heading', { name: item.name, exact: true }),
    ).toBeVisible();
  await page
    .getByText('Cartas de equipamento · 6 equipadas', { exact: true })
    .click();
  const screens = [
    [320, 568],
    [360, 800],
    [390, 844],
    [412, 915],
    [430, 932],
    [768, 1024],
    [844, 390],
    [915, 412],
    [1440, 900],
  ];
  for (const [width, height] of screens) {
    await page.setViewportSize({ width, height });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
    const buttons = page.locator('[data-card-id]');
    expect(await buttons.count()).toBe(5);
    for (const button of await buttons.all()) {
      const box = await button.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    const playerArt = field.locator('[data-side="player"] [data-avatar-base]');
    const actor = field.locator('[data-side="player"] [data-motion]');
    const imageBox = (await playerArt.boundingBox())!,
      actorBox = (await actor.boundingBox())!;
    expect(
      imageBox.y,
      `${width}x${height}: full HD top stays in actor frame`,
    ).toBeGreaterThanOrEqual(actorBox.y - 1);
    expect(
      imageBox.y + imageBox.height,
      `${width}x${height}: full HD feet stay in actor frame`,
    ).toBeLessThanOrEqual(actorBox.y + actorBox.height + 1);
    const opponentImage = (await field
      .locator('[data-side="opponent"] picture img')
      .boundingBox())!;
    const opponentActor = (await field
      .locator('[data-side="opponent"] [data-motion]')
      .boundingBox())!;
    expect(
      opponentImage.y + opponentImage.height,
      `${width}x${height}: trainer feet stay in actor frame`,
    ).toBeLessThanOrEqual(opponentActor.y + opponentActor.height + 1);
    await page.screenshot({
      path: info.outputPath(`cards-${width}x${height}.png`),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  for (const button of await page.locator('[data-card-id]').all())
    expect(
      await button.evaluate((node) => node.scrollWidth - node.clientWidth),
    ).toBeLessThanOrEqual(1);
  await page.screenshot({
    path: info.outputPath('cards-text-200.png'),
    fullPage: true,
  });
  await page.evaluate(() => (document.documentElement.style.fontSize = ''));
  const first = page.locator('[data-card-id]').first();
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  const motion = await page.locator('[data-motion="heavy"]').count();
  expect(motion).toBe(0);
  await page.keyboard.press('Shift+Tab');
  expect(
    await page
      .getByRole('dialog')
      .evaluate((dialog) => dialog.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(first).toBeFocused();
  expect(
    await page
      .locator('[data-card-id]')
      .first()
      .evaluate((node) => getComputedStyle(node).animationName),
  ).toBe('none');
  await expect(
    page.getByLabel('Energia 3 de 3', { exact: true }).locator('b'),
  ).toHaveCSS('animation-name', 'none');
});
test('missing training portrait keeps a readable fallback and the duel remains usable', async ({
  page,
}) => {
  await page.route('**/assets/characters/arena/arena_davi.png', (route) =>
    route.abort(),
  );
  await setup(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await begin(page);
  const field = page.getByLabel('Campo de batalha', { exact: true });
  await expect(
    field.getByRole('img', {
      name: 'Retrato de Davi, o Aprendiz indisponível',
    }),
  ).toBeVisible();
  await expect(
    field.getByRole('progressbar', { name: 'Vida de Davi, o Aprendiz' }),
  ).toHaveAttribute('value', '32');
  const revision = (await transcript(page)).transcript.commands.length;
  await page
    .getByRole('button', { name: 'Encerrar turno', exact: true })
    .click();
  await expect
    .poll(async () =>
      Number(
        await page
          .locator('[data-card-arena-state]')
          .getAttribute('data-battle-revision'),
      ),
    )
    .toBeGreaterThanOrEqual(revision + 2);
  await expect(page.locator('[data-card-id]')).toHaveCount(5);
});

test('enemy can defeat the traveler; loss and restart preserve permanent cards and resources', async ({
  page,
}) => {
  const fixture = await setup(page, false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await begin(page, 'Mara, a Guardiã');
  for (let turn = 0; turn < 20; turn++) {
    if (
      (await page
        .locator('[data-card-arena-state]')
        .getAttribute('data-card-arena-state')) === 'finished'
    )
      break;
    const revision = (await transcript(page)).transcript.commands.length;
    await page
      .getByRole('button', { name: 'Encerrar turno', exact: true })
      .click();
    await expect
      .poll(async () =>
        Number(
          await page
            .locator('[data-card-arena-state]')
            .getAttribute('data-battle-revision'),
        ),
      )
      .toBeGreaterThanOrEqual(revision + 2);
  }
  await expect(
    page.getByRole('heading', { name: 'Você pode tentar novamente' }),
  ).toBeVisible();
  await expect(page.getByTestId('card-reward')).toHaveText(
    'Sem recompensa nesta tentativa.',
  );
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).travelers[0],
    key,
  );
  expect(saved.coins).toBe(100);
  expect(saved.xp).toBe(0);
  expect(saved.inventory).toEqual(fixture.inventory);
  await page
    .getByRole('button', { name: 'Tentar novamente', exact: true })
    .click();
  await expect(page.locator('[data-card-id]')).toHaveCount(5);
});
