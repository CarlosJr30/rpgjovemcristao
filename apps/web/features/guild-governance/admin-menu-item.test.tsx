// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mock = vi.hoisted(() => ({ owner: 'a', getUser: vi.fn(), rpc: vi.fn() }));
vi.mock('../../lib/supabase/auth-context', () => ({
  useAuth: () => ({
    status: 'signedIn',
    user: { id: mock.owner, user_metadata: { role: 'admin' } },
  }),
}));
vi.mock('../../lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    auth: { getUser: mock.getUser },
    rpc: mock.rpc,
  }),
}));
import { AdminMenuItem } from './admin-menu-item';
const status = (allowed: boolean) => ({
  version: 1,
  administrator: allowed,
  permissions: allowed ? ['leadership.manage'] : [],
  leadership: 'none',
  multiGuildReady: false,
  canCreateAdditionalGuilds: false,
  economicRewardsEnabled: false,
});
beforeEach(() => {
  mock.owner = 'a';
  mock.getUser
    .mockReset()
    .mockImplementation(async () => ({
      data: { user: { id: mock.owner, is_anonymous: false } },
      error: null,
    }));
  mock.rpc.mockReset().mockResolvedValue({ data: status(false), error: null });
});
afterEach(cleanup);
test('metadata cannot display the administrative link without protected permission', async () => {
  render(<AdminMenuItem close={() => {}} current={false} />);
  await waitFor(() => expect(mock.rpc).toHaveBeenCalled());
  expect(screen.queryByRole('link')).toBeNull();
});
test('verified admin gets link and revoked permission removes it on focus', async () => {
  mock.rpc.mockResolvedValue({ data: status(true), error: null });
  render(<AdminMenuItem close={() => {}} current />);
  expect(await screen.findByRole('link')).toHaveAttribute(
    'href',
    '/journey/guild/administration',
  );
  mock.rpc.mockResolvedValue({ data: status(false), error: null });
  act(() => window.dispatchEvent(new Event('focus')));
  await waitFor(() => expect(screen.queryByRole('link')).toBeNull());
});
test('a delayed permission response from the previous identity is discarded', async () => {
  let done!: (v: unknown) => void;
  mock.rpc.mockImplementationOnce(
    () =>
      new Promise((r) => {
        done = r;
      }),
  );
  const view = render(<AdminMenuItem close={() => {}} current={false} />);
  await waitFor(() => expect(mock.rpc).toHaveBeenCalled());
  mock.owner = 'b';
  view.rerender(<AdminMenuItem close={() => {}} current={false} />);
  await act(async () => {
    done({ data: status(true), error: null });
  });
  expect(screen.queryByRole('link')).toBeNull();
});
test('invalid Auth or RPC failure keeps the menu closed', async () => {
  mock.getUser.mockResolvedValue({
    data: { user: { id: 'other' } },
    error: null,
  });
  render(<AdminMenuItem close={() => {}} current={false} />);
  await waitFor(() => expect(mock.getUser).toHaveBeenCalled());
  expect(mock.rpc).not.toHaveBeenCalled();
  expect(screen.queryByRole('link')).toBeNull();
});
