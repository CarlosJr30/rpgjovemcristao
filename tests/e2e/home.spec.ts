import { expect, test, type Page } from '@playwright/test';

async function navigate(page: Page, label: string) {
  const menu = page.getByRole('button', { name: 'Abrir menu' });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: label }).click();
}

test('navegação leva à Loja, compra aparece na Mochila e equipamento persiste', async ({ page }, testInfo) => {
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Luca');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await navigate(page, 'Loja');
  await expect(page.getByRole('button', { name: 'Moedas insuficientes' }).first()).toBeVisible();
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1';
    const save = JSON.parse(localStorage.getItem(key)!);
    save.travelers[0].coins = 200;
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.goto('/journey');
  await navigate(page, 'Loja');
  await expect(page.getByRole('heading', { name: 'Loja do Viajante' })).toBeVisible();
  const offer = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Espada do Caminho' }) });
  await expect(offer.getByText('Inspiração bíblica · Efésios 6:17')).toBeVisible();
  await offer.getByRole('button', { name: 'Comprar' }).click();
  await expect(page.getByRole('status')).toContainText('Espada do Caminho comprado');
  await expect(page.getByText('165 Moedas do Viajante')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('shop-purchased.png'), fullPage: true });
  await navigate(page, 'Mochila');
  await expect(page.getByRole('heading', { name: 'Espada do Caminho' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Espada do Caminho' })).toBeVisible();
  await navigate(page, 'Equipamentos');
  await page.getByRole('button', { name: 'Equipar', exact: true }).click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: testInfo.outputPath('equipment-flight.png'), fullPage: true });
  await expect(page.getByText('Espada do Caminho equipado.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Desequipar' })).toBeVisible();
  await navigate(page, 'Coleção');
  await expect(page.getByRole('heading', { name: 'Coleção' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Espada do Caminho' })).toBeVisible();
});

test('líder local publica lição e missão que reaparecem após reload', async ({ page }, testInfo) => {
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Sara');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await navigate(page, 'Guilda');
  await page.getByPlaceholder('Código de convite').fill('CELULA01');
  await page.getByRole('button', { name: 'Entrar com código' }).click();
  await page.getByRole('button', { name: 'Painel do líder · simulação local' }).click();
  await page.getByRole('button', { name: '+ Criar Lição' }).click();
  await page.getByLabel('Título', { exact: true }).fill('Lição de serviço');
  await page.getByLabel('Descrição / contexto').fill('Uma conversa sobre serviço.');
  await page.getByLabel('Passagem bíblica').fill('Efésios 6:15');
  await page.getByLabel('Link bíblico (bible.com)').fill('https://www.bible.com/pt/bible/129/EPH.6.15.NVI');
  await page.getByLabel('Tema').fill('Serviço');
  await page.getByLabel('Perguntas para conversa').fill('Como servir hoje?');
  await page.getByRole('button', { name: 'Publicar na Guilda' }).click();
  await expect(page.getByRole('heading', { name: 'Lição de serviço' })).toBeVisible();
  await page.getByRole('button', { name: '+ Criar Missão' }).click();
  await page.getByLabel('Título', { exact: true }).fill('Missão de ajuda');
  await page.getByLabel('Descrição / contexto').fill('Ajudar alguém na comunidade.');
  await page.getByLabel('Passagem bíblica').fill('Efésios 6:15');
  await page.getByLabel('Objetivo').fill('Realizar uma ação concreta de ajuda.');
  await page.getByRole('button', { name: 'Publicar na Guilda' }).click();
  await expect(page.getByRole('heading', { name: 'Missão de ajuda' })).toBeVisible();
  await page.getByRole('button', { name: '+ Criar Desafio' }).click();
  await page.getByLabel('Título', { exact: true }).fill('Desafio da semana');
  await page.getByLabel('Descrição / contexto').fill('Realizar ações de ajuda na Guilda.');
  await page.getByLabel('Passagem bíblica').fill('Efésios 6:15');
  await page.getByLabel('Objetivo').fill('Concluir duas atividades.');
  await page.getByLabel('Formato').selectOption('collective');
  await page.getByLabel('Meta coletiva').fill('2');
  await page.getByLabel('Tier da recompensa').selectOption('great');
  await page.getByRole('button', { name: 'Publicar na Guilda' }).click();
  await expect(page.getByRole('heading', { name: 'Desafio da semana' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('guild-content.png'), fullPage: true });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Lição de serviço' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Missão de ajuda' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Desafio da semana' })).toBeVisible();
  await page.getByRole('button', { name: 'Sair' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sair' }).click();
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Bia');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1';
    const save = JSON.parse(localStorage.getItem(key)!);
    const activeId = localStorage.getItem('rpg-jovem-cristao:active-traveler-id:v1');
    const member = save.travelers.find((entry: { id: string }) => entry.id === activeId);
    member.xp = 120;
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  await navigate(page, 'Guilda');
  await page.getByPlaceholder('Código de convite').fill('CELULA01');
  await page.getByRole('button', { name: 'Entrar com código' }).click();
  await expect(page.getByRole('heading', { name: 'Lição de serviço' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Missão de ajuda' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Desafio da semana' })).toBeVisible();
  await page.locator('article').filter({ has: page.getByRole('heading', { name: 'Missão de ajuda' }) }).getByRole('button', { name: 'Concluir e enviar' }).click();
  await expect(page.getByText('Aguardando aprovação objetiva.')).toBeVisible();
  await page.locator('article').filter({ has: page.getByRole('heading', { name: 'Desafio da semana' }) }).getByRole('button', { name: 'Concluir e enviar' }).click();
  await page.getByRole('button', { name: 'Sair' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sair' }).click();
  await page.locator('article').filter({ has: page.getByRole('heading', { name: 'Sara' }) }).getByRole('button', { name: 'Entrar' }).click();
  await navigate(page, 'Guilda');
  await page.getByRole('button', { name: 'Painel do líder · simulação local' }).click();
  await page.locator('article').filter({ has: page.getByRole('heading', { name: 'Missão de ajuda' }) }).getByRole('button', { name: 'Aprovar realização' }).click();
  await page.locator('article').filter({ has: page.getByRole('heading', { name: 'Desafio da semana' }) }).getByRole('button', { name: 'Aprovar realização' }).click();
  await expect(page.locator('article').filter({ has: page.getByRole('heading', { name: 'Desafio da semana' }) })).toContainText('1/2');
  await page.getByRole('button', { name: 'Sair' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sair' }).click();
  await page.locator('article').filter({ has: page.getByRole('heading', { name: 'Bia' }) }).getByRole('button', { name: 'Entrar' }).click();
  await navigate(page, 'Guilda');
  await page.locator('article').filter({ has: page.getByRole('heading', { name: 'Missão de ajuda' }) }).getByRole('button', { name: 'Receber recompensa' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'NÍVEL 2!' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Abrir Herói' })).toContainText('Nível 2');
  await expect(page.getByRole('button', { name: 'Abrir Herói' })).toContainText('◈ 35');
});

test('limpeza seletiva deixa a home vazia após reabrir e aceita só o novo Viajante', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('rpg-jovem-cristao:journey:v1', JSON.stringify({ version: 2, travelers: [{ id: 'teste-1' }, { id: 'teste-2' }] }));
    localStorage.setItem('rpg-jovem-cristao:active-traveler:v1', 'active');
    localStorage.setItem('rpg-jovem-cristao:active-traveler-id:v1', 'teste-1');
    localStorage.setItem('preferencia-global', 'preservar');
    for (const key of ['rpg-jovem-cristao:journey:v1', 'rpg-jovem-cristao:active-traveler:v1', 'rpg-jovem-cristao:active-traveler-id:v1']) localStorage.removeItem(key);
  });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Criar Viajante' })).toBeVisible();
  const reopened = await page.context().newPage();
  await reopened.goto('/');
  await expect(reopened.getByRole('button', { name: 'Criar Viajante' })).toBeVisible();
  expect(await reopened.evaluate(() => ({ keys: Object.keys(localStorage).sort(), travelers: localStorage.getItem('rpg-jovem-cristao:journey:v1') }))).toEqual({ keys: ['preferencia-global'], travelers: null });
  await reopened.getByRole('button', { name: 'Criar Viajante' }).click();
  await reopened.getByLabel('Nome do Viajante', { exact: true }).fill('Novo Viajante');
  await reopened.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(reopened).toHaveURL('/journey/intro');
  await reopened.reload();
  const saved = await reopened.evaluate(() => JSON.parse(localStorage.getItem('rpg-jovem-cristao:journey:v1') ?? '{}'));
  expect(saved.travelers).toHaveLength(1);
  expect(saved.travelers[0].name).toBe('Novo Viajante');
  expect(await reopened.evaluate(() => localStorage.getItem('preferencia-global'))).toBe('preservar');
});

test('equipamento mostra inspiração bíblica, animação e persiste no Códice', async ({ page }, testInfo) => {
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Bia');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(page).toHaveURL('/journey/intro');
  await page.goto('/journey/equipment');
  await page.getByRole('button', { name: 'Botas' }).click();
  await expect(page.getByText('Inspiração bíblica · Efésios 6:15')).toBeVisible();
  const bible = page.getByRole('link', { name: 'Abrir na Bíblia' });
  await expect(bible).toHaveAttribute('target', '_blank');
  await expect(bible).toHaveAttribute('href', /EPH\.6\.14-17\.NVI/);
  await page.screenshot({ path: testInfo.outputPath('equipment-bible.png'), fullPage: true });
  await page.getByRole('button', { name: 'Desequipar' }).click();
  await page.getByRole('button', { name: 'Equipar', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Botas do Viajante equipado.');
  await page.reload();
  await page.getByRole('button', { name: 'Botas' }).click();
  await expect(page.getByRole('button', { name: 'Desequipar' })).toBeVisible();
  await page.goto('/journey/diary');
  await expect(page.getByRole('heading', { name: 'Equipamentos & Bíblia' })).toBeVisible();
  await expect(page.getByText('Equipamento inicial')).toBeVisible();
  await page.getByRole('button', { name: 'Sair' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.goto('/journey/equipment');
  await page.getByRole('button', { name: 'Botas' }).click();
  await expect(page.getByRole('button', { name: 'Desequipar' })).toBeVisible();
});

test('minigame carrega o Jardim e inicia a perseguição após o preparo', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Lia');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1';
    const save = JSON.parse(localStorage.getItem(key)!);
    const progress = save.travelers[0].progress;
    progress.gardenStep = 'snake';
    progress.gardenFragments = 3;
    progress.bibleReading.genesis2Confirmed = true;
    progress.bibleReading.genesis3Confirmed = true;
    progress.bibleReading.comprehensionCompleted = true;
    progress.devotionalCompleted = true;
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.goto('/journey/phases/o-jardim-e-a-escolha');
  await expect(page.getByRole('button', { name: 'Começar perseguição' })).toBeVisible();
  await page.getByRole('button', { name: 'Começar perseguição' }).click();
  await expect(page.getByRole('application', { name: 'Fuga da Serpente, jogo de perseguição' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('serpent-start.png'), fullPage: true });
  await expect(page.getByText(/Serpente surgiu/)).toBeVisible({ timeout: 5000 });
  expect(errors).toEqual([]);
});

test('fluxo completo, teclado, persistência e mapa acessível', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page).toHaveTitle('RPG Jovem Cristão');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(
    page.getByRole('heading', { name: 'RPG Jovem Cristão', level: 1 }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('01-home.png'),
    fullPage: true,
  });
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Pular para o conteúdo' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Criar Viajante' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/journey/create');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    '2 e 24',
  );
  await page
    .getByLabel('Nome do Viajante', { exact: true })
    .fill('  Ana Clara  ');
  await page.getByLabel('Longo', { exact: true }).check();
  await page.getByLabel('Azul', { exact: true }).check();
  await page.getByLabel('Escuro', { exact: true }).check();
  await expect(page.getByRole('radio')).toHaveCount(11);
  await page.screenshot({
    path: testInfo.outputPath('02-create.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(page).toHaveURL('/journey/intro');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Toda grande jornadacomeça com oprimeiro passo.',
  );
  await page.screenshot({
    path: testInfo.outputPath('03-intro.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Entrar na jornada' }).click();
  await expect(page).toHaveURL('/journey');
  const acts = page.getByRole('list', { name: 'Atos da campanha' });
  await expect(acts.getByRole('listitem')).toHaveCount(8);
  await expect(acts.getByText('Bloqueado', { exact: false })).toHaveCount(7);
  await expect(acts.getByRole('link')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Abrir Herói' })).toContainText('Ana Clara');
  await page.screenshot({
    path: testInfo.outputPath('04-map.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Ver em lista' }).click();
  await expect(page.getByRole('button', { name: 'Ver mapa' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await acts.getByRole('link', { name: /As Origens/ }).click();
  await expect(page).toHaveURL('/journey/acts/as-origens');
  await expect(
    page.getByRole('heading', { level: 1, name: 'As Origens' }),
  ).toBeVisible();
  await expect(page.getByText('Disponível', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Conhecer a fase/ }).click();
  await expect(page).toHaveURL('/journey/phases/o-jardim-e-a-escolha');
  await expect(
    page.getByRole('heading', { level: 1, name: 'O Jardim e a Escolha' }),
  ).toBeVisible();
  await expect(page.getByText('Fuga da Serpente', { exact: false })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('05-phase.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Entrar no jardim' }).click();
  await expect(page.getByRole('application', { name: 'Área explorável do Jardim' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Abrir Herói' })).toContainText('Ana Clara');
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar Jornada' }).click();
  await expect(page).toHaveURL('/journey');
  await page.goto('/journey/create');
  await expect(
    page.getByRole('heading', { name: 'Seu Viajante já está pronto.' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('rota direta sem Viajante e registro corrompido permitem recuperação', async ({
  page,
}) => {
  await page.goto('/journey/phases/o-jardim-e-a-escolha');
  await expect(page).toHaveURL('/');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(page).toHaveURL('/journey/create');
  await page.evaluate(() =>
    localStorage.setItem('rpg-jovem-cristao:journey:v1', '{invalid'),
  );
  await page.reload();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'registro local',
  );
  await page
    .getByLabel('Nome do Viajante', { exact: true })
    .fill('<script>alert(1)</script>');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(
    page.getByText('Use letras, espaços simples, hífen ou apóstrofo.'),
  ).toBeVisible();
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Lia');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(page).toHaveURL('/journey/intro');
});

test('falha ao gravar não simula criação bem-sucedida', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Denied', 'QuotaExceededError');
    };
  });
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Lia');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Não foi possível salvar',
  );
  await expect(page).toHaveURL('/journey/create');
});

test('360 px e movimento reduzido preservam o fluxo', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/journey/create');
  await page
    .getByLabel('Nome do Viajante', { exact: true })
    .fill('Abcdefghijklmnopqrstuvwx');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(page).toHaveURL('/journey/intro');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Entrar na jornada' }).click();
  await expect(
    page.getByRole('heading', { name: 'Mapa da jornada' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole('list', { name: 'Atos da campanha' })
    .getByRole('link')
    .click();
  await page.getByRole('link', { name: /Conhecer a fase/ }).click();
  await expect(
    page.getByRole('heading', { name: 'O Jardim e a Escolha' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
