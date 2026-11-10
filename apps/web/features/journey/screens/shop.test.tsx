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
import { afterEach, expect, test, vi } from 'vitest';
const f = vi.hoisted(() => ({
  purchase: vi.fn(),
  resume: vi.fn(),
  open: vi.fn(),
  reload: vi.fn(),
  push: vi.fn(),
  read: vi.fn(),
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
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  f.traveler.id = 'fixture';
  f.traveler.coins = 123;
});
const testShopEnvironment = () => {
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'https://wkdvdzfkbwvhyjmamrsg.supabase.co',
  );
  vi.stubEnv('NEXT_PUBLIC_SHOP_TEST_PREVIEW', '1');
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
};
test('blocked legacy accounts still see the catalog, with all transactions disabled', async () => {
  testShopEnvironment();
  let resolveRead!: (state: {
    enabled: boolean;
    coins: number;
    balanceVerified: boolean;
    reason: string;
  }) => void;
  f.read.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveRead = resolve;
      }),
  );
  render(<QAShopAccess />);
  expect(
    screen.getByRole('heading', { name: 'Loja do Viajante' }),
  ).toBeVisible();
  expect(
    screen.getByText('Verificando disponibilidade da Loja.'),
  ).toBeVisible();
  expect(
    screen.getByRole('button', { name: /Comprar.*comum/i }),
  ).toBeDisabled();
  resolveRead({
    enabled: false,
    coins: 0,
    balanceVerified: false,
    reason: 'legacy-reconciliation-required',
  });
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(
      'Aguardando revisão do histórico.',
    ),
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    'Aguardando revisão do histórico.',
  );
  expect(
    screen.getByRole('button', { name: /Comprar.*comum/i }),
  ).toBeDisabled();
  fireEvent.click(screen.getByText('Ajuda e recuperação'));
  expect(
    screen.getByRole('button', { name: 'Consultar compra pendente' }),
  ).toBeDisabled();
  expect(screen.getByRole('button', { name: /Abrir ba/ })).toBeDisabled();
  expect(f.purchase).not.toHaveBeenCalled();
  expect(f.resume).not.toHaveBeenCalled();
});
test('an unconfirmed access read keeps the catalog visible and disables transactions', async () => {
  testShopEnvironment();
  f.traveler.coins = 1000;
  f.read.mockRejectedValue(Error('read failed'));
  render(<QAShopAccess />);
  expect(
    await screen.findByText(
      'Operações indisponíveis. Seus saldos e itens estão preservados.',
    ),
  ).toBeVisible();
  expect(
    screen.getByRole('heading', { name: 'Loja do Viajante' }),
  ).toBeVisible();
  expect(
    screen.getByRole('button', { name: /Comprar.*comum/i }),
  ).toBeDisabled();
  expect(f.purchase).not.toHaveBeenCalled();
  expect(f.resume).not.toHaveBeenCalled();
});
test('a verified account with an unverified balance cannot start a purchase', async () => {
  testShopEnvironment();
  f.traveler.coins = 1000;
  f.read.mockResolvedValue({
    enabled: true,
    coins: 1000,
    balanceVerified: false,
    reason: 'balance-unverified',
  });
  render(<QAShopAccess />);
  expect(
    await screen.findByText(
      'Operações indisponíveis. Seus saldos e itens estão preservados.',
    ),
  ).toBeVisible();
  expect(
    screen.getByRole('button', { name: /Comprar.*comum/i }),
  ).toBeDisabled();
  expect(f.purchase).not.toHaveBeenCalled();
});
test('an authorized Shop state keeps the existing purchase flow available', async () => {
  testShopEnvironment();
  f.read.mockResolvedValue({
    enabled: true,
    coins: 123,
    balanceVerified: true,
  });
  render(<QAShopAccess />);
  const buy = await screen.findByRole('button', {
    name: /Comprar.*comum/i,
  });
  expect(buy).toBeEnabled();
  fireEvent.click(buy);
  expect(
    screen.getByRole('region', { name: 'Confirmar compra' }),
  ).toBeVisible();
  expect(f.purchase).not.toHaveBeenCalled();
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
  const balance = screen.getByText('Saldo').parentElement;
  expect(balance).toHaveTextContent('123');
  expect(balance).toHaveTextContent('Moedas do Viajante');
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
