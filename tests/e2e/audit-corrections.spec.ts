import { expect, test, type Page } from '@playwright/test';

async function createTraveler(page: Page, name: string) {
  await page.goto('/auth');
  await page
    .getByRole('button', { name: 'Continuar somente neste navegador' })
    .click();
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
}
async function navigate(page: Page, label: string) {
  const menu = page.getByRole('button', { name: 'Abrir menu' });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole('navigation', { name: /principal/i })
    .getByRole('link', { name: label })
    .click();
}

test('gate sem Guilda explica o caminho e cria liderança local utilizável', async ({
  page,
}, testInfo) => {
  await createTraveler(page, 'Lia');
  await navigate(page, 'Guilda');
  await expect(
    page.getByText(/Para avançar, participe de uma Guilda/),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Entrar com código' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Informe um código' }),
  ).toBeVisible();
  await page.getByLabel('Código da Guilda').fill('NAOEXISTE');
  await page.getByRole('button', { name: 'Entrar com código' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'inválido ou inexistente' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Criar Guilda de teste' }).click();
  await expect(
    page.getByRole('heading', { name: 'PAINEL DO LÍDER' }),
  ).toBeVisible();
  await expect(
    page.getByText(/Líder local · ambiente de desenvolvimento/),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: '+ Criar Desafio' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: '+ Criar Lição' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: '+ Criar Missão' }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('leader-local-panel.png'),
    fullPage: true,
  });
});

test('Arena explica poder e separa efeito automático de habilidade ativa', async ({
  page,
}, testInfo) => {
  await createTraveler(page, 'Ravi');
  await navigate(page, 'Arena');
  await page.getByText('Como é calculado?').click();
  await expect(
    page.getByText(
      'Estimativa para aproximar adversários. Não determina quem vence.',
    ),
  ).toBeVisible();
  await expect(page.getByText('Atributos').last()).toBeVisible();
  await page.getByRole('button', { name: /Davi, o Aprendiz/ }).click();
  await page.getByRole('button', { name: 'Iniciar batalha' }).click();
  await expect(page.getByRole('button', { name: /ESPECIAIS/ })).toContainText(
    'Use seu Foco',
  );
  await expect(
    page.getByRole('heading', { name: 'EFEITOS PASSIVOS E AUTOMÁTICOS' }),
  ).toBeVisible();
  await expect(page.getByText('Passo do Peregrino')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('arena-effect-types.png'),
    fullPage: true,
  });
});

test('tutorial opcional da Fuga pode ser consultado e início registra a orientação', async ({
  page,
}, testInfo) => {
  await createTraveler(page, 'Teo');
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1';
    const save = JSON.parse(localStorage.getItem(key)!);
    save.travelers[0].progress.gardenStep = 'snake';
    save.travelers[0].progress.bibleReading.genesis2Confirmed = true;
    save.travelers[0].progress.bibleReading.genesis3Confirmed = true;
    save.travelers[0].progress.bibleReading.comprehensionCompleted = true;
    save.travelers[0].progress.devotionalCompleted = true;
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.goto('/journey/phases/o-jardim-e-a-escolha');
  await expect(
    page.getByText(/Encontre 3 Fragmentos de Sabedoria/),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Como jogar', exact: true }).click();
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await expect(page.getByText(/Fragmentos de Luz valem pontos/)).toBeVisible();
  await expect(page.getByText(/Escudo protege contra um ataque/)).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('snake-first-run-tutorial.png'),
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Fechar painel', exact: true })
    .click();
  await page.getByRole('button', { name: 'Começar' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Começar' })).toBeVisible();
  await expect(page.getByText(/Fragmentos de Luz valem pontos/)).toHaveCount(0);
});
