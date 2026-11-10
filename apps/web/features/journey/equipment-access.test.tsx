// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
  type Traveler,
} from './domain/traveler';
import { EQUIPMENT_CATALOG } from './data/equipmentCatalog';
const f = vi.hoisted(() => ({
  traveler: null as Traveler | null,
  read: vi.fn(),
  change: vi.fn(),
  localEquip: vi.fn(),
  training: null as null | { state: { items: Record<string, number> } },
}));
vi.mock('./state/use-journey', () => ({
  useJourney: () => ({ status: 'ready', traveler: f.traveler }),
  equipItem: f.localEquip,
  unequipSlot: vi.fn(),
}));
vi.mock('./components/shell', () => ({
  Shell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  RequireTraveler: ({ children }: { children: (t: Traveler) => ReactNode }) =>
    children(f.traveler!),
}));
vi.mock('../../lib/release-scope', () => ({
  isShopRelease: () => true,
  isShopTestPreview: () => false,
}));
vi.mock('../../lib/supabase/online-sync', () => ({
  getCurrentOnlineUserId: () => 'owner',
  getOnlineSessionRevision: () => 1,
}));
vi.mock('../../lib/supabase/online-equipment', () => ({
  changeOnlineEquipment: f.change,
}));
vi.mock('../../lib/supabase/equipment-access', async (original) => ({
  ...(await original<typeof import('../../lib/supabase/equipment-access')>()),
  readEquipmentAccess: f.read,
}));
vi.mock('../../lib/training-qa/client', () => ({
  activeTraining: () => f.training,
}));
vi.mock('./components/equipped-avatar', () => ({
  EquippedAvatar: () => <div />,
}));
vi.mock('./components/avatar-runtime', () => ({
  AvatarRuntime: () => <div />,
}));
vi.mock('next/image', () => ({ default: () => null }));
import { EquipmentScreen } from './screens/equipment';
beforeEach(() => {
  vi.clearAllMocks();
  f.training = null;
  f.traveler = createTraveler(
    'Fixture',
    DEFAULT_APPEARANCE,
    'fixture',
    '2026-11-10T00:00:00Z',
  );
  f.traveler.inventory = EQUIPMENT_CATALOG.filter(
    (item) => item.id.startsWith('traveler-') || item.id === 'wisdom-amulet',
  );
  f.traveler.equipped = { weapon: 'traveler-sword-common' };
  f.traveler.level = 50;
  f.read.mockResolvedValue(
    f.traveler.inventory.map((item) => ({
      itemId: item.id,
      sourceConfirmed: ['traveler-boots', 'traveler-sword-common'].includes(
        item.id,
      ),
      reason: ['traveler-boots', 'traveler-sword-common'].includes(item.id)
        ? null
        : 'acquisition-unconfirmed',
    })),
  );
  f.change.mockResolvedValue(undefined);
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
afterEach(cleanup);
it('preserves the held helmet but blocks equip in both shelf and preview until its source is recognized', async () => {
  render(<EquipmentScreen />);
  await waitFor(() => expect(f.read).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('button', { name: 'Elmo' }));
  await screen.findByText(
    'Origem pendente de reconhecimento. Item preservado na Mochila.',
  );
  expect(
    screen.getByRole('button', { name: 'Equipar indisponível' }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Experimentar' }));
  expect(
    await screen.findByRole('button', { name: 'Equipar este item' }),
  ).toBeDisabled();
  expect(f.change).not.toHaveBeenCalled();
  expect(f.localEquip).not.toHaveBeenCalled();
});
it('uses the existing online command for a confirmed item and for unequip, without local attribute mutation', async () => {
  render(<EquipmentScreen />);
  await waitFor(() => expect(f.read).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('button', { name: 'Desequipar' }));
  await waitFor(() =>
    expect(f.change).toHaveBeenCalledWith(
      'fixture',
      'weapon',
      null,
      'traveler-sword-common',
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Botas' }));
  await screen.findByText('Origem confirmada · pode equipar');
  fireEvent.click(screen.getByRole('button', { name: 'Equipar' }));
  await waitFor(() =>
    expect(f.change).toHaveBeenCalledWith(
      'fixture',
      'boots',
      'traveler-boots',
      null,
    ),
  );
  expect(f.localEquip).not.toHaveBeenCalled();
});
it('keeps missing read evidence closed without pretending the item has an invalid origin', async () => {
  f.read.mockRejectedValue(new Error('network'));
  render(<EquipmentScreen />);
  fireEvent.click(screen.getByRole('button', { name: 'Elmo' }));
  await screen.findByText('Autorização não confirmada. Atualize a coleção.');
  expect(
    screen.queryByText(/Origem pendente de reconhecimento/),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Equipar indisponível' }),
  ).toBeDisabled();
});
it('continues to use the separate private training possession instead of canonical source approval', async () => {
  f.training = { state: { items: { 'traveler-sword-common': 1 } } };
  f.traveler!.equipped = {};
  render(<EquipmentScreen />);
  await screen.findByText('Origem confirmada · pode equipar');
  fireEvent.click(screen.getByRole('button', { name: 'Elmo' }));
  await screen.findByText('Este item não foi adquirido no treino ativo.');
  expect(
    screen.getByRole('button', { name: 'Equipar indisponível' }),
  ).toBeDisabled();
  expect(f.read).not.toHaveBeenCalled();
});
