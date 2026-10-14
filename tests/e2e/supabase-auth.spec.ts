import { expect, test } from '@playwright/test';

test('Auth mínimo oferece entrada e criação de conta sem alterar o jogo local', async ({
  page,
}) => {
  await page.goto('/auth');
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
  await expect(page.getByLabel('E-mail')).toBeVisible();
  await expect(page.getByLabel('Senha')).toHaveAttribute(
    'autocomplete',
    'current-password',
  );

  await page.getByRole('button', { name: 'Ainda não tenho conta' }).click();
  await expect(
    page.getByRole('heading', { name: 'Criar conta' }),
  ).toBeVisible();
  await expect(page.getByLabel('Nome de exibição')).toBeVisible();
  await expect(page.getByLabel('Senha')).toHaveAttribute(
    'autocomplete',
    'new-password',
  );
  await page
    .getByRole('button', { name: 'Continuar somente neste navegador' })
    .click();
  await expect(page).toHaveURL('/');
});

test('criação exige login ou modo local explícito e aceita o modo local', async ({
  page,
}) => {
  await page.goto('/journey/create');
  const create = page.getByRole('button', { name: 'Criar Viajante' });
  await expect(create).toBeDisabled();
  await expect(
    page.getByText(/Entre em uma conta ou escolha explicitamente/),
  ).toBeVisible();

  await page.goto('/auth');
  await page
    .getByRole('button', { name: 'Continuar somente neste navegador' })
    .click();
  await page.goto('/journey/create');

  await expect(create).toBeEnabled();
  await page.getByLabel('Nome do Viajante').fill('TesteLocalExplicito');
  await create.click();
  await expect(page).toHaveURL('/journey/intro');
});

test('modo local preserva o primeiro Viajante ao criar e selecionar um segundo', async ({
  page,
}) => {
  await page.goto('/auth');
  await page
    .getByRole('button', { name: 'Continuar somente neste navegador' })
    .click();
  await page.goto('/journey/create');

  await page.getByLabel('Nome do Viajante').fill('Primeiro Viajante');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(page).toHaveURL('/journey/intro');

  await page.goto('/journey/create');
  await expect(
    page.getByText(/Continue o caminho de Primeiro Viajante/),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Criar outro Viajante' }).click();
  await page.getByLabel('Nome do Viajante').fill('Segundo Viajante');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(page).toHaveURL('/journey/intro');

  await page.getByRole('button', { name: 'Abrir Herói' }).click();
  await page
    .getByRole('menuitem', { name: 'Trocar Viajante', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Trocar Viajante', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Escolha seu Viajante' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Primeiro Viajante' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Segundo Viajante' }),
  ).toBeVisible();

  await page
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: 'Primeiro Viajante' }) })
    .getByRole('button', { name: 'Entrar' })
    .click();
  await expect(page).toHaveURL('/journey');
});
