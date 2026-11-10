// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const f = vi.hoisted(() => ({
  purchase: vi.fn(),
  resume: vi.fn(),
  open: vi.fn(),
  reload: vi.fn(),
  push: vi.fn(),
  read: vi.fn(),
  initialize: vi.fn(),
  traveler: {
    id: 'fixture',
    coins: 123,
    inventory: [{ id: 'traveler-sword-common' }],
  },
}));
vi.mock('../components/shell', () => ({
  Shell: ({ children }: { children: React.ReactNode }) => children,
  RequireTraveler: ({
    children,
  }: {
    children: (t: typeof f.traveler) => React.ReactNode;
  }) => children(f.traveler),
}));
vi.mock('../state/use-journey', () => ({
  buyEquipment: vi.fn(),
  useJourney: () => ({ status: 'ready', traveler: f.traveler }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: f.push }) }));
vi.mock('../../training-qa/context', () => ({
  useTrainingTraveler: () => null,
}));
vi.mock('../../../lib/qa-shop/client', () => ({
  purchaseQAShop: f.purchase,
  resumeQAPurchase: f.resume,
  readQAShop: f.read,
  initializeShopEconomy: f.initialize,
}));
vi.mock('../../qa-shop/purchase-history', () => ({
  ShopPurchaseHistory: () => null,
}));
vi.mock('../../../lib/supabase/online-sync', () => ({
  getCurrentOnlineUserId: () => 'owner',
  reloadOnlineTraveler: f.reload,
}));
vi.mock('../../chest-reveal/opening', () => ({ requestChestOpening: f.open }));
vi.mock('../../chest-reveal/visual-store', () => ({
  readVisual: () => ({ intent: null }),
  bindReceipt: () => ({}),
  saveCursor: vi.fn(),
}));
vi.mock('next/dynamic', () => ({
  default:
    () =>
    ({
      onClose,
      onViewEquipment,
    }: {
      onClose: () => void;
      onViewEquipment: () => void;
    }) => (
      <div role="dialog" aria-label="Tesouro">
        <button onClick={onClose}>Continuar</button>
        <button onClick={onViewEquipment}>Ver na Mochila</button>
      </div>
    ),
}));
import { ShopScreen } from './shop';
import { QAShopAccess } from '../../qa-shop/access';
import { setTraining } from '../../../lib/training-qa/store';
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  setTraining(null);
  f.traveler.id = 'fixture';
  f.traveler.coins = 123;
});

const official = () => {
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'https://wspafhlbtlpabypzymjo.supabase.co',
  );
  vi.stubEnv('NEXT_PUBLIC_SHOP_PRODUCTION_RELEASE', '1');
};
test.each([
  ['new', true, 0, false],
  ['pristine legacy', false, 0, true],
  ['legacy with history', false, 1000000, false],
  ['approved owner', true, 1000000, false],
] as const)(
  'Shop remains visible for %s; only authorized operations are enabled',
  async (_kind, enabled, coins, initializationEligible) => {
    official();
    f.traveler.coins = coins;
    f.read.mockResolvedValue({
      enabled,
      balanceVerified: enabled,
      coins,
      reason: enabled ? undefined : 'legacy-reconciliation-required',
      initializationEligible,
    });
    render(<QAShopAccess />);
    expect(
      screen.getByRole('heading', { name: 'Loja do Viajante' }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        screen.queryByText('Consultando as operações disponíveis…'),
      ).toBeNull(),
    );
    const buy = screen.getByRole('button', { name: 'Comprar baú comum' });
    expect(buy).toHaveProperty('disabled', !enabled || coins < 40);
    if (enabled && coins < 40)
      expect(
        screen.getByText('Moedas insuficientes para este baú.'),
      ).toBeVisible();
    if (!enabled) {
      fireEvent.click(buy);
      expect(
        screen.queryByRole('region', { name: 'Confirmar compra' }),
      ).toBeNull();
    }
    expect(f.purchase).not.toHaveBeenCalled();
    expect(f.initialize).not.toHaveBeenCalled();
  },
);

test('unconfirmed Shop reads keep the catalog visible and never enable recovery or buying', async () => {
  official();
  f.traveler.coins = 1000;
  f.read.mockRejectedValue(Error('read failed'));
  render(<QAShopAccess />);
  expect(
    await screen.findByText(
      'Operações indisponíveis neste momento. Seus itens e saldos estão preservados.',
    ),
  ).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'Comprar baú comum' }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Consultar compra pendente' }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Abrir baú guardado' }),
  ).toBeDisabled();
  expect(f.purchase).not.toHaveBeenCalled();
  expect(f.resume).not.toHaveBeenCalled();
});

