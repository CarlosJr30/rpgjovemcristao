// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  chestRow,
  fixtureTraveler,
  OWNER,
  TRAVELER,
} from '../../../../tests/fixtures/chest-reveal';
const mocks = vi.hoisted(() => ({
  online: false,
  open: vi.fn(),
  operation: vi.fn(),
  history: vi.fn(),
  list: vi.fn(),
  localOpen: vi.fn(),
  buy: vi.fn(),
  sync: vi.fn(),
}));
vi.mock('./components/shell', () => ({
  Shell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  RequireTraveler: ({
    children,
  }: {
    children: (t: ReturnType<typeof fixtureTraveler>) => React.ReactNode;
  }) => <>{children(fixtureTraveler())}</>,
}));
vi.mock('../../lib/supabase/auth-context', () => ({
  useAuth: () => ({
    status: mocks.online ? 'signedIn' : 'signedOut',
    user: mocks.online ? { id: OWNER } : null,
  }),
}));
vi.mock('./state/use-journey', () => ({
  openOwnedChest: mocks.localOpen,
  buyChest: mocks.buy,
}));
vi.mock('../../lib/supabase/repositories/chest-repository', () => ({
  chestRepository: {
    open: mocks.open,
    operation: mocks.operation,
    history: mocks.history,
    list: mocks.list,
  },
}));
vi.mock('../../lib/supabase/online-sync', () => ({
  reloadOnlineTraveler: mocks.sync,
}));
import { ChestPanel } from './components/chest-panel';
import { BackpackScreen } from './screens/backpack';
import { readVisual } from '../chest-reveal/visual-store';
beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  mocks.online = false;
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
  let tail = Promise.resolve<unknown>(undefined);
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: (_k: string, _o: object, fn: () => Promise<unknown>) => {
        const p = tail.then(fn);
        tail = p.catch(() => undefined);
        return p;
      },
    },
  });
  mocks.list.mockResolvedValue([{ chest_type: 'uncommon', quantity: 1 }]);
  mocks.history.mockResolvedValue([]);
  mocks.sync.mockResolvedValue(true);
  mocks.open.mockResolvedValue({ coins: 999999, ignored: true });
  mocks.operation.mockImplementation(async (_t: string, key: string) => ({
    ...chestRow,
    operation_key: key,
  }));
});
afterEach(cleanup);
function panel() {
  return render(
    <ChestPanel
      ownerId={OWNER}
      traveler={fixtureTraveler()}
      online
      onCountChange={vi.fn()}
      onViewEquipment={vi.fn()}
    />,
  );
}
test('Mochila keeps existing tabs, empty state and centralized shop prices', async () => {
  render(<BackpackScreen />);
  fireEvent.click(screen.getByRole('tab', { name: /^Ba/ }));
  expect(await screen.findByText(/ainda n/)).toBeVisible();
  expect(screen.getByRole('button', { name: /40/ })).toBeVisible();
});
test('offline opening is blocked and does not call legacy browser RNG/grant', async () => {
  const t = fixtureTraveler();
  t.chests.common = 1;
  render(
    <ChestPanel
      ownerId=""
      traveler={t}
      online={false}
      onCountChange={vi.fn()}
      onViewEquipment={vi.fn()}
    />,
  );
  expect(await screen.findByRole('button', { name: 'Abrir' })).toBeDisabled();
  expect(mocks.localOpen).not.toHaveBeenCalled();
  expect(mocks.open).not.toHaveBeenCalled();
});
test('double click opens once, only persisted record is shown; resume/review do not call grant', async () => {
  const ui = panel();
  const open = await screen.findByRole('button', { name: 'Abrir' });
  fireEvent.click(open);
  fireEvent.click(open);
  await screen.findByRole('dialog');
  expect(mocks.open).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/999999/)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Revelar/ }));
  expect(
    await screen.findByRole('heading', { name: '20 Moedas do Viajante' }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /ximo/ }));
  expect(screen.getByRole('heading', { name: /Coura/ })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /Fechar apresenta/ }));
  ui.unmount();
  panel();
  fireEvent.click(
    await screen.findByRole('button', { name: /Retomar apresenta/ }),
  );
  expect(screen.getByRole('heading', { name: /Coura/ })).toBeVisible();
  expect(mocks.open).toHaveBeenCalledTimes(1);
  expect(mocks.localOpen).not.toHaveBeenCalled();
});
test('missing confirmed ledger stays pending; reload consults but never auto-retries RPC', async () => {
  mocks.operation.mockResolvedValue(null);
  const ui = panel();
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir' }));
  expect(
    await screen.findByRole('heading', { name: /Abertura pendente/ }),
  ).toBeVisible();
  expect(screen.queryByRole('dialog')).toBeNull();
  const intent = readVisual(OWNER, TRAVELER).intent;
  ui.unmount();
  panel();
  expect(
    await screen.findByRole('heading', { name: /Abertura pendente/ }),
  ).toBeVisible();
  expect(readVisual(OWNER, TRAVELER).intent).toEqual(intent);
  expect(mocks.open).toHaveBeenCalledTimes(1);
});
test('history re-fetches owner scoped receipt and cannot display foreign records', async () => {
  mocks.history.mockResolvedValue([
    chestRow,
    { ...chestRow, id: 'foreign', traveler_id: 'other' },
  ]);
  panel();
  const replay = await screen.findAllByRole('button', {
    name: 'Ver novamente',
  });
  expect(replay).toHaveLength(1);
  mocks.operation.mockResolvedValue({ ...chestRow, traveler_id: 'other' });
  fireEvent.click(replay[0]);
  await waitFor(() =>
    expect(mocks.operation).toHaveBeenCalledWith(
      TRAVELER,
      chestRow.operation_key,
    ),
  );
  await waitFor(() => expect(replay[0]).toBeEnabled());
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(mocks.open).not.toHaveBeenCalled();
});

test('corrupt visual state preserves bytes, blocks new opening but confirmed history remains readable', async () => {
  mocks.history.mockResolvedValue([chestRow]);
  const k =
    'rpg-jovem-cristao:chest-reveal:v1:' +
    encodeURIComponent(JSON.stringify([OWNER, TRAVELER]));
  localStorage.setItem(k, '{broken');
  panel();
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir' }));
  await waitFor(() =>
    expect(screen.getByText(/Dados preservados/)).toBeVisible(),
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Ver novamente' }));
  await screen.findByRole('dialog');
  fireEvent.click(
    screen.getByRole('button', { name: 'Apresentação estática' }),
  );
  expect(
    await screen.findByRole('heading', { name: '20 Moedas do Viajante' }),
  ).toBeVisible();
  expect(localStorage.getItem(k)).toBe('{broken');
  expect(mocks.open).not.toHaveBeenCalled();
});
