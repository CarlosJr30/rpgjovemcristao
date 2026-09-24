export type Phase = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  biblicalReference: string;
  order: string;
  status: 'available' | 'locked';
  elements: readonly string[];
};
export type Act = {
  id: string;
  slug: string;
  title: string;
  numeral: string;
  order: number;
  status: 'available' | 'locked';
  phases: readonly Phase[];
};
export const GARDEN: Phase = {
  id: 'garden-choice',
  slug: 'o-jardim-e-a-escolha',
  title: 'O Jardim e a Escolha',
  subtitle: 'Uma jornada pelas origens, escolhas e consequências.',
  biblicalReference: 'Gênesis 2–3',
  order: '1.1',
  status: 'available',
  elements: [
    'História',
    'Exploração',
    'Missões',
    'Reflexão',
    'Quiz Bíblico',
    'Grande Desafio',
    'Descobertas',
  ],
};
export const CAMPAIGN: readonly Act[] = [
  {
    id: 'origins',
    slug: 'as-origens',
    title: 'As Origens',
    numeral: 'I',
    order: 1,
    status: 'available',
    phases: [GARDEN],
  },
  {
    id: 'patriarchs',
    slug: 'os-patriarcas',
    title: 'Os Patriarcas',
    numeral: 'II',
    order: 2,
    status: 'locked',
    phases: [],
  },
  {
    id: 'liberation',
    slug: 'libertacao',
    title: 'Libertação',
    numeral: 'III',
    order: 3,
    status: 'locked',
    phases: [],
  },
  {
    id: 'kings',
    slug: 'juizes-e-reis',
    title: 'Juízes e Reis',
    numeral: 'IV',
    order: 4,
    status: 'locked',
    phases: [],
  },
  {
    id: 'exile',
    slug: 'profetas-reinos-e-exilio',
    title: 'Profetas, Reinos e Exílio',
    numeral: 'V',
    order: 5,
    status: 'locked',
    phases: [],
  },
  {
    id: 'return',
    slug: 'retorno-e-restauracao',
    title: 'Retorno e Restauração',
    numeral: 'VI',
    order: 6,
    status: 'locked',
    phases: [],
  },
  {
    id: 'jesus',
    slug: 'jesus',
    title: 'Jesus',
    numeral: 'VII',
    order: 7,
    status: 'locked',
    phases: [],
  },
  {
    id: 'church',
    slug: 'a-igreja',
    title: 'A Igreja',
    numeral: 'VIII',
    order: 8,
    status: 'locked',
    phases: [],
  },
];
export const JOURNEY_ROUTES = {
  create: '/journey/create',
  intro: '/journey/intro',
  map: '/journey',
  origins: '/journey/acts/as-origens',
  garden: '/journey/phases/o-jardim-e-a-escolha',
  preview: '/journey/phases/o-jardim-e-a-escolha/preview',
  guild: '/journey/guild',
  diary: '/journey/diary',
  hero: '/journey/hero',
  equipment: '/journey/equipment',
  backpack: '/journey/backpack',
  shop: '/journey/shop',
  collection: '/journey/collection',
  arena: '/journey/arena',
} as const;
export const GUILD_CHALLENGE_LEGACY = {
  id: 'share-learning',
  title: 'Compartilhe um aprendizado',
  description:
    'Compartilhe com sua célula um aprendizado que você levou desta fase.',
  objective:
    'Confirmação objetiva da participação; não é avaliação espiritual.',
  xpRequired: 200,
} as const;

export const GARDEN_CONTENT = {
  opening:
    'Você chega a um jardim descrito no relato de Gênesis. O Viajante observa; não é Adão nem Eva, e não altera o acontecimento canônico.',
  context:
    'Gênesis 2–3 apresenta o jardim, a responsabilidade humana e uma escolha com consequências. Este texto é um enquadramento interpretativo do jogo; a referência é canônica.',
  reflection: 'Que sinais ajudam você a discernir uma escolha antes de agir?',
  discovery:
    'Fragmento do mapa: o Viajante aprendeu a reconhecer caminhos seguros.',
} as const;
export const GUILD_CHALLENGE = {
  id: 'share-learning',
  title: 'Compartilhe um aprendizado',
  description:
    'Compartilhe com sua célula um aprendizado que você levou desta fase.',
  objective:
    'Confirmação objetiva da participação; não é avaliação espiritual.',
  xpRequired: 200,
} as const;
