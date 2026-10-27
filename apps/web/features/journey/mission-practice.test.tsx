// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { createTraveler, DEFAULT_APPEARANCE } from './domain/traveler';
const m = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock('./state/use-journey', () => ({ updateTraveler: m.save }));
vi.mock('./components/avatar-runtime', () => ({
  AvatarRuntime: () => <span>Avatar</span>,
}));
vi.mock('./audio/audio-manager', () => ({
  gameAudio: { playEffect: vi.fn() },
}));
import {
  MissionPractice,
  missionPracticeTraveler,
} from './screens/mission-practice';
import { BibleReading } from './components/bible-reading';
import { GardenExploration } from './components/garden-exploration';
const source = () =>
  createTraveler('Lia', DEFAULT_APPEARANCE, 'hero', '2026-10-27T10:00:00Z');
beforeEach(() => {
  m.save.mockClear();
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.setAttribute('open', ''); } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.removeAttribute('open'); } });
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});
test('practice starts fresh without changing persisted source, economic fields or completion', () => {
  const s = source();
  s.progress.gardenCompleted = true;
  s.progress.devotionalReflection = 'private server text';
  s.progress.bibleReading.genesis2Confirmed = true;
  const before = structuredClone(s),
    p = missionPracticeTraveler(s);
  expect(p.progress.bibleReading.genesis2Confirmed).toBe(false);
  expect(p.progress.devotionalReflection).toBe('');
  expect(p.xp).toBe(s.xp);
  expect(p.coins).toBe(s.coins);
  expect(p.inventory).toEqual(s.inventory);
  expect(s).toEqual(before);
});
test('demonstration without an explicit memory callback never falls back to legacy persistence', () => {
  render(
    <BibleReading traveler={source()} demonstration onComplete={() => {}} />,
  );
  const link = screen.getAllByRole('link')[0];
  link.addEventListener('click', (e) => e.preventDefault());
  fireEvent.click(link);
  expect(m.save).not.toHaveBeenCalled();
  expect(
    screen.getAllByRole('button', { name: 'Concluí a leitura' })[0],
  ).toBeDisabled();
});
test('exploration demonstration exposes only three objective fragments and no economic actions', () => {
  const { container } = render(
    <GardenExploration
      demonstration
      traveler={source()}
      onComplete={() => {}}
    />,
  );
  expect(container.querySelectorAll('[data-garden-point]')).toHaveLength(3);
  expect(
    container.querySelector(
      '[data-garden-point="coins-grove"],[data-garden-point="chest-hidden"],[data-garden-point="wind-pattern"]',
    ),
  ).toBeNull();
  expect(screen.queryByText('MOEDAS')).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Adicionar à mochila' }),
  ).toBeNull();
});
test('reading, comprehension, reflection, three exploration objectives and quiz never persist or grant', () => {
  vi.useFakeTimers();
  const s = source(),
    before = structuredClone(s);
  render(<MissionPractice source={s} />);
  fireEvent.click(
    screen.getByRole('button', { name: 'Iniciar demonstração →' }),
  );
  expect(
    screen.getByRole('button', { name: 'Continuar para o checkpoint →' }),
  ).toBeDisabled();
  screen.getAllByRole('link', { name: 'Abrir na Bíblia ↗' }).forEach((link) => {
    link.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(link);
  });
  screen
    .getAllByRole('button', { name: 'Concluí a leitura' })
    .forEach((button) => fireEvent.click(button));
  fireEvent.click(
    screen.getByRole('button', { name: 'Continuar para o checkpoint →' }),
  );
  expect(
    screen.getByRole('button', { name: 'Concluir checkpoint →' }),
  ).toBeDisabled();
  fireEvent.click(screen.getByLabelText('Cultivar e guardar o jardim'));
  fireEvent.click(
    screen.getByLabelText('Há liberdade ampla e um limite específico'),
  );
  fireEvent.click(
    screen.getByLabelText('Surgem vergonha, medo e consequências'),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Concluir checkpoint →' }),
  );
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Reservar um momento de oração (opcional)',
    }),
  );
  expect(screen.getByText('Oração opcional')).toBeVisible();
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'Minha reflexão temporária.' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Continuar na demonstração →' }),
  );
  const point = (label: RegExp) => {
    fireEvent.click(screen.getByRole('button', { name: label }));
    act(() => vi.advanceTimersByTime(651));
  };
  point(/^Sinais de cuidado:/);
  let dialog = within(screen.getByRole('dialog'));
  for (const name of [
    /Água que irriga/,
    /Solo que pode ser cultivado/,
    /Vegetação a ser guardada/,
  ])
    fireEvent.click(dialog.getByRole('button', { name }));
  fireEvent.click(dialog.getByRole('button', { name: 'Concluir observação' }));
  point(/^Sinais do limite:/);
  dialog = within(screen.getByRole('dialog'));
    fireEvent.click(dialog.getByRole('button', { name: 'Limite' }));
  expect(dialog.getByText('Sequência 0 / 3')).toBeVisible();
  for (const name of ['Liberdade', 'Orientação', 'Limite'])
      fireEvent.click(dialog.getByRole('button', { name }));
  point(/^Pistas da escolha:/);
  dialog = within(screen.getByRole('dialog'));
  for (const name of [
    /Orientação lembrada/,
    /Escolha realizada/,
    /Mudança percebida/,
  ])
    fireEvent.click(dialog.getByRole('button', { name }));
  for (const name of ['Orientação', 'Escolha', 'Consequência'])
      fireEvent.click(dialog.getByRole('button', { name }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Continuar a jornada →' }),
  );
  for (let i = 0; i < 5; i++) {
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeVisible();
    const choices = screen
      .getAllByRole('button')
      .filter((b) => b.className.includes('choiceCard'));
    fireEvent.click(choices[0]);
    expect(choices.every((b) => b.hasAttribute('disabled'))).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Próxima →' }));
  }
  expect(
    screen.getByRole('region', { name: 'Resultado da demonstração' }),
  ).toBeVisible();
  expect(m.save).not.toHaveBeenCalled();
  expect(s).toEqual(before);
  fireEvent.click(
    screen.getByRole('button', { name: 'Reiniciar demonstração' }),
  );
  expect(
    screen.getByRole('button', { name: 'Iniciar demonstração →' }),
  ).toBeVisible();
  expect(s).toEqual(before);
});
