import assert from 'node:assert/strict';
import { chromium, webkit, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { startLocalAuthSimulator } from '../fixtures/local-auth-http-server.mjs';
import { navigateReleased } from './released-navigation.mjs';

// Actual production bundle + native loopback synthetic HTTP, no player writes.
const origin = 'http://127.0.0.1:3199';
const base = 'build/ui-restore-002/guild-reference';
mkdirSync(base, { recursive: true });
const result = { syntheticData: true, productionProof: false, runs: [] };
for (const guildRole of ['member', 'leader']) {
  const simulator = await startLocalAuthSimulator({ guildRole });
  try {
    for (const [device, launcher, viewport] of [
      ['desktop', chromium, { width: 1440, height: 1000 }],
      ['mobile', webkit, { width: 390, height: 844 }],
    ]) {
      const browser = await launcher.launch();
      const context = await browser.newContext({
        viewport,
        isMobile: device === 'mobile',
        hasTouch: device === 'mobile',
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      page.setDefaultTimeout(20000);
      const run = {
        guildRole,
        device,
        checks: [],
        errors: [],
        consoleErrors: [],
        externalOrigins: [],
        passed: false,
      };
      result.runs.push(run);
      const check = (name, pass) => {
        run.checks.push({ name, pass });
        assert.ok(pass, name);
      };
      page.on('pageerror', (e) => run.errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') run.consoleErrors.push(m.text());
      });
      page.on('request', (r) => {
        const o = new URL(r.url()).origin;
        if (![origin, 'http://127.0.0.1:3202'].includes(o))
          run.externalOrigins.push(o);
      });
      try {
        await page.goto(origin + '/auth');
        const login = page.getByRole('button', { name: 'Entrar', exact: true });
        await expect(login).toBeEnabled();
        await page.getByLabel('E-mail').fill('local-only@fixture.invalid');
        await page
          .getByLabel('Senha', { exact: true })
          .fill('synthetic-local-only');
        await login.click();
        await page.waitForURL(origin + '/');
        await expect(
          page.getByRole('heading', {
            name: 'Bem-vindo, Local WebKit',
            exact: true,
          }),
        ).toBeVisible();
        await navigateReleased(page, 'Guilda');
        await expect(
          page.getByRole('heading', {
            name: 'Companheiros da Jornada',
            level: 2,
          }),
        ).toBeVisible();
        check('current Guild context renders', true);
        await expect(
          page.getByRole('heading', { name: 'Membros', exact: true }),
        ).toBeVisible();
        const hall = page.locator('[data-guild-art="guildHall"]');
        await expect(hall).toBeVisible();
        await expect
          .poll(() => hall.evaluate((i) => i.complete && i.naturalWidth > 0))
          .toBe(true);
        check('original approved hall loads', true);
        check(
          'responsive original hall variant',
          (await hall.evaluate((i) => i.currentSrc)).endsWith(
            device === 'mobile' ? 'guild_hall_mobile.webp' : 'guild_hall.webp',
          ),
        );
        const banner = page.locator('[data-guild-art="guildBanner"]');
        await expect(banner).toBeVisible();
        await expect
          .poll(() => banner.evaluate((i) => i.complete && i.naturalWidth > 0))
          .toBe(true);
        check('original banner loads', true);
        check(
          'does not invent mission activity counts',
          (await page
            .getByLabel('Resumo das atividades carregadas')
            .count()) === 0,
        );
        check(
          'leader controls follow existing role',
          (await page
            .getByRole('button', { name: 'Convidar membros', exact: true })
            .count()) === (guildRole === 'leader' ? 1 : 0),
        );
        check(
          'no horizontal overflow',
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        await page
          .locator('[data-guild-art]')
          .evaluateAll((images) =>
            Promise.all(images.map((image) => image.decode())),
          );
        await page.screenshot({
          path: `${base}/${device}-${guildRole}-guild.png`,
          fullPage: true,
        });
        await page.goto(origin + '/journey/guild/manage');
        await expect(
          page.getByRole('heading', {
            name: 'Companheiros da Jornada',
            level: 2,
          }),
        ).toBeVisible();
        const scene = page.locator('[data-guild-art="guildLeaderTable"]');
        if (guildRole === 'leader') {
          await expect(
            page.getByText('PAINEL DO LÍDER', { exact: true }),
          ).toBeVisible();
          await expect(scene).toBeVisible();
          await expect
            .poll(() => scene.evaluate((i) => i.complete && i.naturalWidth > 0))
            .toBe(true);
        } else {
          await expect(scene).toHaveCount(0);
          await expect(
            page.getByRole('button', { name: 'Convidar membros', exact: true }),
          ).toHaveCount(0);
        }
        check('management appearance cannot grant leader controls', true);
        await expect
          .poll(() =>
            hall.evaluate((image) => image.complete && image.naturalWidth > 0),
          )
          .toBe(true);
        check('management hall is loaded before visual capture', true);
        await page
          .locator('[data-guild-art]')
          .evaluateAll((images) =>
            Promise.all(images.map((image) => image.decode())),
          );
        check(
          'management has no horizontal overflow',
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        await page.screenshot({
          path: `${base}/${device}-${guildRole}-manage.png`,
          fullPage: true,
        });
        check(
          'zero page/console errors',
          !run.errors.length && !run.consoleErrors.length,
        );
        check('loopback only', !run.externalOrigins.length);
        run.passed = true;
      } catch (e) {
        run.failure = e.message;
        await page
          .screenshot({
            path: `${base}/${device}-${guildRole}-failed.png`,
            fullPage: true,
          })
          .catch(() => {});
      } finally {
        await context.close();
        await browser.close();
        writeFileSync(base + '/browser.json', JSON.stringify(result, null, 2));
      }
    }
  } finally {
    await new Promise((resolve) => simulator.close(resolve));
  }
}
console.log(
  JSON.stringify(
    result.runs.map(
      ({ guildRole, device, passed, checks, errors, failure }) => ({
        guildRole,
        device,
        passed,
        checks: checks.length,
        errors,
        failure,
      }),
    ),
  ),
);
assert.ok(
  result.runs.length === 4 && result.runs.every((r) => r.passed),
  'Guild visual restoration failed',
);
