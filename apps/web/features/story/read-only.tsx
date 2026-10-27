'use client';
import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import { ArchiveAccess } from '../release-ebd/archive';
import type { ArchiveSnapshot } from '../../lib/supabase/online-sync';
import { readStoryProgress } from '../../lib/supabase/story-progress-read';
import {
  ALL_STORIES,
  WORLDS,
  STEP_LABELS,
  storyRoute,
  worldRoute,
} from './catalog';
import {
  isStoryComplete,
  progressFor,
  type StoryProgress,
} from './progression';
import { GARDEN, GARDEN_CONTENT } from '../journey/data/campaign';
import { diaryView } from '../journey/data/diaryView';
import css from './story.module.css';

export function JourneyReadScreen({
  worldId,
  storyId,
}: {
  worldId?: string;
  storyId?: string;
}) {
  return (
    <ArchiveAccess>
      {(snapshot) => (
        <JourneyReader
          key={snapshot.traveler.id}
          snapshot={snapshot}
          worldId={worldId}
          storyId={storyId}
        />
      )}
    </ArchiveAccess>
  );
}
function JourneyReader({
  snapshot,
  worldId,
  storyId,
}: {
  snapshot: ArchiveSnapshot;
  worldId?: string;
  storyId?: string;
}) {
  const [result, setResult] = useState<{
    records?: StoryProgress[];
    failed?: boolean;
  }>();
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    readStoryProgress(snapshot.traveler.id)
      .then((records) => {
        if (active) setResult({ records });
      })
      .catch(() => {
        if (active) setResult({ failed: true });
      });
    return () => {
      active = false;
    };
  }, [snapshot.traveler.id, retry]);
  if (!result) return <p role="status">Consultando o progresso da Jornada…</p>;
  if (result.failed || !result.records)
    return (
      <section>
        <p role="alert">Não foi possível consultar o progresso da Jornada.</p>
        <button
          onClick={() => {
            setResult(undefined);
            setRetry((n) => n + 1);
          }}
        >
          Tentar novamente
        </button>
      </section>
    );
  return (
    <JourneyReadView
      snapshot={snapshot}
      records={result.records}
      worldId={worldId}
      storyId={storyId}
    />
  );
}

