// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createTraveler, DEFAULT_APPEARANCE } from './domain/traveler';

const { player, openOwnedChest, buyChest } = vi.hoisted(() => ({
  player: { current: null as ReturnType<typeof createTraveler> | null },
  openOwnedChest: vi.fn(),
  buyChest: vi.fn(),
}));

vi.mock('./components/shell', () => ({
  Shell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  RequireTraveler: ({
    children,
  }: {
    children: (traveler: ReturnType<typeof createTraveler>) => React.ReactNode;
  }) => <>{children(player.current!)}</>,
}));
vi.mock('../../lib/supabase/auth-context', () => ({
  useAuth: () => ({ status: 'local' }),
}));
vi.mock('./state/use-journey', () => ({ openOwnedChest, buyChest }));

import { BackpackScreen } from './screens/backpack';

beforeEach(() => {
  player.current = createTraveler(
    'Lia',
    DEFAULT_APPEARANCE,
    '12345678-1234-4321-8234-123456789abc',
    '2026-09-29T12:00:00.000Z',
  );
  openOwnedChest.mockReset();
  buyChest.mockReset();
});
afterEach(cleanup);

describe('Mochila de Baús', () => {
  test('shows tabs, empty state and centralized store offers', async () => {
    render(<BackpackScreen />);
    fireEvent.click(screen.getByRole('tab', { name: 'Baús' }));
    expect(
      await screen.findByText('Você ainda não possui Baús.'),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Comprar · ◈ 40' }),
    ).toBeVisible();
    expect(screen.getByText('Recompensa de Guilda')).toBeVisible();
  });

  test('shows badge and reveals the persisted reward', async () => {
    player.current!.chests.common = 1;
    player.current!.chestSources.common = ['mission'];
    openOwnedChest.mockReturnValue({
      status: 'opened',
      reward: { coins: 25, itemId: null, itemName: null },
    });
    render(<BackpackScreen />);
    fireEvent.click(screen.getByRole('tab', { name: 'Baús' }));
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Baús (1)' })).toBeVisible(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(await screen.findByText('VOCÊ RECEBEU')).toBeVisible();
    expect(screen.getByText('+ 25 Moedas do Viajante')).toBeVisible();
  });

  test('reveals equipment with catalog icon, name, rarity and quantity', async () => {
    player.current!.chests.uncommon = 1;
    player.current!.chestSources.uncommon = ['mission'];
    openOwnedChest.mockReturnValue({
      status: 'opened',
      reward: {
        coins: 20,
        itemId: 'traveler-armor-uncommon',
        itemName: 'Couraça do Viajante',
      },
    });
    render(<BackpackScreen />);
    fireEvent.click(screen.getByRole('tab', { name: 'Baús' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeVisible();
    expect(
      screen.getByRole('img', { name: 'Couraça do Viajante' }),
    ).toHaveAttribute('src', expect.stringContaining('traveler_armor_rare_icon.png'));
    expect(screen.getByRole('heading', { name: 'Couraça do Viajante' })).toBeVisible();
    expect(within(dialog).getByText('Incomum')).toBeVisible();
    expect(within(dialog).getByText('+1')).toBeVisible();
    expect(within(dialog).getByText('+ 20 Moedas do Viajante')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(openOwnedChest).toHaveBeenCalledTimes(1);
  });

  test('explains when a duplicate equipment quantity increases', async () => {
    const sword = {
      id: 'traveler-sword-common',
      name: 'Espada do Caminho',
      slot: 'weapon' as const,
      rarity: 'comum' as const,
      power: 1,
      stats: { strength: 2 },
      quantity: 1,
    };
    player.current!.inventory.push(sword);
    player.current!.chests.common = 1;
    openOwnedChest.mockReturnValue({
      status: 'opened',
      reward: { coins: 10, itemId: sword.id, itemName: sword.name },
    });
    render(<BackpackScreen />);
    fireEvent.click(screen.getByRole('tab', { name: 'Baús' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir' }));

    expect(
      await screen.findByText('Duplicado — quantidade aumentada para 2'),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Ver na Mochila' }));
    expect(screen.getByRole('tab', { name: 'Equipamentos' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
