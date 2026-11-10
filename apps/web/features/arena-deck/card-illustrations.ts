const CONTENT_040_CARD_ART: readonly (readonly [string, string, string])[] = [
  [
    'arena-card-traveler-charge',
    'Investida do Viajante',
    'attack/arena-card-traveler-charge',
  ],
  ['arena-card-precise-cut', 'Corte Preciso', 'attack/arena-card-precise-cut'],
  [
    'arena-card-brave-advance',
    'Avanço Corajoso',
    'attack/arena-card-brave-advance',
  ],
  [
    'arena-card-perseverance-blow',
    'Golpe da Perseverança',
    'attack/arena-card-perseverance-blow',
  ],
  [
    'arena-card-double-charge',
    'Investida Dupla',
    'attack/arena-card-double-charge',
  ],
  [
    'arena-card-guard-break',
    'Ruptura de Guarda',
    'attack/arena-card-guard-break',
  ],
  [
    'arena-card-decisive-blow',
    'Golpe Decisivo',
    'attack/arena-card-decisive-blow',
  ],
  [
    'arena-card-guardian-cut',
    'Corte do Guardião',
    'attack/arena-card-guardian-cut',
  ],
  [
    'arena-card-last-resistance',
    'Última Resistência',
    'attack/arena-card-last-resistance',
  ],
  ['arena-card-firm-block', 'Bloqueio Firme', 'defense/arena-card-firm-block'],
  [
    'arena-card-prudent-posture',
    'Postura Prudente',
    'defense/arena-card-prudent-posture',
  ],
  [
    'arena-card-traveler-wall',
    'Muralha do Viajante',
    'defense/arena-card-traveler-wall',
  ],
  [
    'arena-card-reinforced-guard',
    'Guarda Reforçada',
    'defense/arena-card-reinforced-guard',
  ],
  [
    'arena-card-strategic-defense',
    'Defesa Estratégica',
    'defense/arena-card-strategic-defense',
  ],
  [
    'arena-card-safe-shelter',
    'Abrigo Seguro',
    'defense/arena-card-safe-shelter',
  ],
  [
    'arena-card-courage-bastion',
    'Bastião da Coragem',
    'defense/arena-card-courage-bastion',
  ],
  [
    'arena-card-persevering-fortress',
    'Fortaleza Perseverante',
    'defense/arena-card-persevering-fortress',
  ],
  [
    'arena-card-breathe-observe',
    'Respirar e Observar',
    'strategy/arena-card-breathe-observe',
  ],
  ['arena-card-side-step', 'Passo Lateral', 'strategy/arena-card-side-step'],
  [
    'arena-card-opponent-reading',
    'Leitura do Adversário',
    'strategy/arena-card-opponent-reading',
  ],
  [
    'arena-card-careful-preparation',
    'Preparação Cuidadosa',
    'strategy/arena-card-careful-preparation',
  ],
  [
    'arena-card-reposition',
    'Reposicionamento',
    'strategy/arena-card-reposition',
  ],
  [
    'arena-card-tactical-planning',
    'Planejamento Tático',
    'strategy/arena-card-tactical-planning',
  ],
  [
    'arena-card-constant-watch',
    'Vigilância Constante',
    'strategy/arena-card-constant-watch',
  ],
  [
    'arena-card-master-strategy',
    'Estratégia do Mestre',
    'strategy/arena-card-master-strategy',
  ],
  [
    'arena-card-regather-strength',
    'Recompor Forças',
    'support/arena-card-regather-strength',
  ],
  [
    'arena-card-renewed-courage',
    'Coragem Renovada',
    'support/arena-card-renewed-courage',
  ],
  [
    'arena-card-prudent-recovery',
    'Recuperação Prudente',
    'support/arena-card-prudent-recovery',
  ],
  [
    'arena-card-persevering-spirit',
    'Ânimo Perseverante',
    'support/arena-card-persevering-spirit',
  ],
  [
    'arena-card-second-wind',
    'Segundo Fôlego',
    'support/arena-card-second-wind',
  ],
  [
    'arena-card-heroic-endurance',
    'Resistência Heroica',
    'support/arena-card-heroic-endurance',
  ],
  [
    'arena-card-unwavering-resolve',
    'Determinação Inabalável',
    'support/arena-card-unwavering-resolve',
  ],
  [
    'arena-card-firm-until-end',
    'Firme Até o Fim',
    'support/arena-card-firm-until-end',
  ],
];

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
  ...Object.fromEntries(
    CONTENT_040_CARD_ART.map(([id, name, path]) => [
      id,
      {
        src: `/assets/cards/arena/content-040/${path}.webp`,
        alt: `Ilustração aprovada da carta ${name}.`,
      },
    ]),
  ),
});

export function arenaCardIllustration(
  id: string,
): ArenaCardIllustration | null {
  return ARENA_CARD_ILLUSTRATIONS[id] ?? null;
}
