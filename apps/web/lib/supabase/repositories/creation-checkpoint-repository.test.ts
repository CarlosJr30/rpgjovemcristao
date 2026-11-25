import { describe, expect, test, vi } from 'vitest';
import { createCreationCheckpointRepository } from './creation-checkpoint-repository';

const snapshot = {
  version: 1,
  storyId: 'creation',
  revision: 3,
  available: true,
  manifestText: '{}',
  manifestHash: 'a'.repeat(64),
  completedDays: [1, 2, 3],
  harmonyCompleted: false,
  quizAttempts: 1,
  bestQuizScore: 4,
  videoCompleted: false,
};

describe('STORY-007 checkpoint adapter', () => {
  test('reads server progress by traveler and content revision', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: snapshot, error: null });
    const repository = createCreationCheckpointRepository(rpc);

    await expect(repository.read('traveler-a')).resolves.toEqual(snapshot);
    expect(rpc).toHaveBeenCalledWith('read_creation_checkpoints', {
      p_traveler_id: 'traveler-a',
    });
  });

  test('sends day and harmony inputs to server validation without local completion', async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          version: 1,
          completed: true,
          correct: true,
          day: 4,
          revision: 3,
          reference: 'Gênesis 1:14–19',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          version: 1,
          completed: false,
          correct: false,
          reference: 'Gênesis 1:1–2:3',
        },
        error: null,
      });
    const repository = createCreationCheckpointRepository(rpc);

    await expect(
      repository.submitDay('traveler-a', 3, 4, 2),
    ).resolves.toMatchObject({
      completed: true,
      revision: 3,
    });
    await expect(
      repository.submitHarmony(
        'traveler-a',
        3,
        [2, 1, 3, 4, 5, 6, 7],
      ),
    ).resolves.toMatchObject({ completed: false, correct: false });
    expect(rpc).toHaveBeenNthCalledWith(1, 'submit_creation_day', {
      p_traveler_id: 'traveler-a',
      p_revision: 3,
      p_day: 4,
      p_answer_index: 2,
    });
    expect(rpc).toHaveBeenNthCalledWith(2, 'submit_creation_harmony', {
      p_traveler_id: 'traveler-a',
      p_revision: 3,
      p_order: [2, 1, 3, 4, 5, 6, 7],
    });
  });

  test('keeps quiz retries idempotent with the same operation ID', async () => {
    const quiz = {
      version: 1,
      attemptId: 'attempt-1',
      score: 5,
      total: 5,
      perfect: true,
      revision: 3,
      replayed: true,
    };
    const rpc = vi.fn().mockResolvedValue({ data: quiz, error: null });
    const repository = createCreationCheckpointRepository(rpc);

    await repository.submitQuiz(
      'traveler-a',
      3,
      'attempt-1',
      [2, 1, 3, 2, 3],
    );
    await repository.submitQuiz(
      'traveler-a',
      3,
      'attempt-1',
      [2, 1, 3, 2, 3],
    );
    expect(rpc).toHaveBeenNthCalledWith(2, 'submit_creation_quiz', {
      p_traveler_id: 'traveler-a',
      p_revision: 3,
      p_operation_id: 'attempt-1',
      p_answers: [2, 1, 3, 2, 3],
    });
  });

  test('rejects malformed inputs, malformed snapshots and server errors', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: snapshot, error: null });
    const repository = createCreationCheckpointRepository(rpc);

    await expect(
      repository.submitDay('traveler-a', 3, 8, 1),
    ).rejects.toThrow(RangeError);
    await expect(
      repository.submitHarmony('traveler-a', 3, [1, 2]),
    ).rejects.toThrow(RangeError);
    await expect(
      repository.submitQuiz(
        'traveler-a',
        3,
        '',
        [1, 1, 1, 1, 1],
      ),
    ).rejects.toThrow(TypeError);
    await expect(repository.read('traveler-a')).resolves.toEqual(snapshot);

    rpc.mockResolvedValueOnce({
      data: { ...snapshot, completedDays: [1, 1] },
      error: null,
    });
    await expect(repository.read('traveler-a')).rejects.toThrow(
      'dias fora da sequ?ncia',
    );
    rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'permission denied' },
    });
    await expect(repository.read('traveler-a')).rejects.toThrow(
      'permission denied',
    );
  });
});
