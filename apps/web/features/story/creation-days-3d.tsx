'use client';

import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import * as T from 'three';
import type { Appearance, AvatarConfig } from '../journey/domain/traveler';
import type { CreationMarker } from './creation-days';
import { CREATION_DAY_SCENES, buildCreationDaysWorld, walkCreationWorld } from './creation-days-world';
import css from './creation-days-3d.module.css';

const beats: Record<number, readonly [string, string, string]> = {
  2: ['As águas ocupam a cena.', 'Uma expansão se estabelece entre as águas.', 'O relato chama essa expansão de céu.'],
  3: ['As águas se reúnem.', 'A porção seca aparece.', 'A terra faz brotar vegetação, conforme o relato.'],
  4: ['Os luminares aparecem no céu.', 'O maior luminar marca o dia; o menor, a noite.', 'Eles marcam tempos determinados, dias e anos; as estrelas também aparecem no relato.'],
  5: ['As águas ganham vida.', 'Criaturas marinhas atravessam os mares.', 'Aves cruzam a expansão dos céus.'],
  6: ['Animais terrestres povoam a paisagem.', 'O relato apresenta homem e mulher.', 'A humanidade é descrita como criada à imagem de Deus.'],
  7: ['A obra da Criação está completa.', 'O sétimo dia é separado no relato.', 'A cena se aquieta para marcar o descanso.'],
};

const directions = [
  { key: 'arrowup', symbol: '↑', label: 'Avançar' },
  { key: 'arrowleft', symbol: '←', label: 'Mover à esquerda' },
  { key: 'arrowdown', symbol: '↓', label: 'Recuar' },
  { key: 'arrowright', symbol: '→', label: 'Mover à direita' },
] as const;
const movement = new Set(['w', 'a', 's', 'd', ...directions.map(({ key }) => key)]);

