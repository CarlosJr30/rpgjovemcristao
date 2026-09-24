import { describe, expect, test } from 'vitest';
import {
  CELL_SIZE,
  CHASE_START_DELAY,
  PLAYER_MAX_SPEED,
  RESPAWN_INVULNERABILITY,
  PLAYER_SPAWN,
  PORTAL_POSITION,
  SERPENT_MAP,
  SERPENT_SPAWN,
  cellCenter,
  effectiveSerpentSpeed,
  findPath,
  isBlocked,
  moveWithCollision,
  normalizeInput,
  playerRespawn,
  serpentSpeed,
} from './components/snake-game-engine';

describe('motor da Fuga da Serpente', () => {
  test('mapa deliberado tem dimensões consistentes e objetivos conectados', () => {
    expect(SERPENT_MAP).toHaveLength(14);
    expect(SERPENT_MAP.every((row) => row.length === 24)).toBe(true);
    const objectives = [
      cellCenter({ col: 3, row: 3 }),
      cellCenter({ col: 18, row: 3 }),
      cellCenter({ col: 22, row: 9 }),
      PORTAL_POSITION,
    ];
    for (const objective of objectives) expect(findPath(PLAYER_SPAWN, objective).length).toBeGreaterThan(0);
    expect(findPath(SERPENT_SPAWN, PLAYER_SPAWN).length).toBeGreaterThan(0);
  });

  test('todos os espaços navegáveis formam um mapa conectado e as rotas não atravessam paredes', () => {
    for (let row = 0; row < SERPENT_MAP.length; row += 1)
      for (let col = 0; col < SERPENT_MAP[row].length; col += 1) {
        if (SERPENT_MAP[row][col] === '#') continue;
        const target = cellCenter({ col, row });
        const route = findPath(PLAYER_SPAWN, target);
        if (target.x === PLAYER_SPAWN.x && target.y === PLAYER_SPAWN.y) continue;
        expect(route.length, `célula isolada em ${String(col)},${String(row)}`).toBeGreaterThan(0);
        expect(route.every((point) => !isBlocked(point, 0))).toBe(true);
      }
  });

  test('normaliza diagonal e permite wall sliding sem atravessar parede', () => {
    const input = normalizeInput({ x: 1, y: 1 });
    expect(Math.hypot(input.x, input.y)).toBeCloseTo(1);
    const nearWall = cellCenter({ col: 5, row: 1 });
    const moved = moveWithCollision(nearWall, { x: 100, y: 60 }, .2);
    expect(isBlocked(moved)).toBe(false);
    expect(moved.y).toBeGreaterThan(nearWall.y);
  });

  test('colisão mantém o jogador dentro dos corredores em passos sucessivos', () => {
    let position = cellCenter({ col: 2, row: 11 });
    for (let frame = 0; frame < 180; frame += 1) {
      position = moveWithCollision(position, { x: PLAYER_MAX_SPEED, y: -PLAYER_MAX_SPEED }, 1 / 60);
      expect(isBlocked(position)).toBe(false);
      expect(position.x).toBeGreaterThanOrEqual(CELL_SIZE);
      expect(position.y).toBeGreaterThanOrEqual(CELL_SIZE);
    }
  });

  test('perseguição dá preparo inicial e preserva tensão sem ultrapassar o jogador', () => {
    const start = serpentSpeed(0, false, false);
    const middle = serpentSpeed(40, false, false);
    const finale = serpentSpeed(80, true, false);
    expect(CHASE_START_DELAY).toBeGreaterThanOrEqual(2);
    expect(CHASE_START_DELAY).toBeLessThanOrEqual(2.5);
    expect(RESPAWN_INVULNERABILITY).toBeGreaterThanOrEqual(1);
    expect(RESPAWN_INVULNERABILITY).toBeLessThanOrEqual(1.5);
    expect(start / PLAYER_MAX_SPEED).toBeCloseTo(.77);
    expect(middle).toBeGreaterThan(start);
    expect(middle).toBeLessThan(PLAYER_MAX_SPEED * .9);
    expect(finale / PLAYER_MAX_SPEED).toBeCloseTo(.96);
    expect(serpentSpeed(80, true, true)).toBeCloseTo(finale * .9);
    for (const elapsed of [0, 10, 30, 50, 75, 100]) {
      expect(effectiveSerpentSpeed(elapsed, false, false)).toBeLessThan(PLAYER_MAX_SPEED);
      expect(effectiveSerpentSpeed(elapsed, true, false)).toBeLessThanOrEqual(PLAYER_MAX_SPEED);
    }
  });

  test('respawn usa o último Fragmento como checkpoint seguro', () => {
    expect(playerRespawn(0)).toEqual(PLAYER_SPAWN);
    expect(playerRespawn(1)).toEqual(cellCenter({ col: 3, row: 3 }));
    expect(playerRespawn(2)).toEqual(cellCenter({ col: 18, row: 3 }));
    expect(playerRespawn(3)).toEqual(cellCenter({ col: 22, row: 9 }));
  });

  test('simulação da rota dos três Fragmentos até o portal é vencível com três vidas', () => {
    const objectives = [
      cellCenter({ col: 3, row: 3 }),
      cellCenter({ col: 18, row: 3 }),
      cellCenter({ col: 22, row: 9 }),
      PORTAL_POSITION,
    ];
    let player = { ...PLAYER_SPAWN };
    let serpent = { ...SERPENT_SPAWN };
    let playerRoute = findPath(player, objectives[0]);
    let serpentRoute = findPath(serpent, player);
    let objective = 0;
    let lives = 3;
    let elapsed = 0;
    let invulnerable = 0;
    let pathTimer = 0;
    const dt = 1 / 60;

    while (elapsed < 150 && lives > 0 && objective < objectives.length) {
      elapsed += dt;
      invulnerable = Math.max(0, invulnerable - dt);
      while (playerRoute.length && Math.hypot(player.x - playerRoute[0].x, player.y - playerRoute[0].y) < 5) playerRoute.shift();
      const playerTarget = playerRoute[0] ?? objectives[objective];
      const playerDirection = normalizeInput({ x: playerTarget.x - player.x, y: playerTarget.y - player.y });
      player = moveWithCollision(player, { x: playerDirection.x * PLAYER_MAX_SPEED, y: playerDirection.y * PLAYER_MAX_SPEED }, dt);

      if (Math.hypot(player.x - objectives[objective].x, player.y - objectives[objective].y) < 18) {
        objective += 1;
        if (objective < objectives.length) playerRoute = findPath(player, objectives[objective]);
      }

      pathTimer -= dt;
      if (pathTimer <= 0) {
        pathTimer = .16;
        serpentRoute = findPath(serpent, player);
      }
      while (serpentRoute.length && Math.hypot(serpent.x - serpentRoute[0].x, serpent.y - serpentRoute[0].y) < 7) serpentRoute.shift();
      const serpentTarget = serpentRoute[0] ?? player;
      const serpentDirection = normalizeInput({ x: serpentTarget.x - serpent.x, y: serpentTarget.y - serpent.y });
      const chaseSpeed = elapsed < CHASE_START_DELAY ? 0 : effectiveSerpentSpeed(elapsed, objective >= 3, false);
      serpent = moveWithCollision(serpent, {
        x: serpentDirection.x * chaseSpeed,
        y: serpentDirection.y * chaseSpeed,
      }, dt, 10);

      if (Math.hypot(player.x - serpent.x, player.y - serpent.y) < 25 && invulnerable <= 0) {
        lives -= 1;
        player = playerRespawn(objective);
        serpent = { ...SERPENT_SPAWN };
        invulnerable = RESPAWN_INVULNERABILITY;
        if (objective < objectives.length) playerRoute = findPath(player, objectives[objective]);
      }
    }

    expect(objective).toBe(objectives.length);
    expect(lives).toBeGreaterThan(0);
  });
});
