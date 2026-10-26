// Loopback-only fixture. Never a Next route, remote account or catalog approval.
import { createRoot } from 'react-dom/client';
import { AvatarRuntime } from '../../../apps/web/features/journey/components/avatar-runtime';
import { calculateTotalAttributes } from '../../../apps/web/features/journey/data/attributes';
import { EQUIPMENT_CATALOG } from '../../../apps/web/features/journey/data/equipmentCatalog';
import { APPROVED_EQUIPMENT_003 } from '../../../apps/web/features/journey/data/equipmentBodyFit003';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
  type Equipment,
} from '../../../apps/web/features/journey/domain/traveler';
import { journeyRepository } from '../../../apps/web/features/journey/persistence/journey-storage';
import {
  equipItem,
  unequipSlot,
  useJourney,
} from '../../../apps/web/features/journey/state/use-journey';
import './style.css';

const fixtureId = '10000000-0000-4000-8000-000000000008';
const alternate: Equipment = {
  id: 'offline-sword-alternate',
  name: 'Espada sintética',
  slot: 'weapon',
  rarity: 'comum',
  power: 2,
  stats: { strength: 4 },
};
if (!journeyRepository.listSaved().some((t) => t.id === fixtureId)) {
  const t = createTraveler(
    'Ensaio isolado',
    DEFAULT_APPEARANCE,
    fixtureId,
    '2026-10-24T12:00:00.000Z',
  );
  t.avatar.gender = 'female';
  t.appearance = { hair: 'longo', outfit: 'azul', skin: 'escuro' };
  t.inventory = [...EQUIPMENT_CATALOG, alternate];
  t.equipped = { armor: 'traveler-armor-uncommon' };
  t.avatar.equippedItems = { ...t.equipped };
  if (!journeyRepository.saveNew(t)) throw Error('Fixture storage unavailable');
}
journeyRepository.startSession(fixtureId);

function Harness() {
  const state = useJourney();
  if (state.status !== 'ready') return <p>Carregando fixture…</p>;
  const t = state.traveler;
  const sword = t.inventory.find((i) => i.id === 'traveler-sword-common')!;
  return (
    <main>
      <h1>Equipamentos: ensaio isolado</h1>
      <p>
        Inventário sintético. Sem rede, contas, créditos ou homologação de
        itens.
      </p>
      <nav aria-label="Operações de teste">
        <button onClick={() => equipItem(sword)}>
          Equipar espada aprovada
        </button>
        <button onClick={() => equipItem(alternate)}>
          Trocar por variante sintética
        </button>
        <button onClick={() => unequipSlot('weapon')}>Desequipar arma</button>
        {APPROVED_EQUIPMENT_003.map((entry) => (
          <span key={entry.itemId}>
            <button
              onClick={() =>
                equipItem(t.inventory.find((item) => item.id === entry.itemId)!)
              }
            >
              Equipar {entry.slot}
            </button>
            <button onClick={() => unequipSlot(entry.slot)}>
              Desequipar {entry.slot}
            </button>
          </span>
        ))}
      </nav>
      <output data-testid="snapshot">
        {JSON.stringify({
          equipped: t.equipped,
          avatarEquipped: t.avatar.equippedItems,
          inventory: t.inventory.map((i) => i.id).sort(),
          attributes: calculateTotalAttributes(t).total,
          xp: t.xp,
          coins: t.coins,
        })}
      </output>
      <AvatarRuntime traveler={t} />
    </main>
  );
}
createRoot(document.getElementById('root')!).render(<Harness />);
