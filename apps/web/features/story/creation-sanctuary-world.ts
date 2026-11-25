import * as T from 'three';
import type { Appearance } from '../journey/domain/traveler';
import { stoneRelief } from './creation-day-one-atmosphere';

export const SANCTUARY_PORTAL_Z = -13;

export function sanctuaryHeight(x: number, z: number) {
  const edge = T.MathUtils.smoothstep(Math.abs(x), 2.1, 12);
  return edge * (0.85 + Math.sin(x * 0.24 + z * 0.18) * 0.72 + Math.cos(z * 0.42) * 0.45);
}

export function buildSanctuary(appearance: Appearance, compact: boolean) {
  const scene = new T.Scene();
  scene.background = new T.Color('#b9caca');
  scene.fog = new T.FogExp2('#b3c6c5', 0.020);
  const sun = new T.DirectionalLight('#ffe0a6', 3.15);
  sun.position.set(-15, 23, -10);
  sun.target.position.z = -6;
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(compact ? 512 : 1024);
  Object.assign(sun.shadow.camera, { left: -19, right: 19, top: 22, bottom: -19, far: 65 });
  sun.shadow.normalBias = 0.035;
  scene.add(new T.HemisphereLight('#d2ebfa', '#6c7150', 2.05), sun, sun.target);

  const stone = stoneRelief();
  const material = (color: string, roughness = 0.88) => new T.MeshStandardMaterial({ color, roughness });
  function mesh(g: T.BufferGeometry, m: T.Material, x: number, y: number, z: number, parent: T.Object3D = scene) {
    const part = new T.Mesh(g, m);
    part.position.set(x, y, z);
    part.receiveShadow = true;
    parent.add(part);
    return part;
  }
  const sky = new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, uniforms: {},
    vertexShader: `
      varying vec3 ray;
      void main() { ray = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      varying vec3 ray;
      void main() {
        vec3 d = normalize(ray);
        float height = clamp(d.y * 1.8, 0., 1.);
        vec3 air = mix(vec3(.81,.67,.49), vec3(.16,.43,.62), smoothstep(0.,.85,height));
        float glow = max(0., dot(d, normalize(vec3(-.50,.17,-.87))));
        float bands = sin(d.x*14. + sin(d.x*9.)*1.9 + d.y*47.);
        float cloud = smoothstep(.42,.92,bands) * smoothstep(.02,.15,d.y) * (1.-smoothstep(.25,.54,d.y));
        air = mix(air, vec3(1.1,.82,.61), cloud*.4);
        air += vec3(1.0,.60,.21)*(pow(glow,17.)*.75+pow(glow,580.)*2.);
        gl_FragColor = vec4(air,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  mesh(new T.SphereGeometry(86, 32, 18), sky, 0, 0, -10).renderOrder = -1;
  const terrain = new T.PlaneGeometry(120, 110, 65, 58);
  terrain.rotateX(-Math.PI / 2);
  const v = terrain.getAttribute('position');
  const turfColors = new Float32Array(v.count * 3);
  const tint = new T.Color();
  for (let i = 0; i < v.count; i++) {
    const x = v.getX(i), z = v.getZ(i) - 23;
    v.setY(i, sanctuaryHeight(x, z));
    const shade = Math.sin(x * 0.71 + z * 0.44) * 0.5 + 0.5;
    tint.set('#547348').lerp(new T.Color('#9a9b61'), shade * 0.58).toArray(turfColors, i * 3);
  }
  terrain.setAttribute('color', new T.BufferAttribute(turfColors, 3));
  terrain.computeVertexNormals();
  mesh(terrain, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.97 }), 0, 0, -23);

  const seed = (i: number) => (Math.sin(i * 91.17 + 53.1) * 51969 % 1 + 1) % 1;
  const pose = new T.Object3D();
  function scatter(
    geometry: T.BufferGeometry, mat: T.Material, count: number,
    place: (i: number) => string, cast = false,
  ) {
    const instances = new T.InstancedMesh(geometry, mat, count);
    instances.receiveShadow = true;
    instances.castShadow = cast;
    for (let i = 0; i < count; i++) {
      pose.rotation.set(0, 0, 0);
      instances.setColorAt(i, tint.set(place(i)));
      pose.updateMatrix();
      instances.setMatrixAt(i, pose.matrix);
    }
    scene.add(instances);
  }
  const rockGeometry = new T.DodecahedronGeometry(1, 0);
  const rock = new T.MeshStandardMaterial({ color: '#eee5d5', roughness: 0.85, bumpMap: stone, bumpScale: 0.14, flatShading: true });
  scatter(rockGeometry, rock, 72, (i) => {
    const x = (i % 2 ? -1 : 1) * (3 + seed(i) * 26);
    const z = 9 - seed(i + 400) * 54;
    const size = 0.32 + seed(i + 800) * 2.7;
    pose.position.set(x, sanctuaryHeight(x, z) + size * 0.24, z);
    pose.scale.set(size, size * 0.62, size * 0.9);
    pose.rotation.set(i * 0.4, i, i * 0.15);
    return i % 3 ? '#8d9481' : '#a8a389';
  }, !compact);

  const pathMat = new T.MeshStandardMaterial({ color: '#fff0d8', bumpMap: stone, bumpScale: 0.1, roughness: 0.86 });
  scatter(new T.CylinderGeometry(1, 1.06, 0.24, 7), pathMat, 52, (i) => {
    const row = Math.floor(i / 2);
    pose.position.set((i % 2 ? 1 : -1) * (0.95 + seed(i) * 0.12), 0.012, 8 - row * 0.91);
    pose.scale.set(1.25, 0.60, 0.57);
    pose.rotation.y = seed(i + 78) * 0.45;
    return i % 5 === 0 ? '#b3a38f' : '#928a75';
  });
  scatter(rockGeometry, material('#e0e4d9'), 28, (i) => {
    const x = (i % 2 ? 1 : -1) * (14 + seed(i + 260) * 35);
    const z = -31 - seed(i + 67) * 43;
    const height = 6 + seed(i + 8) * 16;
    pose.position.set(x, height * 0.35, z);
    pose.scale.set(4 + seed(i + 5) * 11, height, 7);
    pose.rotation.set(0.08, i, 0.24);
    return '#697e7c';
  });

  const trees = Array.from({ length: compact ? 34 : 53 }, (_, i) => {
    const x = (i % 2 ? 1 : -1) * (4.6 + seed(i + 1) * 24);
    const z = 6 - seed(i + 230) * 54;
    return { x, z, y: sanctuaryHeight(x, z), height: 2.4 + seed(i + 9) * 3.5 };
  });
  scatter(new T.CylinderGeometry(0.12, 0.23, 1, 6), material('#f0e5cc'), trees.length, (i) => {
    const { x, y, z, height } = trees[i];
    pose.position.set(x, y + height * 0.27, z);
    pose.scale.set(1, height * 0.55, 1);
    return '#66523e';
  });
  scatter(new T.ConeGeometry(1, 1, 8), material('#d4e3ca'), trees.length * 3, (i) => {
    const { x, y, z, height } = trees[Math.floor(i / 3)];
    const layer = i % 3;
    const radius = height * (0.28 - layer * 0.05);
    pose.position.set(x, y + height * (0.48 + layer * 0.19), z);
    pose.scale.set(radius, height * 0.47, radius);
    pose.rotation.y = i * 0.7;
    return ['#3e6848', '#527d52', '#6a8b5a'][layer];
  }, !compact);
  scatter(new T.IcosahedronGeometry(1, 0), material('#f1f2d5'), compact ? 145 : 260, (i) => {
    const x = (i % 2 ? 1 : -1) * (2.4 + seed(i + 31) * 18);
    const z = 9 - seed(i + 71) * 42;
    const size = 0.13 + seed(i + 90) * 0.53;
    pose.position.set(x, sanctuaryHeight(x, z) + size * 0.35, z);
    pose.scale.set(size, size * 0.65, size * 0.83);
    pose.rotation.y = i * 0.9;
    return i % 13 === 0 ? '#bcaa65' : i % 3 ? '#658048' : '#7e985e';
  });

  const portal = new T.Group();
  portal.position.z = SANCTUARY_PORTAL_Z;
  scene.add(portal);
  const carved = rock.clone();
  carved.color.set('#b1a494');
  const trim = material('#ae8750', 0.58);
  const block = new T.BoxGeometry(1, 1, 1);
  for (const side of [-1, 1]) {
    mesh(block, carved, side * 2.08, 0.16, 0, portal).scale.set(1.16, 0.32, 1.76);
    for (let i = 0; i < 5; i++) {
      const p = mesh(block, carved, side * 2.08, 0.56 + i * 0.45, 0, portal);
      p.scale.set(i % 2 ? 0.71 : 0.83, 0.43, 1.12);
      p.castShadow = true;
      mesh(block, trim, side * 2.08, p.position.y, 0.57, portal).scale.set(0.08, 0.21, 0.04);
    }
  }
  for (let i = 0; i < 13; i++) {
    const a = i * Math.PI / 13 + 0.012;
    const b = (i + 1) * Math.PI / 13 - 0.012;
    const wedge = new T.Shape();
    wedge.absarc(0, 2.55, 2.47, a, b, false);
    wedge.absarc(0, 2.55, 1.70, b, a, true);
    wedge.closePath();
    const g = new T.ExtrudeGeometry(wedge, { depth: 0.94, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.039, bevelSegments: 1, curveSegments: 3 });
    mesh(g, i === 6 ? trim : carved, 0, 0, -0.52, portal).castShadow = true;
  }
  const opening = new T.Shape();
  opening.moveTo(-1.7, 0.11);
  opening.lineTo(1.7, 0.11);
  opening.lineTo(1.7, 2.55);
  opening.absarc(0, 2.55, 1.7, 0, Math.PI, false);
  opening.closePath();
  const time = { value: 0 };
  const veil = new T.ShaderMaterial({
    side: T.DoubleSide, uniforms: { time },
    vertexShader: `
      varying vec2 p;
      void main() { p=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }
    `,
    fragmentShader: `
      varying vec2 p;
      uniform float time;
      void main() {
        float edge=max(abs(p.x),length(vec2(p.x,max(0.,p.y-2.55))));
        float ripple=sin(p.y*4.8+sin(p.x*6.3+time*.65)*1.5-time*1.15);
        float ribbons=pow(.5+.5*ripple,6.);
        float rim=smoothstep(1.30,1.68,edge);
        vec3 c=mix(vec3(.024,.14,.22),vec3(.10,.56,.61), .28+ribbons*.55);
        c+=vec3(.40,.83,.72)*(rim*.85 + .30*exp(-abs(p.x)*1.6));
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  mesh(new T.ShapeGeometry(opening, 24), veil, 0, 0, 0, portal);
  const portalLight = new T.PointLight('#78f5dc', 32, 9);
  portalLight.position.set(0, 1.6, 0.8);
  portal.add(portalLight);
  const dust = new Float32Array((compact ? 28 : 48) * 3);
  for (let i = 0; i < dust.length; i += 3) {
    dust[i] = (seed(i + 41) - 0.5) * 5;
    dust[i + 1] = 0.5 + seed(i + 60) * 4.2;
    dust[i + 2] = 0.7 + seed(i + 99) * 2.5;
  }
  const dustGeometry = new T.BufferGeometry();
  dustGeometry.setAttribute('position', new T.BufferAttribute(dust, 3));
  const motes = new T.Points(dustGeometry, new T.PointsMaterial({
    color: '#d2ffc4', size: 0.062, transparent: true, opacity: 0.65, depthWrite: false, blending: T.AdditiveBlending,
  }));
  portal.add(motes);

  const actor = new T.Group();
  actor.position.set(0, 0.12, 4.2);
  scene.add(actor);
  const torso = new T.Group();
  actor.add(torso);
  const skin = material({ claro: '#d9a983', medio: '#b27b55', escuro: '#794e3d' }[appearance.skin]);
  const cloth = material({ musgo: '#59694f', ocre: '#9d693c', azul: '#496f8f' }[appearance.outfit]);
  const leather = material('#413330');
  const hair = material('#342528');
  mesh(new T.CylinderGeometry(0.28, 0.40, 0.78, 10), cloth, 0, 1.04, 0, torso);
  mesh(new T.CylinderGeometry(0.36, 0.37, 0.09, 10), leather, 0, 0.86, 0, torso);
  mesh(new T.IcosahedronGeometry(0.23, 2), skin, 0, 1.58, -0.02, torso);
  const crown = mesh(new T.IcosahedronGeometry(0.244, 2), hair, 0, 1.68, 0.05, torso);
  if (appearance.hair !== 'curto') crown.scale.set(1.1, 1.14, 1.1);
  if (appearance.hair === 'longo') mesh(new T.CapsuleGeometry(0.135, 0.24), hair, 0, 1.49, 0.16, torso);
  const cloak = mesh(new T.CylinderGeometry(0.25, 0.43, 0.96, 10, 2, true, 0.16, 2.82), cloth.clone(), 0, 1.01, 0.16, torso);
  cloak.rotation.set(0.13, -Math.PI / 2, 0);
  cloak.material.side = T.DoubleSide;
  const arms: T.Group[] = [];
  const legs: T.Group[] = [];
  for (const side of [-1, 1]) {
    const arm = new T.Group();
    arm.position.set(side * 0.34, 1.28, 0);
    arm.rotation.z = side * 0.16;
    torso.add(arm);
    arms.push(arm);
    mesh(new T.CapsuleGeometry(0.10, 0.35, 4, 7), cloth, 0, -0.17, 0, arm);
    mesh(new T.IcosahedronGeometry(0.095, 1), skin, 0, -0.44, 0, arm);
    const leg = new T.Group();
    leg.position.set(side * 0.15, 0.69, 0);
    actor.add(leg);
    legs.push(leg);
    mesh(new T.BoxGeometry(0.20, 0.48, 0.21), leather, 0, -0.23, 0, leg);
    mesh(new T.BoxGeometry(0.21, 0.16, 0.33), leather, 0, -0.60, -0.06, leg);
  }
  actor.traverse((part) => { if (part instanceof T.Mesh) part.castShadow = true; });

  function animate(t: number, stride: number, motion: number, reduced: boolean) {
    time.value = reduced ? 0 : t;
    motes.position.y = reduced ? 0 : Math.sin(t * 0.8) * 0.29;
    torso.position.y = reduced ? 0 : Math.abs(Math.sin(stride)) * motion * 0.055 + (1 - motion) * Math.sin(t * 2.6) * 0.019;
    cloak.rotation.x = 0.13 + motion * (0.12 + Math.sin(stride) * 0.055);
    for (let i = 0; i < legs.length; i++) {
      legs[i].rotation.x = Math.sin(stride + i * Math.PI) * motion * 0.50;
      arms[i].rotation.x = -legs[i].rotation.x * 0.68;
    }
  }

  function dispose() {
    const geometries = new Set<T.BufferGeometry>();
    const materials = new Set<T.Material>();
    scene.traverse((part) => {
      if (!(part instanceof T.Mesh || part instanceof T.Points)) return;
      geometries.add(part.geometry);
      materials.add(part.material);
      if (part instanceof T.InstancedMesh) part.dispose();
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    stone.dispose();
    sun.dispose();
  }
  return { scene, actor, animate, dispose };
}
