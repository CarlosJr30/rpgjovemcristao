import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const viewports = [
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 844, height: 390 },
  { width: 915, height: 412 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
for (const viewport of viewports)
  test(`Avatar central ${viewport.width}x${viewport.height}: same identity, full body, thumbnail and fallback`, async ({
    page,
  }, info) => {
    test.skip(
      info.project.name === 'mobile' && viewport.width !== 390,
      'Six sizes covered by desktop, touch additionally covered at 390.',
    );
    test.setTimeout(90000);
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      localStorage.setItem('rpg-jovem-cristao:auth-mode:v1','local');
      const target=window as unknown as {avatarVitals:{lcp:number,cls:number}};
      target.avatarVitals={lcp:0,cls:0};
      new PerformanceObserver(list=>{for(const e of list.getEntries()) target.avatarVitals.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
      new PerformanceObserver(list=>{for(const e of list.getEntries()){const x=e as PerformanceEntry & {value:number,hadRecentInput:boolean};if(!x.hadRecentInput)target.avatarVitals.cls+=x.value;}}).observe({type:'layout-shift',buffered:true});
    });
    await page.goto('/journey/create');
    await page
      .getByLabel('Nome do Viajante', { exact: true })
      .fill('Viajante Runtime');
    await page.getByRole('button', { name: 'Criar Viajante' }).click();
    await expect(page).not.toHaveURL(/\/create$/);
    const variants = [
      {hair:'longo',outfit:'azul',skin:'escuro',key:'long_blue_dark'},
      {hair:'curto',outfit:'musgo',skin:'claro',key:'short_moss_light'},
      {hair:'cacheado',outfit:'ocre',skin:'medio',key:'curly_ochre_medium'},
      {hair:'cacheado',outfit:'azul',skin:'escuro',key:'curly_blue_dark'},
      {hair:'longo',outfit:'musgo',skin:'medio',key:'long_moss_medium'},
      {hair:'curto',outfit:'ocre',skin:'claro',key:'short_ochre_light'},
    ];
    const variant=variants[viewports.indexOf(viewport)];
    for (const gender of ['male', 'female'] as const) {
      const before = await page.evaluate(({body,appearance}) => {
        const key = 'rpg-jovem-cristao:journey:v1',
          save = JSON.parse(localStorage.getItem(key)!);
        const traveler = save.travelers[0];
        traveler.avatar.gender = body;
        traveler.avatar.face = 3;
        traveler.avatar.hair = 2;
        traveler.appearance = appearance;
        traveler.level = 8;
        traveler.xp = 5600;
        traveler.progress.gardenStep = 'explore';
        localStorage.setItem(key, JSON.stringify(save));
        return JSON.stringify(save);
      }, {body:gender,appearance:{hair:variant.hair,outfit:variant.outfit,skin:variant.skin}});
      const expected = `/assets/avatar/hd/${gender}/${gender}_${variant.key}_hd.png`;
      for (const route of ['', 'hero', 'equipment', 'guild', 'diary']) {
        await page.goto(`/journey/${route}`);
        const runtimes = page.locator('[data-avatar-runtime]');
        await expect(runtimes.first()).toHaveAttribute(
          'data-avatar-body-type',
          gender,
        );
        await expect(runtimes.first()).toHaveAttribute(
          'data-avatar-face-id',
          '3',
        );
        const images = page.locator('[data-avatar-base]');
        expect(await images.count()).toBeGreaterThan(0);
        for (const image of await images.all()) {
          await expect(image).toHaveAttribute('src', expected);
          await expect
            .poll(() =>
              image.evaluate((node) => (node as HTMLImageElement).naturalWidth),
            )
            .toBe(1024);
          const geometry = await image.evaluate((node) => {
            const rect = node.getBoundingClientRect();
            return {
              width: rect.width,
              height: rect.height,
              fit: getComputedStyle(node).objectFit,
              rendering: getComputedStyle(node).imageRendering,
            };
          });
          expect(geometry.width).toBeGreaterThan(0);
          expect(geometry.width).toBeLessThanOrEqual(512);
          expect(geometry.height / geometry.width).toBeCloseTo(1.5, 2);
          expect(geometry.fit).toBe('contain');
          expect(geometry.rendering).toBe('auto');
        }
        await expect(page.locator('[data-overlay-slot]')).toHaveCount(0);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (['', 'hero', 'equipment', 'guild', 'diary'].includes(route))
          await page.screenshot({
            path: info.outputPath(
              `${gender}-${route || 'home'}-${viewport.width}x${viewport.height}.png`,
            ),
            fullPage: true,
          });
      }
      await page.goto('/journey/phases/o-jardim-e-a-escolha');
      await expect(
        page.locator('[class*="gardenAvatar"] [data-avatar-runtime]'),
      ).toHaveAttribute('data-body-type', gender);
      await expect(
        page.locator('[class*="gardenAvatar"] [data-avatar-base]'),
      ).toHaveAttribute('src', expected);
      await page.goto('/journey/arena');
      const actor = page
        .locator('[data-portrait-side="player"] [data-avatar-runtime]')
        .first();
      await expect(actor).toHaveAttribute('data-avatar-mode', 'arena');
      await expect(actor.locator('[data-avatar-base]')).toHaveAttribute(
        'src',
        expected,
      );
      const metrics=await page.evaluate(()=>({
        images:performance.getEntriesByType('resource').filter(e=>e.name.includes('/assets/avatar/hd/')).map(e=>{const r=e as PerformanceResourceTiming;return {url:r.name,transferSize:r.transferSize,decodedBodySize:r.decodedBodySize,duration:r.duration};}),
        navigation:performance.getEntriesByType('navigation').map(e=>({duration:e.duration})),
        vitals:(window as unknown as {avatarVitals:unknown}).avatarVitals,
        screen:{width:innerWidth,height:innerHeight},
      }));
      expect(new Set(metrics.images.map(i=>i.url)).size).toBeLessThanOrEqual(1);
      expect(metrics.images.length).toBeGreaterThan(0);
      await writeFile(info.outputPath(gender+'-performance.json'),JSON.stringify(metrics,null,2));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.screenshot({
        path: info.outputPath(
          `${gender}-arena-${viewport.width}x${viewport.height}.png`,
        ),
        fullPage: true,
      });
      expect(
        await page.evaluate(() =>
          localStorage.getItem('rpg-jovem-cristao:journey:v1'),
        ),
      ).toBe(before);
      await page.route(`**${expected}`, (route) => route.abort());
      await page.goto('/journey/equipment');
      await expect(page.locator('[data-avatar-base]').last()).toHaveAttribute(
        'src',
        expected.replace('/hd/', '/runtime/').replace('_hd.png', '.png'),
      );
      await page.screenshot({
        path: info.outputPath(
          `${gender}-fallback-${viewport.width}x${viewport.height}.png`,
        ),
        fullPage: true,
      });
      await page.goto('/journey/arena');
      await expect(page.locator('[data-portrait-side="player"] [data-avatar-base]')).toHaveAttribute('src',expected.replace('/hd/','/runtime/').replace('_hd.png','.png'));
      await page.screenshot({path:info.outputPath(gender+'-arena-legacy-'+viewport.width+'x'+viewport.height+'.png'),fullPage:true});
      await page.unroute(`**${expected}`);
      await page.evaluate(() => {
        const key = 'rpg-jovem-cristao:journey:v1',
          save = JSON.parse(localStorage.getItem(key)!);
        save.travelers[0].appearance.hair = 'cacheado';
        localStorage.setItem(key, JSON.stringify(save));
      });
      await page.reload();
      await expect(page.locator('[data-avatar-fallback]')).toHaveCount(0);
      await expect(page.locator('[data-avatar-base]').last()).toHaveAttribute(
        'src',
        expected.replace(/_(long|short|curly)_/, '_curly_'),
      );
    }
  });
