// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ChestReveal } from './reveal';
import {
  cardReceipt,
  fixtureTraveler,
  receipt,
} from '../../../../tests/fixtures/chest-reveal';
import type { RevealReceipt } from './receipt';
import type { VisualCursor } from './visual-store';
import { gameAudio } from '../journey/audio/audio-manager';
let reduced = false;
beforeEach(() => {
  vi.useFakeTimers();
  reduced = false;
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({
      matches: reduced,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
const cursor = (r: RevealReceipt): VisualCursor => ({
  receiptId: r.id,
  operationKey: r.operationKey,
  index: 0,
  seen: 0,
  summary: false,
});
function mount(r = cardReceipt, c = cursor(r)) {
  const onProgress = vi.fn(),
    onClose = vi.fn();
  const ui = render(
    <ChestReveal
      receipt={r}
      traveler={fixtureTraveler()}
      cursor={c}
      onProgress={onProgress}
      onClose={onClose}
      onViewEquipment={vi.fn()}
    />,
  );
  return { ...ui, onProgress, onClose };
}
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));
test('closed chest opens, card rises, holds2000ms before flip, then details persist until manual next', () => {
  mount();
  const phase = () =>
    document.querySelector('[data-phase]')?.getAttribute('data-phase');
  expect(phase()).toBe('ready');
  fireEvent.click(screen.getByRole('button', { name: 'Revelar prêmio' }));
  expect(phase()).toBe('opening');
  tick(650);
  expect(phase()).toBe('rising');
  tick(1000);
  expect(phase()).toBe('holding');
  tick(1999);
  expect(phase()).toBe('holding');
  expect(
    screen.queryByRole('heading', { name: 'Carta sintética de revelação' }),
  ).toBeNull();
  tick(1);
  expect(phase()).toBe('flipping');
  tick(550);
  expect(phase()).toBe('details');
  expect(
    screen.getByRole('heading', { name: 'Carta sintética de revelação' }),
  ).toBeVisible();
  expect(screen.getByText('Custo: 2 Foco · Nível mínimo: 2')).toBeVisible();
  tick(60000);
  expect(phase()).toBe('details');
});
test('skip affects only current animation, double next cannot skip another prize, summary preserves receipt order', () => {
  const { onProgress } = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Revelar prêmio' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pular animação' }));
  const next = screen.getByRole('button', { name: 'Próximo prêmio' });
  act(() => {
    fireEvent.click(next);
    fireEvent.click(next);
  });
  expect(document.querySelector('[data-phase]')).toHaveAttribute(
    'data-phase',
    'rising',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Pular animação' }));
  expect(
    screen.getByRole('heading', { name: 'Couraça do Viajante' }),
  ).toBeVisible();
  expect(screen.getByRole('table')).toHaveAccessibleName(
    'Atributos totais do Viajante ao equipar',
  );
  expect(screen.getByText('Parcela ofensiva antes da Defesa')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Próximo prêmio' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pular animação' }));
  fireEvent.click(screen.getByRole('button', { name: 'Ver resumo' }));
  const list = screen.getAllByRole('listitem');
  expect(list.map((l) => l.textContent)).toEqual(
    expect.arrayContaining([
      expect.stringContaining('Carta sintética'),
      expect.stringContaining('Couraça'),
      expect.stringContaining('20 Moedas'),
    ]),
  );
  expect(onProgress).toHaveBeenLastCalledWith(
    expect.objectContaining({ index: 2, seen: 3, summary: true }),
  );
});
test('static and reduced-motion show details without animated waits; equipment uses real descriptions and deltas', () => {
  reduced = true;
  mount(receipt);
  fireEvent.click(screen.getByRole('button', { name: 'Revelar prêmio' }));
  expect(document.querySelector('[data-phase]')).toHaveAttribute(
    'data-phase',
    'details',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Próximo prêmio' }));
  expect(
    screen.getByRole('heading', { name: 'Couraça do Viajante' }),
  ).toBeVisible();
  expect(screen.getByRole('table')).toBeVisible();
  expect(document.querySelector('[data-static]')).toBeInTheDocument();
});
test('accelerating reduces waiting while never skipping details or receipt entries', () => {
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Revelar prêmio' }));
  fireEvent.click(screen.getByRole('button', { name: 'Acelerar' }));
  tick(650 / 3 + 1);
  tick(1000 / 3 + 1);
  tick(2000 / 3 + 1);
  tick(550 / 3 + 1);
  expect(
    screen.getByRole('heading', { name: 'Carta sintética de revelação' }),
  ).toBeVisible();
  expect(screen.getByRole('button', { name: 'Próximo prêmio' })).toBeVisible();
});
test('reload cursor reopens exact equipment details silently and missing inventory gives pending comparison', () => {
  const { onProgress } = mount(receipt, {
    ...cursor(receipt),
    index: 1,
    seen: 2,
  });
  expect(
    screen.getByRole('heading', { name: 'Couraça do Viajante' }),
  ).toBeVisible();
  expect(onProgress).toHaveBeenCalledWith(
    expect.objectContaining({ index: 1, seen: 2 }),
  );
  cleanup();
  const t = fixtureTraveler();
  t.inventory = [];
  render(
    <ChestReveal
      receipt={receipt}
      traveler={t}
      cursor={{ ...cursor(receipt), index: 1, seen: 2 }}
      onProgress={vi.fn()}
      onClose={vi.fn()}
      onViewEquipment={vi.fn()}
    />,
  );
  expect(screen.getByText(/Comparação pendente/)).toBeVisible();
  expect(screen.queryByRole('table')).toBeNull();
});
test('keyboard trap, Escape and overflow restoration release navigation; visual save errors do not hide prize', () => {
  const trigger = document.createElement('button');
  document.body.append(trigger);
  trigger.focus();
  const { onClose, unmount } = mount();
  const close = screen.getByRole('button', {
    name: 'Fechar apresentação e retomar depois',
  });
  expect(close).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
  expect(
    screen.getByRole('button', { name: 'Apresentação estática' }),
  ).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledOnce();
  unmount();
  expect(trigger).toHaveFocus();
  expect(document.body.style.overflow).toBe('');
  trigger.remove();
});
test('five existing rarity themes, no production audio without approved catalog or gesture', () => {
  const sound = vi.spyOn(gameAudio, 'playEffect');
  for (const rarity of [
    'comum',
    'incomum',
    'raro',
    'épico',
    'lendário',
  ] as const) {
    mount({ ...cardReceipt, entries: [{ ...cardReceipt.entries[0], rarity }] });
    expect(document.querySelector('[data-rarity]')).toHaveAttribute(
      'data-rarity',
      rarity,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Apresentação estática' }),
    );
    cleanup();
  }
  expect(sound).not.toHaveBeenCalled();
});
