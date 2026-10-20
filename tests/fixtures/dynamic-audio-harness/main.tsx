import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { gameAudio } from '../../../apps/web/features/journey/audio/audio-manager';
import { useGameAudio } from '../../../apps/web/features/journey/hooks/use-game-audio';
import { AudioSettings } from '../../../apps/web/features/journey/components/audio-settings';
import { StoryVideoPanel } from '../../../apps/web/features/story/video-panel';
import {
  findStory,
  type StoryVideo,
} from '../../../apps/web/features/story/catalog';
import { CHEST_RARITY_SOUNDS } from '../../../apps/web/features/journey/audio/audio-catalog';
import './style.css';
const media: {
  src: string;
  volume: number;
  loop: boolean;
  currentTime: number;
  preload: HTMLAudioElement['preload'];
  paused: boolean;
  plays: number;
  play: () => Promise<void>;
  pause: () => void;
}[] = [];
const fixtureAsset = (name: string) => ({
  src: `/assets/audio/fixture-dynamic-${name}.ogg`,
  license: 'Synthetic FakeMedia fixture only; no media file or approval',
});
// Test-only DI on the actual singleton. No Audio element/file/download exists.
Object.assign(gameAudio, {
  catalog: {
    music: Object.fromEntries(
      ['journey', 'arena', 'tower', 'boss', 'guild'].map((c) => [
        c,
        fixtureAsset(c),
      ]),
    ),
    effects: Object.fromEntries(
      Object.values(CHEST_RARITY_SOUNDS).map((c) => [c, fixtureAsset(c)]),
    ),
  },
  createMedia: (src: string) => {
    const m = {
      src,
      volume: 0,
      loop: false,
      currentTime: 0,
      preload: 'none' as HTMLAudioElement['preload'],
      paused: true,
      plays: 0,
      play: async () => {
        m.paused = false;
        m.plays++;
      },
      pause: () => {
        m.paused = true;
      },
    };
    media.push(m);
    return m;
  },
});
const video: StoryVideo = {
  ...findStory('garden-choice')!.video,
  provider: 'youtube',
  externalId: 'abcdefghijk',
  availability: 'available',
  verification: 'provider-api',
  source: 'Synthetic test only',
  author: 'Synthetic test only',
  authorization: {
    status: 'approved',
    terms: 'TEST fixture; not media approval',
    evidence: 'fixture',
  },
  durationSeconds: 75,
  captions: 'fixture',
  accessibleAlternative: 'fixture',
};
let releaseScene: (() => void) | undefined;
function Harness() {
  const prefs = useGameAudio('/journey/arena');
  const [settings, setSettings] = useState(false);
  const [snapshot, setSnapshot] = useState('[]');
  useEffect(() => {
    const t = setInterval(
      () =>
        setSnapshot(
          JSON.stringify(
            media.map(({ src, volume, loop, paused, plays }) => ({
              src,
              volume,
              loop,
              paused,
              plays,
            })),
          ),
        ),
      100,
    );
    return () => {
      clearInterval(t);
      releaseScene?.();
      gameAudio.dispose();
    };
  }, []);
  return (
    <main>
      <h1>Ensaio isolado de áudio dinâmico</h1>
      <p>
        FakeMedia registra eventos do AudioManager real. Nenhum som, arquivo
        musical, licença ou recompensa é criado.
      </p>
      <button
        onClick={() => {
          gameAudio.unlock();
          gameAudio.updatePreferences({ music: true, effects: true });
        }}
      >
        Ativar ensaio
      </button>
      <button onClick={() => setSettings(true)}>Configurar áudio</button>
      <button
        onClick={() => {
          const previous = releaseScene;
          releaseScene = gameAudio.scene('tower', 0.7);
          previous?.();
        }}
      >
        Torre inicial
      </button>
      <button
        onClick={() => {
          const previous = releaseScene;
          releaseScene = gameAudio.scene('tower', 0.95);
          previous?.();
        }}
      >
        Torre superior
      </button>
      <button
        onClick={() => {
          const previous = releaseScene;
          releaseScene = gameAudio.scene('boss');
          previous?.();
        }}
      >
        Campeão
      </button>
      <button
        onClick={() => {
          releaseScene?.();
          releaseScene = undefined;
          gameAudio.setContext('guild');
        }}
      >
        Estudo
      </button>
      <button onClick={() => gameAudio.setSaveData(true)}>
        Economia de dados
      </button>
      <button onClick={() => gameAudio.setSaveData(false)}>
        Liberar dados
      </button>
      <button onClick={() => gameAudio.suspend()}>Simular aba oculta</button>
      <button onClick={() => gameAudio.resume()}>Retomar aba</button>
      {Object.entries(CHEST_RARITY_SOUNDS).map(([rarity, sound]) => (
        <button key={rarity} onClick={() => gameAudio.playEffect(sound)}>
          Prêmio {rarity}
        </button>
      ))}
      <StoryVideoPanel video={video} completed={false} />
      <pre data-testid="audio-snapshot">{snapshot}</pre>
      {settings && (
        <AudioSettings preferences={prefs} onClose={() => setSettings(false)} />
      )}
    </main>
  );
}
createRoot(document.getElementById('root')!).render(<Harness />);
