// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, test, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { createTraveler, DEFAULT_APPEARANCE } from '../journey/domain/traveler';
import { WorldMapView } from './world-map';
import { WorldView } from './world-screen';
import { StoryView } from './story-screen';
import { StoryVideoPanel, allowedEmbed } from './video-panel';
import { ORIGIN_STORIES, WORLDS } from './catalog';

afterEach(cleanup);
const traveler = () =>
  createTraveler(
    'Lia',
    DEFAULT_APPEARANCE,
    'traveler-a',
    '2026-10-19T12:00:00Z',
  );
test('map offers all nine worlds and first story with semantic links', () => {
  render(<WorldMapView travelerId="traveler-a" records={[]} />);
  expect(
    within(screen.getByRole('list', { name: 'Mundos bíblicos' })).getAllByRole(
      'listitem',
    ),
  ).toHaveLength(9);
  expect(
    screen.getByRole('link', {
      name: 'Ver mundo 9: Apocalipse e Nova Criação',
    }),
  ).toHaveAttribute('href', '/journey/worlds/new-creation');
  expect(
    screen.getByRole('link', { name: /Conhecer a primeira/ }),
  ).toHaveAttribute('href', '/journey/stories/creation');
});
test('Origins lists five configured stories and separates preparation from completion', () => {
  render(<WorldView world={WORLDS[0]} travelerId="traveler-a" records={[]} />);
  expect(screen.getAllByRole('link', { name: /Ver história/ })).toHaveLength(5);
  expect(screen.getByText(/0% · 0\/5/)).toBeVisible();
});
test('video pending blocks finalization and no player loads', () => {
  const complete = vi.fn();
  const { container } = render(
    <StoryView
      story={ORIGIN_STORIES[0]}
      traveler={traveler()}
      records={[]}
      onComplete={complete}
    />,
  );
  expect(
    screen.getByRole('button', { name: 'Concluir história' }),
  ).toBeDisabled();
  expect(screen.getByText(/Aguardando seleção de um vídeo/)).toBeVisible();
  expect(container.querySelector('iframe,video')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Concluir história' }));
  expect(complete).not.toHaveBeenCalled();
});
test('legacy Garden completion is preserved but grants no official video completion', () => {
  const player = traveler();
  player.progress.gardenCompleted = true;
  player.progress.nextPhaseUnlocked = true;
  render(
    <StoryView story={ORIGIN_STORIES[1]} traveler={player} records={[]} />,
  );
  expect(
    screen.getByRole('link', { name: /Continuar atividades/ }),
  ).toHaveAttribute('href', '/journey/phases/o-jardim-e-a-escolha');
  expect(
    screen.getByRole('button', { name: 'Concluir história' }),
  ).toBeDisabled();
  expect(screen.queryByText(/Visualização registrada/)).toBeNull();
});
test('persistence error does not display confirmed zero progress', () => {
  render(
    <WorldMapView
      travelerId="traveler-a"
      records={[]}
      error="Consulta indisponível"
    />,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Consulta indisponível');
  expect(screen.queryByText(/0% · 0\/5/)).toBeNull();
});
test('unavailable and unverifiable videos remain blocked', () => {
  render(
    <StoryVideoPanel
      video={{ ...ORIGIN_STORIES[0].video, availability: 'unavailable' }}
      completed={false}
    />,
  );
  expect(screen.getByText(/O vídeo está indisponível/)).toBeVisible();
});
test('embed source is constructed from allowed provider and validated ID', () => {
  const video = {
    ...ORIGIN_STORIES[0].video,
    provider: 'youtube' as const,
    externalId: 'abcdefghijk',
    availability: 'available' as const,
    source: 'synthetic fixture',
    author: 'fixture',
    verification: 'provider-api' as const,
    authorization: {
      status: 'approved' as const,
      terms: 'test-only',
      evidence: 'fixture',
    },
  };
  expect(allowedEmbed(video)).toBe(
    'https://www.youtube-nocookie.com/embed/abcdefghijk',
  );
  expect(
    allowedEmbed({ ...video, externalId: 'https://evil.invalid/' }),
  ).toBeNull();
  expect(allowedEmbed({ ...video, externalId: 'javascript:' })).toBeNull();
});
