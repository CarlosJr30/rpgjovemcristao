export type Point = { x: number; y: number };
export type Cell = { col: number; row: number };

export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 420;
export const CELL_SIZE = 30;
export const PLAYER_RADIUS = 11;
export const PLAYER_COLLIDER_X = 6;
export const PLAYER_COLLIDER_Y = 4;
export const PLAYER_MAX_SPEED = 158;
export const CHASE_START_DELAY = 2.3;
export const RESPAWN_INVULNERABILITY = 1.35;

export const SERPENT_MAP = [
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

export const PLAYER_SPAWN = cellCenter({ col: 2, row: 11 });
export const SERPENT_SPAWN = cellCenter({ col: 21, row: 1 });
export const PORTAL_POSITION = cellCenter({ col: 22, row: 11 });
const PLAYER_CHECKPOINTS = [
  PLAYER_SPAWN,
  cellCenter({ col: 3, row: 3 }),
  cellCenter({ col: 18, row: 3 }),
  cellCenter({ col: 22, row: 9 }),
] as const;

export function playerRespawn(fragmentCount: number): Point {
  return { ...PLAYER_CHECKPOINTS[Math.max(0, Math.min(3, fragmentCount))] };
}

export function cellCenter(cell: Cell): Point {
  return { x: cell.col * CELL_SIZE + CELL_SIZE / 2, y: cell.row * CELL_SIZE + CELL_SIZE / 2 };
}

export function pointCell(point: Point): Cell {
  return {
    col: Math.max(0, Math.min(SERPENT_MAP[0].length - 1, Math.floor(point.x / CELL_SIZE))),
    row: Math.max(0, Math.min(SERPENT_MAP.length - 1, Math.floor(point.y / CELL_SIZE))),
  };
}

export function isWallCell(cell: Cell): boolean {
  return SERPENT_MAP[cell.row]?.[cell.col] === '#';
}

export function isBlocked(point: Point, radiusX = PLAYER_COLLIDER_X, radiusY = radiusX === PLAYER_COLLIDER_X ? PLAYER_COLLIDER_Y : radiusX): boolean {
  const samples = [
    { x: 0, y: 0 }, { x: radiusX, y: 0 }, { x: -radiusX, y: 0 },
    { x: 0, y: radiusY }, { x: 0, y: -radiusY },
    { x: radiusX * .7, y: radiusY * .7 }, { x: -radiusX * .7, y: radiusY * .7 },
    { x: radiusX * .7, y: -radiusY * .7 }, { x: -radiusX * .7, y: -radiusY * .7 },
  ];
  return samples.some((sample) => isWallCell(pointCell({ x: point.x + sample.x, y: point.y + sample.y })));
}

export function normalizeInput(input: Point): Point {
  const magnitude = Math.hypot(input.x, input.y);
  return magnitude > 1 ? { x: input.x / magnitude, y: input.y / magnitude } : input;
}

export function moveWithCollision(
  position: Point,
  velocity: Point,
  dt: number,
  radiusX = PLAYER_COLLIDER_X,
  radiusY = radiusX === PLAYER_COLLIDER_X ? PLAYER_COLLIDER_Y : radiusX,
): Point {
  const nextX = { x: position.x + velocity.x * dt, y: position.y };
  const xBlocked = isBlocked(nextX, radiusX, radiusY);
  const afterX = xBlocked ? position : nextX;
  const nextY = { x: afterX.x, y: position.y + velocity.y * dt };
  if (!isBlocked(nextY, radiusX, radiusY)) return nextY;
  if (afterX !== position) return afterX;

  // Pequeno encaixe ortogonal evita prender o jogador nas quinas sem permitir
  // atravessar paredes. O mesmo critério vale nos dois eixos.
  const nudges = [-2, 2, -4, 4, -6, 6];
  if (xBlocked && velocity.x !== 0) {
    for (const nudge of nudges) {
      const corner = { x: nextX.x, y: position.y + nudge };
      if (!isBlocked(corner, radiusX, radiusY)) return corner;
    }
  }
  if (velocity.y !== 0) {
    for (const nudge of nudges) {
      const corner = { x: position.x + nudge, y: position.y + velocity.y * dt };
      if (!isBlocked(corner, radiusX, radiusY)) return corner;
    }
  }
  return position;
}

export function approach(current: number, target: number, amount: number): number {
  if (current < target) return Math.min(target, current + amount);
  return Math.max(target, current - amount);
}

export function serpentSpeed(elapsed: number, portalActive: boolean, assisted: boolean): number {
  const progress = Math.min(1, elapsed / 75);
  const ratio = portalActive ? .96 : .77 + progress * .11;
  return PLAYER_MAX_SPEED * ratio * (assisted ? .9 : 1);
}

export function effectiveSerpentSpeed(elapsed: number, portalActive: boolean, assisted: boolean): number {
  const breathCycle = 1 + Math.sin(elapsed * .42) * .07;
  return Math.min(PLAYER_MAX_SPEED, serpentSpeed(elapsed, portalActive, assisted) * breathCycle);
}

export function findPath(startPoint: Point, targetPoint: Point): Point[] {
  const start = nearestOpenCell(pointCell(startPoint));
  const target = nearestOpenCell(pointCell(targetPoint));
  const key = (cell: Cell) => `${String(cell.col)},${String(cell.row)}`;
  const queue: Cell[] = [start];
  const previous = new Map<string, Cell | null>([[key(start), null]]);
  const directions = [{ col: 1, row: 0 }, { col: -1, row: 0 }, { col: 0, row: 1 }, { col: 0, row: -1 }];
  while (queue.length) {
    const current = queue.shift()!;
    if (current.col === target.col && current.row === target.row) break;
    for (const direction of directions) {
      const next = { col: current.col + direction.col, row: current.row + direction.row };
      const nextKey = key(next);
      if (next.col < 0 || next.row < 0 || next.row >= SERPENT_MAP.length || next.col >= SERPENT_MAP[0].length || isWallCell(next) || previous.has(nextKey)) continue;
      previous.set(nextKey, current);
      queue.push(next);
    }
  }
  if (!previous.has(key(target))) return [];
  const cells: Cell[] = [];
  let cursor: Cell | null = target;
  while (cursor) {
    cells.push(cursor);
    cursor = previous.get(key(cursor)) ?? null;
  }
  return cells.reverse().slice(1).map(cellCenter);
}

function nearestOpenCell(origin: Cell): Cell {
  if (!isWallCell(origin)) return origin;
  for (let radius = 1; radius < 5; radius += 1)
    for (let row = origin.row - radius; row <= origin.row + radius; row += 1)
      for (let col = origin.col - radius; col <= origin.col + radius; col += 1) {
        const cell = { col, row };
        if (row >= 0 && col >= 0 && row < SERPENT_MAP.length && col < SERPENT_MAP[0].length && !isWallCell(cell)) return cell;
      }
  return origin;
}
