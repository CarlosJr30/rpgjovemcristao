// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ChestReveal } from '../chest-reveal/reveal';
import type { RevealRarity, RevealReceipt } from '../chest-reveal/receipt';
import {
  fixtureTraveler,
  receipt,
} from '../../../../tests/fixtures/chest-reveal';
import { gameAudio } from './audio/audio-manager';
vi.mock('./audio/audio-assets', async (original) => ({
  ...(await original<typeof import('./audio/audio-assets')>()),
  // Synthetic bindings only in this module's test graph; no media is created.
  SOUND_ASSETS: Object.fromEntries(
    ['common', 'uncommon', 'rare', 'epic', 'extraordinary'].map((key) => [
      `chest_${key}`,
      {
        src: `/assets/audio/test-chest-${key}.ogg`,
        license: 'TEST ONLY; no file',
      },
    ]),
  ),
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
test('explicit reveal emits the confirmed prize rarity, while mount and reload in details stay silent', () => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
  const sound = vi.spyOn(gameAudio, 'playEffect').mockImplementation(() => {});
  const cases: [RevealRarity, string][] = [
    ['comum', 'common'],
    ['incomum', 'uncommon'],
    ['raro', 'rare'],
    ['épico', 'epic'],
    ['lendário', 'extraordinary'],
  ];
  for (const [rarity, key] of cases) {
    const confirmed: RevealReceipt = {
      ...receipt,
      entries: [{ kind: 'coins', amount: 1, rarity }],
    };
    const props = {
      receipt: confirmed,
      traveler: fixtureTraveler(),
      cursor: {
        receiptId: receipt.id,
        operationKey: receipt.operationKey,
        index: 0,
        seen: 0,
        summary: false,
      },
      onProgress: vi.fn(),
      onClose: vi.fn(),
      onViewEquipment: vi.fn(),
    };
    sound.mockClear();
    const view = render(<ChestReveal {...props} />);
    expect(sound).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Revelar prêmio' }));
    expect(sound).toHaveBeenCalledExactlyOnceWith(
      `chest_${key}`,
      rarity === 'comum' ? 0.45 : 0.7,
    );
    view.unmount();
    sound.mockClear();
    const reload = render(
      <ChestReveal {...props} cursor={{ ...props.cursor, seen: 1 }} />,
    );
    expect(sound).not.toHaveBeenCalled();
    reload.unmount();
  }
});
