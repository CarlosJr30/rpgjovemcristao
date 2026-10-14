import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

type Probe = {
  events: string[];
  calls: { media: HTMLMediaElement; started: boolean; error: string }[];
};
async function setup(page: Page, strong = false, seedAudio = true) {
  await page.context().route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.protocol.startsWith('http') &&
      (url.hostname !== '127.0.0.1' || url.port !== '3110')
      ? route.abort()
      : route.continue();
  });
  await page.addInitScript((seedAudio) => {
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local');
    const key = 'rpg-jovem-cristao:audio-preferences:v1';
    if (seedAudio && !localStorage.getItem(key))
      localStorage.setItem(
        key,
        JSON.stringify({
          music: true,
          effects: true,
          musicVolume: 0.45,
          effectsVolume: 0.65,
          muted: false,
        }),
      );
    const probe: Probe = { events: [], calls: [] };
    Object.assign(window, { prototypeAudioProbe: probe });
    window.addEventListener('rpg:arena-sound', (event) =>
      probe.events.push((event as CustomEvent).detail.kind),
    );
    const play = HTMLMediaElement.prototype.play;
    // Observe the real singleton and native playback; never replace media,
    // force unlock, mute, or suppress browser autoplay policy.
    HTMLMediaElement.prototype.play = function () {
      const call = { media: this, started: false, error: '' };
      probe.calls.push(call);
      return play.call(this).then(
        () => {
          call.started = true;
        },
        (error: Error) => {
          call.error = error.name;
          throw error;
        },
      );
    };
  }, seedAudio);
  await page.goto('/journey/create');
  await page
    .getByLabel('Nome do Viajante', { exact: true })
    .fill('Lia Protótipo');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(page).toHaveURL('/journey/intro');
  await page.evaluate((strong) => {
    const key = 'rpg-jovem-cristao:journey:v1';
    const save = JSON.parse(localStorage.getItem(key)!);
    const actor = save.travelers[0];
    Object.assign(actor, { level: 8, xp: 5600 });
    actor.inventory.push({
      id: 'audio-e2e-fixture',
      name: 'Fixture isolada de áudio',
      slot: 'amulet',
      rarity: 'comum',
      power: 0,
      stats: {
        life: 29,
        strength: strong ? 19 : 1,
        defense: strong ? 9 : 2,
        wisdom: 19,
      },
    });
    actor.equipped = { amulet: 'audio-e2e-fixture' };
    localStorage.setItem(key, JSON.stringify(save));
  }, strong);
}
async function snapshot(page: Page) {
  return page.evaluate(() => {
    const probe = (window as unknown as { prototypeAudioProbe: Probe })
      .prototypeAudioProbe;
    const media = [...new Set(probe.calls.map((call) => call.media))];
    return {
      events: probe.events,
      calls: probe.calls.map((call) => ({
        file: new URL(call.media.src).pathname,
        started: call.started,
        error: call.error,
        loop: call.media.loop,
        volume: call.media.volume,
      })),
      media: media.map((audio) => ({
        file: new URL(audio.src).pathname,
        loop: audio.loop,
        volume: audio.volume,
        paused: audio.paused,
        ended: audio.ended,
        currentTime: audio.currentTime,
        readyState: audio.readyState,
      })),
    };
  });
}
async function begin(page: Page, opponent = 'Davi') {
  await page.getByRole('button', { name: new RegExp(opponent + ',') }).click();
  await page.getByRole('button', { name: 'Iniciar batalha' }).click();
  await expect(page.getByRole('button', { name: /ATACAR/ })).toBeVisible();
}
async function act(page: Page, action: string) {
  const button = page.getByRole('button', { name: new RegExp(action) });
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
async function musicPlaying(page: Page) {
  await expect
    .poll(async () =>
      (await snapshot(page)).media.some(
        (media) => media.loop && !media.paused && media.currentTime > 0,
      ),
    )
    .toBe(true);
}

test('DEV prototype: visible audio activation recovers defaults, mute and zero volumes on the live app', async ({
  page,
}, info) => {
  await setup(page, false, false);
  await page.goto('/journey/arena');
  const activate = page.getByRole('button', { name: 'Ativar e testar som' });
  await expect(activate).toBeVisible();
  expect((await snapshot(page)).calls).toEqual([]);
  await page.getByRole('button', { name: 'Configurações de áudio' }).click();
  await expect(page.getByLabel('Música', { exact: true })).not.toBeChecked();
  await expect(page.getByLabel('Efeitos', { exact: true })).not.toBeChecked();
  await page.keyboard.press('Escape');
  await activate.click();
  await musicPlaying(page);
  await expect
    .poll(async () =>
      (await snapshot(page)).calls.some(
        (call) =>
          call.file.endsWith('/arena_attack.ogg') &&
          call.started &&
          !call.error,
      ),
    )
    .toBe(true);
  await page.getByRole('button', { name: 'Configurações de áudio' }).click();
  await expect(page.getByLabel('Música', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Efeitos', { exact: true })).toBeChecked();
  for (const name of ['Volume música', 'Volume efeitos']) {
    await page.getByRole('slider', { name, exact: true }).focus();
    await page.getByRole('slider', { name, exact: true }).press('Home');
  }
  await page.getByLabel('Silenciar tudo').check();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(activate).toBeVisible();
  expect((await snapshot(page)).calls).toEqual([]);
  await activate.click();
  await musicPlaying(page);
  await expect
    .poll(
      async () =>
        (await snapshot(page)).media.find(
          (media) => media.loop && !media.paused,
        )?.volume,
    )
    .toBeCloseTo(0.315, 3);
  await page.getByRole('button', { name: 'Configurações de áudio' }).click();
  await expect(page.getByLabel('Silenciar tudo')).not.toBeChecked();
  await expect(
    page.getByRole('slider', { name: 'Volume efeitos', exact: true }),
  ).toHaveValue('65');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(activate).toBeInViewport();
  await page.screenshot({
    path: info.outputPath('audio-activation-mobile.png'),
  });
  await writeFile(
    info.outputPath('audio-activation.json'),
    JSON.stringify(await snapshot(page), null, 2),
  );
});

test('DEV prototype: real singleton playback, trusted gesture, mix, prefs and cleanup in six viewports', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await setup(page);
  const evidence = [];
  for (const [index, size] of [
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 844, height: 390 },
    { width: 915, height: 412 },
  ].entries()) {
    await page.setViewportSize(size);
    await page.emulateMedia({
      reducedMotion: index >= 4 ? 'reduce' : 'no-preference',
    });
    await page.goto('/journey/arena');
    await expect(page.getByRole('button', { name: /Davi,/ })).toBeVisible();
    expect((await snapshot(page)).calls).toEqual([]); // Preferences alone never unlock.
    await begin(page);
    await musicPlaying(page);
    await expect
      .poll(
        async () =>
          (await snapshot(page)).media.find(
            (media) => media.loop && !media.paused,
          )?.volume,
      )
      .toBeCloseTo(index === 0 ? 0.315 : 0.7, 3);
    await act(page, 'DEFENDER');
    await act(page, 'ATACAR');
    const state = await snapshot(page);
    for (const [event, file] of [
      ['attack', 'arena_attack'],
      ['defense', 'arena_defense'],
      ['focus', 'arena_focus'],
      ['dodge', 'arena_dodge'],
      ['impact', 'player_hit'],
    ])
      expect(
        state.calls.filter((call) => call.file.endsWith(`/${file}.ogg`)),
      ).toHaveLength(state.events.filter((kind) => kind === event).length);
    expect(
      state.calls
        .filter((call) => call.file.includes('/effects/'))
        .every((call) => call.started && !call.error),
    ).toBe(true);
    expect(
      state.media.filter((media) => media.loop && !media.paused),
    ).toHaveLength(1);
    expect(
      state.media.filter(
        (media) => !media.loop && !media.paused && !media.ended,
      ).length,
    ).toBeLessThanOrEqual(4);
    await page.getByRole('button', { name: 'Configurações de áudio' }).click();
    await expect(
      page.getByText(
        'Sons da Arena disponíveis para protótipo não comercial.',
        { exact: false },
      ),
    ).toBeVisible();
    await page.screenshot({
      path: info.outputPath(`prototype-${size.width}.png`),
    });
    const musicVolume = page.getByRole('slider', {
      name: 'Volume música',
      exact: true,
    });
    const effectsVolume = page.getByRole('slider', {
      name: 'Volume efeitos',
      exact: true,
    });
    await musicVolume.focus();
    await musicVolume.press('End');
    await effectsVolume.focus();
    await effectsVolume.press('End');
    await page.getByLabel('Silenciar tudo').check();
    await expect
      .poll(async () =>
        (await snapshot(page)).media.some(
          (media) => !media.paused && !media.ended,
        ),
      )
      .toBe(false);
    await page.getByLabel('Silenciar tudo').uncheck();
    await musicPlaying(page);
    await page.keyboard.press('Escape');
    evidence.push({ size, ...(await snapshot(page)) });
    await page.reload();
    await expect(page.getByRole('button', { name: /Davi,/ })).toBeVisible();
    expect((await snapshot(page)).calls).toEqual([]);
    await page.getByRole('button', { name: 'Configurações de áudio' }).click();
    await expect(musicVolume).toHaveValue('100');
    await expect(effectsVolume).toHaveValue('100');
    await expect(page.getByLabel('Silenciar tudo')).not.toBeChecked();
    await page.keyboard.press('Escape');
    await musicPlaying(page);
    const menu = page.getByRole('button', { name: 'Abrir menu' });
    if (await menu.isVisible()) await menu.click();
    await page
      .getByRole('navigation', { name: 'Navegação principal' })
      .getByRole('link', { name: 'Jornada', exact: true })
      .click();
    await expect(page).toHaveURL('/journey');
    await expect
      .poll(async () =>
        (await snapshot(page)).media.some(
          (media) => !media.paused && !media.ended,
        ),
      )
      .toBe(false);
  }
  expect(errors).toEqual([]);
  await writeFile(
    info.outputPath('prototype-playback.json'),
    JSON.stringify(evidence, null, 2),
  );
});

test('DEV prototype: dodge, special, victory and defeat use actual media once per semantic event', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await setup(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/journey/arena');
  await begin(page, 'Elias');
  for (let round = 0; round < 3; round++) await act(page, 'DEFENDER');
  await page.getByRole('button', { name: /ESPECIAIS/ }).click();
  await page.getByRole('button', { name: /Passo do Peregrino/ }).click();
  await expect(page.getByRole('button', { name: /ATACAR/ })).toBeEnabled();
  const dodge = await snapshot(page);
  expect(dodge.events).toContain('special');
  expect(dodge.events).toContain('dodge');
  expect(
    dodge.calls.filter((call) => call.file.endsWith('/arena_dodge.ogg')),
  ).toHaveLength(dodge.events.filter((kind) => kind === 'dodge').length);
  expect(
    dodge.calls.filter((call) => call.file.endsWith('/arena_focus.ogg')),
  ).toHaveLength(
    dodge.events.filter((kind) => ['special', 'focus'].includes(kind)).length,
  );
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1';
    const save = JSON.parse(localStorage.getItem(key)!);
    save.travelers[0].inventory.find(
      (item: { id: string }) => item.id === 'audio-e2e-fixture',
    ).stats.strength = 39;
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  await begin(page);
  for (
    let round = 0;
    round < 5 && (await page.getByRole('button', { name: /ATACAR/ }).count());
    round++
  )
    await act(page, 'ATACAR');
  await expect(page.locator('[class*="battleResult"]')).toContainText(
    'VITÓRIA',
  );
  await expect
    .poll(
      async () =>
        (await snapshot(page)).calls.filter(
          (call) => call.file.endsWith('/victory.ogg') && call.started,
        ).length,
    )
    .toBe(1);
  const victory = await snapshot(page);
  expect(victory.events.at(-1)).toBe('victory');
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
  await expect
    .poll(
      async () =>
        (await snapshot(page)).calls.filter(
          (call) => call.file.endsWith('/defeat.ogg') && call.started,
        ).length,
    )
    .toBe(1);
  const defeat = await snapshot(page);
  expect(defeat.events.at(-1)).toBe('defeat');
  expect(
    [...dodge.calls, ...victory.calls, ...defeat.calls].every(
      (call) => call.started && !call.error,
    ),
  ).toBe(true);
  await writeFile(
    info.outputPath('prototype-events-and-results.json'),
    JSON.stringify({ dodge, victory, defeat }, null, 2),
  );
});

test('DEV prototype: failed audio requests never block combat or input', async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await setup(page, true);
  await page.route('**/assets/audio/**', (route) => route.abort());
  await page.goto('/journey/arena');
  await begin(page);
  await act(page, 'ATACAR');
  await expect(
    page.locator('[class*="battleRound"], [class*="battleResult"]').first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
