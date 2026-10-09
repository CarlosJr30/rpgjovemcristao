import { expect, test } from '@playwright/test';
import {
  EQUIPMENT_ASSET_MANIFEST,
  resolveEquipmentDefinition,
  resolveEquipmentVisual,
} from '../../apps/web/features/journey/data/equipmentAssets';

// Historical V1 preview retained for traceability. User rejected V1 body fit in TASK-0034.
// Disabled: automated preview cannot approve body art or bypass human approval.
for (const body of ['female', 'male'] as const) {
  test(`${body}: inspect V1 candidate art and alpha fit`, async ({
    page,
  }, testInfo) => {
    test.skip(
      true,
      'V1 body fit rejected by user; V2 prototype/human approval pending.',
    );
    test.skip(testInfo.project.name !== 'desktop');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() =>
      localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
    );
    await page.goto('/journey/create');
    await page
      .getByLabel('Nome do Viajante', { exact: true })
      .fill('Viajante Arte');
    await page
      .getByRole('radio', {
        name: body === 'female' ? 'Feminino' : 'Masculino',
        exact: true,
      })
      .check();
    await page.getByRole('button', { name: 'Criar Viajante' }).click();
    await expect(page).not.toHaveURL(/\/create$/);
    await page.goto('/journey/hero');
    const composite = page.locator(`[data-body-type="${body}"]`);
    const base = composite.getByRole('img', {
      name: 'Avatar do Viajante',
      exact: true,
    });
    await expect
      .poll(() =>
        base.evaluate((node) => (node as HTMLImageElement).naturalWidth),
      )
      .toBe(512);
    const ids = Object.keys(EQUIPMENT_ASSET_MANIFEST);
    const scenarios = ['base', ...ids, 'complete-common', 'complete-rare'];
    for (const hair of ['curto', 'longo', 'cacheado']) {
      if (hair !== 'curto') {
        await page.evaluate((value) => {
          const key = 'rpg-jovem-cristao:journey:v1';
          const save = JSON.parse(localStorage.getItem(key)!);
          save.travelers[0].appearance.hair = value;
          localStorage.setItem(key, JSON.stringify(save));
        }, hair);
        await page.reload();
        await expect
          .poll(() =>
            base.evaluate((node) => (node as HTMLImageElement).naturalWidth),
          )
          .toBe(512);
      }
      for (const scenario of scenarios.filter(
        (value) =>
          hair === 'curto' ||
          value === 'traveler-helmet-rare' ||
          value === 'complete-rare',
      )) {
        const selected =
          scenario === 'base'
            ? []
            : scenario.startsWith('complete')
              ? ids.filter((id) =>
                  scenario === 'complete-common'
                    ? !['traveler-sword-rare', 'traveler-armor-rare'].includes(
                        id,
                      )
                    : ![
                        'traveler-sword-common',
                        'traveler-armor-uncommon',
                      ].includes(id),
                )
              : [scenario];
        const pieces = selected.flatMap(
          (id) =>
            resolveEquipmentVisual(resolveEquipmentDefinition(id)!, body)
              .layers,
        );
        await composite.evaluate(async (element, layers) => {
          element
            .querySelectorAll('[data-candidate]')
            .forEach((node) => node.remove());
          await Promise.all(
            layers.map(async ({ asset, placement: p }) => {
              const img = document.createElement('img');
              img.dataset.candidate = 'true';
              img.alt = '';
              Object.assign(img.style, {
                position: 'absolute',
                pointerEvents: 'none',
                objectFit: 'contain',
                maxWidth: 'none',
                imageRendering: 'auto',
                left: `${(p.x / 512) * 100}%`,
                top: `${(p.y / 768) * 100}%`,
                width: `${(p.width / 512) * 100}%`,
                height: `${(p.height / 768) * 100}%`,
                transform: `rotate(${p.rotation}deg)${p.mirrorX ? ' scaleX(-1)' : ''}`,
                transformOrigin: p.transformOrigin,
                zIndex: String(p.zIndex),
              });
              img.src = asset;
              element.append(img);
              await img.decode();
            }),
          );
        }, pieces);
        const box = (await composite.boundingBox())!;
        await page.screenshot({
          path: testInfo.outputPath(`${body}-${hair}-${scenario}.png`),
          clip: {
            x: box.x - 20,
            y: box.y - 25,
            width: box.width + 40,
            height: box.height + 50,
          },
          animations: 'disabled',
        });
      }
    }
  });
}
