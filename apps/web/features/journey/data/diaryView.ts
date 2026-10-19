import type { Traveler } from '../domain/traveler';
import { BIBLE_LINKS } from './bibleLinks';
import { resolveGardenStep } from './phaseProgress';

export type DiaryEvent = {
  id: string;
  title: string;
  date: string | null;
  status: string;
};
function recordedDate(value: string | null): string | null {
  return value && Number.isFinite(Date.parse(value)) ? value : null;
}
// Read-only UI projection. No new progression, timestamps, scores or save fields.
export function diaryView(traveler: Traveler) {
  const p = traveler.progress;
  const step = resolveGardenStep(p);
  const readings = [
    {
      ...BIBLE_LINKS.genesis2,
      confirmed: p.bibleReading.genesis2Confirmed,
      openedAt: recordedDate(p.bibleReading.genesis2Opened),
    },
    {
      ...BIBLE_LINKS.genesis3,
      confirmed: p.bibleReading.genesis3Confirmed,
      openedAt: recordedDate(p.bibleReading.genesis3Opened),
    },
  ];
  // Quiz score/answers are transient in PhaseScreen. Only completion/attempt ID survive.
  const quizCompleted =
    p.gardenCompleted || ['video', 'reward', 'diary', 'done'].includes(step);
  const events: DiaryEvent[] = [];
  for (const reading of readings) {
    if (reading.openedAt)
      events.push({
        id: `open-${reading.id}`,
        title: `${reading.label} · link aberto`,
        date: reading.openedAt,
        status: 'Abertura registrada',
      });
    if (reading.confirmed)
      events.push({
        id: `confirm-${reading.id}`,
        title: `${reading.label} · leitura confirmada`,
        date: null,
        status: 'Concluída',
      });
  }
  if (p.bibleReading.comprehensionCompleted)
    events.push({
      id: 'comprehension',
      title: 'Registro de compreensão',
      date: null,
      status: 'Concluído',
    });
  if (p.devotionalCompleted)
    events.push({
      id: 'devotional',
      title: 'Devocional e reflexão',
      date: null,
      status: 'Concluídos',
    });
  if (quizCompleted)
    events.push({
      id: 'quiz',
      title: 'Quiz Bíblico da fase',
      date: null,
      status: 'Concluído',
    });
  if (p.gardenCompleted)
    events.push({
      id: 'phase',
      title: 'O Jardim e a Escolha',
      date: null,
      status: 'Fase concluída',
    });
  if (p.gardenRewardGranted)
    events.push({
      id: 'phase-reward',
      title: 'Recompensa principal da fase',
      date: null,
      status: 'Recebida',
    });
  const submittedAt = recordedDate(p.guildChallengeSubmittedAt),
    validatedAt = recordedDate(p.guildChallengeValidatedAt);
  if (submittedAt)
    events.push({
      id: 'guild-submitted',
      title: 'Desafio da Célula · participação enviada',
      date: submittedAt,
      status: 'Envio registrado',
    });
  if (validatedAt)
    events.push({
      id: 'guild-validated',
      title: 'Desafio da Célula · validação recebida',
      date: validatedAt,
      status: 'Validação registrada',
    });
  if (p.guildRewardClaimed)
    events.push({
      id: 'guild-reward',
      title: 'Recompensa do Desafio da Célula',
      date: null,
      status: 'Recebida',
    });
  const dated = events
    .filter((e): e is DiaryEvent & { date: string } => e.date !== null)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const milestones = events.filter((e) => e.date === null);
  const guildStatus: Record<
    Traveler['progress']['guildChallengeStatus'],
    string
  > = {
    locked: 'Desafio ainda bloqueado',
    available: 'Desafio disponível na Guilda',
    'in-progress': 'Participação em andamento',
    submitted: 'Participação enviada',
    'awaiting-validation': 'Aguardando validação da participação',
    'revision-requested': 'Ajustes solicitados na participação',
    approved: 'Participação aprovada',
    'reward-available': 'Recompensa disponível na Guilda',
    completed: 'Desafio concluído',
  };
  return {
    step,
    readings,
    quizCompleted,
    dated,
    milestones,
    lastDated: dated[0] ?? null,
    guildStatus: guildStatus[p.guildChallengeStatus],
  };
}
