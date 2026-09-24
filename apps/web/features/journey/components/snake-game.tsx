'use client';
import { useEffect, useRef, useState } from 'react';
import styles from '../journey.module.css';
type P = { x: number; y: number };
type Props = { onComplete: () => void };
type Status = 'playing' | 'won' | 'lost';
const W = 720,
  H = 420,
  R = 14;
const walls = [
  { x: 0, y: 0, w: 720, h: 18 },
  { x: 0, y: 402, w: 720, h: 18 },
  { x: 0, y: 0, w: 18, h: 420 },
  { x: 702, y: 0, w: 18, h: 420 },
  { x: 130, y: 18, w: 22, h: 128 },
  { x: 130, y: 250, w: 22, h: 152 },
  { x: 290, y: 18, w: 22, h: 110 },
  { x: 290, y: 245, w: 22, h: 157 },
  { x: 455, y: 18, w: 22, h: 130 },
  { x: 455, y: 270, w: 22, h: 132 },
  { x: 570, y: 18, w: 22, h: 95 },
  { x: 570, y: 230, w: 22, h: 172 },
  { x: 18, y: 180, w: 110, h: 22 },
  { x: 170, y: 180, w: 95, h: 22 },
  { x: 330, y: 180, w: 100, h: 22 },
  { x: 500, y: 180, w: 95, h: 22 },
];
const apples = [
    { x: 75, y: 80 },
    { x: 215, y: 75 },
    { x: 365, y: 75 },
    { x: 650, y: 75 },
    { x: 80, y: 330 },
    { x: 220, y: 330 },
    { x: 370, y: 330 },
    { x: 650, y: 330 },
  ],
  fragments = [
    { x: 215, y: 145 },
    { x: 515, y: 275 },
  ],
  powers = [
    { x: 365, y: 315 },
    { x: 640, y: 145 },
  ],
  exit = { x: 665, y: 210 };
const distance = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
const blocked = (p: P) =>
  walls.some(
    (w) =>
      p.x + R > w.x &&
      p.x - R < w.x + w.w &&
      p.y + R > w.y &&
      p.y - R < w.y + w.h,
  );
