import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from '@playwright/test';

const out = fileURLToPath(
  new URL(
    '../build/task-0064-mobile-game-mode/performance-icons/',
    import.meta.url,
  ),
);
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const observations = [];
try {
  const context = await browser.newContext({
    ...devices['Pixel 7'],
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  await context.route('**/*', (route) =>
    new URL(route.request().url()).hostname === '127.0.0.1'
      ? route.continue()
      : route.abort(),
  );
  await context.addInitScript(() => {
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local');
    window.__performanceQA = { cls: 0, lcp: null, longTasks: [] };
    for (const type of [
      'layout-shift',
      'largest-contentful-paint',
      'longtask',
    ]) {
      if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (type === 'layout-shift' && !entry.hadRecentInput)
            window.__performanceQA.cls += entry.value;
          if (type === 'largest-contentful-paint')
            window.__performanceQA.lcp = entry.startTime;
          if (type === 'longtask')
            window.__performanceQA.longTasks.push(entry.duration);
        }
      }).observe({ type, buffered: true });
    }
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3165/journey/create');
  await page
    .getByLabel('Nome do Viajante', { exact: true })
    .fill('Performance QA');
  await page
    .getByRole('button', { name: 'Criar Viajante', exact: true })
    .click();
  await page.waitForURL('**/journey/intro');
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Performance.enable');
  for (const [name, route] of [
    ['home', '/'],
    ['equipment', '/journey/equipment'],
    ['arena', '/journey/arena'],
    ['home-return', '/'],
  ]) {
    await page.goto('http://127.0.0.1:3165' + route, {
      waitUntil: 'networkidle',
    });
    await page.locator('main h1').first().waitFor();
    await page
      .locator('main [data-avatar-base]')
      .evaluateAll(async (images) => {
        await Promise.all(
          images
            .filter((img) => img.getBoundingClientRect().width > 0)
            .map((img) => img.decode().catch(() => {})),
        );
      });
    const metric = await page.evaluate(() => ({
      ...window.__performanceQA,
      hdSources: [
        ...new Set(
          performance
            .getEntriesByType('resource')
            .map((r) => new URL(r.name).pathname)
            .filter((p) => p.includes('/avatar/hd/')),
        ),
      ],
      transferBytes: performance
        .getEntriesByType('resource')
        .reduce((a, r) => a + r.transferSize, 0),
      resources: performance
        .getEntriesByType('resource')
        .map((resource) => ({
          path: new URL(resource.name).pathname + new URL(resource.name).search,
          bytes: resource.transferSize,
        }))
        .sort((a, b) => b.bytes - a.bytes),
      headerHeight: document.querySelector('header').getBoundingClientRect()
        .height,
    }));
    const memory = (await cdp.send('Performance.getMetrics')).metrics;
    metric.heapBytes = memory.find((m) => m.name === 'JSHeapUsedSize')?.value;
    assert.equal(
      metric.hdSources.length,
      1,
      'Only the chosen HD identity should be requested.',
    );
    observations.push({ name, ...metric });
  }
  await page.goto('http://127.0.0.1:3165/journey/equipment', {
    waitUntil: 'networkidle',
  });
  const started = performance.now();
  await page.locator('[data-slot="weapon"]').click();
  await page.locator('#equipment-inventory').waitFor();
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const interactionMs = performance.now() - started;
  await writeFile(
    out + 'observations.json',
    JSON.stringify(
      {
        cpuThrottle: 4,
        network: 'Loopback; cache disabled. No mobile bandwidth simulation.',
        observations,
        equipmentPanelInteractionMs: interactionMs,
        limitation:
          'Host CPU and browser protocol heap; neither field LCP/INP nor POCO X7 memory. Four visits do not prove absence of long-term leaks.',
        physicalDevice: false,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ observations, interactionMs }));
} finally {
  await browser.close();
}
