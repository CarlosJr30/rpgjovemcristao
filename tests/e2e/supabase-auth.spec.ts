import { expect, test } from '@playwright/test';

test('entrada oferece somente login/cadastro em desktop e celular', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /somente neste navegador|localmente/i })).toHaveCount(0);
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();
  await expect(page.getByLabel('Senha')).toHaveAttribute('autocomplete', 'new-password');
  await expect(page.getByRole('button', { name: /somente neste navegador/i })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('account-only-entry.png'), fullPage: true });
});

test('flag local antiga não libera o jogo nem apaga saves antigos', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local');
    localStorage.setItem('rpg-jovem-cristao:journey:v1', 'legacy-save-preserved-for-review');
  });
  await page.goto('/journey/create');
  await expect(page).toHaveURL(/\/auth\?next=/);
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible();
  await expect(page.getByLabel('Nome do Viajante')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('rpg-jovem-cristao:journey:v1'))).toBe('legacy-save-preserved-for-review');
});

test('API do convite recusa acesso sem sessão e não revela dados', async ({ request }) => {
  const response = await request.post('/api/guild-invites', { data: { action: 'resolve', token: 'a'.repeat(64) } });
  expect(response.status()).toBe(401);
  expect(response.headers()['cache-control']).toContain('no-store');
  const auth = await request.get('/auth');
  expect(auth.headers()['cache-control']).toContain('no-store');
  expect(auth.headers()['referrer-policy']).toBe('no-referrer');
  expect(await response.text()).not.toContain('guild_name');
});
