'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { SnakeInput, type SnakeDirection } from './snake-input';
import { gameAudio } from '../audio/audio-manager';
import {
  CELL_SIZE,
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_MAX_SPEED,
  CHASE_START_DELAY,
  RESPAWN_INVULNERABILITY,
  PLAYER_SPAWN,
  PORTAL_POSITION,
  SERPENT_MAP,
  SERPENT_SPAWN,
  approach,
  cellCenter,
  effectiveSerpentSpeed,
  findPath,
  moveWithCollision,
  normalizeInput,
  playerRespawn,
  type Point,
} from './snake-game-engine';
import styles from '../journey.module.css';
import type { GameplayPortrait } from '../data/gameplayAvatarPortrait';

type Props = {
  portrait: GameplayPortrait;
  tutorialCompleted: boolean;
  onTutorialComplete: () => void;
  onComplete: () => void;
};
type Status = 'ready' | 'playing' | 'won' | 'lost';
type PowerKind = 'shield' | 'speed' | 'heal';
type Pickup = Point & { id: string };
type PowerPickup = Pickup & { kind: PowerKind };
type Particle = Point & {
  life: number;
  color: string;
  vx: number;
  vy: number;
  sprite?: AssetKey;
  size?: number;
  hudTarget?: Point;
  maxLife?: number;
};
type Hud = {
  lives: number;
  lightFragments: number;
  score: number;
  fragments: number;
  portalActivating: boolean;
  time: number;
  message: string;
  shield: boolean;
  speed: number;
  danger: number;
  distance: number;
};
type CanvasViewport = { width: number; height: number; dpr: number };
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

export function getSnakeRenderProfile(
  screenWidth: number,
  screenHeight: number,
): SnakeRenderProfile {
  if (screenWidth > 1024)
    return {
      mode: 'desktop',
      cameraFollow: false,
      actorScale: 1,
      pickupScale: 1,
    };
  if (screenWidth > screenHeight && screenHeight <= 500) {
    return {
      mode: 'mobile-landscape',
      cameraFollow: false,
      actorScale: 1.15,
      pickupScale: 1.15,
    };
  }
  if (screenWidth <= 600)
    return {
      mode: 'mobile-portrait',
      cameraFollow: false,
      actorScale: 1.2,
      pickupScale: 1.16,
    };
  return {
    mode: 'tablet',
    cameraFollow: false,
    actorScale: 1.15,
    pickupScale: 1.12,
  };
}

export function getMapFit(
  availableWidth: number,
  availableHeight: number,
): MapFit {
  const width = Math.max(1, availableWidth);
  const height = Math.max(1, availableHeight);
  const scale = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT);
  const mapWidth = GAME_WIDTH * scale;
  const mapHeight = GAME_HEIGHT * scale;
  return {
    scale,
    offsetX: (width - mapWidth) / 2,
    offsetY: (height - mapHeight) / 2,
    width: mapWidth,
    height: mapHeight,
  };
}

const fragments: readonly Pickup[] = [
  { id: 'fragment-one', ...cellCenter({ col: 3, row: 3 }) },
  { id: 'fragment-two', ...cellCenter({ col: 18, row: 3 }) },
  { id: 'fragment-three', ...cellCenter({ col: 22, row: 9 }) },
];
const lightFragments: readonly Pickup[] = [
  { id: 'light-safe', ...cellCenter({ col: 4, row: 11 }) },
  { id: 'light-branch', ...cellCenter({ col: 11, row: 3 }) },
  { id: 'light-risk-one', ...cellCenter({ col: 20, row: 1 }) },
  { id: 'light-risk-two', ...cellCenter({ col: 16, row: 7 }) },
  { id: 'light-detour', ...cellCenter({ col: 2, row: 5 }) },
  { id: 'light-portal', ...cellCenter({ col: 20, row: 11 }) },
];
const powers: readonly PowerPickup[] = [
  { id: 'power-shield', kind: 'shield', ...cellCenter({ col: 8, row: 5 }) },
  { id: 'power-speed', kind: 'speed', ...cellCenter({ col: 13, row: 11 }) },
  { id: 'power-heal', kind: 'heal', ...cellCenter({ col: 2, row: 1 }) },
];
const assetUrls = {
  serpentIdle: '/assets/minigame/serpent/serpent_idle.png',
  serpentMoveOne: '/assets/minigame/serpent/serpent_move_01.png',
  serpentMoveTwo: '/assets/minigame/serpent/serpent_move_02.png',
  serpentAttack: '/assets/minigame/serpent/serpent_attack.png',
  lightFragment: '/assets/minigame/pickups/light_fragment.png',
  fragment: '/assets/minigame/pickups/wisdom_fragment.png',
  portal: '/assets/minigame/portal/exit_portal.png',
  shield: '/assets/minigame/powerups/powerup_shield.png',
  speed: '/assets/minigame/powerups/powerup_speed.png',
  heal: '/assets/minigame/powerups/powerup_heal.png',
  grass: '/assets/minigame/tiles/tile_grass.png',
  path: '/assets/minigame/tiles/tile_path.png',
  wall: '/assets/minigame/tiles/tile_wall.png',
  tree: '/assets/minigame/tiles/tile_tree.png',
  bridge: '/assets/minigame/tiles/tile_bridge.png',
  bush: '/assets/minigame/tiles/tile_bush.png',
  stone: '/assets/minigame/tiles/tile_stone.png',
  water: '/assets/minigame/tiles/tile_water.png',
  boulder: '/assets/minigame/obstacles/obstacle_boulder.png',
  log: '/assets/minigame/obstacles/obstacle_log.png',
  thorns: '/assets/minigame/obstacles/obstacle_thorns.png',
  organicHedge: '/assets/minigame/obstacles/hedge_cluster_v2.png',
  dust: '/assets/minigame/effects/dust_effect.png',
  collect: '/assets/minigame/effects/collect_effect.png',
  victory: '/assets/minigame/effects/victory_effect.png',
  alert: '/assets/minigame/effects/alert_icon.png',
  gardenBackground: '/assets/world/garden/garden_background_day.png',
} as const;
type AssetKey = keyof typeof assetUrls | 'player';
type RenderableAsset = HTMLImageElement | HTMLCanvasElement;
type SoundEvent =
  | 'ambient_garden'
  | 'serpent_near'
  | 'serpent_attack'
  | 'pickup_light'
  | 'pickup_fragment'
  | 'pickup_powerup'
  | 'portal_open'
  | 'player_hit'
  | 'victory'
  | 'defeat';
