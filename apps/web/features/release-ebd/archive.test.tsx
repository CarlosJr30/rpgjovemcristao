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
import { createTraveler, DEFAULT_APPEARANCE } from '../journey/domain/traveler';
import { getArenaCardCatalog } from '@rpg/game-engine';
import { ArchiveAccess } from './archive';
import {
  BackpackContents,
  CollectionContents,
  ArchiveDiary,
} from './archive-screens';
import { arenaCardIllustration } from '../arena-deck/card-illustrations';
import { DiaryContents } from '../journey/screens/diary';
import type { ArchiveSnapshot } from '../../lib/supabase/online-sync';

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt?: string; src: string }) => (
    <span role="img" aria-label={alt} data-src={src} />
  ),
}));

const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  cards: vi.fn(),
  save: vi.fn(),
  owner: 'owner-a',
  online: 'owner-a',
  session: 1,
  travelerId: 'hero-a',
}));
vi.mock('../../lib/supabase/auth-context', () => ({
  useAuth: () => ({ status: 'signedIn', user: { id: mocks.owner } }),
}));
vi.mock('../../lib/supabase/online-sync', () => ({
  readOnlineArchive: mocks.read,
  getOnlineSessionRevision: () => mocks.session,
  getCurrentOnlineUserId: () => mocks.online,
  canUseTravelerInCurrentSession: () => true,
}));
vi.mock('../../lib/supabase/owned-cards-read', () => ({
  readOwnedCards: mocks.cards,
}));
vi.mock('../journey/state/use-journey', () => ({
  saveDiaryEntry: mocks.save,
  useJourney: () => ({ status: 'ready', traveler: { id: mocks.travelerId } }),
}));
vi.mock('./shell', () => ({
  ReleaseAccess: ({ children }: { children: React.ReactNode }) => children,
  ReleaseShell: ({ children }: { children: React.ReactNode }) => children,
}));

function snapshot(): ArchiveSnapshot {
  const traveler = createTraveler(
    'Registro A',
    DEFAULT_APPEARANCE,
    'hero-a',
    '2026-10-01T00:00:00Z',
  );
  traveler.inventory = [];
  traveler.equipped = {};
  return { traveler, inventory: [], persistedProgress: false };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.owner = mocks.online = 'owner-a';
  mocks.session = 1;
  mocks.travelerId = 'hero-a';
  mocks.cards.mockResolvedValue([]);
  mocks.read.mockResolvedValue(snapshot());
});
afterEach(cleanup);

