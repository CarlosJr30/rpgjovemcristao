export type ArenaCardIllustration = Readonly<{
  src: string;
  alt: string;
}>;

export const ARENA_CARD_ILLUSTRATIONS: Readonly<
  Record<string, ArenaCardIllustration>
> = Object.freeze({
  'arena-card-basic-attack': {
    src: '/assets/cards/arena/arena-card-basic-attack.webp',
    alt: 'Viajante executando um golpe de espada contra alvo de treino.',
  },
  'arena-card-basic-defense': {
    src: '/assets/cards/arena/arena-card-basic-defense.webp',
    alt: 'Viajante bloqueando um golpe de treino com o escudo.',
  },
  'arena-card-path-strike': {
    src: '/assets/cards/arena/arena-card-path-strike.webp',
    alt: 'Viajante avançando para golpear um alvo de treino.',
  },
  'arena-card-steadfast-guard': {
    src: '/assets/cards/arena/arena-card-steadfast-guard.webp',
    alt: 'Viajante mantendo guarda firme com o escudo.',
  },
  'arena-card-discernment': {
    src: '/assets/cards/arena/arena-card-discernment.webp',
    alt: 'Viajante estudando um pergaminho sem escrita.',
  },
  'arena-card-pilgrim-step': {
    src: '/assets/cards/arena/arena-card-pilgrim-step.webp',
    alt: 'Viajante caminhando por uma estrada antiga.',
  },
  'arena-card-measured-strike': {
    src: '/assets/cards/arena/arena-card-measured-strike.webp',
    alt: 'Viajante executando um golpe preciso contra alvo de madeira.',
  },
});

export function arenaCardIllustration(
  id: string,
): ArenaCardIllustration | null {
  return ARENA_CARD_ILLUSTRATIONS[id] ?? null;
}
