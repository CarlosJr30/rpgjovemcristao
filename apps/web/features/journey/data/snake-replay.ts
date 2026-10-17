import {
  PLAYER_SPAWN,
  SERPENT_SPAWN,
  PORTAL_POSITION,
  CHASE_START_DELAY,
  RESPAWN_INVULNERABILITY,
  PLAYER_MAX_SPEED,
  cellCenter,
  approach,
  normalizeInput,
  moveWithCollision,
  findPath,
  effectiveSerpentSpeed,
  playerRespawn,
  type Point,
} from '../components/snake-game-engine';

// Lossless frame evidence: dt, resolved input x/y, buffered turn, mobile mode,
// assistance. No client position, pickup count, life or winner is accepted.
export type SnakeFrame = [number, number, number, boolean, boolean, boolean];
export type SnakeProof = { frames: SnakeFrame[]; losses: SnakeFrame[][] };
export const SNAKE_PROOF_MAX_FRAMES = 60000;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export function createSnakeReplay() {
  return {
    player: { ...PLAYER_SPAWN },
    serpent: { ...SERPENT_SPAWN },
    velocity: { x: 0, y: 0 },
    elapsed: 0,
    chaseDelay: CHASE_START_DELAY,
    path: [] as Point[],
    pathTimer: 0,
    lives: 3,
    fragments: [
      cellCenter({ col: 3, row: 3 }),
      cellCenter({ col: 18, row: 3 }),
      cellCenter({ col: 22, row: 9 }),
    ],
    fragmentCount: 0,
    powers: [
      { ...cellCenter({ col: 8, row: 5 }), kind: 'shield' },
      { ...cellCenter({ col: 13, row: 11 }), kind: 'speed' },
      { ...cellCenter({ col: 2, row: 1 }), kind: 'heal' },
    ],
    shield: false,
    speedTimer: 0,
    invulnerable: 0,
    portalActivation: 0,
    finished: false,
    victory: false,
  };
}
export type SnakeReplay = ReturnType<typeof createSnakeReplay>;
/** Same ordered gameplay equations as the existing canvas; presentation is untouched. */
export function stepSnakeReplay(g: SnakeReplay, f: SnakeFrame) {
  const [dt, x, y, buffered, mobile, assisted] = f;
  if (g.finished) throw Error('Commands after terminal state');
  g.elapsed += dt;
  g.chaseDelay = Math.max(0, g.chaseDelay - dt);
  g.speedTimer = Math.max(0, g.speedTimer - dt);
  g.invulnerable = Math.max(0, g.invulnerable - dt);
  g.portalActivation = Math.max(0, g.portalActivation - dt);
  const input = { x, y };
  if (buffered && (input.x || input.y)) {
    if (!input.x || g.velocity.x * input.x < 0) g.velocity.x = 0;
    if (!input.y || g.velocity.y * input.y < 0) g.velocity.y = 0;
  }
  const speed = PLAYER_MAX_SPEED * (g.speedTimer > 0 ? 1.3 : 1),
    response = input.x || input.y ? 980 : 1250;
  g.velocity.x = approach(g.velocity.x, input.x * speed, response * dt);
  g.velocity.y = approach(g.velocity.y, input.y * speed, response * dt);
  g.player = moveWithCollision(g.player, g.velocity, dt);
  g.pathTimer -= dt;
  if (g.pathTimer <= 0) {
    g.pathTimer = 0.16;
    g.path = findPath(g.serpent, g.player);
  }
  while (g.path.length && distance(g.serpent, g.path[0]) < 7) g.path.shift();
  const target = g.path[0] ?? g.player,
    direction = normalizeInput({
      x: target.x - g.serpent.x,
      y: target.y - g.serpent.y,
    });
  if (g.chaseDelay <= 0) {
    const chase = effectiveSerpentSpeed(
      g.elapsed,
      g.fragmentCount === 3,
      assisted,
      mobile,
    );
    g.serpent = moveWithCollision(
      g.serpent,
      { x: direction.x * chase, y: direction.y * chase },
      dt,
      9,
      6,
    );
  }
  g.fragments = g.fragments.filter((p) => {
    if (distance(p, g.player) >= 21) return true;
    g.fragmentCount++;
    if (g.fragmentCount === 3) g.portalActivation = 0.7;
    return false;
  });
  g.powers = g.powers.filter((p) => {
    if (distance(p, g.player) >= 20) return true;
    if (p.kind === 'heal' && g.lives === 3) return true;
    if (p.kind === 'heal') g.lives = Math.min(3, g.lives + 1);
    if (p.kind === 'shield') g.shield = true;
    if (p.kind === 'speed') g.speedTimer = 5;
    return false;
  });
  if (
    distance(g.player, g.serpent) < 25 &&
    g.chaseDelay <= 0 &&
    g.invulnerable <= 0
  ) {
    if (g.shield) {
      g.shield = false;
      g.invulnerable = 1.5;
      g.serpent = { ...SERPENT_SPAWN };
    } else {
      g.lives--;
      if (g.lives <= 0) g.finished = true;
      else {
        g.player = playerRespawn(g.fragmentCount);
        g.serpent = { ...SERPENT_SPAWN };
        g.velocity = { x: 0, y: 0 };
        g.path = [];
        g.invulnerable = RESPAWN_INVULNERABILITY;
      }
    }
  }
  if (
    !g.finished &&
    g.fragmentCount === 3 &&
    g.portalActivation <= 0 &&
    distance(g.player, PORTAL_POSITION) < 24
  ) {
    g.finished = true;
    g.victory = true;
  }
  return g;
}
function replay(frames: unknown, allowAssist: boolean): SnakeReplay | null {
  if (
    !Array.isArray(frames) ||
    !frames.length ||
    frames.length > SNAKE_PROOF_MAX_FRAMES
  )
    return null;
  const g = createSnakeReplay();
  try {
    for (const f of frames) {
      if (
        !Array.isArray(f) ||
        f.length !== 6 ||
        ![f[0], f[1], f[2]].every(Number.isFinite) ||
        f[0] < 0 ||
        f[0] > 0.033 ||
        Math.abs(f[1]) > 1 ||
        Math.abs(f[2]) > 1 ||
        Math.hypot(f[1], f[2]) > 1.000000000000001 ||
        ![f[3], f[4], f[5]].every((v) => typeof v === 'boolean') ||
        (!allowAssist && f[5])
      )
        return null;
      stepSnakeReplay(g, f as SnakeFrame);
    }
  } catch {
    return null;
  }
  return g;
}
export function verifySnakeProof(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const p = value as SnakeProof;
  if (
    Object.keys(p).some((k) => !['frames', 'losses'].includes(k)) ||
    !Array.isArray(p.losses) ||
    p.losses.length > 2
  )
    return false;
  if (
    !Array.isArray(p.frames) ||
    p.frames.length +
      p.losses.reduce(
        (n, f) =>
          n + (Array.isArray(f) ? f.length : SNAKE_PROOF_MAX_FRAMES + 1),
        0,
      ) >
      SNAKE_PROOF_MAX_FRAMES
  )
    return false;
  for (const loss of p.losses) {
    const g = replay(loss, false);
    if (!g?.finished || g.victory) return false;
  }
  return replay(p.frames, p.losses.length === 2)?.victory === true;
}
