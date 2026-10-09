import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const files = [
  ['music/arena_training.ogg', 74.8],
  ['effects/arena_attack.ogg', 0.593333],
  ['effects/arena_defense.ogg', 0.742667],
  ['effects/arena_focus.ogg', 0.78],
  ['effects/arena_dodge.ogg', 0.42],
  ['effects/player_hit.ogg', 0.58],
  ['effects/victory.ogg', 2],
  ['effects/defeat.ogg', 1.814313],
] as const;

// Isolated technical inspection. This does not register assets, approve media,
// alter AudioManager or constitute human audition. Playback is always muted.
test('TASK-0042: oito OGG decodificam e avançam após clique confiável em diagnóstico isolado', async ({
  page,
}, info) => {
  test.setTimeout(60000);
  await page.goto('/');
  const decoded = await page.evaluate(async (files) => {
    const context = new AudioContext({ sampleRate: 48000 });
    const results = [];
    try {
      for (const [file] of files) {
        const response = await fetch(`/assets/audio/${file}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${file}`);
        const buffer = await context.decodeAudioData(
          await response.arrayBuffer(),
        );
        results.push({
          file,
          duration: buffer.duration,
          sampleRate: buffer.sampleRate,
          channels: buffer.numberOfChannels,
          canPlayType: new Audio().canPlayType('audio/ogg; codecs="vorbis"'),
        });
      }
    } finally {
      await context.close();
    }
    return results;
  }, files);
  for (const [index, value] of decoded.entries()) {
    expect(value.canPlayType).not.toBe('');
    expect(value.channels).toBe(2);
    expect(value.sampleRate).toBe(48000);
    expect(Math.abs(value.duration - files[index][1])).toBeLessThan(0.03);
  }
  const playback = [];
  for (const [file, expectedDuration] of files) {
    await page.evaluate((file) => {
      document.getElementById('technical-audio-probe')?.remove();
      const button = document.createElement('button');
      button.id = 'technical-audio-probe';
      button.textContent = 'Decodificação técnica silenciosa';
      button.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647';
      const audio = new Audio(`/assets/audio/${file}`);
      audio.muted = true;
      const state = { trusted: false, started: false, error: '' };
      Object.assign(window, { technicalAudioProbe: { audio, state } });
      button.onclick = (event) => {
        state.trusted = event.isTrusted;
        void audio.play().then(
          () => {
            state.started = true;
          },
          (error: Error) => {
            state.error = error.name;
          },
        );
      };
      document.body.append(button);
    }, file);
    await page.locator('#technical-audio-probe').click();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const { audio, state } = (
            window as unknown as {
              technicalAudioProbe: {
                audio: HTMLAudioElement;
                state: { started: boolean };
              };
            }
          ).technicalAudioProbe;
          return state.started && audio.currentTime > 0;
        }),
      )
      .toBe(true);
    const result = await page.evaluate(() => {
      const { audio, state } = (
        window as unknown as {
          technicalAudioProbe: {
            audio: HTMLAudioElement;
            state: { trusted: boolean; started: boolean; error: string };
          };
        }
      ).technicalAudioProbe;
      const result = {
        ...state,
        muted: audio.muted,
        duration: audio.duration,
        currentTime: audio.currentTime,
      };
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      document.getElementById('technical-audio-probe')?.remove();
      return result;
    });
    expect(result.trusted).toBe(true);
    expect(result.muted).toBe(true);
    expect(result.error).toBe('');
    expect(Math.abs(result.duration - expectedDuration)).toBeLessThan(0.03);
    playback.push({ file, ...result });
  }
  const evidencePath = info.outputPath(
    'browser-decoding-and-muted-playback.json',
  );
  await writeFile(evidencePath, JSON.stringify({ decoded, playback }, null, 2));
  await info.attach('browser-decoding-and-muted-playback.json', {
    path: evidencePath,
    contentType: 'application/json',
  });
});
