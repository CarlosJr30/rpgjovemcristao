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
import { AttendanceXp, CommunityXpHistory } from './attendance-xp';
const m = vi.hoisted(() => ({ claim: vi.fn(), history: vi.fn() }));
vi.mock('../../lib/ebd-classes/xp-client', () => ({
  claimAttendanceXp: m.claim,
  loadCommunityXpHistory: m.history,
}));
const actor = 'actor',
  guild = 'guild',
  lesson = 'lesson';
const receipt = {
  version: 1,
  status: 'credited',
  receiptId: 'receipt',
  travelerId: actor,
  eventId: lesson,
  xp: 50,
  totalXp: 200,
  level: 2,
  weekStart: '2026-11-02T03:00:00Z',
  replayed: false,
  reviewPending: false,
};
beforeEach(() => {
  vi.clearAllMocks();
  m.claim.mockResolvedValue({ result: receipt, refreshed: true });
  m.history.mockResolvedValue({ receipts: [], suspendedEvents: [] });
});
afterEach(cleanup);
it('page load does not issue XP and explicit player action displays only server-confirmed XP and level', async () => {
  render(<AttendanceXp {...{ actor, guild, lesson }} />);
  expect(m.claim).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button'));
  await screen.findByText(/Total registrado: 200 XP · nível 2/);
  expect(m.claim).toHaveBeenCalledExactlyOnceWith(actor, guild, lesson);
  expect(screen.queryByText(/recebeu.*moedas/i)).not.toBeInTheDocument();
});
it('pending repeat is blocked and leaving the panel does not leave parent busy forever', async () => {
  let resolve!: (v: unknown) => void;
  m.claim.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const busy = vi.fn();
  const v = render(
    <AttendanceXp {...{ actor, guild, lesson }} onBusyChange={busy} />,
  );
  fireEvent.click(screen.getByRole('button'));
  fireEvent.click(screen.getByRole('button'));
  expect(m.claim).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button')).toBeDisabled();
  v.unmount();
  expect(busy).toHaveBeenLastCalledWith(false);
  resolve({ result: receipt, refreshed: true });
});
it('zero XP at cap preserves educational participation and does not show a 50XP payout', async () => {
  m.claim.mockResolvedValue({
    result: { ...receipt, status: 'weekly-limit', xp: 0 },
    refreshed: true,
  });
  render(<AttendanceXp {...{ actor, guild, lesson }} />);
  fireEvent.click(screen.getByRole('button'));
  await screen.findByText(/Limite semanal atingido/);
  expect(
    screen.queryByText(/Crédito confirmado: 50 XP/),
  ).not.toBeInTheDocument();
});
it('suspension and legacy do not display a fake economic success', async () => {
  m.claim.mockResolvedValue({
    result: { version: 1, status: 'suspended' },
    refreshed: true,
  });
  render(<AttendanceXp {...{ actor, guild, lesson }} />);
  fireEvent.click(screen.getByRole('button'));
  await screen.findByText(/Concessão suspensa/);
  expect(screen.queryByText(/Total registrado/)).not.toBeInTheDocument();
});
it('failed transport allows safe explicit retry without an optimistic payout', async () => {
  m.claim.mockRejectedValue(Error('Consulta indisponível'));
  render(<AttendanceXp {...{ actor, guild, lesson }} />);
  fireEvent.click(screen.getByRole('button'));
  await screen.findByRole('alert');
  await waitFor(() => expect(screen.getByRole('button')).toBeEnabled());
  expect(screen.queryByText(/Total registrado/)).not.toBeInTheDocument();
});
it('history displays only confirmed official receipts, review marker and no monetary prize', async () => {
  m.history.mockResolvedValue({
    receipts: [{ ...receipt, replayed: true, reviewPending: true }],
    suspendedEvents: [lesson],
  });
  render(<CommunityXpHistory {...{ actor, guild }} />);
  await screen.findByText(/Crédito já confirmado: 50 XP/);
  expect(screen.getByText(/correção de presença em análise/)).toBeVisible();
  expect(m.claim).not.toHaveBeenCalled();
});
