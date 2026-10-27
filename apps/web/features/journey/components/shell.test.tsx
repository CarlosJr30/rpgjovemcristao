// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  signOutAccount: vi.fn(),
  switchTraveler: vi.fn(),
  onlineSyncStatus: { state: 'idle', message: null },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/journey',
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('./avatar', () => ({ Avatar: () => <div /> }));
vi.mock('../state/use-journey', () => ({
  signOutAccount: mocks.signOutAccount,
  switchTraveler: mocks.switchTraveler,
  useJourney: () => ({
    status: 'ready',
    traveler: {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'TesteBancoreal',
      level: 1,
      xp: 0,
      coins: 0,
      appearance: {},
      avatar: {},
    },
  }),
}));
vi.mock('../../../lib/supabase/auth-context', () => ({
  useAuth: () => ({ status: 'signedIn' }),
}));
vi.mock('../../../lib/supabase/online-sync', () => ({
  getOnlineSyncStatus: () => mocks.onlineSyncStatus,
  subscribeOnlineSync: () => () => undefined,
}));

import { Shell } from './shell';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.switchTraveler.mockReturnValue(true);
  mocks.signOutAccount.mockResolvedValue(true);
});

afterEach(cleanup);

describe('Shell account and traveler actions', () => {
  test('switching traveler never calls account sign out', () => {
    render(<Shell>Conteúdo</Shell>);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Herói' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Trocar Viajante' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Trocar Viajante',
      }),
    );

    expect(mocks.switchTraveler).toHaveBeenCalledTimes(1);
    expect(mocks.signOutAccount).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith('/');
  });

  test('signing out the account uses the account action and navigates to auth', async () => {
    render(<Shell>Conteúdo</Shell>);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Herói' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sair da conta' }));

    await waitFor(() => expect(mocks.signOutAccount).toHaveBeenCalledTimes(1));
    expect(mocks.switchTraveler).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith('/auth');
  });
});

describe('original shell within the released interface', () => {
  test('keeps Guilda/EBD in the original menu without exposing gameplay links', () => {
    render(<Shell navigationMode="released">Conteúdo</Shell>);
    const links = within(
      screen.getByRole('navigation', { name: 'Navegação principal' }),
    ).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/journey/hero',
      '/journey/phases/o-jardim-e-a-escolha',
      '/journey/backpack',
      '/journey/collection',
      '/journey/diary',
      '/journey/guild',
      '/journey/guild/ebd',
    ]);
    expect(links.map((link) => link.textContent)).toEqual([
      'Herói',
      'Missões',
      'Mochila',
      'Coleção',
      'Diário',
      'Guilda',
      'EBD',
    ]);
    const nav = screen.getByRole('navigation', { name: 'Navegação principal' });
    const blocked = nav.querySelectorAll('[aria-disabled="true"]');
    expect(blocked).toHaveLength(4);
    expect(Array.from(blocked).map((item) => item.textContent)).toEqual([
      'JornadaEm desenvolvimento',
      'EquipamentosEm desenvolvimento',
      'LojaEm desenvolvimento',
      'ArenaEm desenvolvimento',
    ]);
    for (const item of blocked) {
      expect(item.querySelector('a,button')).toBeNull();
      fireEvent.click(item);
    }
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('navigation', { name: 'Navegação do jogo' }),
    ).not.toBeInTheDocument();
  });

  test('mobile menu traps focus and Escape restores focus/scroll without changing the traveler', () => {
    document.body.style.overflow = 'auto';
    render(<Shell navigationMode="released">Conteúdo</Shell>);
    const trigger = screen.getByRole('button', { name: 'Abrir menu' });
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Menu principal' });
    const last = within(dialog).getByRole('link', { name: 'EBD' });
    const close = within(dialog).getByRole('button', {
      name: 'Fechar navegação',
    });
    expect(within(dialog).getByRole('link', { name: 'Herói' })).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    expect(screen.getByRole('main', { hidden: true })).toHaveAttribute('inert');
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(
      screen.queryByRole('dialog', { name: 'Menu principal' }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('auto');
    expect(mocks.switchTraveler).not.toHaveBeenCalled();
    expect(mocks.signOutAccount).not.toHaveBeenCalled();
    document.body.style.overflow = '';
  });

  test('selecting an allowed route closes the menu and restores the document', () => {
    render(<Shell navigationMode="released">Conteúdo</Shell>);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    const link = screen.getByRole('link', { name: 'Guilda' });
    link.addEventListener('click', (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(link);
    expect(
      screen.queryByRole('dialog', { name: 'Menu principal' }),
    ).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    expect(screen.getByRole('main')).not.toHaveAttribute('inert');
  });
});
