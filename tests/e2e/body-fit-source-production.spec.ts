import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('TASK-0052 sources and diagnostic review remain outside production', async ({
  request,
}, info) => {
  const results = [];
  for (const route of [
    '/assets-source/body-fit-v2/armadura_paladina_verde_e_dourada.png',
    '/build/task-0052-body-fit-validation/delivery/review/index.html',
    '/build/task-0052-body-fit-validation/delivery/review/source/armadura_paladina_verde_e_dourada.png',
    '/tools/arena-lab/',
  ]) {
    const status = (await request.get(route)).status();
    expect(status).toBe(404);
    results.push({ route, status });
  }
  await writeFile(
    `build/task-0052-body-fit-validation/delivery/production-isolation-${info.project.name}.json`,
    JSON.stringify(
      { at: new Date().toISOString(), results, pass: true },
      null,
      2,
    ) + '\n',
  );
});
