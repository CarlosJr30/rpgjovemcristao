import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import nextEnv from '@next/env';
import { chromium, expect } from '@playwright/test';

// Explicit manual runner: no mocked Auth, no SMTP, no existing-account mutations.
// A successful run retains one new QA account and hero. Credentials live only in memory.
nextEnv.loadEnvConfig(path.resolve('apps/web'));
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert(apiUrl && publicKey, 'Public Supabase configuration is missing');
const out = path.resolve('build/task-0067-quick-registration');
await mkdir(out, { recursive: true });
const settingsResponse = await fetch(`${apiUrl}/auth/v1/settings`, {
  headers: { apikey: publicKey },
});
assert(settingsResponse.ok, 'Cannot read Auth settings');
const settings = await settingsResponse.json();
if (
  !settings.mailer_autoconfirm ||
  !settings.external?.email ||
  settings.disable_signup
) {
  const report = {
    status: 'BLOCKED',
    at: new Date().toISOString(),
    mailer_autoconfirm: settings.mailer_autoconfirm,
    email_enabled: settings.external?.email,
    signup_disabled: settings.disable_signup,
    signupAttempted: false,
    reason:
      'Enable email signup and disable Confirm email in the hosted project before running the real flow.',
  };
  await writeFile(
    path.join(out, 'online-check.json'),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
  process.exit(2);
}

const require = createRequire(import.meta.url);
const server = spawn(
  process.execPath,
  [require.resolve('next/dist/bin/next'), 'start', '--port', '3117'],
  { cwd: path.resolve('apps/web'), windowsHide: true, stdio: 'ignore' },
);
let browser;
try {
  await expect
    .poll(
      async () => {
        try {
          return (await fetch('http://127.0.0.1:3117/auth')).status;
        } catch {
          return 0;
        }
      },
      { timeout: 30_000 },
    )
    .toBe(200);
  browser = await chromium.launch({ channel: 'msedge' });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const failures = [];
  page.on('pageerror', () => failures.push('browser error'));
  const email = `rpg-qa-${randomBytes(8).toString('hex')}@example.com`;
  const password = randomBytes(24).toString('base64url');
  await page.goto('http://127.0.0.1:3117/auth');
  await page.getByRole('button', { name: 'Ainda não tenho conta' }).click();
  await page.getByLabel('Nome de exibição').fill('Viajante Teste');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page).toHaveURL(/\/journey\/create$/, { timeout: 20_000 });
  await page.getByLabel('Viajante do Horizonte').check({ force: true });
  await page.getByRole('button', { name: 'Começar aventura' }).click();
  await expect(page).toHaveURL(/\/journey\/phases\/o-jardim-e-a-escolha$/, {
    timeout: 20_000,
  });
  await page.getByRole('button', { name: /Entrar no jardim/ }).click();
  const storageKey = `sb-${new URL(apiUrl).hostname.split('.')[0]}-auth-token`;
  const session = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    storageKey,
  );
  const headers = {
    apikey: publicKey,
    Authorization: `Bearer ${session.access_token}`,
  };
  let hero;
  await expect
    .poll(
      async () => {
        const response = await fetch(
          `${apiUrl}/rest/v1/travelers?select=*&user_id=eq.${session.user.id}`,
          { headers },
        );
        if (!response.ok) return null;
        const rows = await response.json();
        hero = rows[0];
        return hero?.journey_progress?.gardenStep;
      },
      { timeout: 20_000 },
    )
    .toBe('explore');
  assert.equal(hero.body_type, 'female');
  const anonymous = await fetch(
    `${apiUrl}/rest/v1/travelers?select=id&id=eq.${hero.id}`,
    { headers: { apikey: publicKey } },
  );
  const anonymousDenied = [401, 403].includes(anonymous.status) ||
    (anonymous.ok && (await anonymous.json()).length === 0);
  assert(anonymousDenied, 'Anonymous access must be denied');
  await context.close();
  const returning = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const returnPage = await returning.newPage();
  await returnPage.goto('http://127.0.0.1:3117/auth');
  await returnPage.getByLabel('E-mail').fill(email);
  await returnPage.getByLabel('Senha').fill(password);
  await returnPage.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    returnPage.getByRole('heading', {
      name: 'Bem-vindo à jornada, Viajante Teste.',
    }),
  ).toBeVisible({ timeout: 20_000 });
  await returnPage.goto(
    'http://127.0.0.1:3117/journey/phases/o-jardim-e-a-escolha',
  );
  await expect(
    returnPage.getByRole('application', { name: 'Área explorável do Jardim' }),
  ).toBeVisible({ timeout: 20_000 });
  await returnPage.reload();
  await expect(
    returnPage.getByRole('application', { name: 'Área explorável do Jardim' }),
  ).toBeVisible({ timeout: 20_000 });
  assert.deepEqual(failures, []);
  await returnPage.screenshot({
    path: path.join(out, 'online-return-mobile.png'),
    fullPage: true,
  });
  const report = {
    status: 'PASS',
    at: new Date().toISOString(),
    realSupabase: true,
    registration: true,
    avatarPersisted: true,
    missionProgressPersisted: true,
    freshBrowserLogin: true,
    reload: true,
    anonymousDenied: true,
    existingAccountsMutated: false,
    newQaAccountsRetained: 1,
  };
  await writeFile(
    path.join(out, 'online-check.json'),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
} finally {
  await browser?.close();
  server.kill();
}
