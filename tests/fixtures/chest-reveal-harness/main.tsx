import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChestReveal } from '../../../apps/web/features/chest-reveal/reveal';
import {
  bindReceipt,
  saveCursor,
} from '../../../apps/web/features/chest-reveal/visual-store';
import { OWNER, TRAVELER, cardReceipt, fixtureTraveler } from '../chest-reveal';
import {
  rarityLabel,
  type RevealRarity,
  type RevealReceipt,
} from '../../../apps/web/features/chest-reveal/receipt';
import './style.css';
function Harness() {
  const [chosen, setChosen] = useState<RevealReceipt | null>(null);
  const [cursor, setCursor] = useState<ReturnType<typeof bindReceipt> | null>(
    null,
  );
  const [replay, setReplay] = useState(false);
  return (
    <main>
      <h1>Ensaio isolado de revelação</h1>
      <p>
        Recibos e cartas sintéticos. Nenhuma aquisição, RPC ou recompensa real.
        Reutiliza a apresentação do produto.
      </p>
      {(
        ['comum', 'incomum', 'raro', 'épico', 'lendário'] as RevealRarity[]
      ).map((rarity) => (
        <button
          key={rarity}
          onClick={() => {
            const receipt = {
              ...cardReceipt,
              entries: cardReceipt.entries.map((p, i) =>
                i === 0 ? { ...p, rarity } : p,
              ),
            };
            setCursor(bindReceipt(OWNER, TRAVELER, receipt, replay));
            setChosen(receipt);
          }}
        >
          Demonstrar {rarityLabel(rarity)}
        </button>
      ))}
      <label>
        <input
          type="checkbox"
          checked={replay}
          onChange={(e) => setReplay(e.target.checked)}
        />
        Reiniciar somente apresentação
      </label>
      {chosen && cursor && (
        <ChestReveal
          receipt={chosen}
          traveler={fixtureTraveler()}
          cursor={cursor}
          onProgress={(c) => saveCursor(OWNER, TRAVELER, c)}
          onClose={() => setChosen(null)}
          onViewEquipment={() => setChosen(null)}
          presentationLabel="DEMONSTRAÇÃO ISOLADA · recibo sintético, nenhum prêmio real"
        />
      )}
    </main>
  );
}
createRoot(document.getElementById('root')!).render(<Harness />);
