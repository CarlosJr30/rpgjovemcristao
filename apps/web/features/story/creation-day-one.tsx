'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import * as T from 'three';
import type { Appearance, AvatarConfig } from '../journey/domain/traveler';
import {
  buildDayOneWorld, LIGHT_MARKER_Z, SEPARATION_SECONDS, walkDayOne,
} from './creation-day-one-world';
import css from './creation-day-one.module.css';

const directions = [
  { key: 'arrowup', symbol: '↑', label: 'Avançar' },
  { key: 'arrowleft', symbol: '←', label: 'Mover à esquerda' },
  { key: 'arrowdown', symbol: '↓', label: 'Recuar' },
  { key: 'arrowright', symbol: '→', label: 'Mover à direita' },
] as const;
const movement = new Set(['w', 'a', 's', 'd', ...directions.map(({ key }) => key)]);
const captions = [
  'O relato começa em trevas.',
  'Deus diz que haja luz. A luz aparece.',
  'Deus separa a luz das trevas e as chama Dia e Noite.',
];

export default function CreationDayOne({
  appearance, identity, playing, completed, onStart, onComplete, onUnavailable,
}: {
  appearance: Appearance;
  identity?: AvatarConfig;
  playing: boolean;
  completed: boolean;
  onStart: () => void;
  onComplete: () => void;
  onUnavailable: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const keys = useRef(new Set<string>());
  const touches = useRef(new Map<number, string>());
  const [near, setNear] = useState(false);
  const [caption, setCaption] = useState(0);
  const finish = useEffectEvent(onComplete);
  const unavailable = useEffectEvent(onUnavailable);
  const phase = useEffectEvent(() => ({ playing, completed }));
  const clearInput = () => { keys.current.clear(); touches.current.clear(); };

  useEffect(() => {
    const container = host.current!;
    let renderer: T.WebGLRenderer;
    try {
      const compact = window.matchMedia('(pointer: coarse), (max-width: 640px)').matches;
      renderer = new T.WebGLRenderer({ antialias: !compact, powerPreference: 'default' });
    } catch {
      unavailable();
      return;
    }
    const compact = window.matchMedia('(pointer: coarse), (max-width: 640px)').matches;
    const pixelBudget = compact ? 860_000 : 2_073_600;
    const preferredRatio = Math.min(window.devicePixelRatio || 1, compact ? 1.35 : 1.8);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.append(renderer.domElement);
    const world = buildDayOneWorld(appearance, identity, compact);
    const camera = new T.PerspectiveCamera(49, 1, 0.1, 150);
    camera.position.set(0, 3.3, 13.5);
    const target = new T.Vector3(0, 1.05, 2);
    const desired = new T.Vector3();
    const look = new T.Vector3();
    const sweepPosition = new T.Vector3();
    const sweepTarget = new T.Vector3();
    const shot = new T.CubicBezierCurve3(
      new T.Vector3(0.2, 3.1, -5.2),
      new T.Vector3(6.8, 4.8, -8.2),
      new T.Vector3(8.6, 7.6, -11.4),
      new T.Vector3(3.4, 6.5, -12),
    );
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let time = 0;
    let elapsed = 0;
    let last = 0;
    let close = false;
    let lastCaption = 0;
    let done = false;
    let lastLight = -1;
    let visible = false;
    let quality = 1;
    let frameTime = 16;
    let slowTime = 0;
    let stride = 0;
    let walkBlend = 0;
    function fitViewport() {
      const { clientWidth: width, clientHeight: height } = container;
      visible = width > 0 && height > 0;
      if (!visible) {
        clearInput();
        return;
      }
      camera.aspect = width / height;
      camera.fov = width < height ? 55 : 46;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(preferredRatio, Math.sqrt(pixelBudget / (width * height))) * quality);
      renderer.setSize(width, height, false);
    }
    const resize = new ResizeObserver(fitViewport);
    resize.observe(container);
    const lost = (event: Event) => {
      event.preventDefault();
      renderer.setAnimationLoop(null);
      unavailable();
    };
    renderer.domElement.addEventListener('webglcontextlost', lost);
    window.addEventListener('blur', clearInput);
    document.addEventListener('visibilitychange', clearInput);
    renderer.setAnimationLoop((now) => {
      if (!visible || document.hidden) {
        last = 0;
        return;
      }
      const frame = last === 0 ? 16 : now - last;
      const dt = last === 0 ? 0 : Math.min(frame / 1000, 0.05);
      last = now;
      time += dt;
      if (frame < 250) {
        frameTime += (frame - frameTime) * 0.05;
        slowTime = frameTime > 27 ? slowTime + dt : 0;
        if (slowTime > 2.1 && quality > 0.76) {
          quality = Math.max(0.76, quality - 0.12);
          slowTime = 0;
          fitViewport();
        }
      }
      const { playing, completed } = phase();
      const actor = world.avatar.position;
      if (playing && !done) {
        elapsed += dt;
        const next = elapsed >= 5 ? 2 : elapsed >= 2 ? 1 : 0;
        if (next !== lastCaption) {
          lastCaption = next;
          setCaption(next);
        }
        if (elapsed >= SEPARATION_SECONDS) {
          done = true;
          finish();
        }
      }
      const lit = completed ? 1 : Math.min(1, elapsed / SEPARATION_SECONDS);
      if (lit !== lastLight) {
        world.illuminate(lit);
        lastLight = lit;
      }
      world.updateAtmosphere(reduced.matches ? 0 : time);
      const held = [...touches.current.values()];
      const down = (key: string) => keys.current.has(key) || held.includes(key);
      const dx = Number(down('d') || down('arrowright')) - Number(down('a') || down('arrowleft'));
      const dz = Number(down('s') || down('arrowdown')) - Number(down('w') || down('arrowup'));
      const walking = !playing && (dx !== 0 || dz !== 0);
      if (walking) {
        const next = walkDayOne(actor.x, actor.z, dx, dz, dt);
        actor.set(next.x, 0, next.z);
        const facing = Math.atan2(-dx, -dz);
        const angle = facing - world.avatar.rotation.y;
        world.avatar.rotation.y += Math.atan2(Math.sin(angle), Math.cos(angle)) * (1 - Math.exp(-dt * 14));
      }
      walkBlend = T.MathUtils.damp(walkBlend, walking && !reduced.matches ? 1 : 0, 9, dt);
      stride += dt * (7 + walkBlend * 5);
      world.legs.forEach((leg, index) => {
        const swing = Math.sin(stride + index * Math.PI) * walkBlend;
        leg.rotation.x = swing * 0.51;
        world.arms[index].rotation.x = -swing * 0.36;
      });
      world.torso.position.y = reduced.matches ? 0 :
        Math.abs(Math.sin(stride)) * walkBlend * 0.048 + Math.sin(time * 2.8) * (1 - walkBlend) * 0.017;
      world.cloak.rotation.x = 0.14 + walkBlend * (0.13 + Math.sin(stride) * 0.045);
      world.crystal.position.y = 1.28 + (reduced.matches ? 0 : Math.sin(time * 2.4) * 0.18);
      if (!reduced.matches) world.crystal.rotation.y = time * 0.72;
      const isNear = Math.hypot(actor.x, actor.z - LIGHT_MARKER_Z) < 2.6;
      if (isNear !== close) {
        close = isNear;
        setNear(close);
      }
      desired.set(actor.x * 0.90 + 0.46, 3.1, actor.z + (compact ? 5.4 : 5.1));
      look.set(actor.x * 0.84, 1.26, actor.z - 3.7);
      if (playing && !reduced.matches) {
        const sweep = T.MathUtils.smoothstep(lit, 0.05, 0.94);
        const weight = T.MathUtils.smoothstep(lit, 0, 0.20) *
          (1 - T.MathUtils.smoothstep(lit, 0.86, 1));
        shot.getPoint(sweep, sweepPosition);
        sweepTarget.set(-2.2 - sweep * 2.8, 2.7 + sweep * 0.7, -24 - sweep * 3);
        desired.lerp(sweepPosition, weight);
        look.lerp(sweepTarget, weight);
      }
      target.lerp(look, 1 - Math.exp(-dt * (playing ? 2.5 : 6)));
      camera.position.lerp(desired, 1 - Math.exp(-dt * 4));
      camera.lookAt(target);
      renderer.render(world.scene, camera);
      if (!container.dataset.ready) container.dataset.ready = 'true';
    });
    viewport.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener('blur', clearInput);
      document.removeEventListener('visibilitychange', clearInput);
      resize.disconnect();
      renderer.setAnimationLoop(null);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      world.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      delete container.dataset.ready;
    };
  }, [appearance, identity]);

  return (
    <div
      className={css.scene}
      ref={viewport}
      tabIndex={0}
      role="group"
      aria-label="Exploração 3D do Dia 1"
      aria-describedby="creation-3d-controls"
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) clearInput(); }}
      onKeyDown={(event) => {
        const key = event.key.toLowerCase();
        if (event.altKey || event.metaKey || event.ctrlKey) return;
        if (movement.has(key)) {
          event.preventDefault();
          keys.current.add(key);
        } else if (event.target === event.currentTarget && !event.repeat && near &&
          !playing && !completed && (key === 'e' || key === 'enter')) {
          event.preventDefault();
          onStart();
        }
      }}
      onKeyUp={(event) => keys.current.delete(event.key.toLowerCase())}
    >
      <div ref={host} className={css.canvas} />
      <header className={css.title} data-playing={playing}>
        <small>Gênesis 1:3–5 · Representação artística</small>
        <h2>Dia 1 — Luz e trevas</h2>
      </header>
      <span id="creation-3d-controls" hidden>Use WASD, setas ou os controles de toque. Pressione E ao alcançar o marco.</span>
      {playing ? (
        <div className={css.caption}>
          <small>Gênesis 1:3–5</small>
          <p aria-live="polite">{captions[caption]}</p>
          <button type="button" onClick={onComplete}>Ir para a pergunta</button>
        </div>
      ) : (
        <>
          <p className={css.hint}>
            {completed ? 'Luz e trevas separadas. Responda ao desafio.' :
              near ? 'Marco da luz ao alcance.' : 'Encontre o Marco da luz.'}
          </p>
          <div className={css.pad} aria-label="Controles de movimento">
            {directions.map(({ key, symbol, label }) => (
              <button
                type="button" key={key} aria-label={label}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  touches.current.set(event.pointerId, key);
                }}
                onLostPointerCapture={(event) => touches.current.delete(event.pointerId)}
                onPointerUp={(event) => touches.current.delete(event.pointerId)}
                onPointerCancel={(event) => touches.current.delete(event.pointerId)}
              >{symbol}</button>
            ))}
          </div>
          {near && !completed && <button className={css.interact} onClick={onStart}>Observar o marco · E</button>}
        </>
      )}
    </div>
  );
}
