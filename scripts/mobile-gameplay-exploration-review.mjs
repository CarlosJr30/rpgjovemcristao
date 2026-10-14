import { chromium, webkit } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('..', import.meta.url));
const stage = process.argv[2] ?? 'before';
if (!['before', 'after', 'production'].includes(stage))
  throw new Error('Invalid stage');
const baseURL = process.env.GAMEPLAY_QA_URL ?? 'http://127.0.0.1:3173';
const origin = new URL(baseURL).origin;
if (
  !['127.0.0.1', 'rpgjovemcristao-web-inky.vercel.app'].includes(
    new URL(baseURL).hostname,
  )
)
  throw new Error('Unexpected QA origin');
const engine = process.env.GAMEPLAY_QA_BROWSER ?? 'chromium';
const out = path.join(
  root,
  'build/task-0073-mobile-gameplay-exploration',
  stage,
  engine,
);
await mkdir(out, { recursive: true });
const sizes = [
  [320, 568],
  [360, 800],
  [375, 812],
  [390, 844],
  [412, 915],
  [430, 932],
  [844, 390],
  [915, 412],
  [768, 1024],
  [1440, 900],
  [1920, 1080],
];
const selected = process.env.GAMEPLAY_QA_SIZES?.split(',');
const samples = [],
  errors = [];
