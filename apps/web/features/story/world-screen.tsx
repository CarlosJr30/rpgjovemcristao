'use client';
import Link from 'next/link';
import { Shell, RequireTraveler } from '../journey/components/shell';
import { WORLDS, storyRoute, type World } from './catalog';
import { storyStatus, worldSummary, type StoryProgress } from './progression';
import { useStoryProgress } from './use-story-progress';
import { STATUS_LABELS } from './world-map';
import css from './story.module.css';

export function WorldView({
  world,
  travelerId,
  records,
  error = '',
  loading = false,
}: {
  world: World;
  travelerId: string;
  records: readonly StoryProgress[];
  error?: string;
  loading?: boolean;
}) {
  const summary = worldSummary(world, travelerId, records);
  return (
    <section className={css.page}>
      <Link className={css.back} href="/journey">
        ← Mapa dos mundos
      </Link>
      <header className={css.hero}>
        <p className={css.eyebrow}>
          Mundo {world.order} · {STATUS_LABELS[summary.status]}
        </p>
        <h1>{world.title}</h1>
        <p>{world.description}</p>
        <p>
          {error || loading
            ? 'Progresso não confirmado'
            : `${summary.percent}% · ${summary.completed}/${world.stories.length} histórias concluídas`}
        </p>
      </header>
      {loading && <p role="status">Consultando seu progresso…</p>}
      {error && (
        <p role="alert" className={css.notice}>
          {error}
        </p>
      )}
      <p className={css.notice}>Contexto das referências: {world.chronology}</p>
      {world.stories.length ? (
        <ol
          className={css.storyList}
          aria-label={`Histórias de ${world.title}`}
        >
          {world.stories.map((story) => {
            const status = storyStatus(story, travelerId, records);
            return (
              <li className={css.story} key={story.id}>
                <span className={css.number}>
                  {story.order.toString().padStart(2, '0')}
                </span>
                <div>
                  <h2>{story.title}</h2>
                  <p className={css.meta}>{story.references.join(' · ')}</p>
                  <p>{story.description}</p>
                  <span className={css.status}>
                    {STATUS_LABELS[status]} ·{' '}
                    {story.content === 'legacy-adapter'
                      ? 'Atividades do Jardim disponíveis'
                      : story.content==='candidate'?'Prévia interativa · revisão pendente':'Conteúdo em preparação'}
                  </span>
                </div>
                <Link className={css.link} href={storyRoute(story.id)}>
                  {status === 'completed' ? 'Revisitar' : 'Ver história'} →
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className={css.notice}>
          As histórias deste mundo serão adicionadas após a preparação de As
          Origens.
        </p>
      )}
      <p className={css.meta}>
        Recompensa especial do mundo: em definição, sem concessão automática
        nesta etapa.
      </p>
    </section>
  );
}
function TravelerWorld({
  world,
  travelerId,
}: {
  world: World;
  travelerId: string;
}) {
  const progress = useStoryProgress(travelerId);
  return <WorldView world={world} travelerId={travelerId} {...progress} />;
}
export function WorldScreen({ worldId }: { worldId: string }) {
  const world = WORLDS.find((item) => item.id === worldId);
  if (!world) return null;
  return (
    <Shell back="/journey">
      <RequireTraveler>
        {(traveler) => (
          <TravelerWorld
            key={traveler.id}
            world={world}
            travelerId={traveler.id}
          />
        )}
      </RequireTraveler>
    </Shell>
  );
}
