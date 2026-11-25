import * as T from 'three';
import type { Appearance, AvatarConfig } from '../journey/domain/traveler';
import type { CreationMarker } from './creation-days';
import { walkDayOne } from './creation-day-one-world';

export const CREATION_DAY_SCENES = {
  2: { sky: '#86c7e7', ground: '#d9c99d', accent: '#e3f5ff', source: 'Gênesis 1:6–8' },
  3: { sky: '#8ac7df', ground: '#926d48', accent: '#8ecb79', source: 'Gênesis 1:9–13' },
  4: { sky: '#111b3c', ground: '#665d58', accent: '#ffe7a0', source: 'Gênesis 1:14–19' },
  5: { sky: '#70b8d4', ground: '#c9b981', accent: '#f3d280', source: 'Gênesis 1:20–23' },
  6: { sky: '#d5a66c', ground: '#9a7146', accent: '#e7c98d', source: 'Gênesis 1:24–31' },
  7: { sky: '#a8c9c1', ground: '#84966d', accent: '#f0dfac', source: 'Gênesis 2:1–3' },
} as const;

export type CreationWorld = ReturnType<typeof buildCreationDaysWorld>;

export function markerPosition(point: CreationMarker['point']) {
  return { x: T.MathUtils.clamp((point.x - 50) * 0.11, -3.5, 3.5), z: -16 + (100 - point.y) * 0.14 };
}

