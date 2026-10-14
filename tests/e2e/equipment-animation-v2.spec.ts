import { expect, test } from '@playwright/test';
import { EQUIPMENT_CATALOG } from '../../apps/web/features/journey/data/equipmentCatalog';
import { equipmentAnimationAnchor } from '../../apps/web/features/journey/data/equipmentAnimation';
import { RARITY_PRESENTATION } from '../../apps/web/features/journey/data/equipmentCinematic';

function installFlightRecorder() {
  const readFlight = (node: HTMLImageElement) => {
    const img = node,
      style = getComputedStyle(img);
    const avatar = document
      .querySelector('[data-body-type]')!
      .getBoundingClientRect();
    const scene = img.closest<HTMLElement>('[data-equipment-cinematic]')!;
    const animation = img.getAnimations()[0] as CSSAnimation;
    const frames = (animation.effect as KeyframeEffect).getKeyframes();
    return {
      src: img.currentSrc,
      naturalWidth: img.naturalWidth,
      cssWidth: parseFloat(style.width),
      cssHeight: parseFloat(style.height),
      filter: style.filter,
      interpolation: style.imageRendering,
      duration: animation.effect!.getTiming().duration,
      frames,
      targetX: parseFloat(scene.style.getPropertyValue('--target-x')),
      targetY: parseFloat(scene.style.getPropertyValue('--target-y')),
      avatar: {
        x: avatar.x,
        y: avatar.y,
        width: avatar.width,
        height: avatar.height,
      },
      parentIsBody: scene.parentElement === document.body,
    };
  };
  const samples: ReturnType<typeof readFlight>[] = [];
  Object.defineProperty(window, '__iconFlightSamples', {
    value: samples,
    configurable: true,
  });
  new MutationObserver((records) => {
    for (const record of records)
      for (const node of Array.from(record.addedNodes)) {
        if (
          node instanceof HTMLImageElement &&
          node.hasAttribute('data-equipment-flight')
        ) {
          const capture = () => samples.push(readFlight(node));
          if (node.complete) capture();
          else node.addEventListener('load', capture, { once: true });
        }
      }
  }).observe(document.body, { childList: true, subtree: true });
  return samples;
}

