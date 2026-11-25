'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import * as T from 'three';
import type { Appearance } from '../journey/domain/traveler';
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
  appearance, playing, completed, onStart, onComplete, onUnavailable,
}: {
  appearance: Appearance;
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
      renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'default' });
    } catch {
      unavailable();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.BasicShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.append(renderer.domElement);
    const world = buildDayOneWorld(appearance);
    const camera = new T.PerspectiveCamera(49, 1, 0.1, 125);
    camera.position.set(0, 4.1, 15);
    const target = new T.Vector3(0, 1.05, 2);
    const desired = new T.Vector3();
    const look = new T.Vector3();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let time = 0;
    let elapsed = 0;
    let last = 0;
    let close = false;
    let lastCaption = 0;
    let done = false;
    let lastLight = -1;
    let visible = false;
    const resize = new ResizeObserver(() => {
      const { clientWidth: width, clientHeight: height } = container;
      visible = width > 0 && height > 0;
      if (!visible) {
        clearInput();
        return;
      }
      camera.aspect = width / height;
      camera.fov = width < height ? 59 : 49;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    });
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
      const dt = last === 0 ? 0 : Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;
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
      world.legs.forEach((leg, index) => {
        leg.rotation.x = walking && !reduced.matches ? Math.sin(time * 12 + index * Math.PI) * 0.43 : 0;
      });
      world.crystal.position.y = 1.28 + (reduced.matches ? 0 : Math.sin(time * 2.4) * 0.18);
      if (!reduced.matches) world.crystal.rotation.y = time * 0.72;
      const isNear = Math.hypot(actor.x, actor.z - LIGHT_MARKER_Z) < 2.6;
      if (isNear !== close) {
        close = isNear;
        setNear(close);
      }
      if (playing && !reduced.matches) {
        const sweep = T.MathUtils.smoothstep(lit, 0, 1);
        desired.set(-1 + sweep * 7, 3.8 + sweep * 2.5, -7 + sweep * 1.2);
        look.set(-0.9 - sweep * 4, 2.2 + sweep * 1.6, -21);
      } else {
        desired.set(actor.x, 3.55, actor.z + 6.2);
        look.set(actor.x, 1.15, actor.z - 4.7);
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
  }, [appearance]);

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
      <header className={css.title}>
        <small>Gênesis 1:3–5 · Representação artística</small>
        <h2>Dia 1 — Luz e trevas</h2>
      </header>
      <span id="creation-3d-controls" hidden>Use WASD, setas ou os controles de toque. Pressione E ao alcançar o marco.</span>
      {playing ? (
        <div className={css.caption}>
          <p aria-live="polite">{captions[caption]}</p>
          <button type="button" onClick={onComplete}>Ir para a pergunta</button>
        </div>
      ) : (
        <>
          <p className={css.hint}>
            {completed ? 'Luz e trevas separadas. Responda ao desafio.' :
              near ? 'Marco da luz ao alcance.' : 'Siga o caminho de pedra até o marco da luz.'}
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
