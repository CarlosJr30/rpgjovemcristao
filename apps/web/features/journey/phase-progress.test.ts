import { describe, expect, test } from 'vitest';
import { createTraveler } from './domain/traveler';
import { resolveGardenStep } from './data/phaseProgress';

function progressAt(step: string) {
  return {
    ...createTraveler('Teste', { hair: 'curto', outfit: 'musgo', skin: 'medio' }, 'traveler-1', '2026-09-23T12:00:00.000Z').progress,
    gardenStep: step,
  };
}

describe('progressão da Fase 1.1', () => {
  test('não pula a leitura nem a confirmação de compreensão', () => {
    const reading = { ...progressAt('mission'), gardenFragments: 3 };
    expect(resolveGardenStep(reading)).toBe('reading');

    const comprehension = {
      ...reading,
      bibleReading: {
        ...reading.bibleReading,
        genesis2Opened: '2026-09-23T12:00:00.000Z',
        genesis2Confirmed: true,
        genesis3Opened: '2026-09-23T12:01:00.000Z',
        genesis3Confirmed: true,
      },
    };
    expect(resolveGardenStep(comprehension)).toBe('comprehension');
  });

  test('devocional concluído continua em mission após reload', () => {
    const progress = progressAt('reflection');
    progress.bibleReading = {
      genesis2Opened: '2026-09-23T12:00:00.000Z',
      genesis2Confirmed: true,
      genesis3Opened: '2026-09-23T12:01:00.000Z',
      genesis3Confirmed: true,
      comprehensionCompleted: true,
    };
    progress.devotionalCompleted = true;
    expect(resolveGardenStep(progress)).toBe('mission');
  });

  test.each(['snake', 'quiz', 'reward', 'diary'])(
    'não regride %s quando os requisitos anteriores estão completos',
    (step) => {
      const progress = progressAt(step);
      progress.bibleReading = {
        genesis2Opened: '2026-09-23T12:00:00.000Z',
        genesis2Confirmed: true,
        genesis3Opened: '2026-09-23T12:01:00.000Z',
        genesis3Confirmed: true,
        comprehensionCompleted: true,
      };
      progress.devotionalCompleted = true;
      expect(resolveGardenStep(progress)).toBe(step);
    },
  );
});
