// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('./data/approved-visual-assets', () => ({
  APPROVED_VISUAL_ASSETS: {
    arenaDavi: {
      src: '/assets/characters/arena/test.png',
      license: 'Synthetic fixture',
    },
    arenaBackground: {
      src: 'https://example.com/not-local.webp',
      license: 'unknown',
    },
  },
}));
import { PackArtwork } from './components/pack-artwork';
import { trainingPortraitSlot } from './data/audiovisualAssets';
afterEach(cleanup);
test('gate DEV rejeitado mantém fallback mesmo que o catálogo tenha um caminho aprovado', () => {
  const { container } = render(
    <PackArtwork
      slot="arenaDavi"
      enabled={false}
      fallback={<span>monograma</span>}
    />,
  );
  expect(screen.getByText('monograma')).toBeTruthy();
  expect(container.querySelector('img')).toBeNull();
});
test('ausente/URL externa mantém fallback sem solicitar mídia', () => {
  const { container } = render(
    <PackArtwork slot="arenaBackground" fallback={<span>monograma</span>} />,
  );
  expect(screen.getByText('monograma')).toBeTruthy();
  expect(container.querySelector('img')).toBeNull();
});
test('retrato falho retorna ao monograma e não tenta loop de carregamento', () => {
  const { container } = render(
    <PackArtwork slot="arenaDavi" fallback={<span>Davi</span>} />,
  );
  fireEvent.error(container.querySelector('img')!);
  expect(screen.getByText('Davi')).toBeTruthy();
  expect(container.querySelector('img')).toBeNull();
  expect(trainingPortraitSlot('training-tactician')).toBe('arenaNoemi');
  expect(trainingPortraitSlot('unknown')).toBeUndefined();
});
