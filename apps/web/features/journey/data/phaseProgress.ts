import type { Traveler } from '../domain/traveler';

export type GardenStep =
  | 'opening'
  | 'explore'
  | 'reading'
  | 'comprehension'
  | 'context'
  | 'reflection'
  | 'mission'
  | 'snake'
  | 'quiz'
  | 'video'
  | 'reward'
  | 'diary'
  | 'done';

export const PHASE_STEPS: readonly GardenStep[] = [
  'opening',
  'explore',
  'reading',
  'comprehension',
  'context',
  'reflection',
  'mission',
  'snake',
  'quiz',
  'video',
  'reward',
  'diary',
  'done',
];

export function resolveGardenStep(
  progress: Traveler['progress'] | undefined,
): GardenStep {
  if (!progress) return 'opening';

  const rawSaved = PHASE_STEPS.includes(progress.gardenStep as GardenStep)
    ? (progress.gardenStep as GardenStep)
    : 'opening';
  const saved =
    rawSaved === 'reward' || rawSaved === 'diary' ? 'video' : rawSaved;
  if (progress.gardenCompleted && saved === 'done') return 'done';
  // Legacy saves retain their activities, but cannot bypass the new video gate.
  if (saved === 'explore' && progress.gardenFragments >= 3) return 'reading';

  const index = PHASE_STEPS.indexOf(saved);
  const readingConfirmed =
    progress.bibleReading.genesis2Confirmed &&
    progress.bibleReading.genesis3Confirmed;
  if (index >= PHASE_STEPS.indexOf('reading') && !readingConfirmed)
    return 'reading';
  if (
    index >= PHASE_STEPS.indexOf('comprehension') &&
    !progress.bibleReading.comprehensionCompleted
  )
    return 'comprehension';
  if (
    progress.bibleReading.comprehensionCompleted &&
    (saved === 'reading' || saved === 'comprehension')
  )
    return 'context';
  if (index >= PHASE_STEPS.indexOf('mission') && !progress.devotionalCompleted)
    return 'reflection';
  if (saved === 'reflection' && progress.devotionalCompleted) return 'mission';
  return saved;
}
