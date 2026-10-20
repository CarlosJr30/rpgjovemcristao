// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createTraveler, DEFAULT_APPEARANCE } from '../journey/domain/traveler';
import { ORIGINS_LESSONS } from './origins-lessons';
import { OriginsWorkbook } from './origins-workbook';
import {
  learningEvents,
  workbookOwner,
  workbookTraveler,
} from '../../../../tests/fixtures/origins-workbook';
vi.mock('../journey/components/snake-chase-game', () => ({
  SnakeChaseGame: ({ onComplete }: { onComplete: () => void }) => (
    <button onClick={onComplete}>Vitória sintética da Serpente</button>
  ),
}));
const traveler = () =>
  createTraveler(
    'Lia',
    DEFAULT_APPEARANCE,
    workbookTraveler,
    '2026-10-20T12:00:00Z',
  );
afterEach(() => {
  cleanup();
  localStorage.clear();
});
it('reading must be opened then confirmed, and reload resumes the workbook without official progression', async () => {
  const lesson = ORIGINS_LESSONS[0];
  const ui = render(
    <OriginsWorkbook
      lesson={lesson}
      traveler={traveler()}
      ownerId={workbookOwner}
    />,
  );
  await screen.findByRole('button', { name: /1. Céus e terra/ });
  for (const scene of lesson.scenes)
    fireEvent.click(
      screen.getByRole('button', { name: new RegExp(scene.title) }),
    );
  const confirm = await screen.findByRole('button', {
    name: 'Confirmar leitura de Gênesis 1',
  });
  expect(confirm).toBeDisabled();
  fireEvent.click(screen.getByRole('link', { name: 'Abrir Gênesis 1 ↗' }));
  expect(confirm).toBeEnabled();
  fireEvent.click(confirm);
  fireEvent.click(screen.getByRole('link', { name: 'Abrir Gênesis 2 ↗' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirmar leitura de Gênesis 2' }),
  );
  await screen.findByText('O mosaico dos dias');
  expect(screen.getByLabelText('Dia 1',{exact:true})).toHaveRole('combobox');
  ui.unmount();
  render(
    <OriginsWorkbook
      lesson={lesson}
      traveler={traveler()}
      ownerId={workbookOwner}
    />,
  );
  await screen.findByText('O mosaico dos dias');
  expect(screen.queryByText('História concluída')).toBeNull();
  expect(localStorage.length).toBe(1);
  for(const task of lesson.activity.tasks)fireEvent.change(screen.getByLabelText(task.prompt,{exact:true}),{target:{value:task.answer}});
  for(const q of lesson.quiz)fireEvent.click(screen.getByRole('radio',{name:q.options.find(o=>o.id===q.correctOptionId)!.text}));
  expect(screen.getByRole('radio',{name:'Cultivar e guardar'})).toBeChecked();
  expect(screen.getByRole('button',{name:'Continuar para reflexão'})).toBeEnabled();
  expect(screen.queryByRole('textbox')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Continuar para reflexão'}));
  expect(screen.getByRole('textbox')).toBeVisible();
});
it('Garden reuses the Serpent callback after reading, while legacy gardenCompleted does not skip its preview', async () => {
  const lesson = ORIGINS_LESSONS[1],
    t = traveler();
  t.progress.gardenCompleted = true;
  t.progress.nextPhaseUnlocked = true;
  const ui = render(
    <OriginsWorkbook lesson={lesson} traveler={t} ownerId={workbookOwner} />,
  );
  await screen.findByText(/Visitados: 0\/4/);
  ui.unmount();
  const scope = {
    owner: workbookOwner,
    traveler: workbookTraveler,
    storyId: lesson.storyId,
    revision: 1,
  };
  localStorage.setItem(
    `rpg-story-workbook:v1:${workbookOwner}:${workbookTraveler}:${lesson.storyId}:1`,
    JSON.stringify({ scope, events: learningEvents(lesson, 'activity') }),
  );
  render(
    <OriginsWorkbook lesson={lesson} traveler={t} ownerId={workbookOwner} />,
  );
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Vitória sintética da Serpente',
    }),
  );
  await screen.findByText('O que você compreendeu?');
  expect(t.xp).toBe(0);
  expect(t.coins).toBe(0);
});
it('reflection is optional private drafting with no score, storage or leader submission; video remains mandatory', async () => {
  const lesson = ORIGINS_LESSONS[2],
    scope = {
      owner: workbookOwner,
      traveler: workbookTraveler,
      storyId: lesson.storyId,
      revision: 1,
    };
  const key = `rpg-story-workbook:v1:${workbookOwner}:${workbookTraveler}:${lesson.storyId}:1`;
  localStorage.setItem(
    key,
    JSON.stringify({ scope, events: learningEvents(lesson, 'reflection') }),
  );
  render(
    <OriginsWorkbook
      lesson={lesson}
      traveler={traveler()}
      ownerId={workbookOwner}
    />,
  );
  const input = await screen.findByRole('textbox');
  fireEvent.change(input, {
    target: { value: 'PRIVATE-REFLECTION-NEVER-PERSIST' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Refleti em particular' }),
  );
  await screen.findByText('Atividades desta prévia realizadas');
  expect(localStorage.getItem(key)).not.toContain('PRIVATE-REFLECTION');
  expect(localStorage.getItem(key)).not.toMatch(
    /video_completed|reward_receipt|completed_at/,
  );
  await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
});
