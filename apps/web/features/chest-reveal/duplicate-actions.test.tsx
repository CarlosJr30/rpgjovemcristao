// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ read: vi.fn(), sell: vi.fn() }));
vi.mock('../../lib/economy-041/client', () => ({
  readResaleAccess: m.read,
  sellRepeated: m.sell,
}));
import { DuplicateActions } from './duplicate-actions';
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
test('guardar never sells; confirmed sale preserves one copy and retains keyboard focus inside the presentation', async () => {
  m.read.mockResolvedValue({ eligible: true, quantity: 2, sellValue: 10 });
  m.sell.mockResolvedValue({ quantity: 1, coins: 10 });
  render(
    <DuplicateActions
      actor="owned-actor"
      itemId="equipment-apprentice-sword"
    />,
  );
  fireEvent.click(
    await screen.findByRole('button', { name: 'Guardar na Mochila' }),
  );
  expect(m.sell).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Vender repetido · 10 moedas' }),
  );
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(
      'Cópia vendida: +10 moedas.',
    ),
  );
  expect(m.sell).toHaveBeenCalledExactlyOnceWith(
    'owned-actor',
    'equipment-apprentice-sword',
    2,
  );
  expect(screen.queryByRole('button', { name: /Vender repetido/ })).toBeNull();
  await waitFor(() =>
    expect(document.activeElement).toHaveAttribute(
      'aria-label',
      'Cópia excedente',
    ),
  );
});
