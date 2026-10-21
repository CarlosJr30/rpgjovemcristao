import { expect, test, type Page } from '@playwright/test';
import {
  mockAuthorityAccount,
  loginAuthorityAccount,
} from '../fixtures/authority-browser-account';

async function navigate(page: Page, label: string) {
  const link = page.getByRole('link', { name: label, exact: true });
  if (!(await link.isVisible()))
    await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await link.click();
}

test('cross-feature restored identity retains audio preferences and official gates through Story Arena Tower backpack and logout', async ({
  page,
  context,
}, info) => {
  await mockAuthorityAccount(context);
  await context.addInitScript(() => {
    const state = window as unknown as { nativeAudioCalls006: number };
    state.nativeAudioCalls006 = 0;
    HTMLMediaElement.prototype.play = function () {
      state.nativeAudioCalls006++;
      return Promise.resolve();
    };
  });
  const errors: string[] = [];
  const economicWrites: string[] = [];
  const authorityCommands: string[] = [];
  const ownerFilters: string[] = [];
  let mediaRequests = 0;
  page.on('pageerror', (error) => errors.push(error.message));
  context.on('request', (request) => {
    const url = new URL(request.url());
    if (/\.(ogg|mp3|wav|m4a|mp4|webm)(\?|$)/.test(url.href)) mediaRequests++;
    if (url.pathname.endsWith('/travelers') && request.method() === 'GET')
      ownerFilters.push(url.searchParams.get('user_id') ?? '');
    if (url.pathname === '/api/authority')
      authorityCommands.push(request.postDataJSON().operation);
    if (
      request.method() !== 'GET' &&
      /\/rest\/v1\/(rpc\/)?(add_coins|spend_coins|complete_story|claim_|grant_|open_chest|arena_authority|wallets|inventory|traveler_stats|equipped_items)/.test(
        url.pathname,
      )
    )
      economicWrites.push(url.pathname);
  });
  const fit = async () =>
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  await loginAuthorityAccount(page);
  await info.attach('local-initial-resources.json', {
    body: Buffer.from(
      JSON.stringify(
        await page.evaluate(() => ({
          navigation: performance
            .getEntriesByType('navigation')
            .map((entry) => entry.toJSON()),
          resources: performance.getEntriesByType('resource').map((entry) => {
            const resource = entry as PerformanceResourceTiming;
            return {
              path: new URL(resource.name).pathname,
              duration: resource.duration,
              transferSize: resource.transferSize,
              encodedBodySize: resource.encodedBodySize,
            };
          }),
          limitation:
            'Local synthetic login, not physical or hosted performance; zero transferSize can mean cached resource.',
        })),
      ),
    ),
    contentType: 'application/json',
  });
  await page.getByRole('button', { name: 'Configurações de áudio' }).click();
  const dialog = page.getByRole('dialog', { name: 'Áudio' });
  const close = await page
    .getByRole('button', { name: 'Fechar configurações de áudio' })
    .boundingBox();
  expect(close!.width).toBeGreaterThanOrEqual(44);
  expect(close!.height).toBeGreaterThanOrEqual(44);
  const musicTarget = await dialog
    .locator('label')
    .filter({
      has: page.getByRole('checkbox', { name: 'Música', exact: true }),
    })
    .boundingBox();
  expect(musicTarget!.height).toBeGreaterThanOrEqual(44);
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
  await fit();
  await page.screenshot({
    path: info.outputPath('audio-settings.png'),
    fullPage: true,
  });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Configurações de áudio' }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Música', exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole('slider', { name: 'Volume geral', exact: true }),
  ).toHaveValue('99');
  await page.getByRole('checkbox', { name: 'Silenciar tudo' }).check();
  await page.keyboard.press('Escape');

  await page.getByRole('link', { name: /Modo História · ver mundos/ }).click();
  await expect(
    page.getByRole('list', { name: 'Mundos bíblicos' }).locator(':scope > li'),
  ).toHaveCount(9);
  await fit();
  await page.locator('a[href="/journey/stories/creation"]').first().click();
  await expect(
    page.getByRole('heading', { name: 'A Criação', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Concluir história', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText('Aguardando seleção de um vídeo autorizado.', {
      exact: true,
    }),
  ).toBeVisible();
  await fit();
  await page.screenshot({
    path: info.outputPath('story-candidate.png'),
    fullPage: true,
  });

  await navigate(page, 'Arena');
  await expect(
    page.getByText(
      'Servidor oficial indisponível. Catálogo e combate permanecem bloqueados.',
    ),
  ).toBeVisible();
  await expect(page.getByText('Cartas selecionadas: 0/7')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Iniciar batalha' }),
  ).toBeDisabled();
  await fit();
  await page
    .getByRole('link', { name: 'Torre dos 7 Desafios', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Torre dos 7 Desafios' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Enfrentar/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Retomar pelo servidor' }).click();
  await expect(
    page.getByText(
      /Servidor oficial indisponível. Nenhum resultado local será premiado./,
    ),
  ).toBeVisible();
  await fit();
  await page.screenshot({
    path: info.outputPath('tower-gate.png'),
    fullPage: true,
  });
  await navigate(page, 'Mochila');
  await page.getByRole('tab', { name: /^Baús/ }).click();
  await expect(
    page.getByRole('button', { name: 'Abrir', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Configurações de áudio' }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Silenciar tudo' }),
  ).toBeChecked();
  await page.keyboard.press('Escape');
  await fit();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { nativeAudioCalls006: number })
          .nativeAudioCalls006,
    ),
  ).toBe(0);
  expect(mediaRequests).toBe(0);
  expect(economicWrites).toEqual([]);
  expect(authorityCommands.length).toBeGreaterThan(0);
  expect(
    authorityCommands.every((operation) =>
      ['collection', 'resume', 'tower'].includes(operation),
    ),
  ).toBe(true);
  expect(ownerFilters.length).toBeGreaterThan(0);
  expect(
    ownerFilters.every(
      (filter) => filter === 'eq.00000000-0000-4000-8000-000000000001',
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Abrir Herói', exact: true }).click();
  await page
    .getByRole('menuitem', { name: 'Sair da conta', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Entrar', exact: true }),
  ).toBeVisible();
  await page.goto('/journey/guild/ebd');
  await expect(page).toHaveURL(/\/auth\?next=/);
  expect(errors).toEqual([]);
});
