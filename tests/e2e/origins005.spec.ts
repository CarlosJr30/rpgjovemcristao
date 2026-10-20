import { test, expect, type Page } from '@playwright/test';
import {
  mockAuthorityAccount,
  loginAuthorityAccount,
} from '../fixtures/authority-browser-account';
import {
  ORIGINS_LESSONS,
  type OriginsLesson,
} from '../../apps/web/features/story/origins-lessons';
async function exploreAndRead(page: Page, lesson: OriginsLesson) {
  for (const scene of lesson.scenes)
    await page.getByRole('button', { name: new RegExp(scene.title) }).click();
  for (const reading of lesson.readings) {
    const popup = page.waitForEvent('popup');
    await page
      .getByRole('link', { name: `Abrir ${reading.reference} ↗` })
      .click();
    const opened = await popup;
    await opened.close();
    await page
      .getByRole('button', {
        name: `Confirmar leitura de Gênesis ${reading.chapter}`,
      })
      .click();
  }
}
async function fit(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
test('Origins Creation learns through mandatory video gate and resumes without publishing private reflection or granting progress', async ({
  page,
  context,
}, info) => {
  await mockAuthorityAccount(context);
  await loginAuthorityAccount(page);
  const writes: string[] = [];
  page.on('request', (req) => {
    if (
      req.method() === 'POST' &&
      /complete_story|arena_authority|add_coins|claim_chest|guild_/.test(
        req.url(),
      )
    )
      writes.push(req.url());
  });
  await page.goto('/journey/stories/creation');
  await expect(
    page.getByRole('heading', { name: 'A Criação', exact: true }),
  ).toBeVisible();
  const lesson = ORIGINS_LESSONS[0];
  await exploreAndRead(page, lesson);
  await expect(
    page.getByRole('heading', { name: 'O mosaico dos dias' }),
  ).toBeVisible();
  for (const task of lesson.activity.tasks)
    await page
      .getByLabel(task.prompt, { exact: true })
      .selectOption(task.answer);
  await expect(
    page.getByRole('heading', { name: 'O que você compreendeu?' }),
  ).toBeVisible();
  for (const [i, question] of lesson.quiz.entries()) {
    const correct = question.options.find(
      (o) => o.id === question.correctOptionId,
    )!;
    await page
      .getByRole('group', { name: `${i + 1}. ${question.question}` })
      .getByRole('radio', { name: correct.text, exact: true })
      .check();
  }
  await page.getByRole('button',{name:'Continuar para reflexão'}).click();
  await page
    .getByRole('textbox', { name: 'Rascunho opcional, somente nesta tela' })
    .fill('005_PRIVATE_DRAFT_MUST_NOT_PERSIST');
  await page.getByRole('button', { name: 'Refleti em particular' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividades desta prévia realizadas' }),
  ).toBeVisible();
  await expect(
    page.getByText(/Aguardando seleção de um vídeo autorizado/),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Concluir história', exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage)
        .filter((k) => k.startsWith('rpg-story-workbook:'))
        .map((k) => localStorage.getItem(k))
        .join(''),
    ),
  ).not.toContain('005_PRIVATE_DRAFT');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Atividades desta prévia realizadas' }),
  ).toBeVisible();
  expect(writes).toEqual([]);
  await fit(page);
  await page.screenshot({
    path: `build/task-consolidation-005/${info.project.name}-creation-video-gate.png`,
    fullPage: true,
    animations: 'disabled',
  });
});
test('five candidate chapters remain consultable, official order stays locked and Garden uses the existing Serpent', async ({
  page,
  context,
}, info) => {
  await mockAuthorityAccount(context);
  await loginAuthorityAccount(page);
  await page.goto('/journey/worlds/origins');
  await expect(
    page
      .getByRole('list', { name: 'Histórias de As Origens' })
      .getByRole('listitem'),
  ).toHaveCount(5);
  for (const lesson of ORIGINS_LESSONS) {
    await page.goto(`/journey/stories/${lesson.storyId}`);
    await expect(
      page
        .getByRole('navigation', { name: 'Acontecimentos da história' })
        .getByRole('button'),
    ).toHaveCount(4);
    await expect(
      page.getByRole('button', { name: 'Concluir história', exact: true }),
    ).toBeDisabled();
    await fit(page);
  }
  await page.goto('/journey/stories/garden-choice');
  await expect(
    page.getByText(/Conclua a história anterior para avançar/),
  ).toBeVisible();
  await exploreAndRead(page, ORIGINS_LESSONS[1]);
  await expect(
    page.getByRole('heading', { name: 'Fuga da Serpente', exact: true }),
  ).toHaveCount(1);
  await expect(page.locator('canvas')).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Começar',exact:true }),
  ).toBeVisible();
  await page.getByRole('button',{name:'Começar',exact:true}).click();
  await expect(page.getByRole('button',{name:'Pausar',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Pausar',exact:true}).click();
  await expect(page.getByRole('button',{name:'Retomar',exact:true})).toBeVisible();
  await fit(page);
  await page.screenshot({
    path: `build/task-consolidation-005/${info.project.name}-garden-reuse.png`,
    fullPage: true,
    animations: 'disabled',
  });
});
