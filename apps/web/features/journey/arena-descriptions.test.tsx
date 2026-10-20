// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { createArenaDeckBattle, resolveArenaCommand } from '@rpg/game-engine';
import {
  specialCards,
  specialIds,
} from '../../../../tests/fixtures/arena-special-cards';
import { player, opponent } from '../../../../tests/fixtures/arena-deck';
import { BattleCards } from '../arena-deck/editor';
import { createTraveler, DEFAULT_APPEARANCE } from './domain/traveler';
import { SHOP_OFFERS } from './data/equipmentCatalog';
import { EquipmentComparison } from './components/equipment-comparison';
import {
  EquipmentArenaDetails,
  ArenaRecentHistory,
  ArenaRuleSummary,
} from './components/arena-rule-details';
import { travelerBattleSnapshot } from './data/arena';
afterEach(cleanup);
const traveler = () =>
  createTraveler('Lia', DEFAULT_APPEARANCE, 'player', '2026-10-20T12:00:00Z');
test('card panel shows rarity/type, numerical effect, duration, cost, level and remaining uses', () => {
  const b = createArenaDeckBattle(
    player,
    opponent,
    42,
    'ui',
    specialIds,
    specialCards,
  );
  const view = render(<BattleCards battle={b} busy={false} onPlay={vi.fn()} />);
  const strike = () =>
    screen.getByRole('article', { name: 'Carta: Teste: Golpe do Caminho' });
  expect(within(strike()).getByText('teste · Ofensiva')).toBeInTheDocument();
  expect(within(strike()).getByText('Golpe ×1,45')).toBeInTheDocument();
  expect(
    within(strike()).getByText('Custo: 2 Foco · Nível mínimo: 2'),
  ).toBeInTheDocument();
  expect(
    within(strike()).getByText('Usos disponíveis nesta batalha: 1.'),
  ).toBeInTheDocument();
  expect(within(strike()).getByText(/Duração: Um ataque/)).toBeVisible();
  expect(within(strike()).getByRole('button')).toBeDisabled();
  const ready = { ...b, player: { ...b.player, focusPoints: 3 } };
  const used = resolveArenaCommand(
    ready,
    ready.id,
    ready.round,
    `card:${specialIds[0]}`,
  );
  view.rerender(<BattleCards battle={used} busy={false} onPlay={vi.fn()} />);
  expect(within(strike()).getByText('USADA')).toBeInTheDocument();
  expect(
    within(strike()).getByText('Usos disponíveis nesta batalha: 0.'),
  ).toBeInTheDocument();
});
test('owned equipment comparison uses the exact Arena snapshot and does not promise final damage', () => {
  const t = traveler();
  const sword = SHOP_OFFERS[0].equipment;
  t.inventory.push(sword);
  render(<EquipmentComparison traveler={t} item={sword} expanded />);
  const row = screen.getByRole('row', {
    name: /Parcela ofensiva antes da Defesa/,
  });
  expect(
    within(row)
      .getAllByRole('cell')
      .map((c) => c.textContent),
  ).toEqual(['5,38', '9,96', '+4,58']);
  const hp = screen.getByRole('row', { name: /Vida máxima na Arena/ });
  expect(
    within(hp)
      .getAllByRole('cell')
      .map((c) => c.textContent),
  ).toEqual(['32', '32', '0']);
  expect(screen.getByText(/não são dano final/)).toBeInTheDocument();
});
test('unowned item is not compared as if it had been equipped', () => {
  render(
    <EquipmentComparison
      traveler={traveler()}
      item={SHOP_OFFERS[0].equipment}
    />,
  );
  expect(screen.getByText(/Comparação indisponível/)).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});
test('equipment descriptions distinguish numeric attributes, automatic triggers and max HP', () => {
  const t = traveler();
  render(
    <>
      <EquipmentArenaDetails item={SHOP_OFFERS[0].equipment} />
      <ArenaRuleSummary snapshot={travelerBattleSnapshot(t)} />
    </>,
  );
  expect(
    screen.getByText(/Contribuição à parcela ofensiva: 0,18/),
  ).toBeInTheDocument();
  expect(screen.getByText(/\+2 Força/)).toBeInTheDocument();
  expect(screen.getByText(/Vida máxima: 32 HP/)).toBeInTheDocument();
  expect(screen.getByText(/Não é cura/)).toBeInTheDocument();
  expect(screen.getByText(/sem gastar esse reforço/)).toBeInTheDocument();
});
test('recent history reports only entries already confirmed, with actual focus paid', () => {
  const b = createArenaDeckBattle(
    player,
    opponent,
    42,
    'ui',
    specialIds,
    specialCards,
  );
  const ready = { ...b, player: { ...b.player, focusPoints: 3 } };
  const used = resolveArenaCommand(
    ready,
    ready.id,
    ready.round,
    `card:${specialIds[0]}`,
  );
  const view = render(<ArenaRecentHistory battle={b} />);
  expect(screen.queryByText(/Consumiu/)).not.toBeInTheDocument();
  view.rerender(<ArenaRecentHistory battle={used} />);
  expect(
    screen.getByText(/Consumiu 2 Foco; Foco após a ação: 1/),
  ).toBeInTheDocument();
  expect(screen.getAllByRole('listitem').length).toBeLessThanOrEqual(8);
});
