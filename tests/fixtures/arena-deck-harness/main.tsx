// Isolated browser fixture. Not a Next route, and not imported by product code.
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import {
  DeckEditor,
  BattleCards,
} from '../../../apps/web/features/arena-deck/editor';
import { arenaDeckStorage as storage } from '../../../apps/web/features/arena-deck/storage';
import { validateArenaDeck, type ArenaAction } from '@rpg/game-engine';
import { cards, player, opponent } from '../arena-deck';
import './style.css';
function Session({ owner }: { owner: string }) {
  const [data, setData] = useState(() => storage.load(owner, 'player', cards));
  const [error, setError] = useState('');
  const refresh = () => setData(storage.load(owner, 'player', cards));
  const act = async (action: ArenaAction) => {
    try {
      const b = data.battle!;
      await storage.command(owner, 'player', cards, b.id, b.round, action);
      refresh();
    } catch (e) {
      setError(String(e));
    }
  };
  return (
    <>
      <p>Conta sintética: {owner}</p>
      {error && <p role="alert">{error}</p>}
      {data.battle?.status === 'in_progress' ? (
        <p>Baralho bloqueado durante a batalha em andamento.</p>
      ) : (
        <DeckEditor
          cards={cards}
          initial={data.selection}
          locked={false}
          busy={false}
          onSave={async (ids) => {
            await storage.save(owner, 'player', cards, ids);
            refresh();
          }}
        />
      )}
      <button
        disabled={
          !!validateArenaDeck(data.selection, cards) ||
          data.battle?.status === 'in_progress'
        }
        onClick={async () => {
          await storage.begin(owner, 'player', cards, player, opponent);
          setError('');
          refresh();
        }}
      >
        Nova batalha
      </button>
      {data.battle && (
        <>
          <p>
            Identidade:{' '}
            <output aria-label="Identidade da batalha">{data.battle.id}</output>
          </p>
          <p role="status">
            {data.battle.status === 'finished'
              ? 'Batalha encerrada'
              : `Rodada ${data.battle.round}`}
          </p>
          <BattleCards
            battle={data.battle}
            busy={false}
            onPlay={(id) => void act(`card:${id}`)}
          />
          <button
            disabled={data.battle.status === 'finished'}
            onClick={() => void act('attack')}
          >
            Ataque básico
          </button>
        </>
      )}
    </>
  );
}
function Harness() {
  const [owner, setOwner] = useState('A');
  return (
    <main>
      <h1>Ensaio isolado do baralho</h1>
      <p>
        40 cartas sintéticas de teste. Nenhuma aquisição ou recompensa do jogo.
      </p>
      <button onClick={() => setOwner((v) => (v === 'A' ? 'B' : 'A'))}>
        Trocar conta sintética
      </button>
      <Session key={owner} owner={owner} />
    </main>
  );
}
createRoot(document.getElementById('root')!).render(<Harness />);
