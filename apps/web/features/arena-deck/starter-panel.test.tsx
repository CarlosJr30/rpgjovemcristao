// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ArenaStarterPanel } from './starter-panel';
const m = vi.hoisted(() => ({
  read: vi.fn(),
  claim: vi.fn(),
  granted: vi.fn(),
}));
vi.mock('../../lib/supabase/owned-cards-read', () => ({
  readOwnedCards: (...args: unknown[]) => m.read(...args),
}));
vi.mock('./starter', () => ({
  requestArenaStarter: (...args: unknown[]) => m.claim(...args),
}));
beforeEach(() => {
  vi.clearAllMocks();
  m.read.mockResolvedValue([]);
  m.claim.mockResolvedValue({ status: 'available' });
});
afterEach(cleanup);
it('reading or canceling never issues a starter', async () => {
  render(
    <ArenaStarterPanel owner="owner" traveler="hero" onGranted={m.granted} />,
  );
  await screen.findByRole('button', { name: 'Solicitar pacote inicial' });
  expect(m.claim).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Solicitar pacote inicial' }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(m.claim).not.toHaveBeenCalled();
});
it('requires explicit confirmation and refreshes real collection after server confirmation', async () => {
  m.read.mockResolvedValueOnce([]).mockResolvedValueOnce(Array(7).fill({}));
  render(
    <ArenaStarterPanel owner="owner" traveler="hero" onGranted={m.granted} />,
  );
  fireEvent.click(
    await screen.findByRole('button', { name: 'Solicitar pacote inicial' }),
  );
  expect(m.claim).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirmar solicitação' }),
  );
  await waitFor(() => expect(m.granted).toHaveBeenCalledTimes(1));
  expect(m.claim).toHaveBeenCalledExactlyOnceWith('owner', 'hero');
  expect(
    screen.queryByRole('button', { name: 'Solicitar pacote inicial' }),
  ).not.toBeInTheDocument();
});
it('shows an earlier allocation without claiming ownership for this avatar', async () => {
  m.claim.mockResolvedValue({ status: 'claimed-on-another-traveler' });
  render(
    <ArenaStarterPanel owner="owner" traveler="hero" onGranted={m.granted} />,
  );
  fireEvent.click(
    await screen.findByRole('button', { name: 'Solicitar pacote inicial' }),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirmar solicitação' }),
  );
  await screen.findByText(/já foi destinado a outro Viajante/);
  expect(m.granted).not.toHaveBeenCalled();
  expect(m.read).toHaveBeenCalledTimes(1);
});
it('a failed request remains retryable without optimistic cards or fake receipt', async () => {
  m.claim.mockRejectedValue(Error('Falha segura'));
  render(
    <ArenaStarterPanel owner="owner" traveler="hero" onGranted={m.granted} />,
  );
  fireEvent.click(
    await screen.findByRole('button', { name: 'Solicitar pacote inicial' }),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirmar solicitação' }),
  );
  await screen.findByRole('alert');
  expect(m.granted).not.toHaveBeenCalled();
  expect(
    screen.getByRole('button', { name: 'Confirmar solicitação' }),
  ).toBeEnabled();
});
it('does not render another claim button for an existing seven-card collection', async () => {
  m.read.mockResolvedValue(Array(7).fill({}));
  render(
    <ArenaStarterPanel owner="owner" traveler="hero" onGranted={m.granted} />,
  );
  await screen.findByText(/Sua coleção possui sete/);
  expect(
    screen.queryByRole('button', { name: 'Solicitar pacote inicial' }),
  ).not.toBeInTheDocument();
  expect(m.claim).not.toHaveBeenCalled();
});
