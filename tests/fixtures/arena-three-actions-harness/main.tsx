// Test-only browser entry. Never imported by Next or the approved catalog.
import { createRoot } from 'react-dom/client';
import { useRef, useState } from 'react';
import type { ArenaProductAction } from '@rpg/game-engine';
import { ArenaBattleActions } from '../../../apps/web/features/arena-deck/battle-actions';
import { BattleCards } from '../../../apps/web/features/arena-deck/editor';
import { ArenaFocusMeter } from '../../../apps/web/features/journey/components/arena-specials';
import { arenaDeckStorage as storage } from '../../../apps/web/features/arena-deck/storage';
import {
  specialCards as cards,
  specialIds as ids,
} from '../arena-special-cards';
import { player, opponent } from '../arena-deck';
import '../arena-deck-harness/style.css';
import './style.css';
function Harness() {
  const [data, setData] = useState(() =>
    storage.load('fixture', 'player', cards),
  );
  const [level, setLevel] = useState(8);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const refresh = () => setData(storage.load('fixture', 'player', cards));
  const act = async (action: ArenaProductAction) => {
    if (pending.current || !data.battle) return;
    pending.current = true;
    setBusy(true);
    try {
      await storage.command(
        'fixture',
        'player',
        cards,
        data.battle.id,
        data.battle.round,
        action,
      );
      refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const active = data.battle?.status === 'in_progress';
  return (
    <main>
      <h1>Ensaio isolado das três ações</h1>
      <p>
        Sete cartas sintéticas, quatro efeitos existentes. Sem aquisição ou
        recompensa do produto.
      </p>
      {error && <p role="alert">{error}</p>}
      <label>
        Nível sintético{' '}
        <select
          aria-label="Nível sintético"
          value={level}
          disabled={active}
          onChange={(e) => setLevel(Number(e.target.value))}
        >
          <option value={8}>8</option>
          <option value={1}>1</option>
        </select>
      </label>
      <p>Cartas selecionadas: {data.selection.length}/7</p>
      <button
        disabled={active}
        onClick={async () => {
          await storage.save('fixture', 'player', cards, ids);
          refresh();
        }}
      >
        Preparar baralho sintético
      </button>
      <button
        disabled={active || data.selection.length !== 7}
        onClick={async () => {
          await storage.begin(
            'fixture',
            'player',
            cards,
            { ...player, level, specialLoadout: [] },
            opponent,
          );
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
            {active ? `Rodada ${data.battle.round}` : 'Batalha encerrada'}
          </p>
          <div aria-label="Vida dos combatentes">
            <p>
              Jogador: {data.battle.player.hp}/{data.battle.player.maxHp} HP
            </p>
            <p>
              Adversário: {data.battle.opponent.hp}/{data.battle.opponent.maxHp}{' '}
              HP
            </p>
          </div>
          <div className="focusFixture">
            <ArenaFocusMeter fighter={data.battle.player} />
          </div>
          {active ? (
            <ArenaBattleActions
              key={data.battle.id}
              battle={data.battle}
              busy={busy}
              onAction={(a) => void act(a)}
            />
          ) : (
            <BattleCards
              battle={data.battle}
              busy={false}
              onPlay={() => undefined}
            />
          )}
        </>
      )}
    </main>
  );
}
createRoot(document.getElementById('root')!).render(<Harness />);
