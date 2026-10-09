'use client';
import { useEffect, useRef } from 'react';
import { gameAudio, type AudioPreferences } from '../audio/audio-manager';
import { MUSIC_ASSETS, SOUND_ASSETS } from '../audio/audio-assets';
import styles from '../journey.module.css';

export function AudioSettings({
  preferences,
  onClose,
}: {
  preferences: AudioPreferences;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key !== 'Tab') return;
      const targets = Array.from(
        panel.current?.querySelectorAll<HTMLElement>('button, input') ?? [],
      );
      const first = targets[0],
        last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => {
      document.removeEventListener('keydown', keyboard);
      if (before?.isConnected) before.focus();
    };
  }, [onClose]);
  return (
    <div
      className={styles.audioBackdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        className={styles.audioSettings}
        role="dialog"
        aria-modal="true"
        aria-labelledby="audio-title"
      >
        <header>
          <div>
            <p className={styles.eyebrow}>SONS DA JORNADA</p>
            <h2 id="audio-title">Áudio</h2>
          </div>
          <button onClick={onClose} aria-label="Fechar configurações de áudio">
            ×
          </button>
        </header>
        <label>
          <span>Silenciar tudo</span>
          <input
            type="checkbox"
            checked={preferences.muted}
            onChange={(event) =>
              gameAudio.updatePreferences({ muted: event.target.checked })
            }
          />
        </label>
        <label>
          <span>Música</span>
          <input
            type="checkbox"
            checked={preferences.music}
            onChange={(event) =>
              gameAudio.updatePreferences({ music: event.target.checked })
            }
          />
        </label>
        <label className={styles.audioVolume}>
          <span>
            Volume música{' '}
            <output>{Math.round(preferences.musicVolume * 100)}%</output>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            aria-label="Volume música"
            value={preferences.musicVolume * 100}
            onChange={(event) =>
              gameAudio.updatePreferences({
                musicVolume: Number(event.target.value) / 100,
              })
            }
          />
        </label>
        <label>
          <span>Efeitos</span>
          <input
            type="checkbox"
            checked={preferences.effects}
            onChange={(event) =>
              gameAudio.updatePreferences({ effects: event.target.checked })
            }
          />
        </label>
        <label className={styles.audioVolume}>
          <span>
            Volume efeitos{' '}
            <output>{Math.round(preferences.effectsVolume * 100)}%</output>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            aria-label="Volume efeitos"
            value={preferences.effectsVolume * 100}
            onChange={(event) =>
              gameAudio.updatePreferences({
                effectsVolume: Number(event.target.value) / 100,
              })
            }
          />
        </label>
        {!Object.keys(MUSIC_ASSETS).length &&
          !Object.keys(SOUND_ASSETS).length && (
            <p className={styles.audioNote}>
              As trilhas e os sons deste mundo estão em preparação. Suas
              preferências ficam guardadas para quando chegarem.
            </p>
          )}
        {process.env.NODE_ENV === 'development' && MUSIC_ASSETS.arena && (
          <p className={styles.audioNote}>
            Sons da Arena disponíveis para protótipo não comercial. Ative Música
            e Efeitos para ouvir. Estes áudios precisam ser substituídos antes
            de um lançamento comercial.
          </p>
        )}
      </div>
    </div>
  );
}