const emitSound = (event: SoundEvent) => {
  if (event === 'ambient_garden') gameAudio.setContext('exploration');
  else gameAudio.playEffect(event);
};
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const MAX_PARTICLES = 80;

function createRuntime(reducedMotion: boolean) {
  return {
    player: { ...PLAYER_SPAWN },
    serpent: { ...SERPENT_SPAWN },
    velocity: { x: 0, y: 0 },
    input: new SnakeInput(),
    fragments: fragments.map((item) => ({ ...item })),
    lightFragments: lightFragments.map((item) => ({ ...item })),
    powers: powers.map((item) => ({ ...item })),
    particles: [] as Particle[],
    path: [] as Point[],
    pathTimer: 0,
    chaseDelay: CHASE_START_DELAY,
    dustTimer: 0,
    elapsed: 0,
    lives: 3,
    lightFragmentCount: 0,
    fragmentCount: 0,
    portalActivation: 0,
    shield: false,
    speedTimer: 0,
    invulnerable: 0,
    hurtTimer: 0,
    pickupPulse: 0,
    flash: 0,
    shake: 0,
    distanceTravelled: 0,
    finished: false,
    victory: false,
    serpentDirection: { x: -1, y: 0 },
    camera: { x: 0, y: 130 },
    reducedMotion,
    lastMessage: 'Prepare-se · a perseguição começa em instantes.',
    serpentHintShown: false,
    proximitySoundAt: -Infinity,
    respawnHintShown: false,
    portalHintShown: false,
    explorationHintShown: false,
    lastFragmentAt: 0,
  };
}

