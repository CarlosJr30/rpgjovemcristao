import { expect, test } from 'vitest';

// Temporary acceptance probe: intentionally red to prove CI blocks deployment.
// Remove in the next commit after confirming zero deployments for this SHA.
test('TASK-CLOUD-007: canário intencional bloqueia publicação', () => {
  expect('blocked-by-acceptance-probe').toBe('ready-to-publish');
});
