import { expect, test, type Page } from '@playwright/test';
import { EQUIPMENT_CATALOG } from '../../apps/web/features/journey/data/equipmentCatalog';

const screens = [
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
async function createTraveler(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
  );
  await page.goto('/journey/create');
  await page
    .getByLabel('Nome do Viajante', { exact: true })
    .fill('Lia da Jornada');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(page).toHaveURL('/journey/intro');
}

test('TASK-0037: telas principais nos cinco viewports, arte local e navegação', async ({
  page,
}, info) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await createTraveler(page);
  for (const size of screens) {
    await page.setViewportSize(size);
    for (const [route, name] of [
      ['/', 'home'],
      ['/journey', 'journey'],
      ['/journey/arena', 'arena'],
      ['/journey/guild', 'guild'],
      ['/journey/equipment', 'equipment'],
      ['/journey/backpack', 'backpack'],
      ['/journey/diary', 'diary'],
    ]) {
      await page.goto(route);
      await expect(page.locator('main h1').first()).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(size.width + 1);
      const audio = await page
        .getByRole('button', { name: 'Configurações de áudio' })
        .boundingBox();
      expect(audio!.width).toBeGreaterThanOrEqual(48);
      expect(audio!.height).toBeGreaterThanOrEqual(48);
      expect(audio!.x + audio!.width).toBeLessThanOrEqual(size.width + 1);
      if (name === 'home' || name === 'journey') {
        const spotlight = page.getByRole('region', {
          name: 'Sua jornada atual',
        });
        await expect(
          spotlight.getByRole('link', { name: 'Continuar jornada' }),
        ).toHaveAttribute('href', '/journey/phases/o-jardim-e-a-escolha');
        await expect(spotlight.getByRole('progressbar')).toHaveAttribute(
          'max',
          '11',
        );
      }
      if (name === 'diary') {
        const contrast = await page
          .getByRole('link', { name: 'Abrir Gênesis 2 na Bíblia' })
          .evaluate((link) => {
            const luminance = (color: string) => {
              const components = color
                .match(/[\d.]+/g)!
                .slice(0, 3)
                .map(Number)
                .map((channel) => {
                  const value = channel / 255;
                  return value <= 0.04045
                    ? value / 12.92
                    : ((value + 0.055) / 1.055) ** 2.4;
                });
              return (
                components[0] * 0.2126 +
                components[1] * 0.7152 +
                components[2] * 0.0722
              );
            };
            const foreground = luminance(getComputedStyle(link).color);
            const surface = getComputedStyle(
              link.parentElement!.parentElement!,
            );
            const backgrounds = surface.backgroundImage.match(
              /rgba?\([^)]+\)/g,
            ) ?? [surface.backgroundColor];
            return Math.min(
              ...backgrounds.map((color) => {
                const background = luminance(color);
                return (
                  (Math.max(foreground, background) + 0.05) /
                  (Math.min(foreground, background) + 0.05)
                );
              }),
            );
          });
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      }
      await page.screenshot({
        path: info.outputPath(`${name}-${size.width}x${size.height}.png`),
        fullPage: true,
      });
    }
  }
  await page.goto('/journey');
  const menu = page.getByRole('button', { name: 'Abrir menu' });
  if (await menu.isVisible()) await menu.click();
  const nav = page.getByRole('navigation', { name: 'Navegação principal' });
  await expect(
    nav.getByRole('link', { name: 'Jornada', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  expect(await nav.locator('svg').count()).toBe(10);
  await nav.getByRole('link', { name: 'Arena', exact: true }).click();
  await expect(page).toHaveURL('/journey/arena');
  expect(errors).toEqual([]);
});

test('TASK-0037: áudio acessível, gesto, volume e preferências após reload', async ({
  page,
}, info) => {
  await createTraveler(page);
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/assets/audio/')) requests.push(request.url());
  });
  await page.goto('/journey');
  for (const size of [
    ...screens,
    { width: 844, height: 390 },
    { width: 915, height: 412 },
  ]) {
    await page.setViewportSize(size);
    await page.getByRole('button', { name: 'Configurações de áudio' }).click();
    const dialog = page.getByRole('dialog', { name: 'Áudio', exact: true });
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(size.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(size.height);
    await page.screenshot({ path: info.outputPath(`audio-${size.width}.png`) });
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('button', { name: 'Configurações de áudio' }),
    ).toBeFocused();
  }
  await page.getByRole('button', { name: 'Configurações de áudio' }).click();
  await page.getByLabel('Música', { exact: true }).check();
  await page.getByLabel('Efeitos', { exact: true }).check();
  const musicVolume = page.getByRole('slider', {
    name: 'Volume música',
    exact: true,
  });
  await musicVolume.focus();
  await musicVolume.press('End');
  await musicVolume.press('ArrowLeft');
  const effectsVolume = page.getByRole('slider', {
    name: 'Volume efeitos',
    exact: true,
  });
  await effectsVolume.focus();
  await effectsVolume.press('Home');
  await page.getByLabel('Silenciar tudo').check();
  await page.reload();
  await page.getByRole('button', { name: 'Configurações de áudio' }).click();
  await expect(page.getByLabel('Música', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Efeitos', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Silenciar tudo')).toBeChecked();
  await expect(musicVolume).toHaveValue('99');
  await expect(effectsVolume).toHaveValue('0');
  await effectsVolume.focus();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Fechar configurações de áudio' }),
  ).toBeFocused();
  expect(requests).toEqual([]);
});