export function JourneyReadView({
  snapshot,
  records,
  worldId,
  storyId,
}: {
  snapshot: ArchiveSnapshot;
  records: readonly StoryProgress[];
  worldId?: string;
  storyId?: string;
}) {
  const { traveler, persistedProgress } = snapshot;
  const story = ALL_STORIES.find((s) => s.id === storyId);
  const world = WORLDS.find((w) => w.id === (worldId ?? story?.worldId));
  const completed = (id: string) => {
    const s = ALL_STORIES.find((s) => s.id === id);
    return !!s && isStoryComplete(s, progressFor(id, traveler.id, records));
  };
  const view = diaryView(traveler);
  return (
    <article className={css.page} data-story-mode="read-only">
      <Link
        className={css.back}
        href={
          story
            ? worldRoute(story.worldId)
            : world
              ? '/journey/worlds'
              : '/journey'
        }
      >
        ←{' '}
        {story
          ? 'Histórias do mundo'
          : world
            ? 'Mapa dos mundos'
            : 'Salão do Viajante'}
      </Link>
      <header className={css.hero}>
        <p className={css.eyebrow}>Modo História · Consulta</p>
        <h1>
          {story?.title ?? world?.title ?? 'Nove mundos. Um caminho seu.'}
        </h1>
        <p>
          {story?.description ??
            world?.description ??
            'Explore o mapa da aventura bíblica e consulte seus registros existentes.'}
        </p>
        <p>
          Progresso oficial somente leitura. Demonstrações, quando disponíveis,
          não salvam conclusão nem concedem recompensas.
        </p>
      </header>
      {!world && (
        <ol className={css.grid} aria-label="Mundos bíblicos">
          {WORLDS.map((w) => {
            const count = w.stories.filter((s) => completed(s.id)).length;
            return (
              <li
                key={w.id}
                className={css.card}
                style={{ '--world-color': w.color } as CSSProperties}
              >
                <span className={css.symbol} aria-hidden="true">
                  {w.symbol}
                </span>
                <span className={css.eyebrow}>
                  Mundo {w.order.toString().padStart(2, '0')}
                </span>
                <h2>{w.title}</h2>
                <p>{w.description}</p>
                <p>
                  {w.stories.length
                    ? `${count}/${w.stories.length} histórias com conclusão registrada`
                    : 'Bloqueado · Conteúdo em preparação'}
                </p>
                <Link href={worldRoute(w.id)}>Consultar {w.title} →</Link>
              </li>
            );
          })}
        </ol>
      )}
      {world && (
        <p className={css.notice}>
          Contexto das referências: {world.chronology}
        </p>
      )}
      {world &&
        !story &&
        (world.stories.length ? (
          <ol
            className={css.storyList}
            aria-label={`Histórias de ${world.title}`}
          >
            {world.stories.map((s) => (
              <li key={s.id} className={css.story}>
                <span className={css.number}>
                  {s.order.toString().padStart(2, '0')}
                </span>
                <div>
                  <h2>{s.title}</h2>
                  <p>{s.references.join(' · ')}</p>
                  <p>{s.description}</p>
                  <p>
                    {completed(s.id)
                      ? 'Conclusão registrada'
                      : 'Conclusão não registrada'}{' '}
                    · {s.id === 'garden-choice' ? 'Demonstração disponível, sem salvar progresso' : 'Atividades bloqueadas'}
                  </p>
                </div>
                <Link className={css.link} href={storyRoute(s.id)}>
                  Consultar história →
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className={css.notice}>
            Bloqueado · As histórias deste mundo ainda estão em preparação.
          </p>
        ))}
      {story && (
        <section className={css.notice} aria-label="Objetivos e requisitos">
          <h2>Objetivos e requisitos existentes</h2>
          <p>{story.references.join(' · ')}</p>
          <p>
            {story.id === 'garden-choice'
              ? GARDEN.subtitle
              : 'Objetivos das atividades em revisão. Consulta limitada ao catálogo e às referências existentes.'}
          </p>
          <p>
            Enquadramento didático interpretativo; referências indicam o relato
            bíblico. O Viajante é ficcional e não altera seus acontecimentos.
          </p>
          <ul>
            {story.requiredSteps.map((step) => (
              <li key={step}>
                {STEP_LABELS[step]} ·{' '}
                {progressFor(
                  story.id,
                  traveler.id,
                  records,
                )?.completed_steps.includes(step)
                  ? 'Registro existente'
                  : 'Sem registro'}
              </li>
            ))}
          </ul>
          <p>
            {completed(story.id)
              ? 'Conclusão registrada no servidor.'
              : 'Conclusão bloqueada. Conteúdo, vídeo e autoridade de progressão aguardam homologação.'}
          </p>
        </section>
      )}
      {story?.id === 'garden-choice' && <p><Link className={css.link} href="/journey/phases/o-jardim-e-a-escolha">Praticar Missões do Jardim · demonstração sem progressão →</Link></p>}
      {(!world || world.id === 'origins') && (
        <section
          className={css.notice}
          aria-label="Histórico persistido do Jardim"
        >
          <h2>{GARDEN.title} · Histórico preservado</h2>
          <p>{GARDEN_CONTENT.context}</p>
          {persistedProgress ? (
            <>
              <p>
                Estado legado salvo no servidor:{' '}
                {traveler.progress.gardenCompleted
                  ? 'fase concluída no histórico legado'
                  : 'fase sem conclusão legada'}
                .
              </p>
              <ul>
                {view.milestones
                  .filter((e) =>
                    ['comprehension', 'devotional', 'quiz', 'phase'].includes(
                      e.id,
                    ),
                  )
                  .map((e) => (
                    <li key={e.id}>
                      {e.title} · {e.status}
                    </li>
                  ))}
              </ul>
              <p>
                Leituras confirmadas:{' '}
                {view.readings.filter((r) => r.confirmed).length} de 2.
                Fragmentos registrados: {traveler.progress.gardenFragments}.
              </p>
            </>
          ) : (
            <p>
              Nenhum progresso legado persistido válido. O histórico local não
              substitui o servidor.
            </p>
          )}
          <p>
            O histórico legado não completa as cinco histórias do catálogo nem
            desbloqueia fases. Missões individuais não dependem de aprovação da
            Guilda.
          </p>
          <Link className={css.link} href="/journey/diary">
            Consultar Diário →
          </Link>
        </section>
      )}
      <p className={css.meta}>
        Mundos são agrupamentos didáticos com sobreposições históricas. Consulta
        de conteúdo em preparação não libera atividades.
      </p>
    </article>
  );
}