test('pristine initialization requires an explicit action and does not invent spendable coins', async () => {
  official();
  f.traveler.coins = 0;
  f.read.mockResolvedValue({
    enabled: false,
    balanceVerified: false,
    coins: 0,
    reason: 'legacy-reconciliation-required',
    initializationEligible: true,
  });
  f.initialize.mockResolvedValue({
    enabled: true,
    balanceVerified: true,
    coins: 0,
  });
  render(<QAShopAccess />);
  const activate = await screen.findByRole('button', {
    name: 'Ativar economia',
  });
  expect(f.initialize).not.toHaveBeenCalled();
  fireEvent.click(activate);
  await waitFor(() =>
    expect(f.initialize).toHaveBeenCalledExactlyOnceWith('fixture'),
  );
  expect(
    await screen.findByText(
      'Economia ativada. Nenhuma moeda ou item foi concedido.',
    ),
  ).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'Comprar baú comum' }),
  ).toBeDisabled();
  expect(f.traveler.coins).toBe(0);
  expect(f.purchase).not.toHaveBeenCalled();
});

test('switching private training refreshes access without initializing the official economy', async () => {
  official();
  const blocked = {
    enabled: false,
    balanceVerified: false,
    coins: 0,
    reason: 'legacy-reconciliation-required',
  };
  f.read
    .mockResolvedValueOnce(blocked)
    .mockResolvedValueOnce({ enabled: true, balanceVerified: true, coins: 123 })
    .mockResolvedValueOnce(blocked);
  render(<QAShopAccess />);
  await waitFor(() => expect(f.read).toHaveBeenCalledTimes(1));
  const binding = {
    owner: 'owner',
    actor: 'fixture',
    session: 1,
    selected: true,
    state: {
      version: 1 as const,
      qaOnly: true as const,
      enabled: true as const,
      actor: 'fixture',
      activation: 'fixture-training',
      expiresAt: '2100-01-01T00:00:00Z',
      coins: 123,
      chests: 0,
      revision: 0,
      items: {},
      equipped: {},
      history: [],
    },
  };
  await act(async () => setTraining(binding));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Comprar baú comum' }),
    ).toBeEnabled(),
  );
  await act(async () => setTraining({ ...binding, selected: false }));
  await waitFor(() => expect(f.read).toHaveBeenCalledTimes(3));
  expect(
    screen.getByRole('button', { name: 'Comprar baú comum' }),
  ).toBeDisabled();
  expect(f.initialize).not.toHaveBeenCalled();
  expect(f.purchase).not.toHaveBeenCalled();
});

