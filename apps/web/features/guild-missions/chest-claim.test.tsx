// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
const m = vi.hoisted(() => ({ claim: vi.fn() }));
vi.mock('../../lib/community-chests/client', () => ({
  claimCommunityChest: m.claim,
  chestGrantMessages: {
    awarded: 'Baú confirmado na Mochila.',
    suspended: 'Recompensa suspensa.',
  },
}));
import { CommunityChestClaim } from './chest-claim';
afterEach(() => {
  cleanup();
  m.claim.mockReset();
});
it('requires an explicit click and never duplicates an in-flight request', async () => {
  let done!: (v: unknown) => void;
  m.claim.mockImplementation(
    () =>
      new Promise((r) => {
        done = r;
      }),
  );
  render(
    <CommunityChestClaim actor="actor" guild="guild" mission="activity" />,
  );
  expect(m.claim).not.toHaveBeenCalled();
  const b = screen.getByRole('button');
  fireEvent.click(b);
  fireEvent.click(b);
  expect(m.claim).toHaveBeenCalledTimes(1);
  expect(b).toBeDisabled();
  done({ status: 'awarded' });
  await screen.findByText('Baú confirmado na Mochila.');
  expect(b).toBeEnabled();
});
it('changing avatar discards a delayed receipt and clears pending UI', async () => {
  let done!: (v: unknown) => void;
  m.claim.mockImplementation(
    () =>
      new Promise((r) => {
        done = r;
      }),
  );
  const view = render(
    <CommunityChestClaim actor="old" guild="guild" mission="activity" />,
  );
  fireEvent.click(screen.getByRole('button'));
  view.rerender(
    <CommunityChestClaim actor="new" guild="guild" mission="activity" />,
  );
  expect(screen.getByRole('button')).toBeEnabled();
  done({ status: 'awarded' });
  await waitFor(() =>
    expect(
      screen.queryByText('Baú confirmado na Mochila.'),
    ).not.toBeInTheDocument(),
  );
});
it('suspension is shown without announcing a prize', async () => {
  m.claim.mockResolvedValue({ status: 'suspended' });
  render(
    <CommunityChestClaim actor="actor" guild="guild" mission="activity" />,
  );
  fireEvent.click(screen.getByRole('button'));
  await screen.findByText('Recompensa suspensa.');
  expect(
    screen.queryByText('Baú confirmado na Mochila.'),
  ).not.toBeInTheDocument();
});