export function SnakeChaseGame({
  portrait,
  tutorialCompleted,
  onTutorialComplete,
  onComplete,
}: Props) {
  const fallbackUrl = portrait.fallback?.imageUrl;
  const fallbackX = portrait.fallback?.source.x ?? 0;
  const fallbackY = portrait.fallback?.source.y ?? 0;
  const fallbackWidth = portrait.fallback?.source.width ?? 0;
  const fallbackHeight = portrait.fallback?.source.height ?? 0;
  const stablePortrait = useMemo(
    () => ({
      imageUrl: portrait.imageUrl,
      fallback: fallbackUrl
        ? {
            imageUrl: fallbackUrl,
            source: {
              x: fallbackX,
              y: fallbackY,
              width: fallbackWidth,
              height: fallbackHeight,
            },
          }
        : undefined,
      source: {
        x: portrait.source.x,
        y: portrait.source.y,
        width: portrait.source.width,
        height: portrait.source.height,
      },
    }),
    [
      portrait.imageUrl,
      portrait.source.x,
      portrait.source.y,
      portrait.source.width,
      portrait.source.height,
      fallbackUrl,
      fallbackX,
      fallbackY,
      fallbackWidth,
      fallbackHeight,
    ],
  );
  const canvas = useRef<HTMLCanvasElement>(null);
  const gameSurface = useRef<HTMLDivElement>(null);
  const viewport = useRef<CanvasViewport>({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    dpr: 1,
  });
  const images = useRef<Partial<Record<AssetKey, RenderableAsset>>>({});
  const runtime = useRef(createRuntime(false));
  const [status, setStatus] = useState<Status>('ready');
  const [attempts, setAttempts] = useState(1);
  const [losses, setLosses] = useState(0);
  const [assisted, setAssisted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [fullscreenError, setFullscreenError] = useState('');

  const syncControls = useCallback(() => {
    gameSurface.current
      ?.querySelectorAll<HTMLButtonElement>('button[data-direction]')
      .forEach((button) => {
        button.setAttribute(
          'aria-pressed',
          String(
            runtime.current.input.has(
              button.dataset.direction as SnakeDirection,
            ),
          ),
        );
      });
  }, []);
  const clearInput = useCallback(() => {
    runtime.current.input.clear();
    runtime.current.velocity = { x: 0, y: 0 };
    syncControls();
  }, [syncControls]);
  const [hud, setHud] = useState<Hud>({
    lives: 3,
    lightFragments: 0,
    score: 0,
    fragments: 0,
    portalActivating: false,
    time: 0,
    message: 'Encontre os três Fragmentos de Sabedoria.',
    shield: false,
    speed: 0,
    danger: 0,
    distance: 0,
  });

  const reset = (nextStatus: Status = 'playing') => {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    runtime.current = createRuntime(reduced);
    syncControls();
    setHud({
      lives: 3,
      lightFragments: 0,
      score: 0,
      fragments: 0,
      portalActivating: false,
      time: 0,
      message: 'Encontre os três Fragmentos de Sabedoria.',
      shield: false,
      speed: 0,
      danger: 0,
      distance: 0,
    });
    setStatus(nextStatus);
    setResetKey((value) => value + 1);
  };

  useEffect(() => {
    runtime.current.reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const urls = [
      ...Object.entries(assetUrls),
      ['player', stablePortrait.imageUrl],
    ] as [AssetKey, string][];
    let disposed = false;
    for (const [key, url] of urls) {
      const image = new Image();
      if (
        key === 'player' &&
        stablePortrait.fallback &&
        stablePortrait.fallback.imageUrl !== url
      ) {
        image.onerror = () => {
          if (!disposed && image.src.endsWith(url))
            image.src = stablePortrait.fallback!.imageUrl;
        };
        image.onload = () => {
          if (
            !disposed &&
            image.src.endsWith(url) &&
            (image.naturalWidth !== 1024 || image.naturalHeight !== 1536)
          ) {
            image.src = stablePortrait.fallback!.imageUrl;
          }
        };
      }
      if (key === 'gardenBackground' || key === 'player')
        images.current[key] = image;
      else if (key === 'organicHedge')
        image.onload = () => {
          images.current[key] = image;
          terrainCanvas = null;
        };
      else
        image.onload = () => {
          images.current[key] = cleanMinigameAsset(image);
          terrainCanvas = null;
        };
      image.src = url;
    }
    return () => {
      disposed = true;
    };
  }, [stablePortrait]);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const resizeCanvas = () => {
      const rect = element.getBoundingClientRect();
      const width = Math.max(
        1,
        Math.round(element.clientWidth || rect.width || GAME_WIDTH),
      );
      const height = Math.max(
        1,
        Math.round(element.clientHeight || rect.height || GAME_HEIGHT),
      );
      const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      viewport.current = { width, height, dpr };
      const renderWidth = Math.round(width * dpr);
      const renderHeight = Math.round(height * dpr);
      if (element.width !== renderWidth) element.width = renderWidth;
      if (element.height !== renderHeight) element.height = renderHeight;
    };
    resizeCanvas();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(resizeCanvas);
    observer?.observe(element);
    window.addEventListener('resize', resizeCanvas);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    const relevant = new Set([
      'w',
      'a',
      's',
      'd',
      'W',
      'A',
      'S',
      'D',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
    ]);
    const down = (event: KeyboardEvent) => {
      if (
        status !== 'playing' ||
        !relevant.has(event.key) ||
        (event.target instanceof HTMLElement &&
          event.target.matches(
            'input, textarea, select, [contenteditable="true"]',
          ))
      )
        return;
      event.preventDefault();
      runtime.current.input.key(event.key, true);
      syncControls();
    };
    const up = (event: KeyboardEvent) => {
      runtime.current.input.key(event.key, false);
      syncControls();
    };
    const suspend = () => clearInput();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', suspend);
    document.addEventListener('visibilitychange', suspend);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', suspend);
      document.removeEventListener('visibilitychange', suspend);
      clearInput();
    };
  }, [status, clearInput, syncControls]);

  useEffect(() => {
    document.body.dataset.snakeGameActive =
      status === 'ready' ? 'false' : 'true';
    return () => {
      delete document.body.dataset.snakeGameActive;
    };
  }, [status]);

  useEffect(() => {
    const updateFullscreen = () => {
      setIsFullscreen(document.fullscreenElement === gameSurface.current);
      clearInput();
    };
    document.addEventListener('fullscreenchange', updateFullscreen);
    return () =>
      document.removeEventListener('fullscreenchange', updateFullscreen);
  }, [clearInput]);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context) return;
    let frame = 0;
    let last = performance.now();
    let uiTimer = 0;
    const tick = (now: number) => {
      const game = runtime.current;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (status === 'playing' && !game.finished) {
        game.elapsed += dt;
        const previousDelay = game.chaseDelay;
        game.chaseDelay = Math.max(0, game.chaseDelay - dt);
        if (previousDelay > 0 && game.chaseDelay === 0)
          game.lastMessage = 'A vegetação se move — a Serpente surgiu.';
        game.speedTimer = Math.max(0, game.speedTimer - dt);
        game.invulnerable = Math.max(0, game.invulnerable - dt);
        game.hurtTimer = Math.max(0, game.hurtTimer - dt);
        game.pickupPulse = Math.max(0, game.pickupPulse - dt);
        game.flash = Math.max(0, game.flash - dt);
        game.shake = Math.max(0, game.shake - dt);
        game.portalActivation = Math.max(0, game.portalActivation - dt);
        const input = normalizeInput(game.input.axis());
        const maxSpeed = PLAYER_MAX_SPEED * (game.speedTimer > 0 ? 1.3 : 1);
        const target = { x: input.x * maxSpeed, y: input.y * maxSpeed };
        const responsiveness = input.x || input.y ? 980 : 1250;
        game.velocity.x = approach(
          game.velocity.x,
          target.x,
          responsiveness * dt,
        );
        game.velocity.y = approach(
          game.velocity.y,
          target.y,
          responsiveness * dt,
        );
        const before = { ...game.player };
        game.player = moveWithCollision(game.player, game.velocity, dt);
        game.distanceTravelled += distance(before, game.player);
        game.dustTimer -= dt;
        if (
          !game.reducedMotion &&
          Math.hypot(game.velocity.x, game.velocity.y) > 70 &&
          game.dustTimer <= 0
        ) {
          game.dustTimer = 0.14;
          game.particles.push({
            x: game.player.x,
            y: game.player.y + 2,
            life: 0.38,
            color: '#bea778',
            vx: -game.velocity.x * 0.08,
            vy: -game.velocity.y * 0.08,
            sprite: 'dust',
            size: 20,
          });
        }

        game.pathTimer -= dt;
        if (game.pathTimer <= 0) {
          game.pathTimer = 0.16;
          game.path = findPath(game.serpent, game.player);
        }
        while (game.path.length && distance(game.serpent, game.path[0]) < 7)
          game.path.shift();
        const serpentTarget = game.path[0] ?? game.player;
        const direction = normalizeInput({
          x: serpentTarget.x - game.serpent.x,
          y: serpentTarget.y - game.serpent.y,
        });
        game.serpentDirection = direction;
        if (game.chaseDelay <= 0) {
          if (!game.serpentHintShown) {
            game.serpentHintShown = true;
            game.lastMessage =
              'A Serpente está perseguindo você · use caminhos e obstáculos para ganhar distância.';
          }
          const mobile =
            getSnakeRenderProfile(window.innerWidth, window.innerHeight)
              .mode !== 'desktop';
          const chaseSpeed = effectiveSerpentSpeed(
            game.elapsed,
            game.fragmentCount === 3,
            assisted,
            mobile,
          );
          game.serpent = moveWithCollision(
            game.serpent,
            { x: direction.x * chaseSpeed, y: direction.y * chaseSpeed },
            dt,
            9,
            6,
          );
        }

        collect(game.lightFragments, game.player, 19, (pickup) => {
          game.pickupPulse = 0.18;
          game.lightFragmentCount += 1;
          game.lastMessage = 'FRAGMENTO DE LUZ · +100 pontos';
          burst(game, pickup, '#f6d77a', 8);
          game.particles.push({
            ...pickup,
            life: 0.42,
            color: '#fff',
            vx: 0,
            vy: -18,
            sprite: 'collect',
            size: 34,
          });
          if (!game.reducedMotion)
            game.particles.push({
              ...pickup,
              life: 0.5,
              maxLife: 0.5,
              color: '#f6d77a',
              vx: 0,
              vy: 0,
              size: 6,
              hudTarget: { x: 275, y: 16 },
            });
          emitSound('pickup_light');
        });
        collect(game.fragments, game.player, 21, (pickup) => {
          game.pickupPulse = 0.18;
          game.fragmentCount += 1;
          game.lastFragmentAt = game.elapsed;
          game.lastMessage =
            game.fragmentCount === 3
              ? 'PORTAL ATIVADO · Escape!'
              : `Fragmento encontrado · ${String(game.fragmentCount)} / 3`;
          game.flash = 0.45;
          burst(game, pickup, '#f1d77f', 14);
          game.particles.push({
            ...pickup,
            life: 0.55,
            color: '#fff',
            vx: 0,
            vy: -14,
            sprite: 'collect',
            size: 46,
          });
          if (!game.reducedMotion)
            game.particles.push({
              ...pickup,
              life: 0.6,
              maxLife: 0.6,
              color: '#f1d77f',
              vx: 0,
              vy: 0,
              size: 7,
              hudTarget: { x: 185, y: 16 },
            });
          emitSound('pickup_fragment');
          if (game.fragmentCount === 3) {
            game.portalActivation = 0.7;
            game.shake = 0.18;
            emitSound('portal_open');
          }
        });
        collect(game.powers, game.player, 20, (pickup) => {
          if (pickup.kind === 'heal' && game.lives === 3) return false;
          if (pickup.kind === 'shield') game.shield = true;
          if (pickup.kind === 'speed') game.speedTimer = 5;
          if (pickup.kind === 'heal') game.lives = Math.min(3, game.lives + 1);
          game.pickupPulse = 0.18;
          game.lastMessage =
            pickup.kind === 'shield'
              ? 'ESCUDO · protege contra um ataque.'
              : pickup.kind === 'speed'
                ? 'VELOCIDADE · aumenta sua velocidade por 5 segundos.'
                : 'CURA · recupera uma vida.';
          burst(game, pickup, '#9ed5bd', 10);
          emitSound('pickup_powerup');
          return true;
        });

        const serpentDistance = distance(game.player, game.serpent);
        // Match the existing threat sprite range; this changes audio only.
        if (
          game.chaseDelay <= 0 &&
          serpentDistance < 75 &&
          game.elapsed - game.proximitySoundAt >= 4
        ) {
          game.proximitySoundAt = game.elapsed;
          emitSound('serpent_near');
        }
        if (
          serpentDistance < 25 &&
          game.chaseDelay <= 0 &&
          game.invulnerable <= 0
        ) {
          emitSound('serpent_attack');
          if (game.shield) {
            game.shield = false;
            game.invulnerable = 1.5;
            game.serpent = { ...SERPENT_SPAWN };
            game.lastMessage = 'ESCUDO QUEBRADO · Você evitou o impacto.';
          } else {
            game.lives -= 1;
            game.shake = 0.35;
            game.flash = 0.3;
            game.hurtTimer = 0.45;
            emitSound('player_hit');
            if (game.lives <= 0) {
              game.finished = true;
              game.lastMessage = 'A Serpente alcançou você após a última vida.';
              setLosses((value) => value + 1);
              setStatus('lost');
              emitSound('defeat');
            } else {
              game.player = playerRespawn(game.fragmentCount);
              game.serpent = { ...SERPENT_SPAWN };
              game.velocity = { x: 0, y: 0 };
              game.path = [];
              game.invulnerable = RESPAWN_INVULNERABILITY;
              game.lastMessage = game.respawnHintShown
                ? `ATINGIDO · ${String(game.lives)} vidas restantes.`
                : 'Você perdeu uma vida · reapareceu em segurança com proteção temporária.';
              game.respawnHintShown = true;
            }
          }
        }
        if (
          game.fragmentCount < 3 &&
          !game.portalHintShown &&
          distance(game.player, PORTAL_POSITION) < 52
        ) {
          game.portalHintShown = true;
          game.lastMessage =
            'PORTAL INATIVO · reúna os 3 Fragmentos para ativá-lo.';
        }
        if (
          !game.explorationHintShown &&
          game.fragmentCount < 3 &&
          game.elapsed - game.lastFragmentAt > 18
        ) {
          game.explorationHintShown = true;
          game.lastMessage =
            'DICA · explore os caminhos laterais para encontrar Fragmentos.';
        }
        if (
          !game.finished &&
          game.fragmentCount === 3 &&
          game.portalActivation <= 0 &&
          distance(game.player, PORTAL_POSITION) < 24
        ) {
          game.finished = true;
          game.victory = true;
          game.lastMessage = 'Você atravessou o portal e escapou!';
          setStatus('won');
          emitSound('victory');
        }
        updateParticles(game, dt);
        uiTimer += dt;
        if (uiTimer >= 0.1) {
          uiTimer = 0;
          setHud({
            lives: game.lives,
            lightFragments: game.lightFragmentCount,
            score: game.lightFragmentCount * 100,
            fragments: game.fragmentCount,
            portalActivating: game.portalActivation > 0,
            time: Math.floor(game.elapsed),
            message: game.lastMessage,
            shield: game.shield,
            speed: Math.ceil(game.speedTimer),
            danger:
              game.chaseDelay > 0
                ? 0
                : Math.max(0, Math.min(1, 1 - serpentDistance / 220)),
            distance: Math.round(game.distanceTravelled / 10),
          });
        }
      }
      renderGame(
        context,
        runtime.current,
        images.current,
        stablePortrait,
        viewport.current,
        now,
      );
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [assisted, stablePortrait, resetKey, status]);

  const pressDirection = (
    event: ReactPointerEvent<HTMLButtonElement>,
    direction: SnakeDirection,
  ) => {
    if (status !== 'playing') return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    runtime.current.input.pointer(event.pointerId, direction);
    syncControls();
  };
  const releaseDirection = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    runtime.current.input.pointer(event.pointerId, null);
    syncControls();
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const slideDirection = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLButtonElement>('button[data-direction]');
    runtime.current.input.pointer(
      event.pointerId,
      target && gameSurface.current?.contains(target)
        ? (target.dataset.direction as SnakeDirection)
        : null,
    );
    syncControls();
  };
  const retry = () => {
    setAttempts((value) => value + 1);
    reset('playing');
  };
  const exitGame = async () => {
    clearInput();
    if (document.fullscreenElement === gameSurface.current)
      await document.exitFullscreen().catch(() => undefined);
    reset('ready');
  };
  const toggleFullscreen = async () => {
    clearInput();
    setFullscreenError('');
    try {
      if (document.fullscreenElement === gameSurface.current)
        await document.exitFullscreen();
      else if (gameSurface.current?.requestFullscreen)
        await gameSurface.current.requestFullscreen();
      else
        setFullscreenError(
          'Tela cheia indisponível. O modo de jogo continua ocupando a tela no celular.',
        );
    } catch {
      setFullscreenError(
        'Este navegador não abriu tela cheia. Você pode continuar jogando.',
      );
    }
  };

  return (
    <div
      ref={gameSurface}
      className={`${styles.arcadeGame} ${status !== 'ready' ? styles.arcadeGameActive : ''} ${hud.danger > 0.65 ? styles.arcadeDanger : ''}`}
    >
      <div className={styles.arcadeTitle}>
        <span>GRANDE DESAFIO</span>
        <strong>Fuga da Serpente</strong>
        <small>Reúna sabedoria, colete luz e encontre a saída.</small>
      </div>
      <p className={styles.arcadeOrientation}>
        Gire o celular para ampliar o campo. Você também pode jogar em pé.
      </p>
      {status !== 'ready' && (
        <div className={styles.arcadeGameActions}>
          <button
            aria-label={
              isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia'
            }
            onClick={() => void toggleFullscreen()}
          >
            <span aria-hidden="true">⛶</span>
          </button>
          <button onClick={() => void exitGame()}>Sair</button>
        </div>
      )}
      <div className={styles.arcadeHud}>
        <span>
          <b>♥ VIDAS</b>
          <strong>{hud.lives}/3</strong>
        </span>
        <span>
          <b>◆ SABEDORIA</b>
          <strong>{hud.fragments}/3</strong>
        </span>
        <span>
          <b>✦ PONTOS</b>
          <strong>{hud.score}</strong>
        </span>
        <span>
          <b>OBJETIVO</b>
          <strong>
            {hud.portalActivating
              ? 'PORTAL DESPERTANDO'
              : hud.fragments === 3
                ? 'PORTAL ABERTO'
                : 'Reúna os Fragmentos'}
          </strong>
        </span>
      </div>
      <p
        className={styles.arcadeMessage}
        role={fullscreenError ? 'status' : undefined}
      >
        {fullscreenError || hud.message}
      </p>
      <div className={styles.arcadeStage}>
        <canvas
          ref={canvas}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className={styles.arcadeCanvas}
          role="application"
          aria-label="Fuga da Serpente, jogo de perseguição"
        />
        {status === 'ready' && (
          <div className={styles.arcadeOverlay}>
            {!tutorialCompleted ? (
              <div className={styles.snakeTutorial}>
                <span>OBJETIVO</span>
                <h3>Encontre 3 Fragmentos de Sabedoria e escape pelo Portal</h3>
                <div>
                  <p>
                    <b>WASD / SETAS</b>
                    <br />
                    Mover o Viajante
                  </p>
                  <p>
                    <b>◆ SABEDORIA</b>
                    <br />
                    Ativa o Portal em 3/3
                  </p>
                  <p>
                    <b>SERPENTE</b>
                    <br />
                    Use caminhos e obstáculos para ganhar distância
                  </p>
                  <p>
                    <b>✦ LUZ</b>
                    <br />
                    Fragmentos de Luz valem pontos
                  </p>
                </div>
                <small>
                  Escudo protege contra um ataque · Velocidade dá impulso · Cura
                  recupera uma vida.
                </small>
                <button
                  onClick={() => {
                    onTutorialComplete();
                    reset('playing');
                  }}
                >
                  Entendi · começar perseguição
                </button>
              </div>
            ) : (
              <>
                <p>
                  Reúna 3 Fragmentos e alcance o Portal. A perseguição começa
                  após um breve preparo.
                </p>
                <button onClick={() => reset('playing')}>
                  Começar perseguição
                </button>
              </>
            )}
          </div>
        )}
        {status !== 'ready' && status !== 'playing' && (
          <div className={styles.arcadeOverlay}>
            <strong>
              {status === 'won'
                ? 'DESAFIO CONCLUÍDO · VOCÊ ESCAPOU!'
                : 'Você foi alcançado'}
            </strong>
            <div className={styles.arcadeStats}>
              <span>
                Fragmentos <b>{hud.fragments}/3</b>
              </span>
              <span>
                Tempo <b>{hud.time}s</b>
              </span>
              <span>
                Luz{' '}
                <b>
                  {hud.lightFragments}/{lightFragments.length}
                </b>
              </span>
              <span>
                Distância <b>{hud.distance}m</b>
              </span>
              <span>
                Tentativa <b>{attempts}</b>
              </span>
            </div>
            {status === 'lost' && losses >= 2 && !assisted && (
              <button
                className={styles.arcadeAssist}
                onClick={() => {
                  setAssisted(true);
                  retry();
                }}
              >
                Ativar ajuda · Serpente 10% mais lenta
              </button>
            )}
            <div className={styles.arcadeResultActions}>
              <button onClick={retry}>
                {status === 'won' ? 'Jogar novamente' : 'Tentar novamente'}
              </button>
              {status === 'won' && (
                <button onClick={onComplete}>Continuar para o Quiz →</button>
              )}
              <button onClick={() => void exitGame()}>Sair</button>
            </div>
          </div>
        )}
      </div>
      <div className={styles.arcadeTouchPad} aria-label="Controles touch">
        {(
          [
            ['arrowup', 'cima', '▲'],
            ['arrowleft', 'esquerda', '◀'],
            ['arrowdown', 'baixo', '▼'],
            ['arrowright', 'direita', '▶'],
          ] as const
        ).map(([direction, label, symbol]) => (
          <button
            key={direction}
            data-direction={direction}
            aria-pressed="false"
            disabled={status !== 'playing'}
            onPointerDown={(event) => pressDirection(event, direction)}
            onPointerMove={slideDirection}
            onPointerUp={releaseDirection}
            onPointerCancel={releaseDirection}
            onLostPointerCapture={(event) => {
              runtime.current.input.pointer(event.pointerId, null);
              syncControls();
            }}
            onKeyDown={(event) => {
              if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                runtime.current.input.key(direction, true);
                syncControls();
              }
            }}
            onKeyUp={(event) => {
              if (event.key === ' ' || event.key === 'Enter') {
                runtime.current.input.key(direction, false);
                syncControls();
              }
            }}
            onBlur={() => {
              runtime.current.input.key(direction, false);
              syncControls();
            }}
            aria-label={`Mover para ${label}`}
          >
            {symbol}
          </button>
        ))}
      </div>
      <p className={styles.arcadeHelp}>
        WASD ou setas · Touch: use o direcional · Portal inativo até 3
        Fragmentos de Sabedoria · Fragmentos de Luz = pontos ·{' '}
        {assisted ? 'Ajuda ativa' : 'Dificuldade padrão'}
      </p>
    </div>
  );
}