test('TASK-0037: Guilda jogador guarda concluídas no histórico e remove expiradas', async ({
  page,
}, info) => {
  await createTraveler(page);
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1';
    const save = JSON.parse(localStorage.getItem(key)!);
    const traveler = save.travelers[0];
    traveler.progress.guildId = 'guild-celula01';
    const item = {
      id: crypto.randomUUID(),
      guildId: 'guild-celula01',
      kind: 'mission',
      title: 'Missão disponível',
      description: 'Uma tarefa da célula.',
      biblicalReference: '',
      bibleUrl: '',
      objective: 'Servir em comunidade',
      date: '',
      theme: '',
      questions: '',
      groupActivity: '',
      practicalMission: '',
      difficulty: 'normal',
      audience: 'individual',
      collectiveTarget: null,
      tier: 'normal',
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    const completed = {
      ...item,
      id: crypto.randomUUID(),
      title: 'Missão concluída',
    };
    traveler.progress.guildActivities[completed.id] = 'claimed';
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.setItem(
      'rpg-jovem-cristao:guild-content:v1',
      JSON.stringify([
        item,
        completed,
        {
          ...item,
          id: crypto.randomUUID(),
          title: 'Missão expirada',
          date: '2020-01-01',
        },
        {
          ...item,
          id: crypto.randomUUID(),
          title: 'Missão encerrada',
          status: 'closed',
        },
      ]),
    );
  });
  await page.goto('/journey/guild');
  await expect(
    page.getByRole('heading', { name: 'Missão disponível' }),
  ).toBeVisible();
  for (const title of [
    'Missão concluída',
    'Missão expirada',
    'Missão encerrada',
  ])
    await expect(page.getByRole('heading', { name: title })).toHaveCount(0);
  await page.getByRole('button', { name: 'Concluídas', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Missão concluída' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Concluir e enviar' }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath('guild-player-history.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Disponíveis', exact: true }).click();
  await page.getByRole('button', { name: 'Concluir e enviar' }).click();
  await expect(
    page.getByRole('heading', { name: 'Missão disponível' }),
  ).toHaveCount(0);
  await expect(
    page.getByText('Novas missões da sua célula aparecerão aqui.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Aguardando aprovação' }).click();
  await expect(
    page.getByRole('heading', { name: 'Missão disponível' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Missão concluída' }),
  ).toHaveCount(0);
});

test('TASK-0037: Arena apresenta habilidade, atacante/alvo/dano, defesa e resultado real', async ({
  page,
}, info) => {
  test.setTimeout(60_000);
  await createTraveler(page);
  await page.evaluate((items) => {
    const key = 'rpg-jovem-cristao:journey:v1';
    const save = JSON.parse(localStorage.getItem(key)!);
    const traveler = save.travelers[0];
    traveler.inventory = items;
    traveler.level = 2;
    traveler.xp = 200;
    traveler.equipped = {
      weapon: 'traveler-sword-common',
      boots: 'traveler-boots',
    };
    localStorage.setItem(key, JSON.stringify(save));
  }, EQUIPMENT_CATALOG);
  await page.goto('/journey/arena');
  await page.getByRole('button', { name: /Davi, o Aprendiz/ }).click();
  await page.getByRole('button', { name: 'Iniciar batalha' }).click();
  const announcement = page.locator('[class*="combatAnnouncement"]');
  for (let turn = 0; turn < 2; turn++) {
    const defend = page.getByRole('button', { name: /DEFENDER/ });
    await defend.click();
    await expect(defend).toBeEnabled();
  }
  await page.getByRole('button', { name: /ESPECIAIS/ }).click();
  await page.getByRole('button', { name: /Golpe do Caminho/ }).click();
  await expect(announcement).toContainText('Golpe do Caminho');
  await expect(announcement).toContainText('→');
  await expect(page.locator('[class*="combatFloat"]').first()).toContainText(
    'VIDA',
  );
  await expect(page.getByRole('button', { name: /ATACAR/ })).toBeDisabled();
  await page.screenshot({
    path: info.outputPath('arena-skill-impact.png'),
    fullPage: true,
  });
  const defend = page.getByRole('button', { name: /DEFENDER/ });
  await expect(defend).toBeEnabled();
  await defend.click();
  await expect(announcement).toContainText('DEFESA');
  await expect(defend).toBeEnabled();
  await expect(
    page.getByRole('meter', { name: 'Foco de Lia da Jornada' }),
  ).toHaveAttribute('aria-valuenow', '1');
  for (
    let i = 0;
    i < 12 && (await page.getByRole('button', { name: /ATACAR/ }).count());
    i++
  ) {
    const attack = page.getByRole('button', { name: /ATACAR/ });
    await expect(attack).toBeEnabled();
    await attack.click();
    await expect
      .poll(() =>
        attack.evaluateAll(
          (buttons) =>
            buttons.length === 0 || !(buttons[0] as HTMLButtonElement).disabled,
        ),
      )
      .toBe(true);
  }
  await expect(
    page.getByRole('button', { name: 'Voltar à Arena' }),
  ).toBeVisible();
  const history = await page.evaluate(() =>
    localStorage.getItem('rpg-jovem-cristao:arena:v1'),
  );
  expect(history).toBeTruthy();
  await page.screenshot({
    path: info.outputPath('arena-result.png'),
    fullPage: true,
  });
});

test('TASK-0037: reduced motion mantém informações e remove movimento decorativo', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await createTraveler(page);
  await page.goto('/journey');
  expect(
    await page
      .locator('[class*="areaArrival"]')
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none');
  await expect(
    page.getByRole('link', { name: 'Continuar jornada' }),
  ).toBeVisible();
  await page.goto('/journey/arena');
  await page.getByRole('button', { name: /Davi, o Aprendiz/ }).click();
  await page.getByRole('button', { name: 'Iniciar batalha' }).click();
  await page.getByRole('button', { name: /ATACAR/ }).click();
  await expect(page.locator('[class*="combatAnnouncement"]')).toContainText(
    'VIDA',
  );
  expect(
    await page
      .locator('[class*="battleField"]')
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none');
});
