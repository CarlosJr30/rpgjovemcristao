import { test, expect } from '@playwright/test';

test('partial release denies excluded pages and authority API without a session', async ({page,request}) => {
  for (const path of ['/journey/arena','/journey/tower','/journey/cards','/journey/shop','/journey/equipment','/journey/minigames/unapproved','/journey/stories/garden']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(403);
    await expect(page.getByRole('heading',{name:'Este recurso ainda não está disponível'})).toBeVisible();
  }
  const r = await request.post('/api/authority',{data:{operation:'starter'}});
  expect(r.status()).toBe(403);
});

test('recovery remains accessible without authentication on desktop and mobile', async ({page}) => {
  await page.goto('/auth');
  await page.getByRole('link',{name:'Esqueci minha senha'}).click();
  await expect(page.getByRole('heading',{name:'Recuperar acesso'})).toBeVisible();
  await expect(page.getByLabel('E-mail')).toBeVisible();
  await expect(page.getByRole('button',{name:'Enviar link de recuperação'})).toBeEnabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
