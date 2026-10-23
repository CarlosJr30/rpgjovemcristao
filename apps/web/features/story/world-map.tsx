'use client';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { RequireTraveler, Shell } from '../journey/components/shell';
import { AdventurePortals } from '../journey/components/journey-spotlight';
import { WORLDS, storyRoute, worldRoute } from './catalog';
import { nextStory, worldSummary, type StoryProgress } from './progression';
import { useStoryProgress } from './use-story-progress';
import css from './story.module.css';

export const STATUS_LABELS = {
  completed: 'Concluído',
  available: 'Disponível',
  locked: 'Bloqueado',
};
export function WorldMapView({
  travelerId,
  records,
  loading = false,
  error = '',
}: {
  travelerId: string;
  records: readonly StoryProgress[];
  loading?: boolean;
  error?: string;
}) {
  const next = nextStory(travelerId, records);
  return (
    <section className={css.page} aria-labelledby="world-map-title">
      <header className={css.hero}>
        <p className={css.eyebrow}>Modo História · uma jornada individual</p>
        <h1 id="world-map-title">Nove mundos. Um caminho seu.</h1>
        <p>
          Explore as histórias bíblicas, registre suas descobertas e retorne ao
          seu próximo passo. A progressão do Modo História não depende de
          aprovação da Guilda.
        </p>
        <Link
          className={css.link}
          href={next ? storyRoute(next.id) : '/journey/worlds/origins'}
        >
          {records.length
            ? 'Continuar história'
            : 'Conhecer a primeira história'}{' '}
          →
        </Link>
      </header>
      {loading && (
        <p role="status" className={css.notice}>
          Consultando seu progresso…
        </p>
      )}
      {error && (
        <p role="alert" className={css.notice}>
          {error} Os percentuais ficam pendentes de consulta.
        </p>
      )}
      <ol className={css.grid} aria-label="Mundos bíblicos">
        {WORLDS.map((world) => {
          const summary = worldSummary(world, travelerId, records);
          return (
            <li
              key={world.id}
              className={css.card}
              style={{ '--world-color': world.color } as CSSProperties}
            >
              <span className={css.symbol} aria-hidden="true">
                {world.symbol}
              </span>
              <span className={css.eyebrow}>
                Mundo {world.order.toString().padStart(2, '0')}
              </span>
              <h2>{world.title}</h2>
              <p>{world.description}</p>
              <span className={css.status}>
                {STATUS_LABELS[summary.status]}
                {world.stories.length === 0 ? ' · Conteúdo em preparação' : ''}
              </span>
              <progress
                value={summary.percent}
                max={100}
                aria-label={`Progresso de ${world.title}`}
              />
              <p className={css.meta}>
                {error || loading
                  ? 'Progresso não confirmado'
                  : `${summary.percent}% · ${summary.completed}/${world.stories.length} histórias concluídas`}
              </p>
              <Link
                href={worldRoute(world.id)}
                aria-label={`Ver mundo ${world.order}: ${world.title}`}
              >
                Ver histórias →
              </Link>
            </li>
          );
        })}
      </ol>
      <p className={css.meta}>
        Os mundos são agrupamentos didáticos. Há sobreposições históricas entre
        livros e narrativas. Histórias em preparação não contam como concluídas.
      </p>
    </section>
  );
}
function TravelerMap({ travelerId }: { travelerId: string }) {
  const progress = useStoryProgress(travelerId);
  return (
    <>
      <WorldMapView travelerId={travelerId} {...progress} />
      <AdventurePortals />
    </>
  );
}
export function StoryMapScreen() {
  return (
    <Shell>
      <RequireTraveler>
        {(traveler) => (
          <TravelerMap key={traveler.id} travelerId={traveler.id} />
        )}
      </RequireTraveler>
    </Shell>
  );
}
