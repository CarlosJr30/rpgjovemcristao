// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, test, vi } from 'vitest';
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
const mocked = vi.hoisted(() => ({ load: vi.fn(), command: vi.fn() }));
vi.mock('../../lib/supabase/repositories/guild-activity-repository', () => ({
  guildActivityRepository: mocked,
  CellCommandRejected: class extends Error {},
}));
import { CellActivityPanel } from './cell-panel';
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const w = {
  version: 1,
  guildId: 'guild',
  leader: true,
  hasMore: false,
  offset: 0,
  missions: [],
  progress: [],
  members: [{ id: 'actor', name: 'Líder QA' }],
  delegations: [],
  history: [],
  validations: [],
};
test('community creation reuses MissionEditor but exposes no XP or chest-amount selector', async () => {
  mocked.load.mockResolvedValue(w);
  render(<CellActivityPanel actor="actor" guildId="guild" />);
  await screen.findByRole('button', { name: 'Criar encontro' });
  fireEvent.click(screen.getByRole('button', { name: 'Criar encontro' }));
  expect(screen.getByLabelText('Título')).toBeVisible();
  expect(
    screen.queryByLabelText('Recompensa prevista'),
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText('Classificação futura')).toBeVisible();
  expect(screen.getByText(/não concede privilégios/)).toBeVisible();
});
test('changing Guild discards delayed data and does not render the previous community result', async () => {
  let resolve!: (v: unknown) => void;
  mocked.load
    .mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    )
    .mockResolvedValueOnce({ ...w, guildId: 'new', leader: false });
  const { rerender } = render(
    <CellActivityPanel actor="actor" guildId="guild" />,
  );
  rerender(<CellActivityPanel actor="actor" guildId="new" />);
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Criar encontro' }),
    ).not.toBeInTheDocument(),
  );
  resolve(w);
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Criar encontro' }),
    ).not.toBeInTheDocument(),
  );
  expect(mocked.load).toHaveBeenLastCalledWith('actor', 'new', 0);
});