function collect<T extends Point>(
  list: T[],
  player: Point,
  radius: number,
  onCollect: (pickup: T) => boolean | void,
) {
  for (let index = list.length - 1; index >= 0; index -= 1)
    if (distance(player, list[index]) < radius) {
      const pickup = list[index];
      if (onCollect(pickup) !== false) list.splice(index, 1);
    }
}

function burst(
  game: ReturnType<typeof createRuntime>,
  point: Point,
  color: string,
  count: number,
) {
  if (game.reducedMotion) return;
  const available = Math.max(0, MAX_PARTICLES - game.particles.length);
  for (let index = 0; index < Math.min(count, available); index += 1) {
    const angle = (Math.PI * 2 * index) / count;
    game.particles.push({
      ...point,
      life: 0.65,
      color,
      vx: Math.cos(angle) * 48,
      vy: Math.sin(angle) * 48,
    });
  }
}

function updateParticles(game: ReturnType<typeof createRuntime>, dt: number) {
  game.particles = game.particles.slice(-MAX_PARTICLES).filter((particle) => {
    particle.life -= dt;
    if (particle.hudTarget) {
      const travel = Math.min(1, dt / Math.max(dt, particle.life));
      particle.x += (particle.hudTarget.x - particle.x) * travel;
      particle.y += (particle.hudTarget.y - particle.y) * travel;
    } else {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    }
    return particle.life > 0;
  });
}

