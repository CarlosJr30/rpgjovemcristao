// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mock = vi.hoisted(() => ({
  owner: 'scope-owner',
  revision: 1,
  list: vi.fn(),
  status: vi.fn(),
}));
vi.mock('../../lib/supabase/auth-context', () => ({
  useAuth: () => ({
    status: 'signedIn',
    user: { id: mock.owner, user_metadata: { role: 'leader' } },
  }),
}));
vi.mock('../../lib/supabase/online-sync', () => ({
  getCurrentOnlineUserId: () => mock.owner,
  getOnlineSessionRevision: () => mock.revision,
  subscribeOnlineSync: () => () => {},
}));
vi.mock('../../lib/supabase/repositories/guild-repository', () => ({
  guildRepository: { listContexts: mock.list, getStatus: mock.status },
}));
import { GuildScope } from './scope';
import {
  beginGuildWork,
  selectGuild,
} from '../../lib/guild-governance/selection';
const a = '11111111-1111-4111-8111-111111111111',
  b = '22222222-2222-4222-8222-222222222222';
const context = (id: string, name: string) => ({
  guild: { id, name },
  membership: {
    traveler_id: 'actor',
    guild_id: id,
    role: 'leader',
    status: 'active',
  },
  canManage: false,
});
const mount = () =>
  render(
    <GuildScope actor="actor">
      {(scope) => (
        <div data-testid="selected">
          {scope.context?.guild.name}:{scope.canManage ? 'manage' : 'read'}:
          {scope.canCreate ? 'create' : 'closed'}
        </div>
      )}
    </GuildScope>,
  );
beforeEach(() => {
  mock.owner = 'scope-owner';
  mock.revision++;
  sessionStorage.clear();
  mock.list.mockReset();
  mock.status.mockResolvedValue({
    version: 2,
    administrator: false,
    permissions: [],
    leadership: 'none',
    multiGuildReady: true,
    canCreateAdditionalGuilds: false,
    writesEnabled: true,
    economicRewardsEnabled: false,
  });
  mock.list.mockResolvedValue([
    context(a, 'Comunidade A'),
    context(b, 'Comunidade B'),
  ]);
});
afterEach(cleanup);
test('multiple memberships never choose the first community implicitly', async () => {
  mount();
  await screen.findByText(
    'Escolha explicitamente a Guilda ativa para continuar.',
  );
  expect(screen.queryByTestId('selected')).toBeNull();
  fireEvent.change(screen.getByLabelText('Guilda ativa'), {
    target: { value: b },
  });
  expect(await screen.findByTestId('selected')).toHaveTextContent(
    'Comunidade B:read:closed',
  );
});
test('stored community preference is retained after reload only when still a current membership', async () => {
  sessionStorage.setItem('rpg-guild-selection:scope-owner:actor', b);
  mount();
  expect(await screen.findByTestId('selected')).toHaveTextContent(
    'Comunidade B',
  );
});
test('forged preference outside memberships cannot load a private community', async () => {
  sessionStorage.setItem(
    'rpg-guild-selection:scope-owner:actor',
    '33333333-3333-4333-8333-333333333333',
  );
  mount();
  await screen.findByText(
    'Escolha explicitamente a Guilda ativa para continuar.',
  );
  expect(screen.queryByTestId('selected')).toBeNull();
});
test('late account response is ignored after owner and session change', async () => {
  let resolve!: (value: unknown) => void;
  mock.list.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const view = mount();
  mock.owner = 'other-scope-owner';
  mock.revision++;
  mock.list.mockResolvedValueOnce([context(b, 'Outra conta')]);
  view.rerender(
    <GuildScope actor="actor">
      {(scope) => <div data-testid="selected">{scope.context?.guild.name}</div>}
    </GuildScope>,
  );
  await waitFor(() =>
    expect(screen.getByTestId('selected')).toHaveTextContent('Outra conta'),
  );
  await act(async () => resolve([context(a, 'Conta anterior privada')]));
  expect(screen.queryByText('Conta anterior privada')).toBeNull();
});

test('switching communities removes the old editor until fresh permissions arrive', async () => {
  sessionStorage.setItem('rpg-guild-selection:scope-owner:actor', a);
  mount();
  await screen.findByTestId('selected');
  let resolve!: (value: unknown) => void;
  mock.list.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  fireEvent.change(screen.getByLabelText('Guilda ativa'), {
    target: { value: b },
  });
  expect(screen.queryByTestId('selected')).toBeNull();
  expect(screen.getByLabelText('Guilda ativa')).toBeDisabled();
  await act(async () =>
    resolve([context(a, 'Comunidade A'), context(b, 'Comunidade B')]),
  );
  expect(await screen.findByTestId('selected')).toHaveTextContent(
    'Comunidade B:read:closed',
  );
});

test('pending commands disable community changes until their response finishes', async () => {
  mount();
  await screen.findByLabelText('Guilda ativa');
  let finish!: () => void;
  act(() => {
    finish = beginGuildWork('actor');
  });
  expect(screen.getByLabelText('Guilda ativa')).toBeDisabled();
  act(() => finish());
  expect(screen.getByLabelText('Guilda ativa')).not.toBeDisabled();
});

test('confirmed new community stays selected after refreshing previous memberships', async () => {
  mock.list.mockResolvedValueOnce([context(a, 'Comunidade A')]);
  render(
    <GuildScope actor="actor">
      {(scope) => (
        <>
          <div data-testid="selected">{scope.context?.guild.name}</div>
          <button
            onClick={() => {
              selectGuild('actor', b);
              scope.refresh();
            }}
          >
            Confirmar nova comunidade
          </button>
        </>
      )}
    </GuildScope>,
  );
  await waitFor(() =>
    expect(screen.getByTestId('selected')).toHaveTextContent('Comunidade A'),
  );
  let resolve!: (value: unknown) => void;
  mock.list.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirmar nova comunidade' }),
  );
  expect(screen.queryByTestId('selected')).toBeNull();
  await act(async () =>
    resolve([context(a, 'Comunidade A'), context(b, 'Comunidade B')]),
  );
  expect(await screen.findByTestId('selected')).toHaveTextContent(
    'Comunidade B',
  );
});