const browser = await (engine === 'webkit' ? webkit : chromium).launch({
  headless: true,
  ...(engine === 'webkit' ? {} : { channel: 'msedge' }),
});
try {
  for (const [width, height] of sizes) {
    if (selected && !selected.includes(String(width))) continue;
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: width <= 1024,
      hasTouch: width <= 1024,
      reducedMotion: 'reduce',
    });
    await context.route('**/*', (route) =>
      new URL(route.request().url()).origin === origin
        ? route.continue()
        : route.abort(),
    );
    await context.addInitScript(() =>
      localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
    );
    const page = await context.newPage();
    page.on('pageerror', (error) =>
      errors.push({ width, height, message: error.message }),
    );
    await page.goto(baseURL + '/journey/create');
    await page
      .getByLabel('Nome do Viajante', { exact: true })
      .fill('Mobile QA');
    await page
      .getByRole('button', { name: 'Criar Viajante', exact: true })
      .click();
    await page.getByRole('button', { name: /Entrar na jornada/ }).waitFor();
    const phase = async (step) => {
      if (stage !== 'before') await page.waitForLoadState('networkidle');
      await page.evaluate((step) => {
        const key = 'rpg-jovem-cristao:journey:v1',
          save = JSON.parse(localStorage.getItem(key));
        const p = save.travelers[0].progress;
        p.gardenStep = step;
        p.bibleReading.genesis2Confirmed = true;
        p.bibleReading.genesis3Confirmed = true;
        p.bibleReading.comprehensionCompleted = true;
        p.devotionalCompleted = true;
        p.snakeTutorialCompleted = false;
        localStorage.setItem(key, JSON.stringify(save));
      }, step);
      await page.goto(baseURL + '/journey/phases/o-jardim-e-a-escolha');
      await page.locator(`[data-phase-step="${step}"]`).waitFor();
      await page.evaluate(() => document.fonts.ready);
    };
    const shot = async (name) => {
      const metric = await page.evaluate(() => {
        const rect = (n) => {
          if (!n) return null;
          const r = n.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        };
        const scene = document.querySelector(
          '[aria-label="Área explorável do Jardim"]',
        );
        const canvas = document.querySelector('canvas[role="application"]');
        const message = document.querySelector('[class*="arcadeMessage"]');
        const points = [
          ...document.querySelectorAll('[class*="gardenWorldPoint"]'),
        ].filter((n) => n.tagName === 'BUTTON');
        let overlaps = 0;
        for (let i = 0; i < points.length; i++)
          for (let j = i + 1; j < points.length; j++) {
            const a = points[i].getBoundingClientRect(),
              b = points[j].getBoundingClientRect();
            if (
              a.left < b.right &&
              a.right > b.left &&
              a.top < b.bottom &&
              a.bottom > b.top
            )
              overlaps++;
          }
        return {
          width: innerWidth,
          height: innerHeight,
          documentWidth: document.documentElement.scrollWidth,
          scene: rect(scene),
          canvas: rect(canvas),
          pointOverlaps: overlaps,
          dialogCount: document.querySelectorAll('dialog[open]').length,
          message: message
            ? {
                ...rect(message),
                text: message.textContent,
                scrollHeight: message.scrollHeight,
                clientHeight: message.clientHeight,
                whiteSpace: getComputedStyle(message).whiteSpace,
              }
            : null,
          resources: performance.getEntriesByType('resource').length,
          heapBytes: performance.memory?.usedJSHeapSize ?? null,
        };
      });
      samples.push({ width, height, name, ...metric });
      await page.screenshot({
        path: path.join(out, `${width}x${height}-${name}.png`),
        fullPage: name === 'snake-intro-text-200',
      });
    };
    await phase('explore');
    await page
      .getByRole('application', { name: 'Área explorável do Jardim' })
      .scrollIntoViewIfNeeded();
    await shot('exploration');
    await page
      .getByRole('button', { name: 'Sinais do vento: Observar', exact: true })
      .click();
    const details = page.getByRole('button', { name: 'Observar', exact: true });
    if (await details.isVisible()) {
      await shot('point-details');
      await details.click();
    }
    await page
      .getByText('Qual sinal se move sem deixar o lugar?', { exact: true })
      .waitFor();
    await shot('riddle');
    if (stage !== 'before' && width <= 430) {
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await shot('riddle-text-200');
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '';
      });
    }
    await phase('snake');
    await page.locator('[data-serpent-mode]').scrollIntoViewIfNeeded();
    await shot('snake-intro');
    if (stage !== 'before' && width <= 430) {
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await shot('snake-intro-text-200');
      await page
        .getByRole('button', { name: 'Começar', exact: true })
        .scrollIntoViewIfNeeded();
      await shot('snake-intro-text-200-actions');
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '';
      });
    }
    const how = page.getByRole('button', { name: 'Como jogar', exact: true });
    if (await how.isVisible()) {
      await how.click();
      await shot('tutorial-movement');
      await page.getByRole('button', { name: 'Próximo', exact: true }).click();
      await shot('tutorial-objective');
      await page
        .getByRole('button', { name: 'Fechar painel', exact: true })
        .click();
    }
    await page
      .getByRole('button', {
        name: /^(Entendi · começar perseguição|Começar perseguição|Começar)$/,
      })
      .click();
    await page.locator('[data-status="playing"]').waitFor();
    if (stage !== 'before') {
      await page
        .getByRole('status')
        .filter({ hasText: 'A serpente está atrás de você' })
        .waitFor();
    }
    await shot('snake-active');
    if (stage !== 'before' && width <= 430) {
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await shot('snake-hud-text-200');
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '';
      });
    }
    await page.getByRole('button', { name: 'Pausar', exact: true }).click();
    await shot('snake-paused');
    await page
      .getByRole('button', { name: 'Entrar em tela cheia', exact: true })
      .click();
    await shot('snake-fullscreen');
    const fullscreenExit = page.getByRole('button', {
      name: 'Sair da tela cheia',
      exact: true,
    });
    if (await fullscreenExit.isVisible()) await fullscreenExit.click();
    if (stage !== 'before') {
      await phase('quiz');
      await page.locator('[class*="quizPanel"]').scrollIntoViewIfNeeded();
      await shot('quiz-question');
      await page.locator('[class*="choiceCard"]').first().click();
      await page
        .locator('[class*="quizFeedback"]')
        .evaluate((node) => node.scrollIntoView({ block: 'start' }));
      await shot('quiz-feedback');
    }
    if (stage !== 'before') await page.waitForLoadState('networkidle');
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(
  path.join(out, 'metrics.json'),
  JSON.stringify(
    { stage, engine, samples, errors, physicalDevice: false },
    null,
    2,
  ),
);
if (stage === 'before') {
  const hashes = {};
  for (const file of execFileSync('git', ['ls-files', '-z'], { cwd: root })
    .toString()
    .split('\0')
    .filter(Boolean))
    hashes[file] = createHash('sha256')
      .update(await readFile(path.join(root, file)))
      .digest('hex');
  await writeFile(
    path.join(out, 'preservation.json'),
    JSON.stringify(
      {
        base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root })
          .toString()
          .trim(),
        hashes,
      },
      null,
      2,
    ),
  );
}
console.log(
  JSON.stringify({
    stage,
    engine,
    captures: samples.length,
    errors,
    overflow: samples
      .filter((s) => s.documentWidth > s.width)
      .map((s) => `${s.width}:${s.name}`),
  }),
);
