import { expect, test, type Page } from '@playwright/test';
import { guildMissionRewards } from '@rpg/game-engine';

const screens = [
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 844, height: 390 },
  { width: 915, height: 412 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
async function setup(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
  );
  await page.goto('/journey/create');
  await page
    .getByLabel('Nome do Viajante', { exact: true })
    .fill('Lia da Guilda');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(page).toHaveURL('/journey/intro');
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1';
    const save = JSON.parse(localStorage.getItem(key)!);
    const actor = save.travelers[0];
    actor.progress.guildId = 'guild-task-0043';
    actor.progress.guildChallengeStatus = 'locked';
    localStorage.setItem(
      'rpg-jovem-cristao:local-guilds:v1',
      JSON.stringify([
        {
          id: 'guild-task-0043',
          code: 'GUILDA43',
          name: 'Comunidade dos Viajantes',
          leaderId: actor.id,
          createdAt: new Date().toISOString(),
        },
      ]),
    );
    const template = {
      id: crypto.randomUUID(),
      guildId: 'guild-task-0043',
      kind: 'mission',
      title: 'Preparar nosso encontro',
      description:
        'Organize os materiais do encontro com sua comunidade e confirme a realização.',
      biblicalReference: '',
      bibleUrl: '',
      objective: 'Preparar os materiais',
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
    const pending = {
      ...template,
      id: crypto.randomUUID(),
      title: 'Cooperar na acolhida',
      tier: 'epic',
      audience: 'collective',
      collectiveTarget: 2,
    };
    const completed = {
      ...template,
      id: crypto.randomUUID(),
      title: 'Organizar a sala',
    };
    actor.progress.guildActivities[pending.id] = 'submitted';
    actor.progress.guildActivitySubmittedAt[pending.id] =
      new Date().toISOString();
    actor.progress.guildActivities[completed.id] = 'claimed';
    const other = structuredClone(actor);
    other.id = crypto.randomUUID();
    other.name = 'Bia da Guilda';
    other.progress.guildActivities = { [pending.id]: 'claimed' };
    save.travelers.push(other);
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.setItem(
      'rpg-jovem-cristao:guild-content:v1',
      JSON.stringify([
        template,
        pending,
        completed,
        {
          ...template,
          id: crypto.randomUUID(),
          title: 'Missão expirada',
          date: '2020-01-01',
        },
        {
          ...template,
          id: crypto.randomUUID(),
          title: 'Missão encerrada',
          status: 'closed',
        },
      ]),
    );
  });
}
const board = (page: Page) =>
  page.getByRole('region', { name: 'Lições, missões e desafios', exact: true });
const mission = (page: Page) =>
  board(page)
    .locator('article')
    .filter({
      has: page.getByRole('heading', { name: 'Preparar nosso encontro' }),
    });

