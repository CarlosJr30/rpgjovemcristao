import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { EQUIPMENT_CATALOG } from '../../apps/web/features/journey/data/equipmentCatalog';

const screens = [
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
const rareArmor = {
  ...EQUIPMENT_CATALOG.find((item) => item.slot === 'armor')!,
  id: 'traveler-armor-rare',
  name: 'Couraça alternativa',
};
const rareSword = {
  ...EQUIPMENT_CATALOG.find((item) => item.slot === 'weapon')!,
  id: 'traveler-sword-rare',
  name: 'Espada alternativa',
};

test('Rejected V1 stays off both bodies across five viewports and DPR1/2/3', async ({
  browser,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'Own DPR contexts, avoiding duplicate mobile runs.',
  );
  test.setTimeout(180_000);
  const audit = [];
  const rejectedRequests: string[] = [];
  for (const dpr of [1, 2, 3])
    for (const body of ['female', 'male']) {
      const context = await browser.newContext({
        deviceScaleFactor: dpr,
        reducedMotion: 'reduce',
      });
      try {
        const page = await context.newPage();
        page.on('request', (request) => {
          if (request.url().includes('/assets/equipment/overlays/v1/'))
            rejectedRequests.push(request.url());
        });
        await page.addInitScript(() =>
          localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
        );
        await page.goto('/journey/create');
        await page
          .getByLabel('Nome do Viajante', { exact: true })
          .fill('Viajante Nítido');
        await page
          .getByRole('radio', {
            name: body === 'female' ? 'Feminino' : 'Masculino',
            exact: true,
          })
          .check();
        await page.getByRole('button', { name: 'Criar Viajante' }).click();
        await expect(page).not.toHaveURL(/\/create$/);
        for (const variant of ['common', 'rare']) {
          await page.evaluate(
            ({ items, rare }) => {
              const key = 'rpg-jovem-cristao:journey:v1';
              const save = JSON.parse(localStorage.getItem(key)!);
              const traveler = save.travelers[0];
              traveler.inventory = items;
              traveler.equipped = Object.fromEntries(
                items
                  .filter((item) =>
                    rare
                      ? ![
                          'traveler-armor-uncommon',
                          'traveler-sword-common',
                        ].includes(item.id)
                      : ![
                          'traveler-armor-rare',
                          'traveler-sword-rare',
                        ].includes(item.id),
                  )
                  .map((item) => [item.slot, item.id]),
              );
              traveler.avatar.equippedItems = { ...traveler.equipped };
              localStorage.setItem(key, JSON.stringify(save));
            },
            {
              items: [...EQUIPMENT_CATALOG, rareArmor, rareSword],
              rare: variant === 'rare',
            },
          );
          for (const route of ['hero', 'equipment']) {
            await page.goto(`/journey/${route}`);
            const composite = page.locator(`[data-body-type="${body}"]`);
            const layers = composite.locator('[data-overlay-slot]');
            await expect(layers).toHaveCount(0);
            for (const viewport of screens) {
              await page.setViewportSize(viewport);
              await expect(layers).toHaveCount(0);
              const base = composite.getByRole('img', {
                name: 'Avatar do Viajante',
                exact: true,
              });
              await expect
                .poll(() =>
                  base.evaluate(
                    (node) => (node as HTMLImageElement).naturalWidth,
                  ),
                )
                .toBe(512);
              const box = (await composite.boundingBox())!;
              expect(box.width / box.height).toBeCloseTo(2 / 3, 2);
              if (route === 'equipment') {
                await expect(
                  page.locator('article [data-visual-quality="READY"]'),
                ).toHaveCount(0);
                await expect(
                  page.locator('article img').first(),
                ).toHaveAttribute('src', /_icon\.png$/);
              }
              audit.push({
                body,
                variant,
                route,
                viewport,
                dpr,
                bodyLayers: 0,
              });
              if (route === 'hero' && variant === 'rare') {
                const box = (await composite.boundingBox())!;
                await page.screenshot({
                  path: testInfo.outputPath(
                    `${body}-${viewport.width}-dpr${dpr}.png`,
                  ),
                  clip: {
                    x: Math.max(0, box.x - 10),
                    y: box.y - 20,
                    width: box.width + 20,
                    height: box.height + 40,
                  },
                });
              }
            }
          }
        }
      } finally {
        await context.close();
      }
    }
  expect(rejectedRequests).toEqual([]);
  expect(audit).toHaveLength(120);
  await writeFile(
    testInfo.outputPath('v1-rejected-body-fallback-audit.json'),
    JSON.stringify(audit, null, 2),
  );
  await testInfo.attach('v1-rejected-body-fallback-audit', {
    body: JSON.stringify(audit, null, 2),
    contentType: 'application/json',
  });
});
