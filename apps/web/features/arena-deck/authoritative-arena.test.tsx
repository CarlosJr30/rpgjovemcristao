// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  createArenaDeckBattle,
  resolveArenaCommand,
  type ArenaProductAction,
} from '@rpg/game-engine';
import {
  measuredHero,
  measuredOpponent,
  syntheticSevenCards,
} from '../../../../tests/fixtures/measured-strike';
import type { BattleView } from '../../lib/authority/service';
import type { requestAuthority } from '../../lib/authority/client';
vi.mock('../../lib/authority/client', () => ({ requestAuthority: vi.fn() }));
vi.mock('../../lib/supabase/online-sync', () => ({
  reloadOnlineTraveler: vi.fn().mockResolvedValue(true),
}));
vi.mock('../journey/hooks/use-game-audio', () => ({ useAudioScene: vi.fn() }));
vi.mock('../journey/audio/arena-audio', () => ({ emitArenaSound: vi.fn() }));
vi.mock('../journey/hooks/use-battle-presentation', () => ({
  useBattlePresentation: () => ({
    busy: false,
    display: null,
    phase: 'anticipation',
    event: null,
    play: vi.fn(),
  }),
}));
vi.mock('../journey/components/arena-stage', () => ({
  ArenaStage: () => <div data-testid="confirmed-stage" />,
}));
import { AuthoritativeArena } from './authoritative-arena';
afterEach(cleanup);
it('requests the existing starter only after an explicit click and displays only the server-confirmed collection', async () => {
  let claimed = false;
  const cards = syntheticSevenCards();
  const transport = vi.fn(async (body: Record<string, unknown>) => {
    if (body.operation === 'collection')
      return claimed
        ? cards.map((card) => ({
            card,
            version: 'fixture-only',
            receiptId: 'confirmed-receipt',
          }))
        : [];
    if (body.operation === 'resume') return null;
    if (body.operation === 'starter') {
      claimed = true;
      return { id: 'confirmed-receipt' };
    }
    throw Error('Unexpected intent');
  });
  render(
    <AuthoritativeArena
      travelerId={measuredHero.id}
      mode="arena-v3"
      transport={transport as unknown as typeof requestAuthority}
    />,
  );
  const button = await screen.findByRole('button', {
    name: 'Receber baralho inicial neste Viajante',
  });
  await waitFor(() =>
    expect((button as HTMLButtonElement).disabled).toBe(false),
  );
  expect(
    transport.mock.calls.some(([body]) => body.operation === 'starter'),
  ).toBe(false);
  fireEvent.click(button);
  await screen.findByText('Baralho inicial confirmado pelo servidor.');
  expect(
    transport.mock.calls.filter(([body]) => body.operation === 'starter'),
  ).toEqual([[{ travelerId: measuredHero.id, operation: 'starter' }]]);
  expect(
    screen.queryByRole('button', {
      name: 'Receber baralho inicial neste Viajante',
    }),
  ).toBeNull();
});
it('does not manufacture cards when a starter request is rejected', async () => {
  const transport = vi.fn(async (body: Record<string, unknown>) => {
    if (body.operation === 'collection') return [];
    if (body.operation === 'resume') return null;
    throw Error('Catálogo ainda não homologado.');
  });
  render(
    <AuthoritativeArena
      travelerId={measuredHero.id}
      mode="arena-v3"
      transport={transport as unknown as typeof requestAuthority}
    />,
  );
  const button = await screen.findByRole('button', {
    name: 'Receber baralho inicial neste Viajante',
  });
  await waitFor(() =>
    expect((button as HTMLButtonElement).disabled).toBe(false),
  );
  fireEvent.click(button);
  await screen.findByText('Catálogo ainda não homologado.');
  expect(screen.queryByRole('button', { name: 'Selecionar carta' })).toBeNull();
});
it('official client sends only intent, takes confirmed state, and recovers consumed card without a local result', async () => {
  const cards = syntheticSevenCards();
  let current: BattleView | null = null;
  const transport = vi.fn(async (body: Record<string, unknown>) => {
    if (body.operation === 'collection')
      return cards.map((card) => ({
        card,
        version: 'fixture-only',
        receiptId: 'fixture-receipt',
      }));
    if (body.operation === 'resume') return current;
    if (body.operation === 'start')
      return (current = {
        state: createArenaDeckBattle(
          measuredHero,
          measuredOpponent,
          42,
          'fixture-battle',
          cards.map((c) => c.id),
          cards,
        ),
        revision: 0,
        receiptId: null,
        reward: null,
        floor: null,
      });
    if (body.operation === 'command')
      return (current = {
        ...current!,
        revision: current!.revision + 1,
        state: resolveArenaCommand(
          current!.state,
          current!.state.id,
          current!.state.round,
          body.action as ArenaProductAction,
        ),
      });
    throw Error('Unexpected call');
  });
  const first = render(
    <AuthoritativeArena
      travelerId={measuredHero.id}
      mode="arena-v3"
      transport={transport as unknown as typeof requestAuthority}
    />,
  );
  await screen.findByText('Estado confirmado pelo servidor.');
  for (const button of screen.getAllByRole('button', {
    name: 'Selecionar carta',
  }))
    fireEvent.click(button);
  fireEvent.click(screen.getByRole('button', { name: 'Salvar baralho' }));
  await screen.findByText('Baralho pronto para iniciar no servidor.');
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar batalha' }));
  await screen.findByTestId('confirmed-stage');
  fireEvent.click(screen.getByRole('button', { name: 'CARTAS' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Usar carta Ataque Simples' }),
  );
  await waitFor(() =>
    expect(
      transport.mock.calls.filter(([body]) => body.operation === 'command'),
    ).toHaveLength(1),
  );
  const command = transport.mock.calls.find(
    ([body]) => body.operation === 'command',
  )![0];
  expect(Object.keys(command).sort()).toEqual(
    [
      'action',
      'battleId',
      'commandId',
      'operation',
      'revision',
      'round',
      'travelerId',
    ].sort(),
  );
  expect(command.action).toBe(`card:${cards[0].id}`);
  first.unmount();
  render(
    <AuthoritativeArena
      travelerId={measuredHero.id}
      mode="arena-v3"
      transport={transport as unknown as typeof requestAuthority}
    />,
  );
  await screen.findByTestId('confirmed-stage');
  fireEvent.click(screen.getByRole('button', { name: 'CARTAS' }));
  await screen.findByText('USADA');
  expect(
    (
      screen.getByRole('button', {
        name: 'Usar carta Ataque Simples',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(
    transport.mock.calls.filter(([body]) => body.operation === 'command'),
  ).toHaveLength(1);
});
it('unavailable server cannot fall back to local checkpoints, start battle or grant a reward', async () => {
  localStorage.setItem(
    'rpg-arena-forged-win',
    JSON.stringify({ winnerId: measuredHero.id, coins: 9999 }),
  );
  const transport = vi.fn().mockRejectedValue(Error('unavailable'));
  render(
    <AuthoritativeArena
      travelerId={measuredHero.id}
      mode="tower-v3"
      transport={transport}
    />,
  );
  await screen.findByText(
    'Servidor oficial indisponível. Catálogo e combate permanecem bloqueados.',
  );
  expect(
    (screen.getByRole('button', { name: /Enfrentar/ }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(transport.mock.calls.map(([body]) => body.operation).sort()).toEqual([
    'collection',
    'resume',
    'tower',
  ]);
  expect(localStorage.getItem('rpg-arena-forged-win')).toContain('9999');
});