type RecordedFlight = ReturnType<typeof installFlightRecorder>[number];
const slots = {
  helmet: 'Elmo',
  armor: 'Armadura',
  weapon: 'Arma',
  shield: 'Escudo',
  boots: 'Botas',
  amulet: 'Medalhão',
} as const;
for (const body of ['female', 'male'] as const) {
  test(`${body}: icon flight, impact, fallback, swap, unequip and reduced motion`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(
      testInfo.project.name === 'mobile'
        ? { width: 390, height: 844 }
        : { width: 1440, height: 900 },
    );
    await page.addInitScript(() =>
      localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
    );
    await page.goto('/journey/create');
    await page
      .getByLabel('Nome do Viajante', { exact: true })
      .fill('Viajante Animação');
    await page
      .getByRole('radio', {
        name: body === 'female' ? 'Feminino' : 'Masculino',
        exact: true,
      })
      .check();
    await page.getByRole('button', { name: 'Criar Viajante' }).click();
    await expect(page).not.toHaveURL(/\/create$/);
    const sword = EQUIPMENT_CATALOG.find((item) => item.slot === 'weapon')!;
    const alternative = {
      ...sword,
      id: 'traveler-sword-rare',
      name: 'Espada alternativa',
    };
    await page.evaluate(
      (items) => {
        const key = 'rpg-jovem-cristao:journey:v1',
          save = JSON.parse(localStorage.getItem(key)!);
        save.travelers[0].inventory = items;
        save.travelers[0].equipped = {};
        save.travelers[0].avatar.equippedItems = {};
        localStorage.setItem(key, JSON.stringify(save));
      },
      [...EQUIPMENT_CATALOG, alternative],
    );
    await page.goto('/journey/equipment');
    const base = await page
      .locator('[data-body-type]')
      .getByRole('img', { name: 'Avatar do Viajante', exact: true })
      .elementHandle();
    await page.evaluate(installFlightRecorder);
    const samples: (RecordedFlight & { slot: string })[] = [];
    for (const [slot, label] of Object.entries(slots)) {
      await page.getByRole('button', { name: label, exact: true }).click();
      const item = EQUIPMENT_CATALOG.find((entry) => entry.slot === slot)!;
      const card = page.locator('article').filter({
        has: page.getByRole('heading', { name: item.name, exact: true }),
      });
      const sampleIndex: number = samples.length;
      await card.getByRole('button', { name: 'Equipar', exact: true }).click();
      const flight = page.locator('[data-equipment-flight]');
      // Capture at creation instead of polling for a short-lived DOM node.

      await expect(
        page.locator('[data-mobile-screen="equipment"] [data-overlay-slot]'),
      ).toHaveCount(0);
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (
                window as unknown as Window & {
                  __iconFlightSamples: ReturnType<typeof installFlightRecorder>;
                }
              ).__iconFlightSamples.length,
          ),
        )
        .toBeGreaterThan(sampleIndex);
      const sample: RecordedFlight = await page.evaluate(
        (index) =>
          (
            window as unknown as Window & {
              __iconFlightSamples: ReturnType<typeof installFlightRecorder>;
            }
          ).__iconFlightSamples[index],
        sampleIndex,
      );
      expect(sample.parentIsBody).toBe(true);
      expect(sample.src).toMatch(/_icon\.png$/);
      expect(sample.duration).toBe(
        RARITY_PRESENTATION[item.rarity].timings.FLY_TO_TARGET,
      );
      expect(sample.filter).toBe('none');
      expect(sample.interpolation).toBe('auto');
      expect(sample.naturalWidth).toBeGreaterThan(sample.cssWidth * 1.06);
      expect(sample.cssWidth / sample.cssHeight).toBeCloseTo(1, 2);
      expect(sample.frames).toHaveLength(4);
      const anchor = equipmentAnimationAnchor(body, slot as keyof typeof slots);
      const viewport = page.viewportSize()!;
      const targetX = sample.avatar.x + sample.avatar.width * anchor.x;
      const targetY = sample.avatar.y + sample.avatar.height * anchor.y;
      expect(sample.targetX).toBeCloseTo(
        Math.max(20, Math.min(viewport.width - 20, targetX)),
        1,
      );
      expect(sample.targetY).toBeCloseTo(
        Math.max(20, Math.min(viewport.height - 20, targetY)),
        1,
      );
      samples.push({ slot, ...sample });
      if (slot === 'weapon')
        await page.screenshot({
          path: testInfo.outputPath(`${body}-icon-flight.png`),
        });
      await expect(flight).toHaveCount(0);
      await expect(page.locator('[data-equipment-impact]')).toHaveCount(0);
      await expect(
        card.getByRole('button', { name: 'Desequipar', exact: true }),
      ).toBeEnabled();
      await expect(page.getByRole('status')).toContainText(
        body === 'female' && slot === 'armor'
          ? 'Agora aparece no Avatar'
          : 'Camada corporal pendente',
      );
      await expect(
        page.locator('[data-mobile-screen="equipment"] [data-overlay-slot]'),
      ).toHaveCount(body === 'female' && slot === 'armor' ? 1 : 0);
      expect(await base!.evaluate((node) => node.isConnected)).toBe(true);
      await card
        .getByRole('button', { name: 'Desequipar', exact: true })
        .click();
      await expect(
        card.getByRole('button', { name: 'Equipar', exact: true }),
      ).toBeEnabled();
      await expect(page.locator('[data-equipment-flight]')).toHaveCount(0);
    }
    await page.getByRole('button', { name: 'Arma', exact: true }).click();
    const commonCard = page.locator('article').filter({
      has: page.getByRole('heading', { name: sword.name, exact: true }),
    });
    const alternativeCard = page.locator('article').filter({
      has: page.getByRole('heading', { name: alternative.name, exact: true }),
    });
    await commonCard
      .getByRole('button', { name: 'Equipar', exact: true })
      .click();
    await expect(
      commonCard.getByRole('button', { name: 'Desequipar', exact: true }),
    ).toBeEnabled();
    await alternativeCard
      .getByRole('button', { name: 'Equipar', exact: true })
      .click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as unknown as Window & {
                __iconFlightSamples: ReturnType<typeof installFlightRecorder>;
              }
            ).__iconFlightSamples.length,
        ),
      )
      .toBe(8);
    await expect(
      alternativeCard.getByRole('button', { name: 'Desequipar', exact: true }),
    ).toBeEnabled();
    await expect(
      commonCard.getByRole('button', { name: 'Equipar', exact: true }),
    ).toBeEnabled();
    await expect(
      page.locator('[data-mobile-screen="equipment"] [data-overlay-slot]'),
    ).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await alternativeCard
      .getByRole('button', { name: 'Desequipar', exact: true })
      .click();
    await expect(
      alternativeCard.getByRole('button', { name: 'Equipar', exact: true }),
    ).toBeEnabled();
    await commonCard
      .getByRole('button', { name: 'Equipar', exact: true })
      .click();
    await expect(page.locator('[data-equipment-flight]')).toHaveCount(0);
    await expect(page.locator('[data-equipment-impact]')).toHaveCount(0);
    await expect(
      commonCard.getByRole('button', { name: 'Desequipar', exact: true }),
    ).toBeEnabled();
    await expect(page.getByRole('status')).toContainText(
      'Camada corporal pendente',
    );
    expect(await base!.evaluate((node) => node.isConnected)).toBe(true);
    await testInfo.attach('icon-flight-measurements', {
      body: JSON.stringify(samples, null, 2),
      contentType: 'application/json',
    });
    await page.screenshot({
      path: testInfo.outputPath(`${body}-fallback-reduced-motion.png`),
    });
  });
}
