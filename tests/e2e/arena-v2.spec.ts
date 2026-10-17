import { expect, test, type Page } from '@playwright/test';
import {
  VISUAL_ASSETS,
  trainingPortraitSlot,
} from '../../apps/web/features/journey/data/audiovisualAssets';

async function traveler(
  page: Page,
  level: number,
  attributes = { life: 30, strength: 2, defense: 3, wisdom: 20 },
  xp = 100 * level * (level - 1),
) {
  await page.addInitScript(() =>
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
  );
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Lia Tática');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(page).toHaveURL('/journey/intro');
  // URL changes before all Intro prefetch tasks settle. This fixture immediately
  // performs a hard navigation (not a player's Link click); do not unload that
  // document while WebKit is still starting same-origin RSC fetches.
  await page.getByRole('button', { name: /Entrar na jornada/ }).waitFor();
  await page.waitForLoadState('networkidle');
  // Controlled local E2E fixture, never a production save migration.
  await page.evaluate(
    ({ level, attributes, xp }) => {
      const key = 'rpg-jovem-cristao:journey:v1';
      const save = JSON.parse(localStorage.getItem(key)!);
      const actor = save.travelers[0];
      Object.assign(actor, { level, xp });
      actor.inventory.push({
        id: 'synthetic-arena-v2-fixture',
        name: 'Fixture isolada de combate',
        slot: 'amulet',
        rarity: 'comum',
        power: 0,
        stats: Object.fromEntries(
          Object.entries(attributes).map(([key, value]) => [
            key,
            Math.max(0, value - 1),
          ]),
        ),
      });
      actor.equipped = { amulet: 'synthetic-arena-v2-fixture' };
      localStorage.setItem(key, JSON.stringify(save));
    },
    { level, attributes, xp },
  );
  await page.goto('/journey/arena/legacy');
}
async function begin(page: Page, opponent: string) {
  await page.getByRole('button', { name: new RegExp(opponent + ',') }).click();
  await page.getByRole('button', { name: 'Iniciar batalha' }).click();
  await expect(page.locator('[class*="battleActions"] > button')).toHaveCount(
    3,
  );
}
async function act(page: Page, name: string) {
  const button = page.getByRole('button', { name: new RegExp(name) });
  await expect(button).toBeEnabled();
  await button.click();
  await expect
    .poll(() =>
      button.evaluateAll(
        (buttons) =>
          buttons.length === 0 || !(buttons[0] as HTMLButtonElement).disabled,
      ),
    )
    .toBe(true);
}
const meter = (page: Page) =>
  page.getByRole('meter', { name: 'Foco de Lia Tática' });

test('V2 áudio Arena: eventos sincronizados, silêncio sem mídia e saída limpa', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    const trace: { kind: string; time: number }[] = [];
    Object.assign(window, { arenaAudioTrace: trace });
    window.addEventListener('rpg:arena-sound', (event) => {
      trace.push({
        kind: (event as CustomEvent).detail.kind,
        time: performance.now(),
      });
    });
    localStorage.setItem(
      'rpg-jovem-cristao:audio-preferences:v1',
      JSON.stringify({
        music: true,
        effects: true,
        musicVolume: 0.45,
        effectsVolume: 0.65,
        muted: false,
      }),
    );
  });
  const requested: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/assets/audio/')) requested.push(request.url());
  });
  await traveler(page, 8);
  for (const size of [
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
    { width: 844, height: 390 },
    { width: 915, height: 412 },
  ]) {
    await page.setViewportSize(size);
    await page.goto('/journey/arena/legacy');
    await begin(page, 'Davi');
    await act(page, 'DEFENDER');
    await act(page, 'ATACAR');
    const trace = await page.evaluate(
      () =>
        (
          window as unknown as {
            arenaAudioTrace: { kind: string; time: number }[];
          }
        ).arenaAudioTrace,
    );
    expect(trace.some((event) => event.kind === 'defense')).toBe(true);
    expect(trace.some((event) => event.kind === 'focus')).toBe(true);
    const attack = trace.findIndex((event) => event.kind === 'attack');
    expect(attack).toBeGreaterThanOrEqual(0);
    const contact = trace
      .slice(attack + 1)
      .find((event) => ['impact', 'dodge'].includes(event.kind));
    expect(contact).toBeDefined();
    expect(contact!.time - trace[attack].time).toBeGreaterThanOrEqual(25);
    await page.goto('/journey');
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { arenaAudioTrace: unknown[] }).arenaAudioTrace
            .length,
      ),
    ).toBe(0);
  }
  expect(requested).toEqual([]); // Human approvals are pending; production must keep silent fallback.
});

