import * as T from 'three';
import type { Appearance, AvatarConfig } from '../journey/domain/traveler';
import { buildAtmosphere, stoneRelief } from './creation-day-one-atmosphere';
import { addCreationWater } from './creation-scenery-shaders';

export const LIGHT_MARKER_Z = -13;
export const SEPARATION_SECONDS = 8;

export function walkDayOne(x: number, z: number, dx: number, dz: number, dt: number) {
  const length = Math.max(1, Math.hypot(dx, dz));
  const speed = 5.2 * Math.min(dt, 0.05) / length;
  return {
    x: T.MathUtils.clamp(x + dx * speed, -3.8, 3.8),
    z: T.MathUtils.clamp(z + dz * speed, -16, 9),
  };
}

export function buildDayOneWorld(appearance: Appearance, identity: AvatarConfig | undefined, compact: boolean) {
  const scene = new T.Scene();
  scene.background = new T.Color('#23354b');
  const fog = new T.FogExp2('#26364e', 0.031);
  scene.fog = fog;
  const atmosphere = buildAtmosphere(scene, compact);
  const ambient = new T.HemisphereLight('#a6c8e4', '#41384e', 1.65);
  const key = new T.DirectionalLight('#aecfff', 2.25);
  key.position.set(-8, 14, -4);
  key.target.position.set(0, 0, -8);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(compact ? 512 : 1024);
  Object.assign(key.shadow.camera, { left: -14, right: 14, top: 18, bottom: -18, far: 55 });
  key.shadow.normalBias = 0.04;
  const warmKey = new T.SpotLight('#ffba64', 0, 67, 0.58, 0.7, 1.3);
  warmKey.position.set(-19, 15, -28);
  warmKey.target.position.set(-5, 0, -15);
  scene.add(ambient, key, key.target, warmKey, warmKey.target);

  function mesh(
    geometry: T.BufferGeometry, color: string, x: number, y: number, z: number,
    parent: T.Object3D = scene,
  ) {
    const item = new T.Mesh(geometry, new T.MeshStandardMaterial({ color, flatShading: true }));
    item.position.set(x, y, z);
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }
  const relief = stoneRelief(compact ? 256 : 512);
  const water = addCreationWater(scene, 1, compact);

  const rock = new T.DodecahedronGeometry(1, 1);
  const positions = rock.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const rough = 1 + Math.sin(x * 17 + y * 5) * Math.cos(z * 11) * 0.13;
    positions.setXYZ(i, x * rough, y * rough, z * rough);
  }
  rock.computeVertexNormals();
  const stone = new T.MeshStandardMaterial({
    color: '#bbc4d7', roughness: 0.77, metalness: 0.14, flatShading: true,
    bumpMap: relief, bumpScale: compact ? 0.09 : 0.15,
  });
  const matrix = new T.Object3D();
  const tint = new T.Color();
  function batch(count: number, place: (i: number) => string, casts: boolean) {
    const group = new T.InstancedMesh(rock, stone, count);
    group.receiveShadow = true;
    group.castShadow = casts;
    for (let i = 0; i < count; i++) {
      group.setColorAt(i, tint.set(place(i)));
      matrix.updateMatrix();
      group.setMatrixAt(i, matrix.matrix);
    }
    scene.add(group);
  }
  batch(42, (i) => {
    const row = Math.floor(i / 2);
    const side = i % 2 ? -1 : 1;
    matrix.position.set(side * (1.71 + Math.sin(row * 1.6) * 0.29), -0.43, 10 - row * 1.29 + side * 0.18);
    matrix.scale.set(2.57 + Math.sin(i) * 0.26, 0.54, 1.12);
    matrix.rotation.set(0, Math.sin(i * 1.29) * 0.24, 0);
    return i % 5 === 0 ? '#657681' : '#464757';
  }, false);
  batch(72, (i) => {
    const side = i % 2 ? -1 : 1;
    const z = 8 - (i * 4.73) % 76;
    const x = side * (6.2 + (i * 3.37) % 31);
    const height = 1.2 + (i * 2.19) % (Math.abs(x) < 11 ? 3.6 : 10.2);
    matrix.position.set(x, height * 0.29 - 0.4, z);
    matrix.scale.set(1 + height * 0.48, height, 1.1 + height * 0.39);
    matrix.rotation.set(i * 0.39, i * 0.83, i * 0.14);
    return i % 3 === 0 ? '#536a7b' : i % 3 === 1 ? '#424960' : '#353b51';
  }, !compact);
  batch(46, (i) => {
    const side = i % 2 ? -1 : 1;
    matrix.position.set(side * (3.16 + Math.sin(i * 1.23) * 0.68), -0.03, 9 - i * 0.58);
    matrix.scale.set(0.22 + (i % 5) * 0.1, 0.10 + (i % 4) * 0.08, 0.34 + (i % 6) * 0.09);
    matrix.rotation.set(0.23, i * 1.8, 0.1);
    return i % 2 ? '#77818c' : '#566276';
  }, false);
  batch(compact ? 14 : 23, (i) => {
    const side = i % 2 ? -1 : 1;
    const height = 2.5 + (i * 1.97) % 8;
    matrix.position.set(side * (8.2 + (i * 1.72) % 11), height * 0.61, -19 - i * 1.93);
    matrix.scale.set(0.65 + (i % 4) * 0.24, height, 1.4);
    matrix.rotation.set(0.24, i * 1.07, side * 0.18);
    return '#41475b';
  }, false);

  const marker = new T.Group();
  marker.position.z = LIGHT_MARKER_Z;
  scene.add(marker);
  mesh(new T.CylinderGeometry(1.18, 1.37, 0.18, 9), '#373343', 0, 0.09, 0, marker);
  const plinth = mesh(new T.CylinderGeometry(0.62, 1.05, 0.45, 9), '#615b65', 0, 0.31, 0, marker);
  plinth.material.bumpMap = relief;
  plinth.material.bumpScale = 0.18;
  const rim = mesh(new T.TorusGeometry(0.64, 0.028, 6, 32), '#c29053', 0, 0.552, 0, marker);
  rim.rotation.x = -Math.PI / 2;
  rim.material.emissive.set('#b56a32');
  rim.material.emissiveIntensity = 0.6;
  const crystal = new T.Mesh(new T.OctahedronGeometry(0.46), new T.MeshStandardMaterial({
    color: '#f5d7a0', emissive: '#ff9d3c', emissiveIntensity: 1.25, roughness: 0.32,
  }));
  marker.add(crystal);
  const beacon = new T.PointLight('#ffc180', 24, 10);
  beacon.position.y = 1.1;
  marker.add(beacon);

  const avatar = new T.Group();
  avatar.position.z = 8;
  scene.add(avatar);
  const skin = { claro: '#d9a983', medio: '#b27b55', escuro: '#794e3d' }[appearance.skin];
  const cloth = { musgo: '#59694f', ocre: '#9d693c', azul: '#496f8f' }[appearance.outfit];
  const torso = new T.Group();
  avatar.add(torso);
  const body = mesh(new T.CylinderGeometry(0.27, 0.39, 0.73, 10), cloth, 0, 0.99, 0, torso);
  mesh(new T.CylinderGeometry(0.34, 0.36, 0.08, 8), '#362b33', 0, 0.83, 0, avatar);
  mesh(new T.IcosahedronGeometry(0.23, 2), skin, 0, 1.52, -0.03, torso);
  const hairColor = identity?.hairColor;
  const hairTint = hairColor && (Object.hasOwn(T.Color.NAMES, hairColor) || /^#[a-f0-9]{6}$/i.test(hairColor))
    ? hairColor : '#342528';
  const hair = mesh(new T.IcosahedronGeometry(0.24, 2), hairTint, 0, 1.62, 0.03, torso);
  if (appearance.hair === 'longo') {
    hair.scale.set(1.05, 1.16, 1.09);
    mesh(new T.CapsuleGeometry(0.13, 0.28, 4, 8), hairTint, 0, 1.42, 0.17, torso);
  } else if (appearance.hair === 'cacheado') {
    hair.scale.set(1.14, 1.18, 1.13);
  }
  const cloak = mesh(new T.CylinderGeometry(0.25, 0.40, 0.92, 10, 3, true, 0.17, 2.80), cloth, 0, 1, 0.12, torso);
  cloak.rotation.y = -Math.PI / 2;
  cloak.material.side = T.DoubleSide;
  cloak.rotation.x = 0.14;
  const legs = [-1, 1].map((side) => {
    const leg = new T.Group();
    leg.position.set(side * 0.16, 0.69, 0);
    avatar.add(leg);
    mesh(new T.BoxGeometry(0.19, 0.49, 0.2), '#373441', 0, -0.22, 0, leg);
    mesh(new T.BoxGeometry(0.2, 0.15, 0.31), '#2c242a', 0, -0.60, -0.055, leg);
    return leg;
  });
  const arms = [-1, 1].map((side) => {
    const arm = new T.Group();
    arm.position.set(side * 0.33, 1.22, 0);
    arm.rotation.z = side * 0.16;
    torso.add(arm);
    mesh(new T.CapsuleGeometry(0.104, 0.33, 4, 8), cloth, 0, -0.16, 0, arm);
    mesh(new T.IcosahedronGeometry(0.094, 1), skin, 0, -0.42, -0.015, arm);
    return arm;
  });
  avatar.traverse((part) => { if (part instanceof T.Mesh) part.castShadow = true; });
  body.material.roughness = 0.8;

  const contact = new T.Mesh(new T.PlaneGeometry(1.8, 1.6), new T.ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 p; void main() { p = uv - 0.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec2 p; void main() { gl_FragColor = vec4(0.01, 0.02, 0.045, (1.0 - smoothstep(0.07, 0.50, length(p))) * 0.60); }',
  }));
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.18;
  avatar.add(contact);
  const dark = new T.Color('#0d1425');
  const neutral = new T.Color('#26364e');
  const warm = new T.Color('#50505d');
  function illuminate(t: number) {
    const dim = 1 - T.MathUtils.smoothstep(t, 0.04, 0.57);
    const light = T.MathUtils.smoothstep(t, 0.19, 0.92);
    atmosphere.eclipse.value = dim;
    atmosphere.light.value = light;
    water.light.value = light;
    fog.color.copy(neutral).lerp(dark, dim * 0.9).lerp(warm, light * 0.45);
    key.intensity = 2.25 - dim * 1.80 - light * 0.68;
    ambient.intensity = 1.65 - dim * 1.03 - light * 0.45;
    warmKey.intensity = light * 288;
    beacon.intensity = 24 - dim * 19 - light * 7;
  }
  function updateAtmosphere(time: number) {
    atmosphere.time.value = time;
    water.time.value = time;
  }

  function dispose() {
    const geometries = new Set<T.BufferGeometry>();
    const materials = new Set<T.Material>();
    scene.traverse((item) => {
      if (!(item instanceof T.Mesh || item instanceof T.Points)) return;
      geometries.add(item.geometry);
      materials.add(item.material);
      if (item instanceof T.InstancedMesh) item.dispose();
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    relief.dispose();
    key.dispose();
    warmKey.dispose();
    beacon.dispose();
  }
  return { scene, avatar, torso, arms, legs, cloak, crystal, illuminate, updateAtmosphere, dispose };
}
