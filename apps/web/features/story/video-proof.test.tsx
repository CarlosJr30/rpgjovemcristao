// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ORIGIN_STORIES, type StoryVideo } from './catalog';
import { StoryVideoPanel } from './video-panel';
import { gameAudio } from '../journey/audio/audio-manager';
const approved = (): StoryVideo => ({
  ...ORIGIN_STORIES[0].video,
  provider: 'html5',
  url: 'https://media-fixture.invalid/test.mp4',
  captionUrl: 'https://media-fixture.invalid/test.vtt',
  author: 'Synthetic author',
  source: 'Disposable fixture',
  availability: 'available',
  verification: 'browser-events',
  embedding: 'allowed',
  editorialReview: { status: 'approved', reference: 'fixture-only' },
  authorization: {
    status: 'approved',
    terms: 'Fixture only',
    evidence: 'fixture',
  },
  durationSeconds: 10,
  captions: 'Synthetic captions',
  accessibleAlternative: 'Fixture alternative',
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  gameAudio.dispose();
});
it('opening and forged ended event do not observe completion; a native end only creates a local observation and resumes music', () => {
  const release = vi.fn(),
    hold = vi.spyOn(gameAudio, 'holdMusic').mockReturnValue(release);
  render(<StoryVideoPanel video={approved()} completed={false} />);
  fireEvent.click(
    screen.getByRole('button', { name: 'Carregar vídeo de html5' }),
  );
  const video = screen.getByLabelText('Vídeo educativo em seleção');
  fireEvent.ended(video);
  expect(screen.queryByText(/Término observado/)).toBeNull();
  expect(hold).not.toHaveBeenCalled();
  fireEvent.play(video);
  expect(hold).toHaveBeenCalledOnce();
  Object.defineProperties(video, {
    ended: { value: true, configurable: true },
    duration: { value: 10, configurable: true },
    currentTime: { value: 10, configurable: true },
  });
  fireEvent.ended(video);
  expect(screen.getByText(/Término observado/)).toBeVisible();
  expect(release).toHaveBeenCalledOnce();
  expect(
    screen.queryByText('Visualização registrada pelo servidor.'),
  ).toBeNull();
});
it('connection error blocks the step, releases ambient music and provides no bypass', () => {
  const release = vi.fn();
  vi.spyOn(gameAudio, 'holdMusic').mockReturnValue(release);
  render(<StoryVideoPanel video={approved()} completed={false} />);
  fireEvent.click(
    screen.getByRole('button', { name: 'Carregar vídeo de html5' }),
  );
  const video = screen.getByLabelText('Vídeo educativo em seleção');
  fireEvent.play(video);
  fireEvent.error(video);
  expect(screen.getByRole('alert')).toHaveTextContent(
    'etapa continua pendente',
  );
  expect(release).toHaveBeenCalledOnce();
  expect(screen.queryByText(/Término observado/)).toBeNull();
});
it('unapproved embed/editorial, unavailable media, unsupported provider API and unsafe URLs never load a player', () => {
  const cases: StoryVideo[] = [
    { ...approved(), embedding: 'pending' },
    { ...approved(), editorialReview: { status: 'pending', reference: null } },
    { ...approved(), availability: 'unavailable' },
    {
      ...approved(),
      provider: 'youtube',
      externalId: 'abcdefghijk',
      verification: 'none',
    },
    { ...approved(), url: 'javascript:alert(1)' },
  ];
  for (const video of cases) {
    const ui = render(<StoryVideoPanel video={video} completed={false} />);
    expect(ui.container.querySelector('video,iframe')).toBeNull();
    expect(screen.queryByRole('button', { name: /Carregar vídeo/ })).toBeNull();
    ui.unmount();
  }
});
it('project mute applies to narration and no external YouTube/Vimeo API is silently assumed', () => {
  gameAudio.updatePreferences({ muted: true });
  const ui = render(<StoryVideoPanel video={approved()} completed={false} />);
  fireEvent.click(
    screen.getByRole('button', { name: 'Carregar vídeo de html5' }),
  );
  expect(
    (screen.getByLabelText('Vídeo educativo em seleção') as HTMLVideoElement)
      .muted,
  ).toBe(true);
  ui.unmount();
  render(
    <StoryVideoPanel
      video={{
        ...approved(),
        provider: 'youtube',
        externalId: 'abcdefghijk',
        verification: 'provider-api',
      }}
      completed={false}
    />,
  );
  expect(screen.getByText(/aguarda integração de sua API/)).toBeVisible();
  expect(screen.queryByRole('button', { name: /Carregar vídeo/ })).toBeNull();
});