it('shows only possessed equipment and routes management to the existing equipment screen', () => {
  const s = snapshot();
  s.traveler.equipped = { boots: 'traveler-boots' };
  s.inventory = [
    {
      id: 'row',
      traveler_id: 'hero-a',
      item_id: 'traveler-boots',
      quantity: 3,
      metadata: null,
      acquired_at: '2026-10-01',
    },
  ];
  const before = JSON.stringify(s);
  render(<BackpackContents snapshot={s} cards={[]} />);
  expect(screen.getByText('Botas do Viajante')).toBeInTheDocument();
  expect(
    screen.getByRole('tab', { name: /Equipamentos.*3 possuídos/ }),
  ).toBeInTheDocument();
  expect(screen.getByText(/Equipado/)).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Trocar ou desequipar' }),
  ).toHaveAttribute('href', '/journey/equipment');
  expect(screen.queryByText('Item não possuído')).not.toBeInTheDocument();
  expect(JSON.stringify(s)).toBe(before);
});
it('switches the three tabs, counts server-owned cards and links to the existing deck flow', () => {
  // Renderer fixture from the canonical catalog; it grants no owned card.
  const card = getArenaCardCatalog()[0];
  const art = arenaCardIllustration(card.id);
  const s = snapshot();
  const communityChestFlow = <p>Baú disponível pelo fluxo existente</p>;
  render(
    <BackpackContents
      snapshot={s}
      cards={[
        {
          card,
          version: 'official',
          receiptId: '11111111-1111-4111-8111-111111111111',
        },
      ]}
      chestCount={2}
      chests={communityChestFlow}
    />,
  );
  expect(screen.getByRole('tab', { name: /Equipamentos/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  fireEvent.click(screen.getByRole('tab', { name: /Baús/ }));
  expect(screen.getByText('Baú disponível pelo fluxo existente')).toBeVisible();
  expect(
    screen.getByRole('tab', { name: /Baús.*2 possuídos/ }),
  ).toHaveAttribute('aria-selected', 'true');
  fireEvent.click(screen.getByRole('tab', { name: /Cartas/ }));
  expect(screen.getByRole('heading', { name: card.name })).toBeVisible();
  expect(screen.getByRole('img', { name: art!.alt })).toHaveAttribute(
    'data-src',
    art!.src,
  );
  expect(screen.getByText(/Custo .* Foco/)).toBeVisible();
  expect(
    screen.getByRole('link', { name: 'Montar Meu Baralho · 7 cartas' }),
  ).toHaveAttribute('href', '/journey/arena/deck');
});
it('renders existing card presentation and effect without deck or combat actions', () => {
  // Isolated catalog fixture is not a new grant or a hosted approval.
  const card = getArenaCardCatalog()[0];
  render(
    <CollectionContents
      cards={[
        {
          card,
          version: 'isolated',
          receiptId: '11111111-1111-4111-8111-111111111111',
        },
      ]}
    />,
  );
  expect(screen.getByRole('heading', { name: card.name })).toBeInTheDocument();
  expect(screen.getByText(/Custo base:/)).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
it('keeps private persisted diary text escaped and removes all participation/progression actions', () => {
  const s = snapshot();
  s.traveler.progress.devotionalReflection =
    '<script>private reflection</script>';
  s.traveler.progress.bibleReading.genesis2Opened = '2026-10-01T12:00:00Z';
  const before = JSON.stringify(s);
  const { container } = render(
    <DiaryContents traveler={s.traveler} readOnly />,
  );
  expect(
    container.querySelector('[data-private-reflection]'),
  ).toHaveTextContent('<script>private reflection</script>');
  expect(container.querySelector('script')).toBeNull();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(container.querySelector('a[href^="/journey/"]')).toBeNull();
  expect(mocks.save).not.toHaveBeenCalled();
  expect(JSON.stringify(s)).toBe(before);
});
it('does not display cached progress when no server progress exists', async () => {
  render(<ArchiveDiary />);
  expect(
    await screen.findByText(/Nenhum registro de progresso persistido/),
  ).toBeInTheDocument();
  expect(screen.queryByText('Eventos com data')).not.toBeInTheDocument();
  expect(mocks.cards).not.toHaveBeenCalled();
});
it('discards a late account read and hides prior results immediately on an auth change', async () => {
  let resolveOld!: (s: ArchiveSnapshot) => void;
  mocks.read.mockImplementationOnce(
    () =>
      new Promise<ArchiveSnapshot>((r) => {
        resolveOld = r;
      }),
  );
  const renderArchive = () => (
    <ArchiveAccess>{(s) => <p>{s.traveler.name}</p>}</ArchiveAccess>
  );
  const view = render(renderArchive());
  mocks.owner = 'owner-b';
  view.rerender(renderArchive());
  resolveOld(snapshot());
  await waitFor(() =>
    expect(screen.queryByText('Registro A')).not.toBeInTheDocument(),
  );
  expect(mocks.read).toHaveBeenCalledTimes(1);
  mocks.online = 'owner-b';
  mocks.session++;
  mocks.travelerId = 'hero-b';
  const next = snapshot();
  next.traveler.name = 'Registro B';
  mocks.read.mockResolvedValue(next);
  view.rerender(renderArchive());
  expect(await screen.findByText('Registro B')).toBeInTheDocument();
  expect(screen.queryByText('Registro A')).not.toBeInTheDocument();
});
it('does not turn a read failure into an empty success', async () => {
  mocks.read.mockRejectedValue(new Error('private backend details'));
  render(<ArchiveAccess>{() => <p>Empty success</p>}</ArchiveAccess>);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Não foi possível consultar seus registros.',
  );
  expect(screen.queryByText('Empty success')).not.toBeInTheDocument();
  expect(screen.queryByText('private backend details')).not.toBeInTheDocument();
});
