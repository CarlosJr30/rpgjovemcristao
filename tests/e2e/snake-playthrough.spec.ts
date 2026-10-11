import { expect, test, type Page } from '@playwright/test';

const map = [
  '########################',
  '#.....#......#.........#',
  '#.....#..##..#..###....#',
  '#........##............#',
  '#.#..#....#..###...##..#',
  '#....#.............#...#',
  '###..#.#.#.##.##.#.#...#',
  '#....#........#........#',
  '#.#..#.##..#..#...##...#',
  '#......#......#........#',
  '#.##...#.#..#.#...##...#',
  '#......#...............#',
  '#......................#',
  '########################',
] as const;
const cellSize = 36;
type Point = { x: number; y: number };
type Cell = { col: number; row: number };

async function prepareGame(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local');
    const prototype = CanvasRenderingContext2D.prototype;
    const originalTranslate = prototype.translate;
    const originalArc = prototype.arc;
    let lastWorldTranslation: Point | null = null;
    prototype.translate = function translate(x: number, y: number) {
      if (x > 20 && x < 900 && y > 20 && y < 540)
        lastWorldTranslation = { x, y };
      return originalTranslate.call(this, x, y);
    };
    prototype.arc = function arc(
      x: number,
      y: number,
      radius: number,
      startAngle: number,
      endAngle: number,
      counterclockwise?: boolean,
    ) {
      if (
        x === 0 &&
        y === 0 &&
        radius >= 13 &&
        radius <= 15 &&
        lastWorldTranslation
      ) {
        (window as typeof window & { __snakePlayer?: Point }).__snakePlayer = {
          x: lastWorldTranslation.x,
          y: lastWorldTranslation.y + 12,
        };
      }
      return originalArc.call(
        this,
        x,
        y,
        radius,
        startAngle,
        endAngle,
        counterclockwise,
      );
    };
  });
  await page.goto('/journey/create');
  await page.getByLabel('Nome do Viajante', { exact: true }).fill('Nina');
  await page.getByRole('button', { name: 'Criar Viajante' }).click();
  await page.evaluate(() => {
    const key = 'rpg-jovem-cristao:journey:v1';
    const save = JSON.parse(localStorage.getItem(key)!);
    const progress = save.travelers[0].progress;
    progress.gardenStep = 'snake';
    progress.gardenFragments = 3;
    progress.bibleReading.genesis2Confirmed = true;
    progress.bibleReading.genesis3Confirmed = true;
    progress.bibleReading.comprehensionCompleted = true;
    progress.devotionalCompleted = true;
    progress.snakeTutorialCompleted = true;
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.goto('/journey/phases/o-jardim-e-a-escolha');
  await page.getByRole('button', { name: 'Começar perseguição' }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(
          (window as typeof window & { __snakePlayer?: Point }).__snakePlayer,
        ),
      ),
    )
    .toBe(true);
}

function pointCell(point: Point): Cell {
  return {
    col: Math.max(0, Math.min(23, Math.floor(point.x / cellSize))),
    row: Math.max(0, Math.min(13, Math.floor(point.y / cellSize))),
  };
}

function path(startPoint: Point, target: Cell): Cell[] {
  const start = pointCell(startPoint);
  const key = (cell: Cell) => `${cell.col},${cell.row}`;
  const queue = [start];
  const previous = new Map<string, Cell | null>([[key(start), null]]);
  for (const current of queue) {
    if (current.col === target.col && current.row === target.row) break;
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const next = { col: current.col + dc, row: current.row + dr };
      if (map[next.row]?.[next.col] !== '.' || previous.has(key(next)))
        continue;
      previous.set(key(next), current);
      queue.push(next);
    }
  }
  const result: Cell[] = [];
  let cursor: Cell | null = target;
  while (cursor && previous.has(key(cursor))) {
    result.push(cursor);
    cursor = previous.get(key(cursor)) ?? null;
  }
  return result.reverse().slice(1);
}

async function moveUntil(
  page: Page,
  target: Cell,
  complete: () => Promise<boolean>,
  timeout = 25_000,
) {
  const started = Date.now();
  let held: string | null = null;
  while (Date.now() - started < timeout) {
    if (await complete()) break;
    const position = await page.evaluate(
      () =>
        (window as typeof window & { __snakePlayer?: Point }).__snakePlayer!,
    );
    const nextCell = path(position, target)[0] ?? target;
    const next = {
      x: nextCell.col * cellSize + cellSize / 2,
      y: nextCell.row * cellSize + cellSize / 2,
    };
    const dx = next.x - position.x;
    const dy = next.y - position.y;
    const key =
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? 'ArrowRight'
          : 'ArrowLeft'
        : dy > 0
          ? 'ArrowDown'
          : 'ArrowUp';
    if (key !== held) {
      if (held) await page.keyboard.up(held);
      await page.keyboard.down(key);
      held = key;
    }
    await page.waitForTimeout(25);
  }
  if (held) await page.keyboard.up(held);
  expect(
    await complete(),
    `objetivo ${target.col},${target.row} não alcançado`,
  ).toBe(true);
}

test('mobile completa 3 Fragmentos, ativa o Portal, vence, reinicia e sai', async ({
  page,
}, testInfo) => {
  test.skip(
    !['mobile', 'android', 'webkit-mobile'].includes(testInfo.project.name),
    'Playthrough requires a mobile browser project.',
  );
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const logoutRequests: string[] = [];
  page.on('request', (request) => {
    if (/\/auth\/v1\/logout|signout/i.test(request.url()))
      logoutRequests.push(request.url());
  });
  await prepareGame(page);

  const wisdom = page
    .locator('[class*="arcadeHud"] span')
    .filter({ hasText: 'SABEDORIA' })
    .locator('strong');
  await moveUntil(
    page,
    { col: 3, row: 3 },
    async () => (await wisdom.textContent()) === '1/3',
  );
  await moveUntil(
    page,
    { col: 8, row: 5 },
    async () => {
      const position = await page.evaluate(
        () =>
          (window as typeof window & { __snakePlayer?: Point }).__snakePlayer!,
      );
      return (
        Math.hypot(position.x - 8.5 * cellSize, position.y - 5.5 * cellSize) <
        16
      );
    },
    12_000,
  );
  await moveUntil(
    page,
    { col: 18, row: 3 },
    async () => (await wisdom.textContent()) === '2/3',
  );
  await moveUntil(
    page,
    { col: 22, row: 9 },
    async () => (await wisdom.textContent()) === '3/3',
  );
  await expect(page.getByText('PORTAL ABERTO')).toBeVisible({ timeout: 2_000 });
  await moveUntil(
    page,
    { col: 22, row: 11 },
    async () => (await page.getByText(/DESAFIO CONCLUÍDO/).count()) > 0,
  );
  await expect(page.getByText(/DESAFIO CONCLUÍDO/)).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('snake-mobile-victory.png'),
    fullPage: true,
  });

  await page.getByRole('button', { name: 'Jogar novamente' }).click();
  await expect(wisdom).toHaveText('0/3');
  await page.getByRole('button', { name: 'Sair', exact: true }).first().click();
  await expect
    .poll(() => page.evaluate(() => document.body.dataset.snakeGameActive))
    .toBe('false');
  await expect(page.locator('header')).toBeVisible();
  expect(logoutRequests).toEqual([]);
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(localStorage.getItem('rpg-jovem-cristao:active-traveler:v1')),
      ),
    )
    .toBe(true);
});
