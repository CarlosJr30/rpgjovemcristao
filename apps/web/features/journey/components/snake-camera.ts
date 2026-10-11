import {
  CELL_SIZE,
  GAME_HEIGHT,
  GAME_WIDTH,
  type Point,
} from './snake-game-engine';

export type SnakeRenderProfile = {
  mode: 'desktop' | 'mobile-portrait' | 'mobile-landscape' | 'tablet';
  cameraFollow: boolean;
  actorScale: number;
  pickupScale: number;
};
export type MapFit = {
  scale: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};
export type SnakeView = MapFit & {
  camera: Point;
  worldWidth: number;
  worldHeight: number;
};
/** Backing resolution only: never changes CSS size, camera or simulation time. */
export class SnakeRenderQuality {
  private slowFrames = 0;
  private limited = false;
  reset() {
    this.slowFrames = 0;
    this.limited = false;
  }
  dpr(deviceDpr: number) {
    return this.limited ? 1 : Math.min(2, Math.max(1, deviceDpr || 1));
  }
  observe(frameMs: number, mobile: boolean) {
    this.slowFrames =
      mobile && frameMs > 42 && frameMs < 250 ? this.slowFrames + 1 : 0;
    if (this.slowFrames >= 10) this.limited = true;
  }
}
export function getSnakeRenderProfile(
  width: number,
  height: number,
): SnakeRenderProfile {
  if (width > 1024)
    return {
      mode: 'desktop',
      cameraFollow: false,
      actorScale: 1,
      pickupScale: 1,
    };
  const mode =
    width > height && height <= 500
      ? 'mobile-landscape'
      : width <= 600
        ? 'mobile-portrait'
        : 'tablet';
  return { mode, cameraFollow: true, actorScale: 1.2, pickupScale: 1.16 };
}
export function getMapFit(
  availableWidth: number,
  availableHeight: number,
): MapFit {
  const width = Math.max(1, availableWidth),
    height = Math.max(1, availableHeight);
  const scale = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT);
  return {
    scale,
    offsetX: (width - GAME_WIDTH * scale) / 2,
    offsetY: (height - GAME_HEIGHT * scale) / 2,
    width: GAME_WIDTH * scale,
    height: GAME_HEIGHT * scale,
  };
}
/** Visual coordinates only. The grid, collision positions and chase clock are untouched. */
export function getSnakeView(
  width: number,
  height: number,
  player: Point,
  previous: Point | null,
  follow: boolean,
  reducedMotion: boolean,
  dt: number,
): SnakeView {
  width = Math.max(1, width);
  height = Math.max(1, height);
  if (!follow)
    return {
      ...getMapFit(width, height),
      camera: { x: 0, y: 0 },
      worldWidth: GAME_WIDTH,
      worldHeight: GAME_HEIGHT,
    };
  const desiredCell = Math.max(40, Math.min(48, Math.min(width, height) / 8));
  // Cover prevents empty strips even for tall portrait/fullscreen surfaces.
  const scale = Math.max(
    desiredCell / CELL_SIZE,
    width / GAME_WIDTH,
    height / GAME_HEIGHT,
  );
  const worldWidth = width / scale,
    worldHeight = height / scale;
  const limitX = Math.max(0, GAME_WIDTH - worldWidth),
    limitY = Math.max(0, GAME_HEIGHT - worldHeight);
  const clamp = (value: number, limit: number) =>
    Math.max(0, Math.min(limit, value));
  const target = {
    x: clamp(player.x - worldWidth / 2, limitX),
    y: clamp(player.y - worldHeight / 2, limitY),
  };
  const factor =
    !previous || reducedMotion ? 1 : 1 - Math.exp(-14 * Math.max(0, dt));
  const camera = {
    x: clamp(
      previous ? previous.x + (target.x - previous.x) * factor : target.x,
      limitX,
    ),
    y: clamp(
      previous ? previous.y + (target.y - previous.y) * factor : target.y,
      limitY,
    ),
  };
  return {
    scale,
    camera,
    worldWidth,
    worldHeight,
    offsetX: -camera.x * scale,
    offsetY: -camera.y * scale,
    width: GAME_WIDTH * scale,
    height: GAME_HEIGHT * scale,
  };
}