test('TASK-0043: player and leader hall in six viewports, sections, keyboard and reduced motion', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  const guildRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/assets/world/guild/'))
      guildRequests.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await setup(page);
  for (const [index, viewport] of screens.entries()) {
    await page.setViewportSize(viewport);
    await page.emulateMedia({
      reducedMotion: index % 2 ? 'reduce' : 'no-preference',
    });
    guildRequests.length = 0;
    await page.goto('/journey/guild');
    const background = page.locator('img[data-guild-art="guildHall"]');
    await expect
      .poll(() =>
        background.evaluate((img) => (img as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    expect(
      await background.evaluate((img) => (img as HTMLImageElement).currentSrc),
    ).toContain(
      viewport.width <= 760 ? 'guild_hall_mobile.webp' : 'guild_hall.webp',
    );
    expect(
      await background.evaluate((img) => getComputedStyle(img).objectFit),
    ).toBe('cover');
    if (viewport.width <= 760)
      expect(
        await page.evaluate(() =>
          performance
            .getEntriesByType('resource')
            .some((entry) =>
              new URL(entry.name).pathname.endsWith('/guild_hall.webp'),
            ),
        ),
      ).toBe(false);
    await expect(page.locator('img[data-guild-art="guildBanner"]')).toHaveCount(
      1,
    );
    await expect(
      page.getByRole('heading', { name: 'Comunidade dos Viajantes' }),
    ).toBeVisible();
    await expect(page.getByText('Líder: Lia da Guilda')).toBeVisible();
    const summary = page.getByLabel('Resumo das atividades carregadas');
    await expect(summary.locator('div').nth(0)).toContainText('1');
    await expect(summary.locator('div').nth(1)).toContainText('1');
    await expect(summary.locator('div').nth(2)).toContainText('1');
    await expect(mission(page)).toBeVisible();
    await expect(
      mission(page).locator('img[data-guild-art="guildMissionParchment"]'),
    ).toHaveCount(1);
    await expect(
      mission(page).locator('img[data-guild-art="guildRewardChest"]'),
    ).toHaveCount(0);
    await expect(mission(page).getByLabel('Recompensa')).toContainText(
      `+${guildMissionRewards.normal.xp} XP`,
    );
    for (const title of [
      'Cooperar na acolhida',
      'Organizar a sala',
      'Missão expirada',
      'Missão encerrada',
    ])
      await expect(page.getByRole('heading', { name: title })).toHaveCount(0);
    const details = mission(page).locator('summary');
    await details.focus();
    await expect(details).toBeFocused();
    await details.press('Enter');
    await expect(
      mission(page).getByText('Objetivo: Preparar os materiais'),
    ).toBeVisible();
    if (index % 2)
      expect(
        await mission(page).evaluate(
          (card) => getComputedStyle(card).animationName,
        ),
      ).toBe('none');
    await page.screenshot({
      path: info.outputPath(`guild-player-${viewport.width}.png`),
      scale: 'css',
      fullPage: true,
    });
    await board(page)
      .getByRole('button', { name: 'Aguardando aprovação', exact: true })
      .click();
    const pending = board(page)
      .locator('article')
      .filter({
        has: page.getByRole('heading', { name: 'Cooperar na acolhida' }),
      });
    await expect(pending).toBeVisible();
    await expect(
      pending.locator('img[data-guild-art="guildRewardChest"]'),
    ).toHaveCount(1);
    await expect(pending.getByRole('progressbar')).toHaveAttribute(
      'value',
      '1',
    );
    await expect(pending.getByRole('progressbar')).toHaveAttribute('max', '2');
    await expect(mission(page)).toHaveCount(0);
    await board(page)
      .getByRole('button', { name: 'Concluídas', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Organizar a sala' }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Painel do líder · simulação local' })
      .click();
    const queue = page.locator('#guild-pending-approvals');
    const table = page.locator('img[data-guild-art="guildLeaderTable"]');
    await table.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        table.evaluate((img) => (img as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await expect(queue).toContainText('Lia da Guilda');
    await expect(queue.getByLabel('Recompensa')).toContainText(
      `+${guildMissionRewards.epic.xp} XP`,
    );
    expect(
      await queue.evaluate((element) =>
        Boolean(
          element.compareDocumentPosition(document.querySelector('form')!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      ),
    ).toBe(true);
    for (const button of await queue.getByRole('button').all()) {
      await button.scrollIntoViewIfNeeded();
      const box = await button.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(viewport.width + 1);
    await page.screenshot({
      path: info.outputPath(`guild-leader-${viewport.width}.png`),
      scale: 'css',
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});

test('TASK-0044: long names stay clear of the banner, and other routes load no Guild artwork', async ({
  page,
}, info) => {
  await setup(page);
  const name = 'Comunidade de Viajantes Unidos em Serviço e Cooperação';
  await page.evaluate((name) => {
    const key = 'rpg-jovem-cristao:local-guilds:v1';
    const guilds = JSON.parse(localStorage.getItem(key)!);
    guilds[0].name = name;
    localStorage.setItem(key, JSON.stringify(guilds));
  }, name);
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/journey/guild');
    const title = page.getByRole('heading', { name, exact: true });
    await expect(title).toBeVisible();
    const titleBox = (await title.boundingBox())!;
    const banner = (await page
      .locator('img[data-guild-art="guildBanner"]')
      .boundingBox())!;
    expect(titleBox.x).toBeGreaterThanOrEqual(banner.x + banner.width);
    expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({
      path: info.outputPath(`guild-long-name-${viewport.width}.png`),
      scale: 'css',
    });
  }
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/assets/world/guild/'))
      requests.push(request.url());
  });
  await page.goto('/journey');
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('img[data-guild-art]')).toHaveCount(0);
  expect(requests).toEqual([]);
});

test('TASK-0044: failed Guild images preserve fallback, keyboard and mission actions', async ({
  page,
}, info) => {
  await setup(page);
  await page.route('**/assets/world/guild/**', (route) => route.abort());
  await page.goto('/journey/guild');
  await expect(page.locator('[data-guild-scene]')).toHaveAttribute(
    'data-guild-scene',
    'fallback',
  );
  const summary = mission(page).locator('summary');
  await summary.focus();
  await summary.press('Enter');
  await expect(
    mission(page).getByText('Objetivo: Preparar os materiais'),
  ).toBeVisible();
  await mission(page)
    .getByRole('button', { name: 'Concluir e enviar' })
    .click();
  await board(page)
    .getByRole('button', { name: 'Aguardando aprovação', exact: true })
    .click();
  await expect(mission(page)).toBeVisible();
  await page
    .getByRole('button', { name: 'Painel do líder · simulação local' })
    .click();
  const queue = page
    .locator('#guild-pending-approvals article')
    .filter({ hasText: 'Preparar nosso encontro' });
  await queue.getByRole('button', { name: 'Aprovar', exact: true }).click();
  await expect(
    page.getByText('ATIVIDADE APROVADA', { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  await page.screenshot({
    path: info.outputPath('guild-image-fallback.png'),
    scale: 'css',
    fullPage: true,
  });
});

test('TASK-0043: submission, leader approval, real reward once and preserved history', async ({
  page,
}, info) => {
  await setup(page);
  await page.goto('/journey/guild');
  const initial = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('rpg-jovem-cristao:journey:v1')!)
        .travelers[0],
  );
  await mission(page)
    .getByRole('button', { name: 'Concluir e enviar' })
    .click();
  await expect(mission(page)).toHaveCount(0);
  await board(page)
    .getByRole('button', { name: 'Aguardando aprovação', exact: true })
    .click();
  await expect(mission(page)).toBeVisible();
  await page
    .getByRole('button', { name: 'Painel do líder · simulação local' })
    .click();
  const queueItem = page
    .locator('#guild-pending-approvals article')
    .filter({ hasText: 'Preparar nosso encontro' });
  await queueItem.getByRole('button', { name: 'Aprovar', exact: true }).click();
  await expect(
    page.getByText('ATIVIDADE APROVADA', { exact: true }),
  ).toBeVisible();
  await expect(queueItem).toHaveCount(0);
  await expect(
    mission(page).getByRole('button', { name: 'Aprovar realização' }),
  ).toHaveCount(0);
  const after = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('rpg-jovem-cristao:journey:v1')!)
        .travelers[0],
  );
  expect(after.xp - initial.xp).toBe(guildMissionRewards.normal.xp);
  expect(after.coins - initial.coins).toBe(guildMissionRewards.normal.coins);
  expect(
    after.chests[guildMissionRewards.normal.chestType] -
      initial.chests[guildMissionRewards.normal.chestType],
  ).toBe(guildMissionRewards.normal.chestQuantity);
  await page.screenshot({
    path: info.outputPath('guild-approval-result.png'),
    scale: 'css',
    fullPage: true,
  });
  await page.reload();
  await board(page)
    .getByRole('button', { name: 'Concluídas', exact: true })
    .click();
  await expect(mission(page)).toBeVisible();
  await expect(mission(page)).toContainText('Recompensa recebida');
  const reloaded = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('rpg-jovem-cristao:journey:v1')!)
        .travelers[0],
  );
  expect(reloaded.xp).toBe(after.xp);
  expect(reloaded.coins).toBe(after.coins);
  expect(reloaded.chests).toEqual(after.chests);
});