function renderGame(
  context: CanvasRenderingContext2D,
  game: ReturnType<typeof createRuntime>,
  assets: Partial<Record<AssetKey, RenderableAsset>>,
  portrait: GameplayPortrait,
  viewport: CanvasViewport,
  now: number,
) {
  const profile = getSnakeRenderProfile(window.innerWidth, window.innerHeight);
  const mapFit = getMapFit(viewport.width, viewport.height);
  const worldScale = mapFit.scale;
  const actorScale = Math.max(profile.actorScale, 24 / (56 * worldScale));
  const pickupScale = Math.max(profile.pickupScale, 14 / (29 * worldScale));
  game.camera.x = 0;
  game.camera.y = 0;
  context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
  context.clearRect(0, 0, viewport.width, viewport.height);
  const shakeX = game.reducedMotion
    ? 0
    : (Math.random() - 0.5) * game.shake * 12;
  const shakeY = game.reducedMotion
    ? 0
    : (Math.random() - 0.5) * game.shake * 12;
  const lookX = game.reducedMotion
    ? 0
    : -(game.velocity.x / PLAYER_MAX_SPEED) * 2.5;
  const lookY = game.reducedMotion
    ? 0
    : -(game.velocity.y / PLAYER_MAX_SPEED) * 1.5;
  context.save();
  context.translate(mapFit.offsetX, mapFit.offsetY);
  context.scale(worldScale, worldScale);
  if (profile.mode === 'desktop')
    context.translate(shakeX + lookX, shakeY + lookY);
  drawCover(
    context,
    assets.gardenBackground,
    -5,
    -5,
    GAME_WIDTH + 10,
    GAME_HEIGHT + 10,
    '#58744c',
  );
  const atmosphere = context.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  atmosphere.addColorStop(0, 'rgba(66, 104, 62, .18)');
  atmosphere.addColorStop(1, 'rgba(23, 54, 40, .46)');
  context.fillStyle = atmosphere;
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  drawOrganicTerrain(context, assets, now);

  const portalActive = game.fragmentCount === 3 && game.portalActivation <= 0;
  const portalActivating = game.portalActivation > 0;
  drawGroundShadow(context, PORTAL_POSITION, 28, 8, 0.3);
  context.save();
  context.globalAlpha = portalActive
    ? 0.9 + Math.sin(now / 170) * 0.1
    : portalActivating
      ? 0.35 + (0.7 - game.portalActivation) * 0.75
      : 0.28;
  if (portalActive || portalActivating) {
    context.shadowColor = '#f2d77f';
    context.shadowBlur = 25;
  }
  drawCenteredAsset(
    context,
    assets.portal,
    PORTAL_POSITION,
    portalActive || portalActivating ? 66 : 58,
    portalActive || portalActivating ? '#e0ba58' : '#66705f',
  );
  context.restore();
  if (portalActive || portalActivating) {
    context.fillStyle = 'rgba(255, 231, 151, .9)';
    context.font = '700 10px system-ui';
    context.textAlign = 'center';
    context.fillText(
      portalActivating ? 'DESPERTANDO' : 'PORTAL ABERTO',
      PORTAL_POSITION.x,
      PORTAL_POSITION.y - 35,
    );
  }
  if (game.victory)
    drawCenteredAsset(context, assets.victory, PORTAL_POSITION, 92, '#f3da83');
  game.lightFragments.forEach((item, index) => {
    const point = {
      x: item.x,
      y: item.y + (game.reducedMotion ? 0 : Math.sin(now / 260 + index) * 1.5),
    };
    drawGroundShadow(context, item, 10, 4, 0.26);
    context.save();
    context.shadowColor = '#f6d77a';
    context.shadowBlur = 10 + Math.sin(now / 190 + index) * 3;
    drawCenteredAsset(
      context,
      assets.lightFragment,
      point,
      29 * pickupScale,
      '#f6d77a',
    );
    context.restore();
  });
  game.fragments.forEach((item) => {
    context.save();
    context.shadowColor = '#f7e29a';
    context.shadowBlur = 12 + Math.sin(now / 180) * 5;
    drawGroundShadow(context, item, 12, 4, 0.26);
    drawCenteredAsset(
      context,
      assets.fragment,
      {
        x: item.x,
        y: item.y + (game.reducedMotion ? 0 : Math.sin(now / 220 + item.x) * 2),
      },
      36 * pickupScale,
      '#d8c77c',
    );
    context.restore();
  });
  game.powers.forEach((item) => {
    drawGroundShadow(context, item, 12, 4, 0.24);
    drawCenteredAsset(
      context,
      assets[item.kind],
      item,
      34 * pickupScale,
      '#7eb5a1',
    );
  });
  game.particles.forEach((particle) => {
    context.globalAlpha = Math.max(0, particle.life / 0.65);
    if (particle.sprite)
      drawCenteredAsset(
        context,
        assets[particle.sprite],
        particle,
        particle.size ?? 24,
        particle.color,
      );
    else {
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(
        particle.x,
        particle.y,
        (particle.size ?? 6) / 2,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  });
  context.globalAlpha = 1;

  const serpentDistance = distance(game.player, game.serpent);
  const serpentAsset =
    game.chaseDelay > 0
      ? assets.serpentIdle
      : serpentDistance < 75
        ? assets.serpentAttack
        : Math.floor(now / 180) % 2
          ? assets.serpentMoveOne
          : assets.serpentMoveTwo;
  drawGroundShadow(context, game.serpent, 22, 7, 0.38);
  context.save();
  context.translate(
    game.serpent.x,
    game.serpent.y -
      13 +
      (game.reducedMotion || game.chaseDelay > 0
        ? 0
        : Math.sin(now / 140) * 1.2),
  );
  context.scale(game.serpentDirection.x > 0 ? -1 : 1, 1);
  drawCenteredAsset(
    context,
    serpentAsset ?? assets.serpentIdle,
    { x: 0, y: 0 },
    (serpentDistance < 75 ? 61 : 56) * actorScale,
    '#b74d43',
  );
  context.restore();
  if (game.invulnerable <= 0 || Math.floor(now / 90) % 2 === 0) {
    const moving = Math.hypot(game.velocity.x, game.velocity.y) > 8;
    const bob = moving && !game.reducedMotion ? Math.sin(now / 85) * 1.2 : 0;
    drawGroundShadow(context, game.player, 11, 3, 0.32);
    context.save();
    if (game.shield) {
      context.shadowColor = '#c9f6dc';
      context.shadowBlur = 18;
      context.strokeStyle = 'rgba(201, 246, 220, .78)';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(game.player.x, game.player.y - 12, 15, 0, Math.PI * 2);
      context.stroke();
    }
    context.translate(game.player.x, game.player.y - 12 + bob);
    if (!game.reducedMotion) {
      const sway =
        game.hurtTimer > 0
          ? Math.sin(now / 42) * 0.07
          : game.victory
            ? -0.08
            : moving
              ? Math.sin(now / 95) * 0.025
              : Math.sin(now / 420) * 0.008;
      context.rotate(sway);
      if (game.victory) context.translate(0, -4);
    }
    if (!game.reducedMotion && game.pickupPulse > 0) {
      const scale = 1 + 0.07 * Math.sin((Math.PI * game.pickupPulse) / 0.18);
      context.scale(scale, scale);
    }
    context.scale(actorScale, actorScale);
    drawGameplayPortrait(context, assets.player, portrait, serpentDistance);
    context.restore();
  }
  drawForeground(context, assets, now, game.reducedMotion);
  if (serpentDistance < 210) {
    const danger = Math.max(0, 1 - serpentDistance / 210);
    const gradient = context.createRadialGradient(
      game.player.x,
      game.player.y,
      45,
      game.player.x,
      game.player.y,
      310,
    );
    gradient.addColorStop(0, 'rgba(80, 10, 8, 0)');
    gradient.addColorStop(1, `rgba(92, 15, 10, ${String(danger * 0.38)})`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
  if (game.fragmentCount === 3) {
    context.fillStyle = 'rgba(241, 211, 119, .06)';
    context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
  if (game.flash > 0) {
    context.fillStyle = `rgba(255, 239, 171, ${String(game.flash * 0.55)})`;
    context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
  context.restore();
}

let terrain: {
  ground: Path2D;
  hedges: Path2D;
  decorations: { point: Point; key: AssetKey; size: number }[];
} | null = null;
let terrainCanvas: HTMLCanvasElement | null = null;
function terrainShapes() {
  if (terrain) return terrain;
  const ground = new Path2D();
  const hedges = new Path2D();
  const decorations: { point: Point; key: AssetKey; size: number }[] = [];
  for (let row = 0; row < SERPENT_MAP.length; row += 1)
    for (let col = 0; col < SERPENT_MAP[row].length; col += 1) {
      const wall = SERPENT_MAP[row][col] === '#';
      const hash = (col * 37 + row * 61) % 101;
      const x = col * CELL_SIZE;
      const y = row * CELL_SIZE;
      if (!wall) {
        ground.roundRect(x - 3, y - 3, CELL_SIZE + 6, CELL_SIZE + 6, 10);
        continue;
      }
      const centerX = x + CELL_SIZE / 2;
      const centerY = y + CELL_SIZE / 2;
      const rotation = ((hash % 9) - 4) * 0.08;
      hedges.moveTo(centerX + 21 + (hash % 5), centerY);
      hedges.ellipse(
        centerX,
        centerY,
        21 + (hash % 5),
        17 + ((hash * 3) % 7),
        rotation,
        0,
        Math.PI * 2,
      );
      if (hash % 3 === 0) {
        hedges.moveTo(centerX + 10, centerY - 6);
        hedges.ellipse(
          centerX - 7 + (hash % 4),
          centerY + 5,
          14 + (hash % 4),
          11 + (hash % 5),
          -rotation,
          0,
          Math.PI * 2,
        );
      }
      const touchesPath = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => SERPENT_MAP[row + dy]?.[col + dx] === '.');
      if (
        !touchesPath ||
        hash % 5 === 0 ||
        (row === 6 && (col === 9 || col === 11))
      )
        continue;
      const keys: AssetKey[] = [
        'tree',
        'organicHedge',
        'boulder',
        'organicHedge',
        'organicHedge',
      ];
      const key = keys[hash % keys.length];
      const point = {
        x: x + CELL_SIZE / 2 + (hash % 13) - 6,
        y: y + CELL_SIZE / 2 + ((hash * 3) % 13) - 6,
      };
      decorations.push({
        point,
        key,
        size:
          key === 'tree'
            ? 46 + (hash % 14)
            : key === 'boulder'
              ? 38 + (hash % 12)
              : 42 + (hash % 15),
      });
    }
  terrain = { ground, hedges, decorations };
  return terrain;
}

function drawOrganicTerrain(
  context: CanvasRenderingContext2D,
  assets: Partial<Record<AssetKey, RenderableAsset>>,
  now: number,
) {
  if (!terrainCanvas) {
    const canvas = document.createElement('canvas');
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    const layer = canvas.getContext('2d');
    if (layer) {
      const shapes = terrainShapes();
      const earth = layer.createLinearGradient(0, 0, GAME_WIDTH, GAME_HEIGHT);
      earth.addColorStop(0, 'rgba(133, 121, 73, .64)');
      earth.addColorStop(1, 'rgba(102, 91, 61, .74)');
      layer.fillStyle = earth;
      layer.fill(shapes.ground);
      layer.fillStyle = 'rgba(29, 58, 36, .66)';
      layer.fill(shapes.hedges);
      shapes.decorations.forEach(({ point, key, size }) => {
        drawGroundShadow(layer, point, 16, 6, 0.25);
        drawCenteredAsset(layer, assets[key], point, size, '#31543b');
      });
      terrainCanvas = canvas;
    }
  }
  if (terrainCanvas) context.drawImage(terrainCanvas, 0, 0);
  context.save();
  context.globalAlpha = 0.9 + Math.sin(now / 500) * 0.06;
  drawCenteredAsset(
    context,
    assets.water,
    cellCenter({ col: 9, row: 6 }),
    42,
    '#4e8a8d',
  );
  drawCenteredAsset(
    context,
    assets.water,
    cellCenter({ col: 11, row: 6 }),
    42,
    '#4e8a8d',
  );
  context.restore();
  drawCenteredAsset(
    context,
    assets.bridge,
    cellCenter({ col: 10, row: 6 }),
    48,
    '#9c7a4c',
  );
  drawCenteredAsset(
    context,
    assets.boulder,
    cellCenter({ col: 5, row: 4 }),
    52,
    '#6f695b',
  );
  drawCenteredAsset(
    context,
    assets.log,
    cellCenter({ col: 14, row: 8 }),
    50,
    '#6e4d32',
  );
}

function drawForeground(
  context: CanvasRenderingContext2D,
  assets: Partial<Record<AssetKey, RenderableAsset>>,
  now: number,
  reducedMotion: boolean,
) {
  context.save();
  context.globalAlpha = 0.78;
  const sway = reducedMotion ? 0 : Math.sin(now / 700) * 2;
  drawCenteredAsset(
    context,
    assets.bush,
    { x: 18 + sway, y: GAME_HEIGHT - 12 },
    74,
    '#244d36',
  );
  drawCenteredAsset(
    context,
    assets.tree,
    { x: GAME_WIDTH - 14 - sway, y: GAME_HEIGHT - 24 },
    86,
    '#234732',
  );
  context.restore();
}

function drawGameplayPortrait(
  context: CanvasRenderingContext2D,
  image: RenderableAsset | undefined,
  portrait: GameplayPortrait,
  serpentDistance: number,
) {
  const radius = 13;
  context.fillStyle = '#223b2d';
  context.beginPath();
  context.arc(0, 0, radius + 1.5, 0, Math.PI * 2);
  context.fill();
  context.save();
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.clip();
  if (isRenderable(image)) {
    const source =
      image instanceof HTMLImageElement &&
      portrait.fallback &&
      image.src.endsWith(portrait.fallback.imageUrl)
        ? portrait.fallback.source
        : portrait.source;
    const { x, y, width, height } = source;
    context.drawImage(
      image,
      x,
      y,
      width,
      height,
      -radius,
      -radius,
      radius * 2,
      radius * 2,
    );
  } else {
    context.fillStyle = '#c7a16f';
    context.fillRect(-radius, -radius, radius * 2, radius * 2);
  }
  context.restore();
  context.strokeStyle = serpentDistance < 95 ? '#dc9469' : '#d8c18d';
  context.lineWidth = serpentDistance < 95 ? 2 : 1;
  context.beginPath();
  context.arc(0, 0, radius + 0.5, 0, Math.PI * 2);
  context.stroke();
}

function drawCenteredAsset(
  context: CanvasRenderingContext2D,
  image: RenderableAsset | undefined,
  point: Point,
  size: number,
  fallback: string,
) {
  if (isRenderable(image))
    context.drawImage(
      image,
      point.x - size / 2,
      point.y - size / 2,
      size,
      size,
    );
  else {
    context.fillStyle = fallback;
    context.beginPath();
    context.arc(point.x, point.y, size * 0.35, 0, Math.PI * 2);
    context.fill();
  }
}

function drawGroundShadow(
  context: CanvasRenderingContext2D,
  point: Point,
  radiusX: number,
  radiusY: number,
  opacity: number,
) {
  context.save();
  context.fillStyle = `rgba(12, 26, 17, ${String(opacity)})`;
  context.beginPath();
  context.ellipse(point.x, point.y + 2, radiusX, radiusY, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: RenderableAsset | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  fallback: string,
) {
  if (!isRenderable(image)) {
    context.fillStyle = fallback;
    context.fillRect(x, y, width, height);
    return;
  }
  const sourceWidth =
    image instanceof HTMLImageElement ? image.naturalWidth : image.width;
  const sourceHeight =
    image instanceof HTMLImageElement ? image.naturalHeight : image.height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const cropWidth = width / scale;
  const cropHeight = height / scale;
  context.drawImage(
    image,
    (sourceWidth - cropWidth) / 2,
    (sourceHeight - cropHeight) / 2,
    cropWidth,
    cropHeight,
    x,
    y,
    width,
    height,
  );
}

function isRenderable(
  image: RenderableAsset | undefined,
): image is RenderableAsset {
  return Boolean(
    image &&
    (!(image instanceof HTMLImageElement) ||
      (image.complete && image.naturalWidth)),
  );
}

function cleanMinigameAsset(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = Math.floor(image.naturalHeight * 0.84);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return canvas;
  context.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const brightness = Math.max(
      pixels.data[index],
      pixels.data[index + 1],
      pixels.data[index + 2],
    );
    if (brightness < 24) pixels.data[index + 3] = 0;
    else if (brightness < 52)
      pixels.data[index + 3] = Math.round(
        pixels.data[index + 3] * ((brightness - 24) / 28),
      );
  }
  context.putImageData(pixels, 0, 0);
  return canvas;
}
