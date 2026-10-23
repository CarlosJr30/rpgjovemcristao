// Isolated positive fixture. Never a Next route or a product catalog.
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { TowerExperience } from '../../../apps/web/features/arena-tower/screen';
import { arenaDeckStorage } from '../../../apps/web/features/arena-deck/storage';
import { cards as legacyCards, ids as legacyIds } from '../arena-deck';
import { getArenaCardCatalog } from '@rpg/game-engine';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
} from '../../../apps/web/features/journey/domain/traveler';
import './style.css';
// This switch exists only inside the isolated fixture, never on a Next route.
const candidate =
  new URLSearchParams(location.search).get('candidate') === '003a';
const cards = candidate ? getArenaCardCatalog() : legacyCards;
const ids = candidate ? cards.map((card) => card.id) : legacyIds;
const source = async () => cards;
const strong = {
  ...createTraveler(
    'Lia',
    DEFAULT_APPEARANCE,
    'player',
    '2026-10-20T12:00:00Z',
  ),
  level: 8,
  attributes: candidate
    ? { life: 100, strength: 5, defense: 10, wisdom: 20 }
    : { life: 100, strength: 400, defense: 100, wisdom: 100 },
};
function Harness() {
  const [owner, setOwner] = useState('A');
  const [ready, setReady] = useState(false);
  return (
    <main>
      <h1>Ensaio isolado da Torre</h1>
      <p>
        Cartas e atributos sintéticos, sem aquisição ou recompensa do produto.
      </p>
      <button
        onClick={async () => {
          await arenaDeckStorage.save(owner, 'player', cards, ids);
          setReady(true);
        }}
      >
        Preparar baralho sintético
      </button>
      <button
        onClick={() => {
          setOwner((x) => (x === 'A' ? 'B' : 'A'));
          setReady(false);
        }}
      >
        Trocar conta sintética
      </button>
      <p>
        Conta sintética {owner}
        {ready ? ' · baralho preparado' : ''}
      </p>
      <TowerExperience
        key={owner + String(ready)}
        ownerId={owner}
        traveler={strong}
        collectionSource={source}
      />
    </main>
  );
}
createRoot(document.getElementById('root')!).render(<Harness />);
