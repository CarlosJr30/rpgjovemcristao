'use client';

import { useEffect, useEffectEvent, useRef, useState, type RefObject } from 'react';
import * as T from 'three';
import type { Appearance } from '../journey/domain/traveler';
import { buildSanctuary, sanctuaryHeight, SANCTUARY_PORTAL_Z } from './creation-sanctuary-world';
import css from './creation-sanctuary.module.css';

const directions = [
  { keys: ['w', 'arrowup'], symbol: '↑', label: 'Avançar' },
  { keys: ['a', 'arrowleft'], symbol: '←', label: 'Mover à esquerda' },
  { keys: ['s', 'arrowdown'], symbol: '↓', label: 'Recuar' },
  { keys: ['d', 'arrowright'], symbol: '→', label: 'Mover à direita' },
];
const movement = new Set(directions.flatMap(({ keys }) => keys));

export default function CreationSanctuary({
  appearance, stage, destination, onEnter, onUnavailable,
}: {
  appearance: Appearance;
  stage: RefObject<HTMLDivElement | null>;
  destination: string;
  onEnter: () => void;
  onUnavailable: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const keys = useRef(new Set<string>());
  const touches = useRef(new Map<number, string>());
  const [near, setNear] = useState(false);
  const unavailable = useEffectEvent(onUnavailable);
  const clearInput = () => { keys.current.clear(); touches.current.clear(); };

  useEffect(() => {
    const container = host.current!;
    const compact = window.matchMedia('(pointer: coarse), (max-width: 640px)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: !compact });
    } catch {
      unavailable();
      return;
    }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.append(renderer.domElement);
    const world = buildSanctuary(appearance, compact);
    const camera = new T.PerspectiveCamera(47, 1, 0.1, 145);
    camera.position.set(0.35, 3.0, 9.6);
    const desired = new T.Vector3();
    const target = new T.Vector3(0, 1.55, 0);
    const look = new T.Vector3();
    const maxPixels = compact ? 780_000 : 2_073_600;
    let visible = false;
    const resize = new ResizeObserver(() => {
      const { clientWidth: width, clientHeight: height } = container;
      visible = width > 0 && height > 0;
      if (!visible) { clearInput(); return; }
      camera.aspect = width / height;
      camera.fov = width < height ? 57 : 47;
      camera.updateProjectionMatrix();
      const ratio = Math.min(window.devicePixelRatio || 1, compact ? 1.35 : 1.6, Math.sqrt(maxPixels / (width * height)));
      renderer.setPixelRatio(ratio);
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
    let last = 0;
    let time = 0;
    let stride = 0;
    let motion = 0;
    let nearPortal = false;
    renderer.setAnimationLoop((now) => {
      if (!visible || document.hidden) { last = 0; return; }
      const dt = last ? Math.min((now - last) / 1000, 0.065) : 0;
      last = now;
      time += dt;
      const held = [...touches.current.values()];
      const pressed = (index: number) => Number(directions[index].keys.some((key) => keys.current.has(key) || held.includes(key)));
      const dx = pressed(3) - pressed(1);
      const dz = pressed(2) - pressed(0);
      const actor = world.actor;
      const length = Math.hypot(dx, dz);
      if (length) {
        const x = T.MathUtils.clamp(actor.position.x + dx * 4.8 * dt / length, -2.3, 2.3);
        const z = T.MathUtils.clamp(actor.position.z + dz * 4.8 * dt / length, SANCTUARY_PORTAL_Z + 1.28, 5.6);
        actor.position.set(x, sanctuaryHeight(x, z) + 0.12, z);
        const angle = Math.atan2(-dx, -dz) - actor.rotation.y;
        actor.rotation.y += Math.atan2(Math.sin(angle), Math.cos(angle)) * (1 - Math.exp(-dt * 13));
      }
      motion = T.MathUtils.damp(motion, length && !reduced.matches ? 1 : 0, 9, dt);
      stride += dt * 11.5;
      world.animate(time, stride, motion, reduced.matches);
      const isNear = Math.abs(actor.position.x) <= 1.75 && actor.position.z - SANCTUARY_PORTAL_Z < 3.0;
      if (isNear !== nearPortal) {
        nearPortal = isNear;
        setNear(isNear);
      }
      desired.set(actor.position.x + 0.35, actor.position.y + 2.92, actor.position.z + 5.35);
      look.set(actor.position.x * 0.66, 1.55, actor.position.z - 4.2);
      camera.position.lerp(desired, 1 - Math.exp(-dt * 5));
      target.lerp(look, 1 - Math.exp(-dt * 6));
      camera.lookAt(target);
      renderer.render(world.scene, camera);
      if (!container.dataset.ready) container.dataset.ready = 'true';
    });
    stage.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener('blur', clearInput);
      document.removeEventListener('visibilitychange', clearInput);
      clearInput();
      resize.disconnect();
      renderer.setAnimationLoop(null);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      world.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      delete container.dataset.ready;
    };
  }, [appearance, stage]);

  return (
    <div className={css.scene} ref={stage} tabIndex={0} role="group"
      aria-label="Santuário da Jornada em 3D" aria-describedby="sanctuary-controls"
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) clearInput(); }}
      onKeyDown={(event) => {
        const key = event.key.toLowerCase();
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (movement.has(key)) {
          event.preventDefault();
          keys.current.add(key);
        } else if (event.target === event.currentTarget && !event.repeat && near && (key === 'e' || key === 'enter')) {
          event.preventDefault();
          onEnter();
        }
      }}
      onKeyUp={(event) => keys.current.delete(event.key.toLowerCase())}
    >
      <div ref={host} className={css.canvas} />
      <div className={css.hud}>
        <h2>{destination}</h2>
        <p role="status">{near ? 'Portal ao alcance' : 'Siga o caminho de pedra'}</p>
      </div>
      <span id="sanctuary-controls" hidden>Use WASD, setas ou os controles de toque. Pressione E ao alcançar o portal.</span>
      <div className={css.pad} aria-label="Controles de movimento">
        {directions.map(({ keys, symbol, label }) => (
          <button key={label} type="button" aria-label={label}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              touches.current.set(event.pointerId, keys[0]);
            }}
            onPointerUp={(event) => touches.current.delete(event.pointerId)}
            onPointerCancel={(event) => touches.current.delete(event.pointerId)}
            onLostPointerCapture={(event) => touches.current.delete(event.pointerId)}
          >{symbol}</button>
        ))}
      </div>
      {near && <button className={css.enter} type="button" onClick={onEnter}>Entrar no portal <kbd>E</kbd></button>}
    </div>
  );
}
