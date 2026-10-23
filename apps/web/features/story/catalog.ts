export const STORY_STEPS = [
  'explore',
  'reading',
  'activity',
  'quiz',
  'reflection',
  'video',
  'reward',
] as const;
export type StoryStep = (typeof STORY_STEPS)[number];
export const STEP_LABELS: Record<StoryStep, string> = {
  explore: 'Exploração',
  reading: 'Leitura bíblica',
  activity: 'Atividade ou minigame',
  quiz: 'Quiz bíblico',
  reflection: 'Reflexão',
  video: 'Vídeo educativo obrigatório',
  reward: 'Recompensa',
};
export type StoryVideo = {
  provider: 'youtube' | 'vimeo' | 'html5' | null;
  externalId: string | null;
  url: string | null;
  title: string;
  source: string | null;
  author: string | null;
  authorization: {
    status: 'pending' | 'approved';
    terms: string | null;
    evidence: string | null;
  };
  language: string;
  durationSeconds: number | null;
  availability: 'missing' | 'available' | 'unavailable';
  verification: 'provider-api' | 'browser-events' | 'none';
  captions: string | null;
  accessibleAlternative: string | null;
  embedding: 'pending' | 'allowed' | 'denied';
  editorialReview: { status:'pending'|'approved'; reference:string|null };
  captionUrl: string|null;
};
export type StoryReward = {
  key: string;
  xp: number;
  coins: number;
  chest: 'common' | 'rare' | 'epic' | null;
  achievementId: string | null;
  integration: 'pending-economic-review';
};
export type Story = {
  id: string;
  worldId: string;
  order: number;
  title: string;
  description: string;
  references: readonly string[];
  requiredSteps: readonly StoryStep[];
  content: 'prepared' | 'candidate' | 'legacy-adapter' | 'ready';
  minigameId: 'snake-chase' | null;
  legacyRoute: string | null;
  video: StoryVideo;
  reward: StoryReward | null;
};
export type World = {
  id: string;
  order: number;
  title: string;
  description: string;
  symbol: string;
  color: string;
  chronology: string;
  stories: readonly Story[];
  specialReward: StoryReward | null;
};
const missingVideo = (): StoryVideo => ({
  provider: null,
  externalId: null,
  url: null,
  title: 'Vídeo educativo em seleção',
  source: null,
  author: null,
  authorization: { status: 'pending', terms: null, evidence: null },
  language: 'pt-BR',
  durationSeconds: null,
  availability: 'missing',
  verification: 'none',
  captions: null,
  accessibleAlternative: null,
  embedding:'pending',
  editorialReview:{status:'pending',reference:null},
  captionUrl:null,
});
function originsStory(
  id: string,
  order: number,
  title: string,
  reference: string,
  description: string,
): Story {
  const garden = id === 'garden-choice';
  return {
    id,
    worldId: 'origins',
    order,
    title,
    description,
    references: [reference],
    requiredSteps: STORY_STEPS,
    content: garden ? 'legacy-adapter' : 'candidate',
    minigameId: garden ? 'snake-chase' : null,
    legacyRoute: garden ? '/journey/phases/o-jardim-e-a-escolha' : null,
    video: missingVideo(),
    reward: garden
      ? {
          key: 'phase:garden-choice',
          xp: 120,
          coins: 30,
          chest: 'common',
          achievementId: null,
          integration: 'pending-economic-review',
        }
      : null,
  };
}
export const ORIGIN_STORIES: readonly Story[] = [
  originsStory(
    'creation',
    1,
    'A Criação',
    'Gênesis 1–2',
    'O início da jornada pelo relato da criação.',
  ),
  originsStory(
    'garden-choice',
    2,
    'O Jardim do Éden e a Queda',
    'Gênesis 3',
    'Escolhas e consequências; reaproveita O Jardim e a Escolha.',
  ),
  originsStory(
    'cain-abel',
    3,
    'Caim e Abel',
    'Gênesis 4',
    'Ira, responsabilidade e misericórdia em uma prévia educativa.',
  ),
  originsStory(
    'noah-ark',
    4,
    'A Arca de Noé',
    'Gênesis 6–9',
    'A narrativa de Noé e da arca.',
  ),
  originsStory(
    'babel',
    5,
    'A Torre de Babel',
    'Gênesis 11:1–9',
    'O relato da torre e da dispersão.',
  ),
];
export const WORLDS: readonly World[] = [
  {
    id: 'origins',
    order: 1,
    title: 'As Origens',
    description: 'Criação, Jardim, Caim e Abel, Noé e Babel.',
    symbol: '✧',
    color: '#c4d59a',
    chronology:
      'Gênesis 2 também contextualiza o Jardim; o fluxo legado mantém Gênesis 2–3.',
    stories: ORIGIN_STORIES,
    specialReward: null,
  },
  {
    id: 'patriarchs',
    order: 2,
    title: 'Os Patriarcas',
    description: 'Abraão, Isaque, Jacó e José.',
    symbol: '⌂',
    color: '#e0bd85',
    chronology: 'Agrupamento didático de Gênesis 12–50.',
    stories: [],
    specialReward: null,
  },
  {
    id: 'liberation',
    order: 3,
    title: 'Libertação',
    description: 'Moisés, Egito, Êxodo e deserto.',
    symbol: '≈',
    color: '#8ac9d3',
    chronology: 'O agrupamento inclui narrativas e instruções do Pentateuco.',
    stories: [],
    specialReward: null,
  },
  {
    id: 'promised-land',
    order: 4,
    title: 'Terra Prometida',
    description: 'Josué, Jericó, Juízes, Gideão e Sansão.',
    symbol: '△',
    color: '#b4d4af',
    chronology:
      'Os ciclos de Juízes não pressupõem uma sequência nacional simples.',
    stories: [],
    specialReward: null,
  },
  {
    id: 'kings',
    order: 5,
    title: 'Reis e Profetas',
    description: 'Samuel, Saul, Davi, Salomão, Elias e profetas.',
    symbol: '♔',
    color: '#e3cb7e',
    chronology: 'Reinos, Crônicas e ministérios proféticos se sobrepõem.',
    stories: [],
    specialReward: null,
  },
  {
    id: 'return',
    order: 6,
    title: 'Exílio e Retorno',
    description: 'Daniel, Ester, Esdras e Neemias.',
    symbol: '▥',
    color: '#b8b0de',
    chronology:
      'Ester se situa no período persa; exílio e retorno abrangem comunidades e momentos distintos.',
    stories: [],
    specialReward: null,
  },
  {
    id: 'jesus',
    order: 7,
    title: 'Vida de Jesus',
    description: 'Nascimento, ministério, cruz e ressurreição.',
    symbol: '✦',
    color: '#ecc6a5',
    chronology:
      'Os quatro Evangelhos narram acontecimentos paralelos, com organização própria.',
    stories: [],
    specialReward: null,
  },
  {
    id: 'church',
    order: 8,
    title: 'Igreja Primitiva',
    description: 'Pentecostes, Pedro, Paulo e viagens missionárias.',
    symbol: '⌘',
    color: '#91c3b9',
    chronology: 'Atos e várias cartas apostólicas se sobrepõem.',
    stories: [],
    specialReward: null,
  },
  {
    id: 'new-creation',
    order: 9,
    title: 'Apocalipse e Nova Criação',
    description: 'Cartas, visões de João, esperança e nova criação.',
    symbol: '☼',
    color: '#c8b4e6',
    chronology:
      'Cartas apostólicas também pertencem ao contexto da Igreja Primitiva. A ordem didática não fixa uma cronologia das visões nem consenso escatológico.',
    stories: [],
    specialReward: null,
  },
];
export const ALL_STORIES = WORLDS.flatMap((world) => world.stories);
export const findStory = (id: string) =>
  ALL_STORIES.find((story) => story.id === id);
export const storyRoute = (id: string) =>
  `/journey/stories/${encodeURIComponent(id)}`;
export const worldRoute = (id: string) =>
  `/journey/worlds/${encodeURIComponent(id)}`;