export function buildCreationDaysWorld(
  day: 2 | 3 | 4 | 5 | 6 | 7,
  markers: readonly CreationMarker[],
  appearance: Appearance,
  identity: AvatarConfig | undefined,
  compact: boolean,
) {
  const spec = CREATION_DAY_SCENES[day];
  const scene = new T.Scene();
  scene.background = new T.Color(spec.sky);
  scene.fog = new T.FogExp2(spec.sky, day === 4 ? 0.018 : 0.024);
  scene.add(new T.HemisphereLight('#e5f3ff', spec.ground, 1.65));
  const sun = new T.DirectionalLight(day === 4 ? '#b9c8ff' : '#fff0cf', day === 4 ? 1.2 : 2.5);
  sun.position.set(-7, 12, -7);
  sun.castShadow = !compact;
  sun.shadow.mapSize.setScalar(compact ? 512 : 1024);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 18, bottom: -18, far: 48 });
  scene.add(sun, sun.target);
  const groundMat = new T.MeshStandardMaterial({ color: spec.ground, roughness: 0.92, flatShading: true });
  const ground = new T.Mesh(new T.PlaneGeometry(160, 160), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.2, -10);
  ground.receiveShadow = true;
  scene.add(ground);

  const animated: Array<{ object: T.Object3D; kind: 'water' | 'bird' | 'fish' | 'plant' | 'orbit' | 'cloud'; phase: number; baseY: number; baseX?: number }> = [];
  let celestial: T.Group | undefined;
  const material = (color: string, roughness = 0.78, emissive?: string) => new T.MeshStandardMaterial({ color, roughness, flatShading: true, ...(emissive ? { emissive, emissiveIntensity: 0.36 } : {}) });
  const addMesh = (geometry: T.BufferGeometry, color: string, position: [number, number, number], scale: [number, number, number] = [1, 1, 1], parent: T.Object3D = scene, roughness = 0.78, emissive?: string) => {
    const object = new T.Mesh(geometry, material(color, roughness, emissive));
    object.position.set(...position); object.scale.set(...scale); object.castShadow = !compact; object.receiveShadow = true;
    parent.add(object); return object;
  };
  const groupAt = (x: number, y: number, z: number, parent: T.Object3D = scene) => {
    const group = new T.Group(); group.position.set(x, y, z); parent.add(group); return group;
  };
  const rock = new T.DodecahedronGeometry(1, 1);
  const rockMat = material(day === 3 ? '#a99775' : '#777b76');
  for (let i = 0; i < (compact ? 24 : 42); i++) {
    const side = i % 2 ? -1 : 1;
    const z = 8 - (i * 4.7) % 48;
    const height = 0.8 + ((i * 1.79) % 4.1);
    const mesh = new T.Mesh(rock, rockMat);
    mesh.position.set(side * (5.4 + ((i * 1.33) % 8)), height * 0.37 - 0.24, z);
    mesh.scale.set(1.3 + (i % 3) * 0.44, height, 1.1 + (i % 4) * 0.35);
    mesh.rotation.set(i * 0.1, i * 0.57, i * 0.07); mesh.castShadow = !compact; mesh.receiveShadow = true;
    scene.add(mesh);
  }

  const waterMaterial = material(day === 2 ? '#3579a4' : '#176487', 0.29);
  waterMaterial.metalness = 0.12;
  const waterGeometry = new T.PlaneGeometry(28, 25, 24, 24);
  const water = new T.Mesh(waterGeometry, waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, day === 2 ? 0.32 : day === 3 || day === 5 ? -0.06 : -20, -11);
  water.receiveShadow = true;
  scene.add(water); animated.push({ object: water, kind: 'water', phase: 0, baseY: water.position.y });
  if (day === 2) {
    const upperWater = addMesh(new T.SphereGeometry(1, 24, 14), '#9bd6ec', [0, 10.2, -20], [15, 2.15, 8], scene, 0.35);
    upperWater.material.transparent = true; upperWater.material.opacity = 0.54;
    for (let i = 0; i < 9; i++) {
      const cloud = addMesh(new T.SphereGeometry(1, 14, 10), '#f3fbff', [-12 + (i * 3.1), 8 + Math.sin(i) * 0.8, -25 - (i % 3) * 2], [1.9, 0.75, 1.1], scene, 1);
      animated.push({ object: cloud, kind: 'cloud', phase: i * 0.8, baseY: cloud.position.y });
    }
  }
  if (day === 3) {
    const field = groupAt(0, 0, 0);
    const stemGeometry = new T.CylinderGeometry(0.035, 0.07, 1, 5);
    const stemMaterial = material('#54804b');
    const stemInstances = new T.InstancedMesh(stemGeometry, stemMaterial, 36);
    const leafGeometry = new T.SphereGeometry(0.25, 8, 6);
    const leaves = Array.from({ length: 4 }, (_, direction) => {
      const mesh = new T.InstancedMesh(leafGeometry, material('#6d9b52'), 36);
      mesh.userData.direction = direction;
      field.add(mesh);
      return mesh;
    });
    const matrixHelper = new T.Object3D();
    const leafTint = new T.Color();
    for (let i = 0; i < 36; i++) {
      const x = ((i * 2.73) % 12) - 6;
      const z = -22 + ((i * 3.17) % 28);
      const height = 0.8 + (i % 4) * 0.24;
      matrixHelper.position.set(x, height / 2, z); matrixHelper.scale.set(1, height, 1); matrixHelper.rotation.set(0, 0, 0); matrixHelper.updateMatrix();
      stemInstances.setMatrixAt(i, matrixHelper.matrix);
      for (let direction = 0; direction < leaves.length; direction++) {
        const angle = direction * Math.PI / 2;
        matrixHelper.position.set(x + Math.cos(angle) * 0.2, height * 0.55 + direction * 0.07, z + Math.sin(angle) * 0.2);
        matrixHelper.scale.set(0.38, 0.1, 0.16); matrixHelper.rotation.set(0, angle, 0); matrixHelper.updateMatrix();
        leaves[direction]!.setMatrixAt(i, matrixHelper.matrix);
        leaves[direction]!.setColorAt(i, leafTint.set(i % 5 === 0 ? '#d6a458' : '#6d9b52'));
      }
    }
    stemInstances.instanceMatrix.needsUpdate = true;
    field.add(stemInstances);
    for (const leaf of leaves) { leaf.instanceMatrix.needsUpdate = true; if (leaf.instanceColor) leaf.instanceColor.needsUpdate = true; }
    animated.push({ object: field, kind: 'plant', phase: 0, baseY: 0 });
    for (let i = 0; i < 11; i++) {
      const x = -8.5 + ((i * 1.71) % 17);
      const z = -18 + ((i * 1.37) % 8);
      addMesh(new T.CylinderGeometry(0.13, 0.23, 1.45, 7), '#684c36', [x, 0.57, z]);
      addMesh(new T.DodecahedronGeometry(0.88, 1), i % 3 ? '#548352' : '#769552', [x, 1.75, z], [1.05, 1.2, 0.95]);
    }
    // A raised green shoreline makes the meeting of dry land and sea readable from the follow camera.
    for (let i = 0; i < 7; i++) addMesh(new T.SphereGeometry(1, 12, 8), '#718e50', [-5 + i * 1.65, 0.1, -8 - Math.sin(i * 0.6) * 2], [1.5, 0.48, 2.1]);
  }
  if (day === 4) {
    const orbit = groupAt(0, 0, -27);
    celestial = orbit;
    orbit.position.y = 9;
    addMesh(new T.SphereGeometry(2.45, 32, 20), '#f1bd62', [-7, 0, 0], [1, 1, 1], orbit, 0.35, '#f5a51c');
    addMesh(new T.SphereGeometry(1.48, 28, 18), '#dbe6ff', [7, 0, 0], [1, 1, 1], orbit, 0.4, '#8299d5');
    const starPositions = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i++) {
      starPositions[i * 3] = -32 + ((i * 37) % 64);
      starPositions[i * 3 + 1] = 6 + ((i * 13) % 22);
      starPositions[i * 3 + 2] = -48 + ((i * 17) % 22);
    }
    const starGeometry = new T.BufferGeometry();
    starGeometry.setAttribute('position', new T.BufferAttribute(starPositions, 3));
    scene.add(new T.Points(starGeometry, new T.PointsMaterial({ color: '#fff0bd', size: 0.095, sizeAttenuation: true })));
    const ring = addMesh(new T.TorusGeometry(1.7, 0.07, 8, 36), '#d9c17b', [0, 1, -8], [1.3, 0.35, 1], scene, 0.4, '#a48643');
    ring.position.set(0, 5, -25);
    ring.rotation.x = 0;
    animated.push({ object: orbit, kind: 'orbit', phase: 0, baseY: 0 });
  }
  if (day === 5) {
    for (let i = 0; i < 10; i++) {
      const fish = groupAt(-5 + (i % 5) * 2.4, -0.65 + (i % 3) * 0.48, -16 - Math.floor(i / 5) * 4);
      addMesh(new T.SphereGeometry(0.36, 12, 8), i % 2 ? '#f2c773' : '#7cc6d5', [0, 0, 0], [1.45, 0.78, 0.7], fish, 0.4);
      const tail = addMesh(new T.ConeGeometry(0.2, 0.48, 4), i % 2 ? '#d99556' : '#539ab0', [0, 0, 0.48], [1, 1, 0.65], fish);
      tail.rotation.x = Math.PI / 2; tail.rotation.z = Math.PI;
      animated.push({ object: fish, kind: 'fish', phase: i * 0.63, baseY: fish.position.y, baseX: fish.position.x });
    }
    for (let i = 0; i < 8; i++) {
      const bird = groupAt(-9 + i * 2.5, 4.8 + Math.sin(i * 1.4) * 1.3, -18 - (i % 3) * 4);
      addMesh(new T.SphereGeometry(0.2, 10, 8), '#f1ead8', [0, 0, 0], [1, 0.72, 1.3], bird);
      const wingL = addMesh(new T.BoxGeometry(0.8, 0.07, 0.36), '#d4d8d3', [-0.38, 0.05, 0], [1, 1, 1], bird);
      const wingR = addMesh(new T.BoxGeometry(0.8, 0.07, 0.36), '#d4d8d3', [0.38, 0.05, 0], [1, 1, 1], bird);
      animated.push({ object: bird, kind: 'bird', phase: i * 0.7, baseY: bird.position.y });
      void wingL; void wingR;
    }
  }
  if (day === 6) {
    // Low-poly wildlife models and two abstract human silhouettes, clearly an artistic scene.
    for (let i = 0; i < 7; i++) {
      const animal = groupAt(-7 + (i % 4) * 4.1, 0, -15 - Math.floor(i / 4) * 5);
      const color = ['#d2a36b', '#8b725b', '#c9bd9d'][i % 3]!;
      addMesh(new T.SphereGeometry(0.8, 14, 10), color, [0, 0.95, 0], [1.15, 0.75, 1.75], animal);
      addMesh(new T.SphereGeometry(0.42, 12, 9), color, [0, 1.55, -1.15], [0.85, 1, 0.84], animal);
      for (const side of [-1, 1]) for (const back of [-1, 1]) {
        const leg = addMesh(new T.CylinderGeometry(0.11, 0.08, 0.78, 6), color, [side * 0.48, 0.38, back * 0.86], [1, 1, 1], animal);
        animated.push({ object: leg, kind: 'plant', phase: i + side + back, baseY: 0.38 });
      }
      if (i === 0) for (const side of [-1, 1]) {
        const horn = addMesh(new T.ConeGeometry(0.085, 0.68, 6), '#ead9b7', [side * 0.42, 2.12, -1.2], [1, 1, 1], animal);
        horn.rotation.z = side * -0.32;
      }
    }
    for (let i = 0; i < 2; i++) {
      const figure = groupAt(i ? 3 : -3, 0, -19);
      addMesh(new T.CylinderGeometry(0.35, 0.53, 1.2, 9), i ? '#a9c7bb' : '#d9b18b', [0, 0.72, 0], [1, 1, 1], figure);
      addMesh(new T.SphereGeometry(0.34, 12, 10), i ? '#704a3d' : '#a66d4d', [0, 1.55, -0.02], [1, 1, 1], figure);
      addMesh(new T.CylinderGeometry(0.38, 0.44, 1.1, 8, 1, true), i ? '#78948c' : '#bd8b64', [0, 0.77, 0.15], [1, 1, 1], figure);
    }
  }
  if (day === 7) {
    for (let i = 0; i < 18; i++) {
      const x = -10 + (i * 1.23) % 20; const z = -30 + (i * 2.71) % 15;
      const trunk = addMesh(new T.CylinderGeometry(0.18, 0.34, 2.8 + (i % 3) * 0.5, 7), '#665043', [x, 1.15, z]);
      addMesh(new T.SphereGeometry(1, 12, 8), i % 3 ? '#688a65' : '#83966a', [x, 2.8 + (i % 3) * 0.2, z], [1.05, 0.9, 0.95]);
      trunk.rotation.z = Math.sin(i * 2) * 0.08;
    }
    addMesh(new T.CylinderGeometry(2.8, 3.7, 0.45, 8), '#bdb08b', [0, 0.1, -15], [1, 1, 1], scene);
    addMesh(new T.CylinderGeometry(2.1, 2.7, 0.42, 8), '#d8c9a5', [0, 0.53, -15]);
    for (let i = 0; i < 5; i++) {
      const glow = addMesh(new T.SphereGeometry(0.14, 8, 6), '#f3e6bd', [-1.2 + i * 0.6, 1.08, -15], [1, 1.4, 1], scene, 0.35, '#e8cd83');
      animated.push({ object: glow, kind: 'cloud', phase: i, baseY: glow.position.y });
    }
  }

  const markerGroups = markers.map((marker) => {
    const p = markerPosition(marker.point);
    const group = groupAt(p.x, 0, p.z);
    addMesh(new T.CylinderGeometry(0.9, 1.05, 0.18, 10), '#615c58', [0, 0.1, 0], [1, 1, 1], group);
    const ring = addMesh(new T.TorusGeometry(0.67, 0.045, 7, 30), spec.accent, [0, 0.45, 0], [1, 1, 1], group, 0.38, spec.accent);
    ring.rotation.x = -Math.PI / 2;
    const crystal = addMesh(new T.OctahedronGeometry(0.42), spec.accent, [0, 1.15, 0], [1, 1.25, 1], group, 0.28, spec.accent);
    animated.push({ object: crystal, kind: 'orbit', phase: marker.point.x * 0.02, baseY: 1.15 });
    return { id: marker.id, position: p, group };
  });

  const avatar = new T.Group(); avatar.position.set(0, 0, 8); scene.add(avatar);
  const skin = { claro: '#d9a983', medio: '#b27b55', escuro: '#794e3d' }[appearance.skin];
  const cloth = { musgo: '#59694f', ocre: '#9d693c', azul: '#496f8f' }[appearance.outfit];
  const torso = new T.Group(); avatar.add(torso);
  addMesh(new T.CylinderGeometry(0.27, 0.39, 0.73, 10), cloth, [0, 0.99, 0], [1, 1, 1], torso);
  addMesh(new T.CylinderGeometry(0.34, 0.36, 0.08, 8), '#362b33', [0, 0.83, 0], [1, 1, 1], avatar);
  addMesh(new T.IcosahedronGeometry(0.23, 2), skin, [0, 1.52, -0.03], [1, 1, 1], torso);
  const hairTint = identity?.hairColor && (/^#[a-f0-9]{6}$/i.test(identity.hairColor) || Object.hasOwn(T.Color.NAMES, identity.hairColor)) ? identity.hairColor : '#342528';
  const hair = addMesh(new T.IcosahedronGeometry(0.24, 2), hairTint, [0, 1.62, 0.03], [1, 1, 1], torso);
  if (appearance.hair === 'longo') { hair.scale.set(1.05, 1.16, 1.09); addMesh(new T.CapsuleGeometry(0.13, 0.28, 4, 8), hairTint, [0, 1.42, 0.17], [1, 1, 1], torso); }
  else if (appearance.hair === 'cacheado') hair.scale.set(1.14, 1.18, 1.13);
  const cloak = addMesh(new T.CylinderGeometry(0.25, 0.4, 0.92, 10, 3, true, 0.17, 2.8), cloth, [0, 1, 0.12], [1, 1, 1], torso);
  cloak.rotation.y = -Math.PI / 2; cloak.rotation.x = 0.14; cloak.material.side = T.DoubleSide;
  const legs = [-1, 1].map((side) => { const leg = new T.Group(); leg.position.set(side * 0.16, 0.69, 0); avatar.add(leg); addMesh(new T.BoxGeometry(0.19, 0.49, 0.2), '#373441', [0, -0.22, 0], [1, 1, 1], leg); addMesh(new T.BoxGeometry(0.2, 0.15, 0.31), '#2c242a', [0, -0.6, -0.055], [1, 1, 1], leg); return leg; });
  const arms = [-1, 1].map((side) => { const arm = new T.Group(); arm.position.set(side * 0.33, 1.22, 0); torso.add(arm); addMesh(new T.CapsuleGeometry(0.104, 0.33, 4, 8), cloth, [0, -0.16, 0], [1, 1, 1], arm); addMesh(new T.IcosahedronGeometry(0.094, 1), skin, [0, -0.42, -0.015], [1, 1, 1], arm); return arm; });
  return {
    scene, avatar, torso, cloak, legs, arms, markerGroups, animated,
    update(time: number, cinematic: number) {
      for (const item of animated) {
        if (item.kind === 'water') {
          const attr = (item.object as T.Mesh).geometry.getAttribute('position');
          for (let i = 0; i < attr.count; i++) {
            const x = attr.getX(i), z = attr.getY(i);
            attr.setZ(i, Math.sin(x * 0.62 + time * 0.9) * 0.08 + Math.cos(z * 0.77 + time * 0.7) * 0.055);
          }
          attr.needsUpdate = true; (item.object as T.Mesh).geometry.computeVertexNormals();
        } else if (item.kind === 'bird') {
          item.object.position.y = item.baseY + Math.sin(time * 2.8 + item.phase) * 0.24;
          item.object.rotation.z = Math.sin(time * 5 + item.phase) * 0.15;
        } else if (item.kind === 'fish') {
          item.object.position.x = item.baseX! + Math.sin(time * 0.65 + item.phase) * 1.2;
          item.object.position.y = item.baseY + Math.sin(time * 2 + item.phase) * 0.12;
        } else if (item.kind === 'plant') item.object.rotation.z = Math.sin(time * (1.2 + cinematic * 3) + item.phase) * 0.035;
        else if (item.kind === 'orbit') { item.object.rotation.y = cinematic ? time * 0.18 : Math.sin(time * 0.2 + item.phase) * 0.05; }
        else item.object.position.y = item.baseY + Math.sin(time * 0.6 + item.phase) * 0.12;
      }
      if (celestial) celestial.rotation.z = -0.22 + cinematic * 0.44;
      this.markerGroups.forEach(({ group }, index) => { group.rotation.y = Math.sin(time * 0.7 + index) * 0.06; });
    },
    dispose() {
      const geometries = new Set<T.BufferGeometry>([rock, waterGeometry]);
      const materials = new Set<T.Material>([rockMat, waterMaterial, groundMat]);
      scene.traverse((item) => { if (item instanceof T.Mesh || item instanceof T.Points) { geometries.add(item.geometry); const mats = Array.isArray(item.material) ? item.material : [item.material]; mats.forEach((mat) => materials.add(mat)); } });
      geometries.forEach((item) => item.dispose()); materials.forEach((item) => item.dispose()); sun.dispose();
    },
  };
}

export function walkCreationWorld(x: number, z: number, dx: number, dz: number, dt: number) {
  const point = walkDayOne(x, z, dx, dz, dt);
  return { x: T.MathUtils.clamp(point.x, -3.8, 3.8), z: T.MathUtils.clamp(point.z, -16, 9) };
}
