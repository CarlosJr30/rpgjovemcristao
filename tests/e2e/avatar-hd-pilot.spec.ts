import { expect, test } from '@playwright/test';
import { EQUIPMENT_CATALOG } from '../../apps/web/features/journey/data/equipmentCatalog';
const key = 'rpg-jovem-cristao:journey:v1';
for (const gender of ['male', 'female'] as const)
  test(`HD real lab ${gender}: create, Intro, Home/Shell, Hero, equipment, Garden, Arena and Snake portrait`, async ({
    page,
  }, info) => {
    test.setTimeout(180000);
    await page.addInitScript(() => {
      localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local');
      const target = window as unknown as { hdPortraits: unknown[] };
      target.hdPortraits = [];
      const original = CanvasRenderingContext2D.prototype.drawImage;
      Object.defineProperty(CanvasRenderingContext2D.prototype, 'drawImage', {
        value: function (this: CanvasRenderingContext2D, ...args: unknown[]) {
          const img = args[0];
          if (
            img instanceof HTMLImageElement &&
            img.currentSrc.includes('/assets/avatar/hd/')
          )
            target.hdPortraits.push({
              src: img.currentSrc,
              width: img.naturalWidth,
              height: img.naturalHeight,
              crop: args.slice(1, 5),
            });
          return Reflect.apply(original, this, args);
        },
      });
    });
    const expected = `/assets/avatar/hd/${gender}/${gender}_short_moss_medium_hd.png`;
    await page.goto('/journey/create');
    await page
      .getByRole('radio', {
        name: gender === 'male' ? 'Masculino' : 'Feminino',
        exact: true,
      })
      .check();
    await expect(page.locator('[data-avatar-base]').last()).toHaveAttribute(
      'src',
      expected,
    );
    await page
      .getByLabel('Nome do Viajante', { exact: true })
      .fill(`Piloto HD ${gender}`);
    await page.getByRole('button', { name: 'Criar Viajante' }).click();
    await expect(page).toHaveURL(/\/intro$/);
    await expect(page.locator('[data-avatar-base]').last()).toHaveAttribute(
      'src',
      expected,
    );
    await page.evaluate(
      ({ key, items }) => {
        const save = JSON.parse(localStorage.getItem(key)!);
        const t = save.travelers[0];
        t.inventory = items;
        t.equipped = Object.fromEntries(
          items.map((i: { slot: string; id: string }) => [i.slot, i.id]),
        );
        t.avatar.equippedItems = {};
        t.level = 8;
        t.xp = 5600;
        t.progress.gardenStep = 'explore';
        localStorage.setItem(key, JSON.stringify(save));
      },
      { key, items: EQUIPMENT_CATALOG },
    );
    const before = await page.evaluate((key) => localStorage.getItem(key), key);
    for (const route of [
      '/journey',
      '/journey/intro',
      '/journey/hero',
      '/journey/equipment',
      '/journey/phases/o-jardim-e-a-escolha',
      '/journey/arena',
    ]) {
      await page.goto(route);
      const images = page.locator('[data-avatar-base]');
      expect(await images.count()).toBeGreaterThan(0);
      for (const image of await images.all()) {
        await expect(image).toHaveAttribute('src', expected);
        await expect
          .poll(() =>
            image.evaluate((n) => (n as HTMLImageElement).naturalWidth),
          )
          .toBe(1024);
        const r = await image.boundingBox();
        expect(r!.height / r!.width).toBeCloseTo(1.5, 2);
      }
      await expect(page.locator('[data-overlay-slot]')).toHaveCount(0);
      if (route === '/journey/equipment') {
        await expect(page.locator('[data-slot]')).toHaveCount(6);
        await page.screenshot({
          path: info.outputPath(`${gender}-equipment.png`),
          fullPage: true,
        });
      }
      if (route === '/journey/hero')
        await page.screenshot({
          path: info.outputPath(`${gender}-hero.png`),
          fullPage: true,
        });
    }
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
      before,
    );
    await page.reload();
    await expect(page.locator('[data-avatar-base]').last()).toHaveAttribute(
      'src',
      expected,
    );
    await page.route(`**${expected}`, (route) => route.abort());
    await page.goto('/journey/equipment');
    await expect(page.locator('[data-avatar-base]').last()).toHaveAttribute(
      'src',
      expected.replace('/hd/', '/runtime/').replace('_hd.png', '.png'),
    );
    await page.unroute(`**${expected}`);
    await page.reload();
    await expect
      .poll(() =>
        page
          .locator('[data-avatar-base]')
          .last()
          .evaluate((n) => (n as HTMLImageElement).naturalWidth),
      )
      .toBe(1024);
    await page.evaluate((key) => {
      const save = JSON.parse(localStorage.getItem(key)!);
      const p = save.travelers[0].progress;
      p.gardenStep = 'snake';
      p.gardenFragments = 3;
      p.bibleReading.genesis2Confirmed = true;
      p.bibleReading.genesis3Confirmed = true;
      p.bibleReading.comprehensionCompleted = true;
      p.devotionalCompleted = true;
      p.snakeTutorialCompleted = true;
      localStorage.setItem(key, JSON.stringify(save));
    }, key);
    await page.goto('/journey/phases/o-jardim-e-a-escolha');
    await page.getByRole('button', { name: 'Começar perseguição' }).click();
    await expect(
      page.getByRole('application', {
        name: 'Fuga da Serpente, jogo de perseguição',
      }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { hdPortraits: unknown[] }).hdPortraits
              .length,
        ),
      )
      .toBeGreaterThan(0);
    const portrait = await page.evaluate(
      () =>
        (
          window as unknown as {
            hdPortraits: {
              src: string;
              width: number;
              height: number;
              crop: number[];
            }[];
          }
        ).hdPortraits[0],
    );
    expect(portrait.width).toBe(1024);
    expect(portrait.height).toBe(1536);
    expect(portrait.src).toContain(expected);
    expect(portrait.crop).toEqual([300, 0, 424, 410]);
    await page
      .getByRole('application', {
        name: 'Fuga da Serpente, jogo de perseguição',
      })
      .screenshot({ path: info.outputPath(`${gender}-snake-portrait.png`) });
  });

