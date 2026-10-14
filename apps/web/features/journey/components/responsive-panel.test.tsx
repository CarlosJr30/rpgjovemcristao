// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  act,
} from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ResponsivePanel } from './responsive-panel';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
test('mobile details can close and reopen without losing the content; desktop always exposes it', () => {
  let compact = true;
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', () => ({
    matches: compact,
    addEventListener: (_: string, notify: () => void) => listeners.add(notify),
    removeEventListener: (_: string, notify: () => void) =>
      listeners.delete(notify),
  }));
  render(
    <ResponsivePanel title="Mochila">
      <button>Comparar equipamento</button>
    </ResponsivePanel>,
  );
  const details = screen.getByText('Mochila').closest('details')!;
  expect(details.open).toBe(false);
  act(() => {
    details.open = true;
    fireEvent(details, new Event('toggle'));
  });
  expect(details.open).toBe(true);
  act(() => {
    details.open = false;
    fireEvent(details, new Event('toggle'));
  });
  expect(details.open).toBe(false);
  act(() => {
    compact = false;
    listeners.forEach((notify) => notify());
  });
  expect(details.open).toBe(true);
  expect(
    screen.getByRole('button', { name: 'Comparar equipamento' }),
  ).toBeInTheDocument();
});
