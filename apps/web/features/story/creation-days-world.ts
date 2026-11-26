import * as T from 'three';
import type { Appearance, AvatarConfig } from '../journey/domain/traveler';
import type { CreationMarker } from './creation-days';
import { walkDayOne } from './creation-day-one-world';
import { addCreationSky, addCreationWater } from './creation-scenery-shaders';
import { addCreationTerrain, addCreationVegetation } from './creation-scenery-terrain';

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
  const fog = new T.FogExp2(day === 7 ? '#c2b294' : spec.sky, day === 4 ? 0.021 : 0.023);
  scene.fog = fog;
  const ambient = new T.HemisphereLight('#c7e2f7', spec.ground, 1.38);
  scene.add(ambient);
  const sun = new T.DirectionalLight(day === 4 ? '#d2dbff' : '#ffe1b7', day === 7 ? 3.05 : 2.6);
  sun.position.set(-11, day === 7 ? 9 : 14, 4);
  sun.target.position.set(0, 0, -10);
  sun.castShadow = !compact;
  sun.shadow.mapSize.setScalar(compact ? 512 : 1024);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 18, bottom: -18, far: 48 });
  sun.shadow.normalBias = 0.075;
  sun.shadow.bias = -0.0002;
  scene.add(sun, sun.target);
  const sky = addCreationSky(scene, day, compact);
  const terrain = addCreationTerrain(scene, day, compact);
  const water = day === 2 || day === 3 || day === 5 ? addCreationWater(scene, day, compact) : undefined;
  const vegetation = day === 3 || day >= 5 ? addCreationVegetation(scene, day as 3 | 5 | 6 | 7, compact) : undefined;

  const animated: Array<{ object: T.Object3D; kind: 'bird' | 'fish' | 'plant' | 'orbit' | 'leg' | 'wing' | 'tail'; phase: number; baseY: number; baseX?: number; baseZ?: number }> = [];
  let celestial: T.Group | undefined;
  let stars: T.Points<T.BufferGeometry, T.PointsMaterial> | undefined;
  let humanTableau: T.Group | undefined;
  const material = (color: string, roughness = 0.78, emissive?: string) => new T.MeshStandardMaterial({ color, roughness, ...(emissive ? { emissive, emissiveIntensity: 0.36 } : {}) });
  const addMesh = (geometry: T.BufferGeometry, color: string, position: [number, number, number], scale: [number, number, number] = [1, 1, 1], parent: T.Object3D = scene, roughness = 0.78, emissive?: string) => {
    const object = new T.Mesh(geometry, material(color, roughness, emissive));
    object.position.set(...position); object.scale.set(...scale); object.castShadow = !compact; object.receiveShadow = true;
    parent.add(object); return object;
  };
  const groupAt = (x: number, y: number, z: number, parent: T.Object3D = scene) => {
    const group = new T.Group(); group.position.set(x, y, z); parent.add(group); return group;
  };
  let youngPlants: T.Group | undefined;
  if (day === 3) {
    const field = groupAt(0, 0, 0);
    youngPlants = field;
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
      const x = (i % 2 ? 1 : -1) * (1.8 + ((i * 2.73) % 2.1));
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
  }
  if (day === 4) {
    const orbit = groupAt(0, 0, -27);
    celestial = orbit;
    orbit.position.y = 9.1;
    const solar = addMesh(new T.SphereGeometry(1.84, 32, 20), '#ffda81', [-8.1, -1.7, 0], [1, 1, 1], orbit, .62, '#ffb149');
    solar.material.emissiveIntensity = 2.1;
    solar.castShadow = false;
    const lunar = addMesh(new T.SphereGeometry(1.23, 28, 18), '#b5c5e6', [7.1, .9, 0], [1, 1, 1], orbit, .93, '#6f8db2');
    lunar.material.bumpMap = terrain.relief;
    lunar.material.bumpScale = .22;
    lunar.castShadow = false;
    for (const [body, color, size] of [[solar, '#ffaf5b', 5.8], [lunar, '#a6c9f9', 3.7]] as const) {
      const halo = new T.Mesh(new T.PlaneGeometry(size, size), new T.ShaderMaterial({
        transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        uniforms: { tint: { value: new T.Color(color) } },
        vertexShader: 'varying vec2 p; void main(){ p=uv-.5; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: 'varying vec2 p; uniform vec3 tint; void main(){ gl_FragColor=vec4(tint,pow(1.-smoothstep(.14,.5,length(p)),2.)*.49); }',
      }));
      halo.position.copy(body.position);
      halo.position.z -= 1.9;
      orbit.add(halo);
    }
    const starPositions = new Float32Array((compact ? 165 : 290) * 3);
    for (let i = 0; i < starPositions.length; i += 3) {
      starPositions[i] = 61 * Math.sin(i * 1.913);
      starPositions[i + 1] = 5 + 32 * Math.abs(Math.sin(i * .071 + 3.2));
      starPositions[i + 2] = -68 + 17 * Math.sin(i * .729);
    }
    const starGeometry = new T.BufferGeometry();
    starGeometry.setAttribute('position', new T.BufferAttribute(starPositions, 3));
    stars = new T.Points(starGeometry, new T.PointsMaterial({ color: '#fff1ce', size: .115, transparent: true, opacity: .75, depthWrite: false, fog: false }));
    scene.add(stars);
  }
  if (day === 5) {
    const body = new T.SphereGeometry(.26, 12, 8);
    const fin = new T.ConeGeometry(.24, .33, 3);
    for (let i = 0; i < (compact ? 12 : 20); i++) {
      const side = i % 2 ? -1 : 1;
      const fish = groupAt(side * (4.45 + (i % 5) * .75), -.33 - (i % 3) * .09, -4 - Math.floor(i / 4) * 2.7);
      const color = i % 3 ? '#97d6cc' : '#e9a45a';
      addMesh(body, color, [0, 0, 0], [.78, .67, 1.67], fish, .28).castShadow = false;
      const tail = groupAt(0, 0, .37, fish);
      const blade = addMesh(fin, color, [0, 0, .15], [.32, 1, 1.3], tail);
      blade.rotation.x = -Math.PI / 2;
      blade.castShadow = false;
      animated.push({ object: tail, kind: 'tail', phase: i * .6, baseY: 0 });
      animated.push({ object: fish, kind: 'fish', phase: i * .48, baseY: fish.position.y, baseX: fish.position.x, baseZ: fish.position.z });
    }
    const feathers = new T.SphereGeometry(1, 10, 6);
    for (let i = 0; i < (compact ? 6 : 10); i++) {
      const bird = groupAt(-11 + i * 2.4, 3.6 + Math.sin(i * 1.4) * 1.1, -14 - (i % 3) * 4);
      addMesh(feathers, '#eee7d9', [0, 0, 0], [.16, .14, .43], bird).castShadow = false;
      addMesh(fin, '#c59354', [0, .04, -.43], [.32, .73, .25], bird).rotation.x = -Math.PI / 2;
      for (const side of [-1, 1]) {
        const wing = groupAt(side * .09, .02, 0, bird);
        const plume = addMesh(feathers, '#cfcac0', [side * .48, 0, .13], [.56, .046, .22], wing);
        plume.rotation.y = side * -.24;
        plume.castShadow = false;
        animated.push({ object: wing, kind: 'wing', phase: i * .72, baseY: side });
      }
      animated.push({ object: bird, kind: 'bird', phase: i * .72, baseY: bird.position.y, baseX: bird.position.x, baseZ: bird.position.z });
    }
  }
  if (day === 6) {
    for (let i = 0; i < 7; i++) {
      const side = i % 2 ? -1 : 1;
      const animal = groupAt(side * (3.5 + i % 3 * 1.65), 0, -5 - i * 2.65);
      animal.rotation.y = side * -.68;
      const color = ['#a6653f', '#765649', '#ceba94'][i % 3]!;
      addMesh(new T.SphereGeometry(.79, 16, 12), color, [0, .99, 0], [.75, .76, 1.47], animal);
      addMesh(new T.SphereGeometry(.48, 12, 9), color, [0, 1.38, -.76], [.62, 1.15, .73], animal);
      addMesh(new T.SphereGeometry(.36, 12, 9), color, [0, 1.84, -1.10], [.85, .88, 1.06], animal);
      addMesh(new T.SphereGeometry(.22, 10, 8), '#654636', [0, 1.74, -1.36], [1.04, .67, 1.17], animal);
      for (const earSide of [-1, 1]) {
        const ear = addMesh(new T.SphereGeometry(.20, 9, 6), color, [earSide * .30, 2, -1.07], [.88, .35, 1], animal);
        ear.rotation.z = earSide * .58;
      }
      for (const side of [-1, 1]) for (const back of [-1, 1]) {
        const hip = groupAt(side * .32, .81, back * .65, animal);
        addMesh(new T.CylinderGeometry(.145, .065, .72, 7), color, [0, -.32, 0], [1, 1, 1], hip);
        addMesh(new T.BoxGeometry(.15, .115, .20), '#4b3933', [0, -.70, -.024], [1, 1, 1], hip);
        animated.push({ object: hip, kind: 'leg', phase: i + (side === back ? 0 : Math.PI), baseY: 0 });
      }
      if (i % 3 === 0) for (const hornSide of [-1, 1]) {
        const horn = addMesh(new T.ConeGeometry(.077, .53, 7), '#ddc498', [hornSide * .20, 2.20, -1.08], [1, 1, 1], animal);
        horn.rotation.z = hornSide * -.39;
      }
      animated.push({ object: animal, kind: 'plant', phase: i * .7, baseY: 0 });
    }
    humanTableau = groupAt(0, 0, -15.8);
    for (let i = 0; i < 2; i++) {
      const figure = groupAt(i ? 2.85 : -2.85, 0, i * .52, humanTableau);
      const cloth = i ? '#778e71' : '#bd8b5f';
      const skin = i ? '#87553d' : '#ae7752';
      const tunic = addMesh(new T.CylinderGeometry(.27, .48, 1.26, 14), cloth, [0, .72, 0], [1, 1, .64], figure);
      tunic.material.bumpMap = terrain.relief;
      tunic.material.bumpScale = .08;
      addMesh(new T.SphereGeometry(.25, 18, 12), skin, [0, 1.60, -.025], [.84, 1.12, .94], figure);
      addMesh(new T.SphereGeometry(.244, 14, 9), '#3d302a', [0, 1.69, .055], [.88, .78, .91], figure);
      for (const side of [-1, 1]) {
        const arm = addMesh(new T.CapsuleGeometry(.075, .47, 4, 9), skin, [side * .30, 1.06, -.016], [1, 1, 1], figure);
        arm.rotation.z = side * .22;
      }
      figure.rotation.y = i ? -.43 : .39;
      figure.scale.setScalar(i ? 1.02 : 1.16);
    }
  }
  if (day === 7) {
    const dust = new Float32Array((compact ? 36 : 74) * 3);
    for (let i = 0; i < dust.length; i += 3) {
      dust[i] = Math.sin(i * .77) * 11;
      dust[i + 1] = .42 + (i * .37) % 6;
      dust[i + 2] = 5 - (i * .61) % 40;
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.BufferAttribute(dust, 3));
    const points = new T.Points(geometry, new T.PointsMaterial({ color: '#efcc88', transparent: true, opacity: .42, size: .067, depthWrite: false }));
    scene.add(points);
    animated.push({ object: points, kind: 'plant', phase: 1, baseY: 0 });
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
  const contact = new T.Mesh(new T.PlaneGeometry(1.6, 1.3), new T.ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 p; void main(){ p=uv-.5; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'varying vec2 p; void main(){ gl_FragColor=vec4(.04,.034,.028,(1.-smoothstep(.05,.5,length(p)))*.59); }',
  }));
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = .024;
  avatar.add(contact);

  const dayColor = fog.color.clone();
  const nightColor = new T.Color('#464361');
  let played = false;
  return {
    scene, avatar, torso, cloak, legs, arms, markerGroups,
    update(time: number, cinematic: number) {
      sky.time.value = time;
      if (cinematic > 0) played = true;
      const reveal = cinematic || Number(played);
      if (day === 2) sky.phase.value = T.MathUtils.smoothstep(reveal, .08, .8);
      if (water) {
        water.time.value = time;
        if (day === 3) water.surface.position.y = -.16 - T.MathUtils.smoothstep(reveal, .02, .49) * .16;
      }
      if (day === 3 && vegetation && youngPlants) {
        const growth = T.MathUtils.smoothstep(reveal, .18, .92);
        vegetation.groves.scale.y = .68 + growth * .32;
        youngPlants.scale.y = .19 + growth * .81;
      }
      if (celestial && stars) {
        const night = .19 + .81 * T.MathUtils.smoothstep(reveal, .38, .95);
        sky.night.value = night;
        celestial.rotation.z = -.04 + night * .27;
        celestial.position.y = 9.1 + night * 1.65;
        stars.material.opacity = .32 + night * .66;
        fog.color.copy(dayColor).lerp(nightColor, night);
        ambient.intensity = 1.48 - night * .70;
        sun.intensity = 3.0 - night * 2.06;
      }
      if (humanTableau) {
        const emergence = T.MathUtils.smoothstep(reveal, .35, .92);
        humanTableau.scale.y = .74 + emergence * .26;
      }
      if (vegetation && day === 7) {
        vegetation.crowns.rotation.z = Math.sin(time * .36) * .012;
      }
      for (const item of animated) {
        switch (item.kind) {
          case 'bird': {
            const arc = time * .32 + item.phase;
            item.object.position.set(item.baseX! + Math.sin(arc) * 3.4, item.baseY + Math.sin(arc * 2) * .57, item.baseZ! + Math.cos(arc) * 2.8);
            item.object.rotation.set(.05, Math.atan2(-Math.cos(arc) * 3.4, Math.sin(arc) * 2.8), Math.sin(arc) * .16);
            break;
          }
          case 'fish': {
            const arc = time * .69 + item.phase;
            item.object.position.set(item.baseX! + Math.sin(arc) * .82, item.baseY + Math.sin(arc * 2) * .09, item.baseZ! + Math.cos(arc) * 1.65);
            item.object.rotation.y = Math.atan2(-Math.cos(arc) * .82, Math.sin(arc) * 1.65);
            break;
          }
          case 'wing': item.object.rotation.z = item.baseY * Math.sin(time * 5.4 + item.phase) * .54; break;
          case 'tail': item.object.rotation.y = Math.sin(time * 8.5 + item.phase) * .37; break;
          case 'leg': item.object.rotation.x = Math.sin(time * 2.2 + item.phase) * .10; break;
          case 'plant': item.object.rotation.z = Math.sin(time * 1.15 + item.phase) * .018; break;
          case 'orbit': item.object.rotation.y = time * .18 + item.phase; break;
        }
      }
      markerGroups.forEach(({ group }, index) => { group.rotation.y = Math.sin(time * 0.7 + index) * 0.06; });
    },
    dispose() {
      const geometries = new Set<T.BufferGeometry>();
      const materials = new Set<T.Material>();
      scene.traverse((item) => {
        if (!(item instanceof T.Mesh || item instanceof T.Points)) return;
        geometries.add(item.geometry);
        const mats = Array.isArray(item.material) ? item.material : [item.material];
        mats.forEach((mat) => materials.add(mat));
        if (item instanceof T.InstancedMesh) item.dispose();
      });
      geometries.forEach((item) => item.dispose());
      materials.forEach((item) => item.dispose());
      terrain.relief.dispose();
      terrain.groundColor.dispose();
      sun.dispose();
    },
  };
}

export function walkCreationWorld(x: number, z: number, dx: number, dz: number, dt: number) {
  const point = walkDayOne(x, z, dx, dz, dt);
  return { x: T.MathUtils.clamp(point.x, -3.8, 3.8), z: T.MathUtils.clamp(point.z, -16, 9) };
}
