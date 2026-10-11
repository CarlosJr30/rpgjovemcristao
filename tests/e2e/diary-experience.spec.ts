import { expect, test, type Page } from '@playwright/test';
import { BIBLE_LINKS } from '../../apps/web/features/journey/data/bibleLinks';
const sizes = [
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 844, height: 390 },
  { width: 915, height: 412 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
async function create(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
  );
  await page.goto('/journey/create');
  await page
    .getByLabel('Nome do Viajante', { exact: true })
    .fill('Viajante do Diário');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await expect(page).not.toHaveURL(/\/create$/);
}
for (const viewport of sizes)
  test(`Diário ${viewport.width}x${viewport.height}: empty, records, long reflection and privacy`, async ({
    page,
  }, info) => {
    test.skip(
      info.project.name === 'mobile' && viewport.width !== 390,
      'Desktop covers all sizes; mobile verifies touch.',
    );
    await page.setViewportSize(viewport);
    await create(page);
    await page.goto('/journey/diary');
    await expect(
      page.getByRole('heading', { name: 'Diário do Viajante', exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/Nenhum evento com data/)).toBeVisible();
    await expect(page.locator('textarea')).toHaveCount(0);
    const contrast = await page
      .getByRole('region', { name: 'Sua jornada atual' })
      .evaluate((section) => {
        const luminance = (color: string) => {
          const rgb = color
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number);
          const linear = rgb.map((n) => {
            const c = n / 255;
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          });
          return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
        };
        const background = luminance(getComputedStyle(section).backgroundColor);
        return Array.from(
          section.querySelectorAll('h2, p, small, strong, progress + span'),
        ).map((el) => {
          const foreground = luminance(getComputedStyle(el).color);
          return (
            (Math.max(background, foreground) + 0.05) /
            (Math.min(background, foreground) + 0.05)
          );
        });
      });
    expect(contrast.every((ratio) => ratio >= 4.5)).toBe(true);
    await expect(
      page
        .getByRole('region', { name: 'Sua jornada atual' })
        .getByRole('progressbar'),
    ).toHaveAttribute('value', '0');
    await page.screenshot({
      path: info.outputPath(`empty-${viewport.width}x${viewport.height}.png`),
      fullPage: true,
    });
    const reflection =
      'Reflexão privada de teste. ' + 'responsabilidade'.repeat(45);
    await page.evaluate((answer) => {
      const key = 'rpg-jovem-cristao:journey:v1',
        save = JSON.parse(localStorage.getItem(key)!);
      const p = save.travelers[0].progress;
      p.gardenStep = 'done';
      p.gardenCompleted = true;
      p.gardenRewardGranted = true;
      p.devotionalCompleted = true;
      p.devotionalReflection = answer;
      p.quizAttemptId = 3;
      p.bibleReading = {
        genesis2Opened: '2026-10-02T12:00:00Z',
        genesis2Confirmed: true,
        genesis3Opened: '2026-10-02T12:03:00Z',
        genesis3Confirmed: true,
        comprehensionCompleted: true,
      };
      p.guildChallengeStatus = 'awaiting-validation';
      p.guildChallengeSubmittedAt = '2026-10-03T12:00:00Z';
      p.diaryEntries = 2;
      localStorage.setItem(key, JSON.stringify(save));
    }, reflection);
    await page.reload();
    const before = await page.evaluate(() =>
      localStorage.getItem('rpg-jovem-cristao:journey:v1'),
    );
    await expect(page.locator('[data-private-reflection]')).not.toBeVisible();
    await expect(page.locator('[data-diary-guild-state]')).toContainText(
      'Aguardando validação',
    );
    await expect(
      page
        .getByRole('region', { name: 'Sua jornada atual' })
        .getByRole('progressbar'),
    ).toHaveAttribute('value', '11');
    for (const reading of [BIBLE_LINKS.genesis2, BIBLE_LINKS.genesis3]) {
      const link = page.getByRole('link', {
        name: `Abrir ${reading.label} na Bíblia ↗`,
        exact: true,
      });
      await expect(link).toHaveAttribute('href', reading.url);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    const quiz = page.locator('#diary-quiz');
    await expect(quiz).toContainText('Quiz concluído');
    await expect(quiz).toContainText('Tentativas iniciadas registradas: 3');
    const ids = await page
      .locator('[data-diary-event]')
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute('data-diary-event')),
      );
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => id === 'phase-reward')).toHaveLength(1);
    const summary = page.getByText('Ver minha reflexão privada', {
      exact: true,
    });
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-private-reflection]')).toHaveText(
      reflection,
    );
    await expect(summary).toBeFocused();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect
      .poll(() =>
        page
          .locator('#diary-reflection')
          .evaluate((el) => getComputedStyle(el).animationName),
      )
      .toBe('none');
    await page.screenshot({
      path: info.outputPath(`diary-${viewport.width}x${viewport.height}.png`),
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const targets = await page
      .locator('main a,main button,main summary')
      .evaluateAll((nodes) =>
        nodes
          .filter((n) => n.getBoundingClientRect().height > 0)
          .map((n) => n.getBoundingClientRect().height),
      );
    expect(targets.every((h) => h >= 44)).toBe(true);
    expect(
      await page.evaluate(() =>
        localStorage.getItem('rpg-jovem-cristao:journey:v1'),
      ),
    ).toBe(before);
    await page.getByRole('button', { name: 'Registrar participação' }).click();
    await expect(
      page.getByRole('button', { name: 'Registrar participação' }),
    ).toBeDisabled();
    await expect(page.getByRole('status')).toContainText(
      'Nenhum texto novo foi salvo',
    );
    await expect(page.locator('[data-diary-participations]')).toHaveText('3');
    const after = await page.evaluate(() =>
      localStorage.getItem('rpg-jovem-cristao:journey:v1'),
    );
    const previousSave = JSON.parse(before!),
      nextSave = JSON.parse(after!);
    previousSave.travelers[0].progress.diaryEntries++;
    expect(nextSave).toEqual(previousSave);
    await page.reload();
    await expect(page.locator('[data-private-reflection]')).not.toBeVisible();
    await expect(page.locator('[data-diary-participations]')).toHaveText('3');
  });
