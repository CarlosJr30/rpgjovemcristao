import assert from 'node:assert/strict';
import { chromium, webkit, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { startLocalAuthSimulator } from '../fixtures/local-auth-http-server.mjs';
import { isReleasedPath } from '../../apps/web/lib/release-scope.ts';
import { navigateReleased, accountAction, openLegacyLessons } from './released-navigation.mjs';

// Full production application, loopback-only synthetic data. Never hosted users.
const origin = 'http://127.0.0.1:3199';
const base = process.argv.includes('--restore')
  ? 'build/ui-restore-002'
  : 'build/ui-mobile-001';
mkdirSync(base, { recursive: true });
const simulator = await startLocalAuthSimulator({ archiveInventory: true, guildRole: 'member' });
const result = { syntheticData: true, productionProof: false, runs: [] };
try {
  for (const [name, launcher, viewport, touch] of [
    ['desktop', chromium, { width: 1440, height: 1000 }, false],
    ['mobile', webkit, { width: 390, height: 844 }, true],
    ['small-mobile', webkit, { width: 320, height: 740 }, true],
    ['landscape', webkit, { width: 844, height: 390 }, true],
  ]) {
    const browser = await launcher.launch();
    const context = await browser.newContext({
      viewport,
      isMobile: touch,
      hasTouch: touch,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const run = {
      name,
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
    page.on('console', (e) => {
      if (e.type() === 'error') run.consoleErrors.push(e.text());
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
      check('current account login works', true);
      const allowed = await page
        .locator('a[href^="/journey"]')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
      check(
        'no blocked route exposed by restored home',
        allowed.every(isReleasedPath),
      );
      check(
        'home contains no large navigation card grid',
        (await page.getByRole('main').getByRole('link').count()) === 0,
      );
      const nav = page.locator('nav[aria-label="Navegação principal"]');
      check(
        'one original navigation with eleven modules',
        (await nav.evaluate((element) => element.children.length)) === 11,
      );
      check(
        'three unreleased modules have no protected actions',
        (await nav.locator('[aria-disabled="true"]').count()) === 3 &&
          (await nav
            .locator('[aria-disabled="true"] a,[aria-disabled="true"] button')
            .count()) === 0,
      );
      check(
        'only the eight approved modules are linked',
        JSON.stringify(await nav.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')))) ===
          JSON.stringify(['/journey/hero','/journey/worlds','/journey/phases/o-jardim-e-a-escolha','/journey/backpack','/journey/collection','/journey/diary','/journey/guild','/journey/guild/ebd']),
      );
      const trigger = page.getByRole('button', {
        name: 'Abrir menu',
        exact: true,
      });
      if (touch) {
        const bounds = await trigger.boundingBox();
        check(
          'menu touch target at least44px',
          bounds.width >= 44 && bounds.height >= 44,
        );
        await trigger.tap();
        const menu = page.getByRole('dialog', { name: 'Menu principal' });
        await expect(menu).toBeVisible();
        await expect(
          menu.getByRole('link', { name: 'Herói', exact: true }),
        ).toBeFocused();
        check('menu opens with keyboard focus', true);
        check(
          'body scroll locked while menu open',
          await page.evaluate(() => document.body.style.overflow === 'hidden'),
        );
        const close = menu.getByRole('button', { name: 'Fechar navegação' });
        const last = menu.getByRole('link', { name: 'EBD', exact: true });
        await last.scrollIntoViewIfNeeded();
        await last.focus();
        await page.keyboard.press('Tab');
        await expect(close).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(last).toBeFocused();
        check('keyboard focus stays inside menu', true);
        await page.keyboard.press('Escape');
        await expect(menu).toHaveCount(0);
        await expect(trigger).toBeFocused();
        check('Escape closes and returns focus', true);
        await trigger.tap();
        await page.touchscreen.tap(
          viewport.width - 6,
          Math.min(180, viewport.height - 40),
        );
        await expect(menu).toHaveCount(0);
        check('outside touch closes menu', true);
        await trigger.tap();
        await page
          .getByRole('navigation', { name: 'Navegação principal', exact: true })
          .getByRole('link', { name: 'EBD', exact: true })
          .tap();
      } else await navigateReleased(page, 'EBD');
      await openLegacyLessons(page);
      await expect(page.getByLabel('Área da Escola Bíblica')).toBeAttached();
      check('EBD reached through principal menu', true);
      check(
        'menu closes after navigation',
        (await page.getByRole('dialog', { name: 'Menu principal' }).count()) ===
          0,
      );
      await navigateReleased(page, 'Guilda');
      await expect(
        page.getByRole('heading', { name: 'Minha Guilda', exact: true }),
      ).toBeVisible();
      check('existing Guilda screen preserved', true);
      await navigateReleased(page, 'Meu avatar');
      await expect(
        page.getByRole('heading', { name: 'Local WebKit', exact: true }),
      ).toBeVisible();
      check(
        'avatar source loads',
        await page
          .locator('main [data-avatar-base]')
          .evaluate((image) => image.complete && image.naturalWidth > 0),
      );
      check(
        'four attributes are read-only',
        (await page
          .getByLabel('Atributos do Viajante')
          .locator('dd')
          .count()) === 4,
      );
      await page
        .getByRole('button', { name: 'Abrir Herói', exact: true })
        .click();
      await page
        .getByRole('menuitem', { name: 'Trocar Viajante', exact: true })
        .click();
      await page
        .getByRole('dialog', { name: 'Trocar de Viajante?' })
        .getByRole('button', { name: 'Cancelar', exact: true })
        .click();
      await expect(
        page.getByRole('heading', { name: 'Local WebKit', exact: true }),
      ).toBeVisible();
      check('canceling switch preserves current traveler', true);
      check(
        'no horizontal overflow',
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({
        path: base + '/' + name + '-validated.png',
        fullPage: true,
      });
      await navigateReleased(page, 'Mochila');
      await expect(page.getByRole('heading', { name: 'Botas do Viajante', exact: true })).toBeVisible();
      await expect(page.getByText(/^Quantidade: 3/)).toBeVisible();
      await page.locator('main img[src]').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      check('populated backpack fits after original icon decodes', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      check('inventory icon fits its card', await page.locator('main img[src]').evaluateAll(images => images.every(image => image.getBoundingClientRect().right <= image.closest('article').getBoundingClientRect().right)));
      check('backpack remains consultation only', await page.getByRole('button', { name: /equipar|vender|comprar|transferir/i }).count() === 0);
      await page.screenshot({ path: base + '/' + name + '-backpack-populated.png', fullPage: true });
      await navigateReleased(page, 'Jornada');
      await expect(page.locator('[data-story-mode="read-only"]')).toBeVisible();
      check('Jornada preserves nine existing worlds', await page.getByRole('list', { name: 'Mundos bíblicos' }).getByRole('listitem').count() === 9);
      check('Jornada shows honest empty official progress', await page.getByText('0/5 histórias com conclusão registrada', { exact: true }).count() === 1);
      check('Jornada does not promote local progress', await page.getByText('Nenhum progresso legado persistido válido. O histórico local não substitui o servidor.', { exact: true }).count() === 1);
      check('Jornada has no completion or economic controls', await page.locator('main button').count() === 0);
      await page.screenshot({ path: base + '/' + name + '-journey-map.png', fullPage: true });
      await page.getByRole('link', { name: 'Consultar As Origens →', exact: true }).click();
      await expect(page.getByRole('list', { name: 'Histórias de As Origens' })).toBeVisible();
      check('origins preserves five stories without splitting Eden and Fall', await page.getByRole('list', { name: 'Histórias de As Origens' }).getByRole('listitem').count() === 5);
      for (const id of ['creation','garden-choice','cain-abel','noah-ark','babel']) {
        await page.goto(origin + '/journey/stories/' + id);
        await expect(page.getByRole('region', { name: 'Objetivos e requisitos' })).toBeVisible();
        check('read-only story ' + id + ' has no completion action', await page.locator('main button,main textarea,main input').count() === 0);
        check('read-only story ' + id + ' fits mobile viewport', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
      await page.reload();
      await expect(page.getByRole('region', { name: 'Objetivos e requisitos' })).toBeVisible();
      check('Jornada reload remains read only', await page.locator('[data-story-mode="read-only"]').count() === 1);
      await page.goto(origin + '/journey/worlds/patriarchs');
      await expect(page.getByText('Bloqueado · As histórias deste mundo ainda estão em preparação.', { exact: true })).toBeVisible();
      check('planned world remains blocked without invented activities', await page.locator('main button,main input,main textarea').count() === 0);
      // HTTP checks are real release guards, not routed or fabricated responses.
      for (const path of [
        '/journey/arena',
        '/journey/arena/tower',
        '/journey/tower',
        '/journey/equipment',
        '/journey/shop',
        '/journey/minigames/unapproved',
        '/journey/stories/blocked',
        '/journey/worlds/blocked',
      ]) {
        const response = await context.request.get(origin + path);
        check('protected ' + path, response.status() === 403);
      }
      for (const path of ['/journey/backpack','/journey/collection','/journey/diary']) {
        const response = await context.request.get(origin + path);
        check('consultation route ' + path, response.status() === 200);
      }
      const authority = await context.request.post(origin + '/api/authority', {
        data: { operation: 'starter' },
      });
      check('economy authority remains denied', authority.status() === 403);
      await accountAction(page, 'Sair da conta');
      await page.waitForURL(origin + '/auth');
      await expect(
        page.getByRole('heading', { name: 'Entrar', exact: true }),
      ).toBeVisible();
      check('current logout works', true);
      await page
        .getByRole('button', { name: 'Criar conta', exact: true })
        .click();
      await expect(
        page.getByRole('heading', { name: 'Criar conta', exact: true }),
      ).toBeVisible();
      await expect(page.getByLabel('Nome de exibição')).toBeVisible();
      check(
        'existing registration form preserved without creating an account',
        true,
      );
      await page.goto(origin + '/auth/recover');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      check('existing recovery route remains available', true);
      check('no page errors', run.errors.length === 0);
      check('no console errors', run.consoleErrors.length === 0);
      check('no external origins', run.externalOrigins.length === 0);
      run.passed = true;
    } catch (error) {
      run.failure = error.message;
      await page
        .screenshot({
          path: base + '/' + name + '-failure.png',
          fullPage: true,
        })
        .catch(() => {});
    } finally {
      await context.close();
      await browser.close();
      writeFileSync(
        base + '/browser-results.json',
        JSON.stringify(result, null, 2),
      );
    }
  }
} finally {
  await new Promise((resolve) => simulator.close(resolve));
}
console.log(
  JSON.stringify(
    result.runs.map(
      ({ name, passed, checks, errors, consoleErrors, failure }) => ({
        name,
        passed,
        checks: checks.length,
        errors,
        consoleErrors,
        failure,
      }),
    ),
  ),
);
if (result.runs.some((r) => !r.passed)) process.exitCode = 1;