export default function CreationDays3D({
  dayNumber, title, reference, markers, appearance, identity, completedMarkers, requestedMarker,
  onCompleteMarker, onUnavailable,
}: {
  dayNumber: 2 | 3 | 4 | 5 | 6 | 7;
  title: string;
  reference: string;
  markers: readonly CreationMarker[];
  appearance: Appearance;
  identity?: AvatarConfig;
  completedMarkers: readonly string[];
  requestedMarker?: { id: string; nonce: number };
  onCompleteMarker: (id: string) => void;
  onUnavailable: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const keys = useRef(new Set<string>());
  const touches = useRef(new Map<number, string>());
  const cinematic = useRef<{ id: string; started: number } | null>(null);
  const completedIds = useRef(new Set<string>());
  const complete = useEffectEvent(onCompleteMarker);
  const unavailable = useEffectEvent(onUnavailable);
  const [nearMarker, setNearMarker] = useState<string>();
  const [activeMarker, setActiveMarker] = useState<string>();
  const [caption, setCaption] = useState(0);
  const clearInput = () => { keys.current.clear(); touches.current.clear(); };

  const beginCinematic = useCallback((markerId: string) => {
    if (completedMarkers.includes(markerId) || cinematic.current) return;
    cinematic.current = { id: markerId, started: performance.now() };
    setCaption(0);
    setActiveMarker(markerId);
  }, [completedMarkers]);

  useEffect(() => {
    completedIds.current = new Set(completedMarkers);
  }, [completedMarkers]);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    const compact = window.matchMedia('(pointer: coarse), (max-width: 640px)').matches;
    let renderer: T.WebGLRenderer;
    try { renderer = new T.WebGLRenderer({ antialias: !compact, powerPreference: 'default' }); }
    catch { unavailable(); return; }
    renderer.shadowMap.enabled = !compact;
    renderer.shadowMap.type = T.PCFShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.append(renderer.domElement);
    const world = buildCreationDaysWorld(dayNumber, markers, appearance, identity, compact);
    const camera = new T.PerspectiveCamera(47, 1, 0.1, 140);
    const target = new T.Vector3(0, 1.15, 0);
    const desired = new T.Vector3();
    const look = new T.Vector3();
    const cinematicShot = new T.CubicBezierCurve3(
      new T.Vector3(0.1, 7.5, -5), new T.Vector3(-8, 10, -16),
      new T.Vector3(8, 8.5, -23), new T.Vector3(0, 6.2, -12),
    );
    let visible = false; let lastFrame = 0; let time = 0; let stride = 0; let walkBlend = 0;
    let priorNear = '';
    const fit = () => {
      const { clientWidth: width, clientHeight: height } = container;
      visible = width > 0 && height > 0;
      if (!visible) { clearInput(); return; }
      camera.aspect = width / height;
      camera.fov = width < height ? 56 : 47;
      camera.updateProjectionMatrix();
      const pixelCap = compact ? 900_000 : 2_100_000;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.3 : 1.7, Math.sqrt(pixelCap / (width * height))));
      renderer.setSize(width, height, false);
    };
    const resize = new ResizeObserver(fit);
    resize.observe(container);
    const lost = (event: Event) => { event.preventDefault(); renderer.setAnimationLoop(null); unavailable(); };
    renderer.domElement.addEventListener('webglcontextlost', lost);
    window.addEventListener('blur', clearInput);
    document.addEventListener('visibilitychange', clearInput);
    renderer.setAnimationLoop((now) => {
      if (!visible || document.hidden) { lastFrame = 0; return; }
      const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
      lastFrame = now; time += dt;
      const held = [...touches.current.values()];
      const down = (key: string) => keys.current.has(key) || held.includes(key);
      const dx = Number(down('d') || down('arrowright')) - Number(down('a') || down('arrowleft'));
      const dz = Number(down('s') || down('arrowdown')) - Number(down('w') || down('arrowup'));
      const isCinematic = cinematic.current;
      const actor = world.avatar.position;
      const walking = !isCinematic && (dx !== 0 || dz !== 0);
      if (walking) {
        const next = walkCreationWorld(actor.x, actor.z, dx, dz, dt);
        actor.set(next.x, 0, next.z);
        const facing = Math.atan2(-dx, -dz);
        const angle = facing - world.avatar.rotation.y;
        world.avatar.rotation.y += Math.atan2(Math.sin(angle), Math.cos(angle)) * (1 - Math.exp(-dt * 12));
      }
      walkBlend = T.MathUtils.damp(walkBlend, walking ? 1 : 0, 8, dt);
      stride += dt * (7 + walkBlend * 4);
      world.legs.forEach((leg, index) => { leg.rotation.x = Math.sin(stride + index * Math.PI) * walkBlend * 0.5; world.arms[index]!.rotation.x = -Math.sin(stride + index * Math.PI) * walkBlend * 0.34; });
      world.torso.position.y = Math.abs(Math.sin(stride)) * walkBlend * 0.045 + Math.sin(time * 2.7) * (1 - walkBlend) * 0.016;
      world.cloak.rotation.x = 0.14 + walkBlend * (0.12 + Math.sin(stride) * 0.04);
      let closest = '';
      let closestDistance = 2.45;
      for (const marker of world.markerGroups) {
        const distance = Math.hypot(actor.x - marker.position.x, actor.z - marker.position.z);
        if (distance < closestDistance && !completedIds.current.has(marker.id)) { closest = marker.id; closestDistance = distance; }
      }
      if (closest !== priorNear) { priorNear = closest; setNearMarker(closest || undefined); }
      const cinematicProgress = isCinematic ? Math.min(1, (now - isCinematic.started) / 7200) : 0;
      world.update(time, cinematicProgress);
      desired.set(actor.x * 0.9 + 0.4, 3.05, actor.z + (compact ? 5.8 : 5.3));
      look.set(actor.x * 0.8, 1.2, actor.z - 3.2);
      if (isCinematic) {
        cinematicShot.getPoint(T.MathUtils.smoothstep(cinematicProgress, 0.04, 0.96), desired);
        look.set(0, 2.2, -13);
        const beat = Math.min(2, Math.floor(cinematicProgress * 3));
        setCaption((current) => current === beat ? current : beat);
        if (cinematicProgress >= 1) {
          cinematic.current = null;
          setActiveMarker(undefined);
          complete(isCinematic.id);
        }
      }
      target.lerp(look, 1 - Math.exp(-dt * (isCinematic ? 2.1 : 6)));
      camera.position.lerp(desired, 1 - Math.exp(-dt * (isCinematic ? 2.7 : 4.2)));
      camera.lookAt(target);
      renderer.render(world.scene, camera);
      if (!container.dataset.ready) container.dataset.ready = 'true';
    });
    viewport.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener('blur', clearInput);
      document.removeEventListener('visibilitychange', clearInput);
      resize.disconnect(); renderer.setAnimationLoop(null);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      world.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
      delete container.dataset.ready;
    };
  }, [dayNumber, markers, appearance, identity]);

  useEffect(() => {
    if (requestedMarker) beginCinematic(requestedMarker.id);
  }, [requestedMarker, beginCinematic]);

  const finishCinematic = () => {
    const current = cinematic.current;
    if (!current) return;
    cinematic.current = null;
    setActiveMarker(undefined);
    onCompleteMarker(current.id);
  };

  return (
    <div className={css.scene} ref={viewport} tabIndex={0} role="group"
      aria-label={`Exploração 3D do Dia ${dayNumber}`} aria-describedby={`creation-day-${dayNumber}-controls`}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) clearInput(); }}
      onKeyDown={(event) => {
        const key = event.key.toLowerCase();
        if (event.altKey || event.metaKey || event.ctrlKey) return;
        if (movement.has(key)) { event.preventDefault(); keys.current.add(key); }
        else if ((key === 'e' || key === 'enter') && !event.repeat && nearMarker && !cinematic.current) { event.preventDefault(); beginCinematic(nearMarker); }
      }}
      onKeyUp={(event) => keys.current.delete(event.key.toLowerCase())}>
      <div ref={host} className={css.canvas} />
      <header className={css.title} data-playing={Boolean(activeMarker)}>
        <small>{CREATION_DAY_SCENES[dayNumber].source} · Representação artística</small>
        <h2>Dia {dayNumber} — {title}</h2>
      </header>
      <p className={css.hint}>
        {activeMarker ? 'Observe a sequência bíblica.' : nearMarker ? `${markers.find(({ id }) => id === nearMarker)?.label} ao alcance.` : `Explore e encontre ${markers.length > 1 ? 'os marcos' : 'o marco'} da cena.`}
      </p>
      <span id={`creation-day-${dayNumber}-controls`} hidden>Use WASD, as setas ou os controles de toque. Pressione E ao alcançar um marco. Sequência baseada em {reference}; representação artística sem retratar Deus.</span>
      {activeMarker ? (
        <div className={css.cinematic}>
          <small>{CREATION_DAY_SCENES[dayNumber].source}</small>
          <p aria-live="polite">{beats[dayNumber]![caption]}</p>
          <button type="button" onClick={() => caption < 2 ? setCaption((value) => value + 1) : finishCinematic()}>
            {caption < 2 ? 'Continuar sequência' : 'Ir para a pergunta'}
          </button>
        </div>
      ) : (
        <>
          <div className={css.pad} aria-label="Controles de movimento">
            {directions.map(({ key, symbol, label }) => <button type="button" key={key} aria-label={label}
              onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); touches.current.set(event.pointerId, key); }}
              onLostPointerCapture={(event) => touches.current.delete(event.pointerId)}
              onPointerUp={(event) => touches.current.delete(event.pointerId)}
              onPointerCancel={(event) => touches.current.delete(event.pointerId)}>{symbol}</button>)}
          </div>
          {nearMarker && <button type="button" className={css.interact} onClick={() => beginCinematic(nearMarker)}>Observar marco · E</button>}
        </>
      )}
    </div>
  );
}