test('Continue devotional uses the phase gate and returns the stored reflection to the Diary', async ({
  page,
}) => {
  await create(page);
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1',
      save = JSON.parse(localStorage.getItem(key)!);
    const p = save.travelers[0].progress;
    p.gardenStep = 'reflection';
    p.bibleReading = {
      genesis2Opened: '2026-10-02T12:00:00Z',
      genesis2Confirmed: true,
      genesis3Opened: '2026-10-02T12:03:00Z',
      genesis3Confirmed: true,
      comprehensionCompleted: true,
    };
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.goto('/journey/diary');
  await expect(
    page.getByRole('region', { name: 'Sua jornada atual' }),
  ).toContainText('Continue o Devocional');
  await page
    .getByRole('link', { name: 'Continuar devocional na fase →', exact: true })
    .click();
  await page
    .getByLabel(
      'Depois da leitura, qual responsabilidade mais chamou sua atenção?',
    )
    .fill('Resposta de teste armazenada pelo fluxo existente.');
  await page
    .getByRole('button', {
      name: 'Salvar reflexão e continuar para a Missão →',
      exact: true,
    })
    .click();
  await page.goto('/journey/diary');
  await expect(page.locator('#diary-reflection')).toContainText(
    'Devocional concluído',
  );
  await page.getByText('Ver minha reflexão privada', { exact: true }).click();
  await expect(page.locator('[data-private-reflection]')).toHaveText(
    'Resposta de teste armazenada pelo fluxo existente.',
  );
  await expect(
    page.getByRole('region', { name: 'Sua jornada atual' }),
  ).toContainText('Realize a missão do Jardim');
});