test('HD pilot lab: switching traveler preserves both identities without new save fields', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
  );
  for (const gender of ['male', 'female']) {
    await page.goto('/journey/create');
    const createAnother = page.getByRole('button', { name: 'Criar outro Viajante', exact: true });
    if (await createAnother.isVisible()) await createAnother.click();
    await page
      .getByRole('radio', {
        name: gender === 'male' ? 'Masculino' : 'Feminino',
        exact: true,
      })
      .check();
    await page
      .getByLabel('Nome do Viajante', { exact: true })
      .fill(`Troca ${gender}`);
    await page.getByRole('button', { name: 'Criar Viajante' }).click();
    await expect(page).toHaveURL(/\/intro$/);
  }
  const snapshots = await page.evaluate((key) => {
    const save = JSON.parse(localStorage.getItem(key)!);
    return save.travelers.map((t: { id: string }) => ({
      id: t.id,
      serialized: JSON.stringify(t),
    }));
  }, key);
  for (const snapshot of snapshots) {
    const gender = await page.evaluate(
      ({ key, id }) => {
        const save = JSON.parse(localStorage.getItem(key)!);
        localStorage.setItem('rpg-jovem-cristao:active-traveler-id:v1', id);
        return save.travelers.find((t: { id: string }) => t.id === id).avatar
          .gender;
      },
      { key, id: snapshot.id },
    );
    await page.goto('/journey/hero');
    await expect(page.locator('[data-avatar-base]').last()).toHaveAttribute(
      'src',
      `/assets/avatar/hd/${gender}/${gender}_short_moss_medium_hd.png`,
    );
    expect(
      await page.evaluate(
        ({ key, id }) => {
          const save = JSON.parse(localStorage.getItem(key)!);
          return JSON.stringify(
            save.travelers.find((t: { id: string }) => t.id === id),
          );
        },
        { key, id: snapshot.id },
      ),
    ).toBe(snapshot.serialized);
  }
});