test('V2 pack real: falha controlada mantém Avatar, monogramas e combate em reduced motion', async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/assets/characters/arena/*.png', (route) =>
    route.abort(),
  );
  await page.route('**/assets/world/arena/*.webp', (route) => route.abort());
  await traveler(page, 8);
  for (const name of ['Davi', 'Elias', 'Mara', 'Noemi']) {
    await page.goto('/journey/arena/legacy');
    await begin(page, name);
    const stage = page.getByTestId('arena-stage');
    await expect(stage.locator('[data-portrait-side="opponent"] b')).toHaveText(
      name[0],
    );
    await expect(
      stage.locator('[data-portrait-side="opponent"] img'),
    ).toHaveCount(0);
    await expect(stage.locator('[data-layer="background"] img')).toHaveCount(0);
    await expect(
      stage.locator('[data-portrait-side="player"] img').first(),
    ).toBeVisible();
    await expect(stage).toHaveCSS('transform', 'none');
    await act(page, 'ATACAR');
    await expect(meter(page)).toHaveAttribute('aria-valuenow', '1');
  }
  expect(errors).toEqual([]);
});

test('V2 nível 1: três escolhas, locks, Defesa útil e save antigo sem novos campos', async ({
  page,
}) => {
  await traveler(page, 1);
  const keys = await page.evaluate(() =>
    Object.keys(
      JSON.parse(localStorage.getItem('rpg-jovem-cristao:journey:v1')!)
        .travelers[0],
    ),
  );
  await begin(page, 'Davi');
  await expect(meter(page)).toHaveAttribute('aria-valuenow', '0');
  await page.getByRole('button', { name: /ESPECIAIS/ }).click();
  const special = page.getByRole('button', { name: /Golpe do Caminho/ });
  await expect(special).toHaveAttribute('aria-disabled', 'true');
  // Intentionally attempt an unavailable action; the engine must keep the turn unchanged.
  await expect(special).toHaveJSProperty('disabled', false);
  await special.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('status').filter({ hasText: 'Desbloqueia no nível 2' }),
  ).toBeVisible();
  await expect(page.locator('[class*="battleRound"]')).toHaveText('RODADA 1');
  await page.getByRole('button', { name: 'Fechar especiais' }).click();
  await act(page, 'DEFENDER');
  await expect(meter(page)).toHaveAttribute('aria-valuenow', '1');
  await expect(page.locator('[class*="battleLog"]')).toContainText('DEFESA');
  await page.reload();
  expect(
    await page.evaluate(() =>
      Object.keys(
        JSON.parse(localStorage.getItem('rpg-jovem-cristao:journey:v1')!)
          .travelers[0],
      ),
    ),
  ).toEqual(keys);
});

for (const [level, ability, nextLocked] of [
  [4, 'Guarda Perseverante', 'Discernimento'],
  [6, 'Discernimento', 'Passo do Peregrino'],
] as const) {
  test(`V2 nível ${level}: limite de desbloqueio e especial disponível no nível exato`, async ({
    page,
  }) => {
    test.setTimeout(45_000);
    await traveler(page, level);
    await begin(page, 'Elias');
    for (let turn = 0; turn < 2; turn++) await act(page, 'DEFENDER');
    await page.getByRole('button', { name: /ESPECIAIS/ }).click();
    await expect(
      page.getByRole('button', { name: new RegExp(nextLocked) }),
    ).toHaveAttribute('aria-disabled', 'true');
    const selected = page.getByRole('button', { name: new RegExp(ability) });
    await expect(selected).toHaveAttribute('aria-disabled', 'false');
    await selected.click();
    await expect(page.locator('[class*="combatAnnouncement"]')).toContainText(
      ability,
    );
    await expect(page.getByRole('button', { name: /ATACAR/ })).toBeEnabled();
    await expect(meter(page)).toHaveAttribute('aria-valuenow', '0');
    if (level === 6)
      await expect(page.locator('[class*="arenaIntent"]')).toContainText(
        'Provável',
      );
    else
      await expect(page.locator('[class*="battleLog"]')).toContainText(
        'Próximo dano reduzido',
      );
  });
}

test('V2 nível 2: vazio, cheio, Foco insuficiente e Golpe do Caminho cinematográfico', async ({
  page,
}, info) => {
  test.setTimeout(60_000);
  await traveler(page, 2);
  await begin(page, 'Mara');
  await page.getByRole('button', { name: /ESPECIAIS/ }).click();
  const special = page.getByRole('button', { name: /Golpe do Caminho/ });
  await expect(special).toHaveAttribute('aria-disabled', 'true');
  await expect(special).toHaveJSProperty('disabled', false);
  await special.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('status').filter({ hasText: 'FOCO INSUFICIENTE' }),
  ).toBeVisible();
  await expect(meter(page)).toHaveAttribute('aria-valuenow', '0');
  await page.getByRole('button', { name: 'Fechar especiais' }).click();
  for (let index = 0; index < 3; index++) await act(page, 'ATACAR');
  await expect(meter(page)).toHaveAttribute('aria-valuenow', '3');
  await page.getByRole('button', { name: /ESPECIAIS/ }).click();
  await special.click();
  const field = page.locator('[class*="battleField"]');
  await expect(field).toHaveAttribute('data-special', 'path-strike');
  await expect(page.getByRole('button', { name: /ATACAR/ })).toBeDisabled();
  await expect(field).toHaveAttribute('data-phase', 'impact');
  await page.screenshot({
    path: info.outputPath('v2-special-impact.png'),
    fullPage: true,
  });
  await expect(page.getByRole('button', { name: /ATACAR/ })).toBeEnabled();
  await expect(meter(page)).toHaveAttribute('aria-valuenow', '1');
});

test('V2 nível 8: Passo esquiva, Discernimento dá vantagem e Guarda reduz dano', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await traveler(page, 8);
  await begin(page, 'Elias');
  for (let index = 0; index < 3; index++) await act(page, 'DEFENDER');
  await page.getByRole('button', { name: /ESPECIAIS/ }).click();
  await page.getByRole('button', { name: /Passo do Peregrino/ }).click();
  await expect(page.locator('[class*="combatAnnouncement"]')).toContainText(
    'ESQUIVOU',
  );
  await expect(page.locator('[data-motion="dodge"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /ATACAR/ })).toBeEnabled();
  await expect(meter(page)).toHaveAttribute('aria-valuenow', '0');
  for (let index = 0; index < 2; index++) await act(page, 'DEFENDER');
  await page.getByRole('button', { name: /ESPECIAIS/ }).click();
  await page.getByRole('button', { name: /Discernimento/ }).click();
  await expect(page.locator('[class*="arenaIntent"]')).toContainText(
    'Provável',
  );
  for (let index = 0; index < 2; index++) await act(page, 'DEFENDER');
  await page.getByRole('button', { name: /ESPECIAIS/ }).click();
  await page.getByRole('button', { name: /Guarda Perseverante/ }).click();
  await expect(page.locator('[class*="combatAnnouncement"]')).toContainText(
    'Guarda Perseverante',
  );
  await expect(page.getByRole('button', { name: /ATACAR/ })).toBeEnabled();
  await expect(page.locator('[class*="battleLog"]')).toContainText(
    'Próximo dano reduzido',
  );
});

test('V2 quatro oponentes nos quatro viewports: Avatar, Foco, impacto, fallback e toque', async ({
  page,
}, info) => {
  test.setTimeout(180_000);
  const errors: string[] = [],
    arenaRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (/\/assets\/(world|characters)\/arena\//.test(request.url()))
      arenaRequests.push(request.url());
  });
  await traveler(page, 8, { life: 30, strength: 20, defense: 10, wisdom: 0 });
  for (const size of [
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(size);
    for (const [opponent, profile] of [
      ['Davi', 'agile'],
      ['Elias', 'offensive'],
      ['Mara', 'guardian'],
      ['Noemi', 'tactical'],
    ]) {
      await page.goto('/journey/arena/legacy');
      await begin(page, opponent);
      const fighters = page.locator('[class*="battleFighter"]');
      await expect(fighters).toHaveCount(2);
      expect(
        await meter(page).evaluate((element) =>
          parseFloat(getComputedStyle(element).fontSize),
        ),
      ).toBeGreaterThanOrEqual(12);
      await expect(fighters.nth(1)).toHaveAttribute('data-profile', profile);
      await expect(fighters.first().locator('img').first()).toBeVisible();
      const slot = trainingPortraitSlot(
        profile === 'agile'
          ? 'training-apprentice'
          : profile === 'offensive'
            ? 'training-balanced'
            : profile === 'guardian'
              ? 'training-guardian'
              : 'training-tactician',
      );
      if (slot && VISUAL_ASSETS[slot])
        await expect(fighters.nth(1).locator('img')).toHaveAttribute(
          'src',
          VISUAL_ASSETS[slot]!.src,
        );
      else
        await expect(
          fighters.nth(1).locator('[class*="trainingAvatar"]'),
        ).toBeVisible();
      for (const button of await page
        .locator('[class*="battleActions"] > button')
        .all()) {
        const box = await button.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(48);
        expect(box!.width).toBeGreaterThanOrEqual(48);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(size.width + 1);
      await page.screenshot({
        path: info.outputPath(`${opponent}-${size.width}.png`),
        fullPage: true,
      });
      await act(page, 'ATACAR');
    }
  }
  expect(errors).toEqual([]);
  const approved = new Set(
    Object.values(VISUAL_ASSETS).flatMap((asset) =>
      asset ? [asset.src, ...(asset.mobileSrc ? [asset.mobileSrc] : [])] : [],
    ),
  );
  expect(
    arenaRequests.filter((url) => !approved.has(new URL(url).pathname)),
  ).toEqual([]);
});

test('V2 vitória, level-up/unlock reais, histórico/reload e derrota com nova tentativa', async ({
  page,
}, info) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    const events: string[] = [];
    Object.assign(window, { settlementAudioEvents: events });
    window.addEventListener('rpg:arena-sound', (event) => {
      events.push((event as CustomEvent).detail.kind);
    });
  });
  const sounds = () =>
    page.evaluate(
      () =>
        (window as unknown as { settlementAudioEvents: string[] })
          .settlementAudioEvents,
    );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await traveler(
    page,
    1,
    { life: 30, strength: 20, defense: 10, wisdom: 20 },
    192,
  );
  await begin(page, 'Davi');
  for (
    let round = 0;
    round < 5 && (await page.getByRole('button', { name: /ATACAR/ }).count());
    round++
  )
    await act(page, 'ATACAR');
  await expect(page.locator('[class*="battleResult"]')).toContainText(
    'VITÓRIA',
  );
  const victorySounds = await sounds();
  expect(victorySounds.filter((kind) => kind === 'victory')).toHaveLength(1);
  expect(victorySounds.at(-1)).toBe('victory');
  expect(victorySounds.slice(0, -1)).toContain('impact');
  const notice = page.locator('[class*="arenaLevelNotice"]');
  await expect(notice).toContainText('NÍVEL 2');
  await expect(notice).toContainText('NOVA HABILIDADE DESBLOQUEADA');
  await expect(notice).toContainText('Golpe do Caminho');
  await expect(notice).toHaveCSS('animation-name', 'none');
  await page.screenshot({
    path: info.outputPath('v2-level-up.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(() => {
      const save = JSON.parse(
        localStorage.getItem('rpg-jovem-cristao:journey:v1')!,
      );
      return [save.travelers[0].level, save.travelers[0].xp];
    }),
  ).toEqual([2, 200]);
  await page.reload();
  await expect(page.locator('[class*="arenaHistory"]')).toContainText(
    'Vitória',
  );
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1';
    const save = JSON.parse(localStorage.getItem(key)!);
    save.travelers[0].equipped = {};
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  await begin(page, 'Elias');
  for (
    let round = 0;
    round < 10 && (await page.getByRole('button', { name: /ATACAR/ }).count());
    round++
  )
    await act(page, 'ATACAR');
  await expect(page.locator('[class*="battleResult"]')).toContainText(
    'TREINO ENCERRADO',
  );
  const defeatSounds = await sounds();
  expect(defeatSounds.filter((kind) => kind === 'defeat')).toHaveLength(1);
  expect(defeatSounds.at(-1)).toBe('defeat');
  expect(defeatSounds.slice(0, -1)).toContain('impact');
  await expect(
    page.getByRole('button', { name: 'Tentar novamente' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(meter(page)).toHaveAttribute('aria-valuenow', '0');
  expect((await sounds()).filter((kind) => kind === 'defeat')).toHaveLength(1);
});
