import { authenticateProtectedPreview } from '../fixtures/protected-preview-route.ts';
import { webkit } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
const input = JSON.parse(readFileSync(0, 'utf8'));
if (
  !process.env.VERCEL_OIDC_TOKEN ||
  typeof input.account?.email !== 'string' ||
  !input.account.email ||
  typeof input.account?.password !== 'string' ||
  !input.account.password ||
  typeof input.account?.active?.name !== 'string'
)
  throw new Error(
    'Authorized TEST account and protected transport are required',
  );
const origin = input.origin;
if (
  origin !==
  'https://rpgjovemcristao-nu38qe2u0-carlos-junior-s-projects.vercel.app'
)
  throw new Error('Only the reviewed TEST-backed Preview is allowed');
if (
  !['fetch', 'continue'].includes(input.transport) ||
  !['links', 'goto'].includes(input.navigation) ||
  !Number.isInteger(input.repeats) ||
  input.repeats < 1 ||
  input.repeats > 10
)
  throw new Error('Explicit bounded probe matrix required');
const output =
  'build/rpg-dev-002/webkit-probe-' +
  input.transport +
  '-' +
  (input.navigation ?? 'links') +
  '-versioned.json';
const runs = [];
const safeUrl = (raw) => {
  try {
    const u = new URL(raw);
    return {
      origin: u.origin,
      path: u.pathname,
      rsc: u.searchParams.has('_rsc'),
    };
  } catch {
    return { invalid: true };
  }
};
const redact = (v) =>
  String(v)
    .split(input.account.password)
    .join('[password]')
    .split(input.account.email)
    .join('[email]')
    .replace(/https?:\/\/\S+/g, '[URL]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[token]');
const browser = await webkit.launch();
try {
  for (let repeat = 0; repeat < (input.repeats ?? 3); repeat++) {
    const run = {
      repeat,
      transport: input.transport,
      navigation: input.navigation ?? 'links',
      checks: [],
      responses: [],
      failures: [],
      errors: [],
      cookies: [],
      passed: false,
    };
    runs.push(run);
    const save = () =>
      writeFileSync(
        output,
        JSON.stringify(
          { origin, sha: '2d0132e5fd57f65a670dd551d2e811ccbc79911f', runs },
          null,
          2,
        ),
      );
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    if (input.transport === 'fetch')
      await authenticateProtectedPreview(
        context,
        origin,
        process.env.VERCEL_OIDC_TOKEN,
      );
    else
      await context.route(origin + '/**', (route) =>
        route.continue({
          headers: {
            ...route.request().headers(),
            'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN,
          },
        }),
      );
    const page = await context.newPage();
    page.setDefaultTimeout(25000);
    page.on('pageerror', (e) => {
      run.errors.push({ name: e.name, message: redact(e.message) });
      save();
    });
    page.on('requestfailed', (r) => {
      run.failures.push({
        ...safeUrl(r.url()),
        type: r.resourceType(),
        message: r.failure()?.errorText,
      });
      save();
    });
    page.on('response', (r) => {
      const u = new URL(r.url());
      if (u.origin !== origin) return;
      const h = r.headers();
      run.responses.push({
        ...safeUrl(r.url()),
        status: r.status(),
        type: h['content-type'],
        vercelError: h['x-vercel-error'],
        location: h.location
          ? safeUrl(new URL(h.location, r.url()).href)
          : null,
        prefetch: r.request().headers()['next-router-prefetch'] ?? null,
      });
      save();
    });
    const visit = async (path) => {
      await page.goto(origin + path);
      await page.waitForLoadState('networkidle');
    };
    let step = 'login';
    try {
      await visit('/auth');
      await page.getByLabel('E-mail').fill(input.account.email);
      await page
        .getByLabel('Senha', { exact: true })
        .fill(input.account.password);
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
      await page.waitForURL(origin + '/', { waitUntil: 'load' });
      await page
        .getByRole('heading', {
          name: 'Bem-vindo, ' + input.account.active.name,
          exact: true,
        })
        .waitFor();
      await page.waitForLoadState('networkidle');
      run.checks.push('login');
      step = 'avatar';
      if (input.navigation === 'goto') await visit('/journey/hero');
      else
        await page
          .getByRole('link', { name: 'Meu avatar', exact: true })
          .click();
      await page
        .getByRole('heading', { name: input.account.active.name, exact: true })
        .waitFor();
      await page.waitForLoadState('networkidle');
      run.checks.push('avatar');
      step = 'Guilda';
      if (input.navigation === 'goto') await visit('/journey/guild');
      else
        await page.getByRole('link', { name: 'Guilda', exact: true }).click();
      await page
        .getByRole('heading', { name: 'Minha Guilda', exact: true })
        .waitFor();
      await page
        .getByText('Carregando Guilda…', { exact: true })
        .waitFor({ state: 'hidden' });
      await page.waitForLoadState('networkidle');
      run.checks.push('Guilda');
      step = 'EBD';
      if (input.navigation === 'goto') await visit('/journey/guild/ebd');
      else await page.getByRole('link', { name: 'EBD', exact: true }).click();
      await page
        .getByLabel('Área da Escola Bíblica')
        .waitFor({ state: 'attached' });
      await page.waitForLoadState('networkidle');
      run.checks.push('EBD');
      step = 'reload';
      await page.reload();
      await page
        .getByLabel('Área da Escola Bíblica')
        .waitFor({ state: 'attached' });
      await page.waitForLoadState('networkidle');
      run.checks.push('reload');
      run.cookies = (await context.cookies()).map(
        ({ name, domain, path, secure, httpOnly, sameSite }) => ({
          name,
          domain,
          path,
          secure,
          httpOnly,
          sameSite,
        }),
      );
      step = 'logout';
      await page
        .getByRole('button', { name: 'Sair da conta', exact: true })
        .click();
      await page.waitForURL(origin + '/auth', { waitUntil: 'load' });
      await page
        .getByRole('heading', { name: 'Entrar', exact: true })
        .waitFor();
      await page.waitForLoadState('networkidle');
      run.checks.push('logout');
      step = 'signed-out EBD';
      await visit('/journey/guild/ebd');
      await page
        .getByRole('heading', { name: 'Entrar', exact: true })
        .waitFor();
      run.checks.push('signed-out EBD');
      run.passed = run.errors.length === 0;
    } catch (e) {
      run.failedStep = step;
      run.error = redact(e.message);
    } finally {
      save();
      await context.close();
    }
  }
  console.log(
    JSON.stringify({
      transport: input.transport,
      repetitions: runs.length,
      passed: runs.filter((x) => x.passed).length,
      errors: runs.map((x) => x.errors.length),
      failedSteps: runs.map((x) => x.failedStep ?? null),
    }),
  );
  if (runs.some((run) => !run.passed)) process.exitCode = 1;
} finally {
  await browser.close();
}