export function SnakeGame({ onComplete }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null),
    keys = useRef<P>({ x: 0, y: 0 }),
    player = useRef<P>({ x: 55, y: 330 }),
    snake = useRef<P>({ x: 650, y: 75 }),
    velocity = useRef<P>({ x: 0, y: 0 }),
    snakeMode = useRef<'PATROL' | 'CHASE' | 'INTERCEPT' | 'HUNT'>('PATROL'),
    applesLeft = useRef(apples.map((p) => ({ ...p }))),
    fragmentsLeft = useRef(fragments.map((p) => ({ ...p }))),
    powersLeft = useRef(powers.map((p) => ({ ...p })));
  const [hud, setHud] = useState({
      lives: 3,
      score: 0,
      fragments: 0,
      time: 0,
      boost: 0,
      message: 'Colete as maçãs e os Fragmentos de Sabedoria.',
    }),
    [status, setStatus] = useState<Status>('playing'),
    [resetKey, setResetKey] = useState(0);
  const reset = () => {
    player.current = { x: 55, y: 330 };
    snake.current = { x: 650, y: 75 };
    velocity.current = { x: 0, y: 0 };
    applesLeft.current = apples.map((p) => ({ ...p }));
    fragmentsLeft.current = fragments.map((p) => ({ ...p }));
    powersLeft.current = powers.map((p) => ({ ...p }));
    setHud({
      lives: 3,
      score: 0,
      fragments: 0,
      time: 0,
      boost: 0,
      message: 'Colete as maçãs e os Fragmentos de Sabedoria.',
    });
    setStatus('playing');
    setResetKey((v) => v + 1);
  };
  useEffect(() => {
    const map: Record<string, P> = {
      w: { x: 0, y: -1 },
      ArrowUp: { x: 0, y: -1 },
      s: { x: 0, y: 1 },
      ArrowDown: { x: 0, y: 1 },
      a: { x: -1, y: 0 },
      ArrowLeft: { x: -1, y: 0 },
      d: { x: 1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    };
    const down = (e: KeyboardEvent) => {
      if (map[e.key]) {
        e.preventDefault();
        keys.current = map[e.key];
      }
    };
    addEventListener('keydown', down);
    return () => removeEventListener('keydown', down);
  }, []);
  useEffect(() => {
    const el = canvas.current,
      ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    let raf = 0,
      last = performance.now(),
      elapsed = 0,
      ui = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.035, (now - last) / 1000);
      last = now;
      if (status === 'playing') {
        elapsed += dt;
        const p = player.current,
          k = keys.current,
          wanted = { x: k.x * 125, y: k.y * 125 },
          probe = { x: p.x + wanted.x * 0.12, y: p.y + wanted.y * 0.12 };
        if ((k.x || k.y) && !blocked(probe)) velocity.current = wanted;
        const n = {
          x: p.x + velocity.current.x * dt,
          y: p.y + velocity.current.y * dt,
        };
        if (!blocked({ x: n.x, y: p.y })) p.x = n.x;
        if (!blocked({ x: p.x, y: n.y })) p.y = n.y;
        const phase = Math.floor(elapsed / 7) % 4;
        snakeMode.current =
          phase === 0
            ? 'PATROL'
            : phase === 1
              ? 'CHASE'
              : phase === 2
                ? 'INTERCEPT'
                : 'HUNT';
        const lead =
          snakeMode.current === 'INTERCEPT'
            ? {
                x: p.x + velocity.current.x * 0.7,
                y: p.y + velocity.current.y * 0.7,
              }
            : p;
        const sTarget =
          snakeMode.current === 'PATROL'
            ? {
                x: p.x + Math.sin(elapsed) * 100,
                y: p.y + Math.cos(elapsed) * 70,
              }
            : lead;
        const s = snake.current,
          dx = sTarget.x - s.x,
          dy = sTarget.y - s.y,
          axis =
            Math.abs(dx) > Math.abs(dy)
              ? { x: Math.sign(dx), y: 0 }
              : { x: 0, y: Math.sign(dy) },
          speed =
            hud.boost > 0
              ? 28
              : (snakeMode.current === 'HUNT' ? 92 : 68) +
                Math.min(38, elapsed * 0.9),
          sn = { x: s.x + axis.x * speed * dt, y: s.y + axis.y * speed * dt };
        if (!blocked(sn)) {
          s.x = sn.x;
          s.y = sn.y;
        } else {
          const side = { x: axis.y, y: axis.x },
            alt = {
              x: s.x + side.x * speed * dt,
              y: s.y + side.y * speed * dt,
            };
          if (!blocked(alt)) {
            s.x = alt.x;
            s.y = alt.y;
          }
        }
        const collect = (list: P[], fn: () => void) => {
          for (let i = list.length - 1; i >= 0; i--)
            if (distance(p, list[i]) < 25) {
              list.splice(i, 1);
              fn();
            }
        };
        collect(applesLeft.current, () =>
          setHud((h) => ({
            ...h,
            score: h.score + 100,
            message: 'Maçã coletada!',
          })),
        );
        collect(fragmentsLeft.current, () =>
          setHud((h) => ({
            ...h,
            fragments: h.fragments + 1,
            boost: 6,
            message: 'Fragmento de Sabedoria: serpente vulnerável!',
          })),
        );
        collect(powersLeft.current, () =>
          setHud((h) => ({ ...h, boost: 6, message: 'Power-up ativado!' })),
        );
        if (distance(p, s) < 25) {
          setHud((h) => {
            const lives = h.lives - 1;
            if (lives <= 0) setStatus('lost');
            return {
              ...h,
              lives,
              message: lives
                ? 'Você foi atingido!'
                : 'A serpente alcançou você.',
            };
          });
          p.x = 55;
          p.y = 330;
        }
        if (distance(p, exit) < 25) {
          if (fragmentsLeft.current.length === 0) {
            setStatus('won');
            onComplete();
          } else
            setHud((h) => ({
              ...h,
              message: 'A saída está selada: encontre os dois Fragmentos.',
            }));
        }
        if (hud.boost > 0)
          setHud((h) => ({ ...h, boost: Math.max(0, h.boost - dt) }));
        ui += dt;
        if (ui > 0.12) {
          ui = 0;
          setHud((h) => ({ ...h, time: Math.floor(elapsed) }));
        }
      }
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#6b985a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#80aa66';
      for (let x = 35; x < W - 20; x += 58)
        for (let y = 35; y < H - 20; y += 58) {
          ctx.beginPath();
          ctx.arc(x, y, 16, 0, Math.PI * 2);
          ctx.fill();
        }
      ctx.fillStyle = '#355a3b';
      walls.forEach((w) => {
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = '#567844';
        ctx.fillRect(w.x + 3, w.y + 3, w.w - 6, 5);
        ctx.fillStyle = '#355a3b';
      });
      ctx.fillStyle = '#4b9aa4';
      ctx.fillRect(315, 204, 140, 30);
      ctx.fillStyle = '#e2bd58';
      ctx.fillRect(exit.x - 18, exit.y - 22, 36, 44);
      const icon = (p: P, s: string, c: string) => {
        ctx.beginPath();
        ctx.fillStyle = c;
        ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '22px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s, p.x, p.y);
      };
      applesLeft.current.forEach((p) => icon(p, '🍎', '#6b985a'));
      fragmentsLeft.current.forEach((p) => icon(p, '✨', '#7266a8'));
      powersLeft.current.forEach((p) => icon(p, '⚡', '#4c8999'));
      icon(snake.current, '🐍', '#c95849');
      icon(player.current, '🧭', '#edc866');
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hud.boost, onComplete, resetKey, status]);
  return (
    <div className={styles.arcadeGame}>
      <div className={styles.arcadeHud}>
        <span>❤️ {hud.lives}</span>
        <span>🍎 {hud.score}</span>
        <span>✨ {hud.fragments}/2</span>
        <span>⏱ {hud.time}s</span>
      </div>
      <p className={styles.arcadeMessage}>
        {hud.message}
        {hud.boost > 0 && ' · Fragmento ativo ' + Math.ceil(hud.boost) + 's'}
      </p>
      <canvas
        ref={canvas}
        width={W}
        height={H}
        className={styles.arcadeCanvas}
        role="application"
        aria-label="Fuga da Serpente, labirinto arcade"
      />
      <div className={styles.touchPad} aria-label="Controles touch">
        <button
          onClick={() => (keys.current = { x: 0, y: -1 })}
          aria-label="Andar para cima"
        >
          ▲
        </button>
        <button
          onClick={() => (keys.current = { x: -1, y: 0 })}
          aria-label="Andar para esquerda"
        >
          ◀
        </button>
        <button
          onClick={() => (keys.current = { x: 0, y: 1 })}
          aria-label="Andar para baixo"
        >
          ▼
        </button>
        <button
          onClick={() => (keys.current = { x: 1, y: 0 })}
          aria-label="Andar para direita"
        >
          ▶
        </button>
      </div>
      {status !== 'playing' && (
        <div className={styles.arcadeResult}>
          <strong>
            {status === 'won' ? 'VITÓRIA!' : 'A SERPENTE ALCANÇOU VOCÊ'}
          </strong>
          <button
            className={styles.primaryLink}
            onClick={status === 'won' ? onComplete : reset}
          >
            {status === 'won' ? 'Continuar para o Quiz →' : 'Tentar novamente'}
          </button>
        </div>
      )}
    </div>
  );
}
