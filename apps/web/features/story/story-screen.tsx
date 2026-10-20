'use client';
import Link from 'next/link';
import { useState } from 'react';
import { RequireTraveler, Shell } from '../journey/components/shell';
import type { Traveler } from '../journey/domain/traveler';
import { resolveGardenStep } from '../journey/data/phaseProgress';
import { storyRepository } from '../../lib/supabase/repositories/story-repository';
import {
  ALL_STORIES,
  WORLDS,
  STEP_LABELS,
  findStory,
  storyRoute,
  worldRoute,
  type Story,
} from './catalog';
import {
  nextRequiredStep,
  progressFor,
  storyStatus,
  videoBlocker,
  type StoryProgress,
} from './progression';
import { useStoryProgress } from './use-story-progress';
import { StoryVideoPanel } from './video-panel';
import { STATUS_LABELS } from './world-map';
import css from './story.module.css';
import { useAudioScene } from '../journey/hooks/use-game-audio';
import { AUDIO_WORLD_IDS } from '../journey/audio/audio-catalog';
import { originsLesson } from './origins-lessons';
import { OriginsWorkbook } from './origins-workbook';
import { useAuth } from '../../lib/supabase/auth-context';

export function StoryView({
  story,
  traveler,
  records,
  error = '',
  loading = false,
  onComplete,
  ownerId,
}: {
  story: Story;
  traveler: Traveler;
  records: readonly StoryProgress[];
  error?: string;
  loading?: boolean;
  onComplete?: () => Promise<void>;
  ownerId?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [finishError, setFinishError] = useState('');
  const row = progressFor(story.id, traveler.id, records);
  const status = storyStatus(story, traveler.id, records);
  const step = nextRequiredStep(story, row);
  useAudioScene(
    step === 'reading' || step === 'reflection'
      ? 'devotional'
      : step === 'quiz'
        ? 'quiz'
        : AUDIO_WORLD_IDS.some((id) => id === story.worldId)
          ? `world:${story.worldId as (typeof AUDIO_WORLD_IDS)[number]}`
          : 'exploration',
  );
  const legacy = story.id === 'garden-choice';
  const world = WORLDS.find((item) => item.id === story.worldId);
  const legacyStarted =
    legacy &&
    (traveler.progress.gardenCompleted ||
      traveler.progress.gardenFragments > 0 ||
      traveler.progress.gardenStep !== 'opening');
  const canComplete =
    !loading &&
    !error &&
    status === 'available' &&
    !step &&
    !videoBlocker(story.video) &&
    story.content === 'ready' &&
    !!onComplete;
  const next =
    ALL_STORIES[ALL_STORIES.findIndex((item) => item.id === story.id) + 1];
  const lesson=originsLesson(story.id);
  return (
    <section className={css.page}>
      <Link className={css.back} href={worldRoute(story.worldId)}>
        ← Histórias de {world?.title ?? 'seu mundo'}
      </Link>
      <header className={css.hero}>
        <p className={css.eyebrow}>
          Mundo {world?.order ?? '—'} · História {story.order} ·{' '}
          {STATUS_LABELS[status]}
        </p>
        <h1>{story.title}</h1>
        <p>{story.references.join(' · ')}</p>
        <p>{story.description}</p>
      </header>
      {loading && <p role="status">Consultando seu progresso…</p>}
      {error && (
        <p className={css.notice} role="alert">
          {error}
        </p>
      )}
      {status === 'locked' && (
        <p className={css.notice}>
          Conclua a história anterior para avançar. Você pode consultar a
          preparação deste capítulo.
        </p>
      )}
      {lesson&&<OriginsWorkbook key={`${ownerId??'preview'}:${traveler.id}:${story.id}`} lesson={lesson} traveler={traveler} ownerId={ownerId}/>}
      <div className={css.columns}>
        <section className={css.panel}>
          <h2>Progresso oficial</h2>
          <p>
            {status === 'completed'
              ? 'História concluída. A revisita preserva suas recompensas.'
              : story.content === 'prepared'
                ? 'Este capítulo está em preparação. Atividades, quiz e reflexão aguardam revisão.'
                : story.content==='candidate'
                  ? 'Prévia interativa disponível; conclusão oficial aguarda revisão e vídeo autorizado.'
                  : step
                  ? STEP_LABELS[step]
                  : 'Confirmar a conclusão da história.'}
          </p>
          <ol className={css.steps}>
            {story.requiredSteps.map((item) => (
              <li key={item}>
                {STEP_LABELS[item]}
                <small>
                  {row?.completed_steps.includes(item)
                    ? 'Registrado pelo servidor'
                    : 'Pendente'}
                </small>
              </li>
            ))}
          </ol>
        </section>
        <StoryVideoPanel
          key={story.id}
          video={story.video}
          completed={row?.video_completed ?? false}
        />
      </div>
      {legacy && (
        <section className={css.notice}>
          <h2>O Jardim e a Escolha · atividades existentes</h2>
          <p>
            Exploração, leitura de Gênesis 2–3, devocional, Fuga da Serpente e
            quiz foram preservados. A leitura de Gênesis 2 contextualiza esta
            história; não conclui automaticamente A Criação.
          </p>
          <p>
            Seu registro anterior:{' '}
            {traveler.progress.gardenCompleted
              ? 'atividades concluídas'
              : `etapa ${resolveGardenStep(traveler.progress)}`}
            . O histórico anterior não comprova o novo vídeo obrigatório.
          </p>
          {(legacyStarted || status !== 'locked') && (
            <Link className={css.link} href={story.legacyRoute!}>
              Continuar atividades do Jardim →
            </Link>
          )}
        </section>
      )}
      <section className={css.panel}>
        <h2>Recompensa e conclusão</h2>
        <p>
          {story.reward
            ? `${story.reward.xp} XP, ${story.reward.coins} moedas e 1 Baú Comum: configuração herdada, aguardando integração segura.`
            : 'Recompensa em definição. Nenhum valor novo foi aplicado à economia.'}
        </p>
        <p>
          A conclusão só libera a próxima história depois das etapas
          obrigatórias, do vídeo e do recibo único de recompensa. A Guilda
          mantém suas próprias atividades e aprovações.
        </p>
        {finishError && <p role="alert">{finishError}</p>}
        <div className={css.actions}>
          <button
            disabled={!canComplete || saving}
            onClick={async () => {
              if (!canComplete) return;
              setSaving(true);
              setFinishError('');
              try {
                await onComplete!();
              } catch {
                setFinishError(
                  'Não foi possível concluir. Seu progresso foi preservado; tente novamente.',
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving
              ? 'Registrando…'
              : status === 'completed'
                ? 'História concluída'
                : 'Concluir história'}
          </button>
          {status === 'completed' && next && (
            <Link className={css.link} href={storyRoute(next.id)}>
              Próxima história →
            </Link>
          )}
        </div>
      </section>
      <p className={css.meta}>
        Referências canônicas indicam a origem bíblica. Organização, descrições
        e aplicações são interpretativas; exploração e minigames são ficcionais
        e não alteram o relato.
      </p>
    </section>
  );
}
function TravelerStory({
  story,
  traveler,
}: {
  story: Story;
  traveler: Traveler;
}) {
  const progress = useStoryProgress(traveler.id);
  const auth=useAuth();
  return (
    <StoryView
      story={story}
      traveler={traveler}
      {...progress}
      ownerId={auth.user?.id}
      onComplete={async () => {
        await storyRepository.complete(traveler.id, story.id);
        progress.refresh();
      }}
    />
  );
}
export function StoryScreen({ storyId }: { storyId: string }) {
  const story = findStory(storyId);
  if (!story) return null;
  return (
    <Shell back={worldRoute(story.worldId)}>
      <RequireTraveler>
        {(traveler) => (
          <TravelerStory key={traveler.id} story={story} traveler={traveler} />
        )}
      </RequireTraveler>
    </Shell>
  );
}
