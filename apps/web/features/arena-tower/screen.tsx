'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  arenaProfiles,
  calculateMaxHp,
  validateArenaDeck,
  type ArenaCard,
} from '@rpg/game-engine';
import { useAuth } from '../../lib/supabase/auth-context';
import { RequireTraveler, Shell } from '../journey/components/shell';
import { ArenaExperience, type LocalTowerMode } from '../journey/screens/arena';
import type { Traveler } from '../journey/domain/traveler';
import {
  loadArenaCollection,
  type CollectionSource,
} from '../arena-deck/collection';
import { TOWER_FLOORS } from './config';
import {
  finishTower,
  loadTower,
  recoverTower,
  towerArenaSession,
} from './storage';
import css from './tower.module.css';
type View = ReturnType<typeof loadTower>;
export function TowerExperience({
  ownerId,
  traveler,
  collectionSource = loadArenaCollection,
}: {
  ownerId: string;
  traveler: Traveler;
  collectionSource?: CollectionSource;
}) {
  const [data, setData] = useState<{
    view: View;
    cards: readonly ArenaCard[];
  } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [combat, setCombat] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let live = true;
    collectionSource(ownerId, traveler.id)
      .then((cards) => {
        const view = loadTower(ownerId, traveler.id, cards);
        if (live) {
          setData({ view, cards });
          setError('');
        }
      })
      .catch((e) => {
        if (live)
          setError(e instanceof Error ? e.message : 'Torre indisponível.');
      });
    return () => {
      live = false;
    };
  }, [ownerId, traveler.id, collectionSource, refresh]);
  const mode = useMemo<LocalTowerMode | null>(
    () =>
      combat === null
        ? null
        : {
            boss: TOWER_FLOORS[combat].boss,
            opponent: TOWER_FLOORS[combat].snapshot,
            session: towerArenaSession(combat),
            onFinished: async (id) => {
              const cards = await collectionSource(ownerId, traveler.id);
              return finishTower(ownerId, traveler.id, cards, id);
            },
            onExit: () => {
              setCombat(null);
              setData(null);
              setRefresh((v) => v + 1);
            },
          },
    [combat, ownerId, traveler.id, collectionSource],
  );
  if (mode)
    return (
      <ArenaExperience
        key={`${ownerId}:${traveler.id}:${combat}`}
        traveler={traveler}
        ownerId={ownerId}
        collectionSource={collectionSource}
        localTower={mode}
      />
    );
  const current = data?.view.progress.wins.length ?? 0;
  const deckError = data
    ? validateArenaDeck(data.view.selection, data.cards)
    : 'count';
  return (
    <section className={css.tower}>
      <header>
        <span>ARENA · TREINO DEMONSTRATIVO</span>
        <h1>Torre dos 7 Desafios</h1>
        <p>
          Sete adversários, um campeão. Cada andar é uma batalha nova; as sete
          cartas voltam a ter um uso no próximo combate.
        </p>
      </header>
      <aside className={css.notice}>
        <strong>Progresso local, não oficial.</strong>
        <p>
          Este treino fica neste navegador. Vitórias, conquistas e recompensas
          oficiais exigem validação do servidor. Nenhum XP, moeda ou baú será
          concedido nesta modalidade local.
        </p>
      </aside>
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p role="status">Carregando checkpoint da Torre…</p>}
      {data && (
        <>
          <p role="status">Torre local: {current}/7 desafios concluídos.</p>
          <p>
            Cartas selecionadas: {data.view.selection.length}/7.{' '}
            <Link href="/journey/arena/deck">Meu Baralho</Link>
          </p>
          {deckError && (
            <p className={css.notice}>
              A entrada exige sete cartas homologadas e possuídas. Catálogo e
              aquisição ainda pendentes; nenhuma carta será concedida para
              liberar a Torre.
            </p>
          )}
          {data.view.battle && (
            <p className={css.notice}>
              {data.view.recovery
                ? 'Checkpoint de batalha salvo; retome para recuperar o vínculo local.'
                : data.view.battle.status === 'finished'
                  ? 'Resultado local pendente. Revise e registre explicitamente; recarregar não concede vitória.'
                  : 'Batalha em andamento salva. Retome a mesma identidade e cartas.'}
            </p>
          )}
          {data.view.progress.last?.outcome === 'defeat' && (
            <p>
              A derrota mantém o andar atual. Andares anteriores e sua coleção
              foram preservados, sem perda de XP ou moedas.
            </p>
          )}
          {current === 7 && (
            <div className={css.champion} role="status">
              <h2>Campeão superado — treino local concluído!</h2>
              <p>
                7/7 registrados neste navegador. Conquista oficial e recompensa
                da primeira conclusão não foram concedidas.
              </p>
            </div>
          )}
          <ol className={css.floors} aria-label="Sete andares da Torre">
            {TOWER_FLOORS.map((floor, i) => {
              const done = i < current;
              const available = i === current;
              return (
                <li
                  key={floor.id}
                  data-state={
                    done ? 'completed' : available ? 'available' : 'locked'
                  }
                  className={floor.boss ? css.champion : undefined}
                >
                  <span>
                    ANDAR {floor.index}
                    {floor.boss ? ' · CAMPEÃO' : ''}
                  </span>
                  <h2>{floor.snapshot.name}</h2>
                  <p>
                    {floor.difficulty} ·{' '}
                    {arenaProfiles[floor.snapshot.arenaProfile!].label} · Poder{' '}
                    {floor.snapshot.combatPower}
                  </p>
                  <strong>
                    {done
                      ? 'Concluído no treino local'
                      : available
                        ? 'Disponível para treino local'
                        : 'Bloqueado'}
                  </strong>
                  <p>{floor.strategy}</p>
                  <details>
                    <summary>Ver atributos e condições</summary>
                    <p>
                      Nível {floor.snapshot.level} · HP{' '}
                      {calculateMaxHp(floor.snapshot.attributes)} · Força{' '}
                      {floor.snapshot.attributes.strength} · Defesa{' '}
                      {floor.snapshot.attributes.defense} · Sabedoria{' '}
                      {floor.snapshot.attributes.wisdom}.
                    </p>
                    <p>
                      {floor.snapshot.equipment
                        .map((e) => e.name)
                        .join(' · ') || 'Sem equipamento.'}
                    </p>
                    <p>
                      Recompensa oficial: pendente de homologação e servidor;
                      nenhum valor previsto foi aprovado.
                    </p>
                  </details>
                  <button
                    disabled={
                      !available ||
                      busy ||
                      !!error ||
                      (!data.view.battle && !!deckError)
                    }
                    onClick={async () => {
                      setBusy(true);
                      try {
                        const cards = await collectionSource(
                          ownerId,
                          traveler.id,
                        );
                        await recoverTower(ownerId, traveler.id, cards);
                        const fresh = loadTower(ownerId, traveler.id, cards);
                        if (fresh.progress.wins.length !== i)
                          throw new Error(
                            'O andar mudou em outra aba. Atualize o mapa.',
                          );
                        if (
                          !fresh.battle &&
                          validateArenaDeck(fresh.selection, cards)
                        )
                          throw new Error(
                            'Escolha sete cartas válidas antes de entrar.',
                          );
                        setData({ view: fresh, cards });
                        setCombat(i);
                      } catch (e) {
                        setError(
                          e instanceof Error
                            ? e.message
                            : 'Checkpoint pendente.',
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {done
                      ? 'Andar concluído'
                      : available
                        ? data.view.battle
                          ? data.view.battle.status === 'finished'
                            ? 'Revisar resultado local'
                            : 'Retomar batalha'
                          : floor.boss
                            ? 'Enfrentar o campeão'
                            : 'Entrar no andar'
                        : 'Andar bloqueado'}
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      )}
      <p>
        <Link href="/journey/arena">Voltar à Arena comum</Link>
      </p>
    </section>
  );
}
export function TowerScreen() {
  const auth = useAuth();
  return (
    <Shell back="/journey/arena" backLabel="Voltar à Arena">
      <RequireTraveler>
        {(traveler) => (
          <TowerExperience
            key={`${auth.user?.id}:${traveler.id}`}
            ownerId={auth.user?.id ?? ''}
            traveler={traveler}
          />
        )}
      </RequireTraveler>
    </Shell>
  );
}
