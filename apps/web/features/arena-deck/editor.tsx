'use client';
import { useState } from 'react';
import {
  arenaCardDescription,
  arenaCardAvailability,
  describeArenaAction,
  validateArenaDeck,
  type ArenaCard,
  type BattleState,
} from '@rpg/game-engine';
import css from '../guild-missions/panel.module.css';
import cardsCss from './cards.module.css';
export function DeckEditor({
  cards,
  initial,
  locked,
  busy,
  onSave,
  showTitle = true,
  saveMessage = 'Baralho salvo neste navegador.',
}: {
  cards: readonly ArenaCard[];
  initial: readonly string[];
  locked: boolean;
  busy: boolean;
  onSave: (ids: readonly string[]) => Promise<void>;
  showTitle?: boolean;
  saveMessage?: string;
}) {
  const [ids, setIds] = useState([...initial]);
  const [rarity, setRarity] = useState('');
  const [kind, setKind] = useState('');
  const [message, setMessage] = useState('');
  const select = (id: string) => {
    setMessage('');
    setIds((old) =>
      old.includes(id)
        ? old.filter((x) => x !== id)
        : old.length < 7
          ? [...old, id]
          : old,
    );
  };
  return (
    <section className={css.panel} aria-label="Montagem do baralho">
      {showTitle && <h2>Meu Baralho — Arena</h2>}
      <p>
        Cartas adquiridas: {cards.length}. Escolha sete cartas diferentes da sua
        coleção. Cada carta terá um uso por batalha e continuará na coleção.
      </p>
      <p role="status">
        <strong>Cartas selecionadas: {ids.length}/7</strong>
      </p>
      {locked && (
        <p className={css.notice}>
          Baralho bloqueado durante a batalha em andamento.
        </p>
      )}
      {cards.filter((c) => c.action).length < 7 && (
        <p className={css.notice}>
          Você precisa de sete cartas de combate válidas para iniciar. A coleção
          de combate aguarda catálogo e aquisição autorizados; nenhuma carta
          será concedida automaticamente.
        </p>
      )}
      <ol aria-label="Sete posições do baralho">
        {Array.from({ length: 7 }, (_, i) => {
          const id = ids[i];
          return (
            <li key={i}>
              {id
                ? (cards.find((c) => c.id === id)?.name ?? 'Carta indisponível')
                : 'Posição vazia'}{' '}
              {id && (
                <button
                  disabled={locked || busy}
                  onClick={() => select(id)}
                  aria-label={`Remover carta ${i + 1}`}
                >
                  Remover
                </button>
              )}
            </li>
          );
        })}
      </ol>
      <div className={css.form}>
        <label>
          Filtrar por raridade
          <select
            aria-label="Filtrar por raridade"
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
          >
            <option value="">Todas</option>
            {[...new Set(cards.map((c) => c.rarity))].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          Filtrar por tipo
          <select
            aria-label="Filtrar por tipo"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="OFFENSIVE">Ofensiva</option>
            <option value="DEFENSIVE">Defensiva</option>
            <option value="TACTICAL">Tática</option>
          </select>
        </label>
      </div>
      <div className={css.grid}>
        {cards
          .filter(
            (c) =>
              (!rarity || c.rarity === rarity) && (!kind || c.type === kind),
          )
          .map((c) => {
            const detail = describeArenaAction(c.action);
            return (
              <article
                className={css.card}
                key={c.id}
                aria-label={`Carta: ${c.name}`}
              >
                <h3>{c.name}</h3>
                <p>
                  {c.rarity} ·{' '}
                  {c.type === 'OFFENSIVE'
                    ? 'Ofensiva'
                    : c.type === 'DEFENSIVE'
                      ? 'Defensiva'
                      : 'Tática'}
                </p>
                <p>{arenaCardDescription(c)}</p>
                <p>
                  <strong>{detail.headline}</strong>
                </p>
                <p>Duração: {detail.duration}</p>
                <p>Condição: {detail.condition}</p>
                <p>
                  Custo base: {detail.focusCost} Foco · Nível mínimo:{' '}
                  {detail.minimumLevel}. O custo na batalha considera
                  modificadores do snapshot.
                </p>
                <p>
                  {ids.includes(c.id)
                    ? 'NO BARALHO'
                    : c.action
                      ? 'Disponível'
                      : 'Efeito indisponível'}
                </p>
                <button
                  disabled={
                    locked ||
                    busy ||
                    !c.action ||
                    (!ids.includes(c.id) && ids.length >= 7)
                  }
                  onClick={() => select(c.id)}
                >
                  {ids.includes(c.id)
                    ? 'Retirar do baralho'
                    : 'Selecionar carta'}
                </button>
              </article>
            );
          })}
      </div>
      <button
        disabled={busy || locked || !!validateArenaDeck(ids, cards)}
        onClick={async () => {
          try {
            await onSave(ids);
            setMessage(saveMessage);
          } catch (e) {
            setMessage(
              e instanceof Error ? e.message : 'Não foi possível salvar.',
            );
          }
        }}
      >
        Salvar baralho
      </button>
      {message && (
        <p role="status" className={css.notice}>
          {message}
        </p>
      )}
    </section>
  );
}
export function BattleCards({
  battle,
  busy,
  onPlay,
  panelId,
}: {
  battle: BattleState;
  busy: boolean;
  onPlay: (id: string) => void;
  panelId?: string;
}) {
  return (
    <section
      id={panelId}
      className={`${css.panel} ${cardsCss.battlePanel}`}
      aria-label="Cartas desta batalha"
    >
      <h3>Seu baralho nesta batalha</h3>
      <p>
        Usadas: {battle.deck?.usedIds.length ?? 0}/7. Cada carta tem um uso.
        Atacar e Defender não consomem cartas; especiais passam pelo baralho.
      </p>
      <div className={css.grid}>
        {battle.deck?.cards.map((c) => {
          const availability = arenaCardAvailability(battle, c.id);
          const description = describeArenaAction(c.action, battle.player);
          const { status, focusCost, minimumLevel, missingFocus } =
            availability;
          const reason =
            status === 'used'
              ? 'Esta carta já foi utilizada nesta batalha.'
              : status === 'finished'
                ? 'Esta batalha foi encerrada.'
                : status === 'level'
                  ? `Carta disponível após atingir o nível ${minimumLevel}.`
                  : status === 'focus'
                    ? `Você precisa de mais ${missingFocus} ${missingFocus === 1 ? 'ponto' : 'pontos'} de Foco.`
                    : status === 'unavailable'
                      ? 'Efeito indisponível.'
                      : busy
                        ? 'Aguarde a confirmação da rodada.'
                        : '';
          return (
            <article
              key={c.id}
              className={css.card}
              aria-label={`Carta: ${c.name}`}
            >
              <h4>{c.name}</h4>
              <p>
                {c.rarity} ·{' '}
                {c.type === 'OFFENSIVE'
                  ? 'Ofensiva'
                  : c.type === 'DEFENSIVE'
                    ? 'Defensiva'
                    : 'Tática'}
              </p>
              <strong>{description.headline}</strong>
              <details>
                <summary>Como funciona esta carta</summary>
                <p>{description.explanation}</p>
                <p>
                  Condição: {description.condition} Nível e Foco suficientes.
                </p>
              </details>
              <p>Duração: {description.duration}</p>
              <p>
                Custo: {focusCost} Foco · Nível mínimo: {minimumLevel}
              </p>
              <p>
                Usos disponíveis nesta batalha:{' '}
                {status === 'used' || battle.status !== 'in_progress' ? 0 : 1}.
              </p>
              <b>
                {status === 'used'
                  ? 'USADA'
                  : status === 'available' && !busy
                    ? 'Disponível'
                    : 'Indisponível'}
              </b>
              {reason && <p>{reason}</p>}
              <p>
                <button
                  disabled={busy || status !== 'available'}
                  onClick={() => onPlay(c.id)}
                  aria-label={`Usar carta ${c.name}`}
                >
                  Usar carta
                </button>
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
