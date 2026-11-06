'use client';
import { useEffect, useRef, useState } from 'react';
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
import { arenaCardIllustration } from './card-illustrations';
// Registered equipment icons are action symbols, not approved card illustrations.
const symbolFor = (card: ArenaCard) =>
  card.type === 'OFFENSIVE'
    ? '/assets/equipment/weapon/traveler_sword_rare_icon.png'
    : card.type === 'DEFENSIVE'
      ? '/assets/equipment/shield/traveler_shield_rare_icon.png'
      : '/assets/equipment/amulet/amulet_of_the_path_icon.png';
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
    <section
      className={`${css.panel} ${cardsCss.collection}`}
      aria-label="Montagem do baralho"
    >
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
          Você precisa de sete cartas de combate válidas para iniciar. Sua
          coleção ainda não possui sete cartas homologadas. Nenhuma carta será
          concedida automaticamente ao acessar esta tela.
        </p>
      )}
      <ol className={cardsCss.slots} aria-label="Sete posições do baralho">
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
      <div className={cardsCss.collectionGrid}>
        {cards
          .filter(
            (c) =>
              (!rarity || c.rarity === rarity) && (!kind || c.type === kind),
          )
          .map((c) => {
            const detail = describeArenaAction(c.action);
            const illustration = arenaCardIllustration(c.id);
            return (
              <article
                className={cardsCss.card}
                key={c.id}
                aria-label={`Carta: ${c.name}`}
                data-rarity={c.rarity}
                data-kind={c.type}
                data-selected={ids.includes(c.id)}
                data-art-status={illustration ? 'approved' : 'pending'}
              >
                <span className={cardsCss.focusBadge}>
                  {detail.focusCost}
                  <small>FOCO</small>
                </span>
                <figure
                  className={`${cardsCss.artSlot} ${illustration ? cardsCss.illustratedArt : ''}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- arte local versionada, sem otimização remota */}
                  <img
                    src={illustration?.src ?? symbolFor(c)}
                    alt={illustration?.alt ?? ''}
                  />
                  {!illustration && <figcaption>Símbolo de ação</figcaption>}
                </figure>
                <h3>{c.name}</h3>
                <p>
                  {c.rarity} ·{' '}
                  {c.type === 'OFFENSIVE'
                    ? 'Ofensiva'
                    : c.type === 'DEFENSIVE'
                      ? 'Defensiva'
                      : 'Tática'}
                </p>
                <p>
                  <strong>{detail.headline}</strong>
                </p>
                <details>
                  <summary>Regras e duração</summary>
                  <p>{arenaCardDescription(c)}</p>
                  <p>{detail.explanation}</p>
                  <p>Duração: {detail.duration}</p>
                  <p>Condição: {detail.condition}</p>
                </details>
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
  onClose,
  compact = false,
  onSelect,
}: {
  battle: BattleState;
  busy: boolean;
  onPlay: (id: string) => void;
  panelId?: string;
  onClose?: () => void;
  compact?: boolean;
  onSelect?: (id: string) => void;
}) {
  const hand = useRef<HTMLDivElement>(null);
  const [handEdges, setHandEdges] = useState({ start: true, end: true });

  useEffect(() => {
    if (!compact) return;
    const element = hand.current;
    if (!element) return;
    const updateEdges = () => {
      const next = {
        start: element.scrollLeft <= 1,
        end:
          element.scrollLeft + element.clientWidth >= element.scrollWidth - 2,
      };
      setHandEdges((current) =>
        current.start === next.start && current.end === next.end
          ? current
          : next,
      );
    };
    updateEdges();
    element.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);
    return () => {
      element.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
    };
  }, [compact, battle.deck?.cards.length]);

  const moveHand = (direction: -1 | 1) => {
    const element = hand.current;
    if (!element) return;
    element.scrollBy({
      left: direction * element.clientWidth,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  };

  return (
    <section
      id={panelId}
      className={`${css.panel} ${cardsCss.battlePanel}`}
      aria-label="Cartas desta batalha"
      tabIndex={-1}
    >
      <h3>{compact ? 'Escolha uma carta' : 'Seu baralho nesta batalha'}</h3>
      {onClose && <button onClick={onClose}>Fechar cartas</button>}
      {!compact && (
        <p>
          Usadas: {battle.deck?.usedIds.length ?? 0}/7. Cada carta tem um uso.
          Atacar e Defender não consomem cartas; especiais passam pelo baralho.
        </p>
      )}
      {!battle.deck?.cards.length && (
        <p role="status">
          Este combate não possui um baralho válido. Acesse{' '}
          <a href="/journey/arena/deck">Meu Baralho</a>, solicite e confirme o
          pacote inicial se necessário e selecione/salve sete cartas próprias.
        </p>
      )}
      {compact && (
        <nav
          className={cardsCss.compactNavigation}
          aria-label="Navegação das cartas"
        >
          <button
            type="button"
            aria-label="Mostrar cartas anteriores"
            disabled={handEdges.start}
            onClick={() => moveHand(-1)}
          >
            <span aria-hidden="true">←</span> Anteriores
          </button>
          <button
            type="button"
            aria-label="Mostrar próximas cartas"
            disabled={handEdges.end}
            onClick={() => moveHand(1)}
          >
            Próximas <span aria-hidden="true">→</span>
          </button>
        </nav>
      )}
      <div
        ref={hand}
        className={`${cardsCss.hand} ${compact ? cardsCss.compactHand : ''}`}
        aria-label="Mão de sete cartas"
        role={compact ? 'group' : undefined}
        tabIndex={compact ? 0 : undefined}
      >
        {battle.deck?.cards.map((c) => {
          const availability = arenaCardAvailability(battle, c.id);
          const description = describeArenaAction(c.action, battle.player);
          const illustration = arenaCardIllustration(c.id);
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
              className={`${cardsCss.card} ${compact ? cardsCss.compactCard : ''}`}
              aria-label={`Carta: ${c.name}`}
              data-rarity={c.rarity}
              data-kind={c.type}
              data-used={status === 'used'}
              data-art-status={illustration ? 'approved' : 'pending'}
              data-compact={compact || undefined}
            >
              <span className={cardsCss.focusBadge}>
                {focusCost}
                <small>FOCO</small>
              </span>
              <figure
                className={`${cardsCss.artSlot} ${illustration ? cardsCss.illustratedArt : ''}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- arte local versionada, sem otimização remota */}
                <img
                  src={illustration?.src ?? symbolFor(c)}
                  alt={illustration?.alt ?? ''}
                />
                {!illustration && <figcaption>Símbolo de ação</figcaption>}
              </figure>
              <h4>{c.name}</h4>
              {compact ? (
                <>
                  <p>
                    {c.rarity} ·{' '}
                    {c.type === 'OFFENSIVE'
                      ? 'Ofensiva'
                      : c.type === 'DEFENSIVE'
                        ? 'Defensiva'
                        : 'Tática'}
                  </p>
                  <strong>{description.headline}</strong>
                  <p>
                    Custo: {focusCost} Foco · Nível mínimo: {minimumLevel}
                  </p>
                </>
              ) : (
                <>
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
                      Condição: {description.condition} Nível e Foco
                      suficientes.
                    </p>
                    <p>Duração: {description.duration}</p>
                  </details>
                  <p>
                    Custo: {focusCost} Foco · Nível mínimo: {minimumLevel}
                  </p>
                  <p>
                    Usos disponíveis nesta batalha:{' '}
                    {status === 'used' || battle.status !== 'in_progress'
                      ? 0
                      : 1}
                    .
                  </p>
                </>
              )}
              <b>
                {status === 'used'
                  ? 'USADA'
                  : status === 'available' && !busy
                    ? 'Disponível'
                    : 'Indisponível'}
              </b>
              {compact && reason && (
                <p className={cardsCss.compactReason}>{reason}</p>
              )}
              {!compact && reason && <p>{reason}</p>}
              <p>
                <button
                  disabled={busy || status !== 'available'}
                  id={compact ? `${panelId}-option-${c.id}` : undefined}
                  onClick={() => (onSelect ? onSelect(c.id) : onPlay(c.id))}
                  aria-label={`${compact ? 'Selecionar' : 'Usar'} carta ${c.name}`}
                >
                  {compact ? 'Selecionar' : 'Usar carta'}
                </button>
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
