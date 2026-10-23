// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { StoryVideoPanel } from '../story/video-panel';
import { findStory, type StoryVideo } from '../story/catalog';
import { gameAudio } from './audio/audio-manager';
import { CHEST_RARITY_SOUNDS } from './audio/audio-catalog';
import {
  APPROVED_EFFECTS,
  APPROVED_MUSIC,
} from './audio/approved-audio-assets';
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  gameAudio.dispose();
});
const video: StoryVideo = {
  ...findStory('garden-choice')!.video,
  provider: 'html5',
  url: 'https://video-fixture.invalid/local-test.mp4',
  captionUrl:'https://video-fixture.invalid/local-test.vtt',
  availability: 'available',
  verification: 'browser-events',
  embedding:'allowed',
  editorialReview:{status:'approved',reference:'fixture-only'},
  source: 'Synthetic test only',
  author: 'Synthetic test only',
  authorization: {
    status: 'approved',
    terms: 'TEST fixture, not a real media approval',
    evidence: 'fixture',
  },
  durationSeconds: 75,
  captions: 'fixture',
  accessibleAlternative: 'fixture',
};
test('approved native player holds during playback and releases on pause/close/unmount without awarding completion', async () => {
  const release = vi.fn(),
    hold = vi.spyOn(gameAudio, 'holdMusic').mockReturnValue(release);
  const ui = render(<StoryVideoPanel video={video} completed={false} />);
  fireEvent.click(
    screen.getByRole('button', { name: 'Carregar vídeo de html5' }),
  );
  expect(hold).not.toHaveBeenCalled();
  fireEvent.play(screen.getByLabelText(video.title));
  await waitFor(() => expect(hold).toHaveBeenCalledOnce());
  expect(screen.getByLabelText(video.title)).toBeInTheDocument();
  expect(screen.getByText(/Abrir o player não conclui/)).toBeVisible();
  fireEvent.click(
    screen.getByRole('button', { name: 'Fechar vídeo e retomar ambiente' }),
  );
  expect(release).toHaveBeenCalledOnce();
  fireEvent.click(
    screen.getByRole('button', { name: 'Carregar vídeo de html5' }),
  );
  fireEvent.play(screen.getByLabelText(video.title));
  fireEvent.pause(screen.getByLabelText(video.title));
  expect(release).toHaveBeenCalledTimes(2);
  fireEvent.play(screen.getByLabelText(video.title));
  ui.unmount();
  expect(release).toHaveBeenCalledTimes(3);
});
test('missing or blocked video never acquires a hold and approved rarity hooks remain silent when catalog is empty', () => {
  const hold = vi.spyOn(gameAudio, 'holdMusic');
  render(
    <StoryVideoPanel
      video={findStory('garden-choice')!.video}
      completed={false}
    />,
  );
  expect(hold).not.toHaveBeenCalled();
  expect(Object.keys(APPROVED_MUSIC)).toHaveLength(0);
  expect(Object.keys(APPROVED_EFFECTS)).toHaveLength(0);
  expect(Object.values(CHEST_RARITY_SOUNDS)).toEqual([
    'chest_common',
    'chest_uncommon',
    'chest_rare',
    'chest_epic',
    'chest_extraordinary',
  ]);
});
