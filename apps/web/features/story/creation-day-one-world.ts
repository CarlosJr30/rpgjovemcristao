import * as T from 'three';
import type { Appearance } from '../journey/domain/traveler';

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

export function buildDayOneWorld(appearance: Appearance) {
  const scene = new T.Scene();
  scene.background = new T.Color('#101a30');
  const fog = new T.FogExp2('#101a30', 0.031);
  scene.fog = fog;
  const ambient = new T.HemisphereLight('#91b3d9', '#392a32', 1.3);
  const key = new T.DirectionalLight('#b5cafb', 1.35);
  key.position.set(-8, 14, -4);
  key.target.position.set(0, 0, -8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -14, right: 14, top: 18, bottom: -18, far: 55 });
  key.shadow.normalBias = 0.04;
  scene.add(ambient, key, key.target);

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
  const ground = mesh(new T.PlaneGeometry(130, 130), '#252938', 0, -0.06, -28);
  ground.rotation.x = -Math.PI / 2;
  const water = mesh(new T.PlaneGeometry(125, 115), '#172b46', 0, -0.025, -36);
  water.rotation.x = -Math.PI / 2;
  water.material.roughness = 0.32;
  const rock = new T.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 27; i++) {
    const slab = mesh(rock, i % 3 === 0 ? '#484954' : '#393744', Math.sin(i) * 0.55, -0.44, 10 - i * 1.09);
    slab.scale.set(5.5, 0.56, 1.4);
    slab.rotation.y = Math.sin(i * 3.1) * 0.19;
  }
  for (let i = 0; i < 54; i++) {
    const side = i % 2 ? -1 : 1;
    const x = side * (5.4 + (i * 3.37) % 28);
    const ridge = mesh(rock, i % 3 === 0 ? '#343c53' : '#272d43', x, -0.05, 11 - (i * 4.73) % 66);
    const height = 0.55 + (i * 2.19) % (Math.abs(x) < 9 ? 2.5 : 8);
    ridge.scale.set(0.7 + height * 0.39, height, 0.9 + height * 0.28);
    ridge.rotation.set(i * 0.39, i * 0.83, i * 0.14);
    ridge.castShadow = Math.abs(x) < 11;
  }
  for (let i = 0; i < 32; i++) {
    const shard = mesh(rock, '#565662', Math.sin(i * 2.1) * 4.5, 0.02, 10 - i * 0.88);
    shard.scale.set(0.3, 0.07, 0.4);
  }

  const marker = new T.Group();
  marker.position.z = LIGHT_MARKER_Z;
  scene.add(marker);
  mesh(new T.CylinderGeometry(1, 1.32, 0.37, 7), '#626079', 0, 0.11, 0, marker);
  const crystal = new T.Mesh(new T.OctahedronGeometry(0.46), new T.MeshStandardMaterial({
    color: '#f5d7a0', emissive: '#ff9d3c', emissiveIntensity: 1.25, roughness: 0.32,
  }));
  marker.add(crystal);
  marker.add(new T.PointLight('#ffc16d', 12, 8));

  const avatar = new T.Group();
  avatar.position.z = 8;
  scene.add(avatar);
  const skin = { claro: '#d9a983', medio: '#b27b55', escuro: '#794e3d' }[appearance.skin];
  const cloth = { musgo: '#59694f', ocre: '#9d693c', azul: '#496f8f' }[appearance.outfit];
  const body = mesh(new T.CylinderGeometry(0.27, 0.39, 0.73, 8), cloth, 0, 0.99, 0, avatar);
  mesh(new T.CylinderGeometry(0.34, 0.36, 0.08, 8), '#362b33', 0, 0.83, 0, avatar);
  mesh(new T.IcosahedronGeometry(0.23, 1), skin, 0, 1.52, -0.03, avatar);
  const hair = mesh(new T.IcosahedronGeometry(0.24, 1), '#342528', 0, 1.62, 0.03, avatar);
  if (appearance.hair !== 'curto') hair.scale.set(1.1, 1.15, 1.07);
  const cloak = mesh(new T.CylinderGeometry(0.15, 0.39, 0.82, 5), '#9a5451', 0, 0.96, 0.20, avatar);
  cloak.scale.z = 0.4;
  cloak.rotation.x = 0.14;
  const legs = [-1, 1].map((side) => {
    const leg = new T.Group();
    leg.position.set(side * 0.16, 0.69, 0);
    avatar.add(leg);
    mesh(new T.BoxGeometry(0.19, 0.49, 0.2), '#373441', 0, -0.22, 0, leg);
    mesh(new T.BoxGeometry(0.2, 0.15, 0.31), '#2c242a', 0, -0.60, -0.055, leg);
    return leg;
  });
  for (const side of [-1, 1]) {
    const arm = mesh(new T.CapsuleGeometry(0.104, 0.39, 3, 6), cloth, side * 0.33, 1.05, 0, avatar);
    arm.rotation.z = side * 0.16;
    mesh(new T.IcosahedronGeometry(0.095, 0), skin, side * 0.39, 0.8, -0.025, avatar);
  }
  avatar.traverse((part) => { if (part instanceof T.Mesh) part.castShadow = true; });
  body.material.roughness = 0.8;

  const veil = new T.Group();
  const beamGeometry = new T.ConeGeometry(3.6, 19, 24, 1, true);
  for (let i = 0; i < 3; i++) {
    const beam = new T.Mesh(beamGeometry, new T.MeshBasicMaterial({
      color: '#ffca87', transparent: true, opacity: 0, depthWrite: false,
      side: T.DoubleSide, blending: T.AdditiveBlending,
    }));
    beam.position.set(-4 - i * 3.4, 7, -21 - i * 4);
    beam.rotation.z = -0.26 - i * 0.12;
    veil.add(beam);
  }
  scene.add(veil);
  const dark = new T.Color('#101a30');
  const warm = new T.Color('#5f5262');
  function illuminate(t: number) {
    const light = T.MathUtils.smoothstep(t, 0.14, 0.76);
    scene.background = dark.clone().lerp(warm, light * 0.64);
    fog.color.copy(scene.background);
    key.color.set('#b5cafb').lerp(new T.Color('#ffd092'), light);
    key.intensity = 1.35 + light * 3.4;
    ambient.intensity = 1.3 - light * 0.50;
    veil.children.forEach((item, index) => {
      if (item instanceof T.Mesh) item.material.opacity = light * (0.095 - index * 0.02);
    });
  }

  function dispose() {
    const geometries = new Set<T.BufferGeometry>();
    const materials = new Set<T.Material>();
    scene.traverse((item) => {
      if (!(item instanceof T.Mesh)) return;
      geometries.add(item.geometry);
      materials.add(item.material);
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    key.dispose();
  }
  return { scene, avatar, legs, cloak, crystal, illuminate, dispose };
}
