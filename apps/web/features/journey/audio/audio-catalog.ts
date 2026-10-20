import type { MusicContext, SoundEffect } from './audio-assets';
export const AUDIO_WORLD_IDS = [
  'origins',
  'patriarchs',
  'liberation',
  'promised-land',
  'kings',
  'return',
  'jesus',
  'church',
  'new-creation',
] as const;
type Rights = Readonly<{
  source: string;
  author: string;
  license: string;
  permissions: string;
  reviewedBy: string;
  evidence: string;
  sha256: string;
}>;
export type TrackSlot = Readonly<
  {
    id: string;
    name: string;
    context: MusicContext;
    durationSeconds: number | null;
    loop: boolean;
    defaultVolume: number;
    version: 1;
  } & (
    | { approval: 'pending'; path: null; rights: null }
    | { approval: 'approved'; path: string; rights: Rights }
  )
>;
const pending = (
  context: MusicContext,
  name: string,
  volume = 0.6,
  loop = true,
): TrackSlot => ({
  id: `music:${context}`,
  name,
  context,
  durationSeconds: null,
  loop,
  defaultVolume: volume,
  version: 1,
  approval: 'pending',
  path: null,
  rights: null,
});
/** Planning metadata, never a second playback or approval catalog. Files only
 * enter playback through the existing audited APPROVED_MUSIC/EFFECTS pipeline. */
export const MUSIC_SLOTS: readonly TrackSlot[] = [
  pending('menu', 'Menu Principal'),
  pending('garden', 'Jardim do Éden', 0.45),
  pending('exploration', 'Exploração Bíblica'),
  pending('snake', 'Fuga da Serpente', 0.65),
  pending('arena', 'Arena de Treinamento', 0.7),
  pending('tower', 'Torre dos 7 Desafios', 0.7),
  pending('boss', 'Batalha contra Chefões', 0.7),
  pending('devotional', 'Oração e Reflexão', 0.25),
  pending('reward', 'Vitória e Recompensas', 0.5, false),
  pending('guild', 'Guilda', 0.3),
  pending('ebd', 'Escola Bíblica Dominical', 0.25),
  ...AUDIO_WORLD_IDS.map((id) => pending(`world:${id}`, `Mundo: ${id}`)),
];
export const MUSIC_REFERENCES = [
  {
    name: 'Forged for the Journey',
    direction: 'Aventura leve; candidato a ambiente descontraído',
    approval: 'pending',
    path: null,
  },
  {
    name: 'Banners of the Dawn',
    direction: 'Abertura épica com vocal; não usar em loop de combate',
    approval: 'pending',
    path: null,
  },
  {
    name: 'Courage of the Young Hero',
    direction: 'Arena instrumental; duração desejada75s, não aferida',
    approval: 'pending',
    path: null,
  },
] as const;
export const QUIET_CONTEXTS: ReadonlySet<MusicContext> = new Set([
  'devotional',
  'quiz',
  'guild',
  'ebd',
]);
export const CHEST_RARITY_SOUNDS: Readonly<
  Record<'comum' | 'incomum' | 'raro' | 'épico' | 'lendário', SoundEffect>
> = {
  comum: 'chest_common',
  incomum: 'chest_uncommon',
  raro: 'chest_rare',
  épico: 'chest_epic',
  lendário: 'chest_extraordinary',
};
export function contextLoop(context: MusicContext) {
  return context !== 'reward';
}