test('an old avatar response cannot enable the newly selected avatar', async () => {
  official();
  let resolve!: (v: unknown) => void;
  f.read
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    )
    .mockResolvedValue({
      enabled: false,
      balanceVerified: false,
      coins: 0,
      reason: 'legacy-reconciliation-required',
    });
  const view = render(<QAShopAccess />);
  f.traveler.id = 'other-fixture';
  view.rerender(<QAShopAccess />);
  await waitFor(() => expect(f.read).toHaveBeenCalledTimes(2));
  await act(async () =>
    resolve({ enabled: true, balanceVerified: true, coins: 1000000 }),
  );
  expect(
    screen.getByRole('button', { name: 'Comprar baú comum' }),
  ).toBeDisabled();
});
test('existing offers retain prices and assets while categories never purchase or resume', () => {
  render(
    <ShopScreen qa={{ actor: 'fixture', coins: 123, production: true }} />,
  );
  const offers = screen.getByLabelText('Produtos disponíveis');
  expect(within(offers).getAllByRole('article')).toHaveLength(4);
  for (const [name, price] of [
    ['Baú comum', 40],
    ['Espada do Caminho', 35],
    ['Couraça do Viajante', 65],
    ['Escudo da Perseverança', 115],
  ] as const) {
    const card = screen.getByRole('heading', { name }).closest('article')!;
    expect(
      within(card).getByText(new RegExp(`^◈ ${price} Moedas`)),
    ).toBeVisible();
    expect(card.querySelector('img')?.getAttribute('src')).toMatch(
      /^\/assets\//,
    );
  }
  const categories = screen.getByRole('group', { name: 'Categorias da Loja' });
  fireEvent.click(within(categories).getByRole('button', { name: 'Baús' }));
  expect(within(offers).getAllByRole('article')).toHaveLength(1);
  fireEvent.click(
    within(categories).getByRole('button', {
      name: 'Equipamentos',
    }),
  );
  expect(within(offers).getAllByRole('article')).toHaveLength(3);
  expect(f.purchase).not.toHaveBeenCalled();
  expect(f.resume).not.toHaveBeenCalled();
  expect(screen.getByText('Adquirido')).toBeDisabled();
});
test('full acquisition catalog is visible without purchase actions or unapproved prices', () => {
  render(
    <ShopScreen qa={{ actor: 'fixture', coins: 123, production: true }} />,
  );
  const other = screen.getByRole('region', {
    name: 'Mais artefatos',
  });
  expect(within(other).getAllByRole('article')).toHaveLength(40);
  expect(within(other).queryByRole('button')).toBeNull();
  expect(other).not.toHaveTextContent(/90 Moedas|180 Moedas/);
  for (const name of [
    'Botas do Viajante',
    'Elmo do Viajante',
    'Medalhão do Caminho',
    'Baú Incomum',
    'Baú Raro',
    'Baú Extraordinário',
  ]) {
    expect(within(other).getByRole('heading', { name })).toBeVisible();
  }
  const activities = screen.getByRole('region', {
    name: 'Tesouros de atividades',
  });
  expect(within(activities).getAllByRole('article')).toHaveLength(1);
  for (const name of [
    'Baú comum',
    'Baú Incomum',
    'Baú Raro',
    'Baú Épico',
    'Baú Extraordinário',
  ]) {
    expect(screen.getAllByRole('heading', { name }).length).toBeGreaterThan(0);
  }
  expect(within(activities).queryByRole('button')).toBeNull();
  expect(
    screen.getByRole('region', { name: 'Cartas da Arena' }),
  ).toHaveTextContent('Venda de cartas indisponível');
  const filters = screen.getByRole('group', { name: 'Categorias da Loja' });
  fireEvent.click(
    within(filters).getByRole('button', { name: 'Equipamentos' }),
  );
  expect(within(other).getAllByRole('article')).toHaveLength(37);
  expect(
    screen.queryByRole('region', { name: 'Tesouros de atividades' }),
  ).toBeNull();
  fireEvent.click(within(filters).getByRole('button', { name: 'Baús' }));
  expect(within(other).getAllByRole('article')).toHaveLength(3);
  expect(f.purchase).not.toHaveBeenCalled();
  expect(f.resume).not.toHaveBeenCalled();
});
test('filtering and cancelling preserve the displayed balance and never submit a purchase', () => {
  render(
    <ShopScreen qa={{ actor: 'fixture', coins: 123, production: true }} />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Comprar baú comum' }));
  expect(
    screen.getByRole('region', { name: 'Confirmar compra' }),
  ).toHaveTextContent('Baú comum');
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.queryByRole('region', { name: 'Confirmar compra' })).toBeNull();
  expect(screen.getByText('123 Moedas do Viajante')).toBeVisible();
  expect(f.purchase).not.toHaveBeenCalled();
  expect(f.traveler.coins).toBe(123);
});

test('confirmed purchase auto opens once; failed opening retries the same ID without buying again', async () => {
  f.purchase.mockResolvedValue({
    kind: 'chest',
    openingOperationId: 'stable-opening',
  });
  f.open
    .mockRejectedValueOnce(Error('Rede indisponível'))
    .mockResolvedValueOnce({ id: 'receipt' });
  f.reload.mockResolvedValue(true);
  render(
    <ShopScreen qa={{ actor: 'fixture', coins: 123, production: true }} />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Comprar baú comum' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar compra' }));
  await waitFor(() => expect(f.open).toHaveBeenCalledTimes(1));
  const retry = await screen.findByRole('button', {
    name: 'Tentar abrir novamente',
  });
  await waitFor(() => expect(retry).not.toBeDisabled());
  fireEvent.click(retry);
  await screen.findByRole('dialog', { name: 'Tesouro' });
  expect(f.purchase).toHaveBeenCalledTimes(1);
  expect(f.open.mock.calls[1]).toEqual(f.open.mock.calls[0]);
  expect(f.open.mock.calls[0]).toEqual([
    'owner',
    'fixture',
    'common',
    false,
    true,
    false,
    'stable-opening',
  ]);
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(f.open).toHaveBeenCalledTimes(2);
});

test('Ver na Mochila navigates after confirmed opening without another transaction', async () => {
  f.purchase.mockResolvedValue({
    kind: 'chest',
    openingOperationId: 'stable-opening',
  });
  f.open.mockResolvedValue({ id: 'receipt' });
  f.reload.mockResolvedValue(true);
  render(
    <ShopScreen qa={{ actor: 'fixture', coins: 123, production: true }} />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Comprar baú comum' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar compra' }));
  fireEvent.click(
    await screen.findByRole('button', { name: 'Ver na Mochila' }),
  );
  expect(f.push).toHaveBeenCalledWith('/journey/backpack');
  expect(f.purchase).toHaveBeenCalledTimes(1);
  expect(f.open).toHaveBeenCalledTimes(1);
});
