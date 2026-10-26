// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
  type Traveler,
} from './domain/traveler';
const mocks = vi.hoisted(() => ({
  change: vi.fn(),
  equip: vi.fn(),
  unequip: vi.fn(),
  traveler: null as Traveler | null,
}));
vi.mock('./components/shell', () => ({
  Shell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  RequireTraveler: ({ children }: { children: (t: Traveler) => ReactNode }) =>
    children(mocks.traveler!),
}));
vi.mock('./state/use-journey', () => ({
  equipItem: mocks.equip,
  unequipSlot: mocks.unequip,
}));
vi.mock('../../lib/supabase/online-sync', () => ({
  getCurrentOnlineUserId: () => null,
}));
vi.mock('../../lib/supabase/online-equipment', () => ({
  changeOnlineEquipment: mocks.change,
}));
import { EquipmentScreen } from './screens/equipment';
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  mocks.traveler = createTraveler(
    'Fixture',
    DEFAULT_APPEARANCE,
    'fixture',
    '2026-10-26T00:00:00.000Z',
  );
  mocks.change.mockRejectedValue(
    new Error('Entre novamente na conta deste Viajante.'),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('does not fall back to local equip or unequip when the online session disappears', async () => {
  render(<EquipmentScreen serverConfirmedOnly />);
  fireEvent.click(screen.getByRole('button', { name: 'Botas' }));
  fireEvent.click(screen.getByRole('button', { name: 'Desequipar' }));
  expect(
    await screen.findByText('Entre novamente na conta deste Viajante.'),
  ).toBeVisible();
  expect(mocks.change).toHaveBeenCalledWith(
    'fixture',
    'boots',
    null,
    'traveler-boots',
  );
  expect(mocks.equip).not.toHaveBeenCalled();
  expect(mocks.unequip).not.toHaveBeenCalled();
});
