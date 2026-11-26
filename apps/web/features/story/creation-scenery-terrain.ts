import * as T from 'three';
import { stoneRelief } from './creation-day-one-atmosphere';

type Day = 2 | 3 | 4 | 5 | 6 | 7;

const colors: Record<Day, readonly [string, string, string]> = {
  2: ['#817e6b', '#bdad89', '#506577'],
  3: ['#4b6431', '#ac895d', '#637358'],
  4: ['#444358', '#876961', '#615c77'],
  5: ['#557359', '#b5a173', '#4c7371'],
  6: ['#68763e', '#c09a69', '#826347'],
  7: ['#475f2c', '#9e8b5b', '#65705a'],
};

function variation(index: number, salt: number) {
  const value = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function heightAt(day: Day, x: number, z: number) {
  const edge = Math.abs(x);
  const bank = T.MathUtils.smoothstep(edge, 2.95, 5.2);
  const wave = Math.sin(x * .48 + z * .31) * Math.cos(z * .58 - x * .19);
  const small = Math.sin(z * 1.59 + x * .67) * Math.cos(x * 1.23 - z * .35);
  if (day === 2 || day === 5) {
    const islands = day === 5 ? Math.max(0, wave) ** 2 * bank * 1.13 : 0;
    return -.045 - bank * (.69 + wave * .22) + small * .022 + islands;
  }
  if (day === 3) {
    const inlet = Math.exp(-((x - 9) ** 2 / 29 + (z + 13) ** 2 / 105));
    return -.055 + bank * (.22 + wave * .62) - inlet * bank * 1.02 + small * .035;
  }
  return -.065 + bank * (.4 + wave * .69) + small * .032;
}

function groundTexture(size: number) {
  const pixels = new Uint8Array(size * size * 4);
  const grainSizes = [5, 13, 29, 59];
  const grains = grainSizes.map((count, band) => Float32Array.from({ length: count * count }, (_, index) => variation(index, band + 40)));
  function sample(u: number, v: number, band: number) {
    const count = grainSizes[band]!;
    const grain = grains[band]!;
    const x = u * count, y = v * count;
    const col = Math.floor(x), row = Math.floor(y);
    const px = x - col, py = y - row;
    const fx = px * px * (3 - 2 * px), fy = py * py * (3 - 2 * py);
    const nextCol = (col + 1) % count, nextRow = (row + 1) % count;
    const lerp = T.MathUtils.lerp;
    return lerp(
      lerp(grain[row * count + col]!, grain[row * count + nextCol]!, fx),
      lerp(grain[nextRow * count + col]!, grain[nextRow * count + nextCol]!, fx), fy,
    );
  }
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const earth = sample(u, v, 0) - .5;
      const grit = sample(u, v, 1) - .5;
      const gravel = sample(u, v, 2) ** 3;
      const light = earth * 30 + grit * 33 + gravel * 48 + (sample(u, v, 3) - .5) * 18;
      const offset = (y * size + x) * 4;
      pixels[offset] = Math.min(255, 196 + light);
      pixels[offset + 1] = Math.min(255, 190 + light);
      pixels[offset + 2] = Math.min(255, 174 + light);
      pixels[offset + 3] = 255;
    }
  }
  const texture = new T.DataTexture(pixels, size, size);
  texture.colorSpace = T.SRGBColorSpace;
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.repeat.set(28, 27);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

export function addCreationTerrain(scene: T.Scene, day: Day, compact: boolean) {
  const textureSize = compact ? 256 : 512;
  const relief = stoneRelief(textureSize);
  const groundColor = groundTexture(textureSize);
  const [soil, track, stone] = colors[day].map((color) => new T.Color(color)) as [T.Color, T.Color, T.Color];
  const terrain = new T.PlaneGeometry(112, 116, compact ? 72 : 112, compact ? 76 : 116);
  terrain.rotateX(-Math.PI / 2);
  terrain.translate(0, 0, -32);
  const vertices = terrain.getAttribute('position');
  const rgb = new Float32Array(vertices.count * 3);
  const tint = new T.Color();
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), z = vertices.getZ(i);
    const height = heightAt(day, x, z);
    vertices.setY(i, height);
    const trail = Math.abs(x - Math.sin(z * .27) * .26);
    const blend = 1 - T.MathUtils.smoothstep(trail, 1.12, 3.24);
    tint.copy(soil).lerp(track, blend).lerp(stone, Math.max(0, -height) * .45);
    tint.multiplyScalar(.79 + variation(i, 2) * .28 + .12 * Math.sin(z * .44 + x));
    tint.toArray(rgb, i * 3);
  }
  terrain.setAttribute('color', new T.BufferAttribute(rgb, 3));
  terrain.computeVertexNormals();
  const ground = new T.Mesh(terrain, new T.MeshStandardMaterial({
    vertexColors: true, roughness: .94, map: groundColor, bumpMap: groundColor, bumpScale: .26,
  }));
  ground.receiveShadow = true;
  scene.add(ground);

  const rock = new T.IcosahedronGeometry(1, compact ? 3 : 5);
  const points = rock.getAttribute('position');
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i), y = points.getY(i), z = points.getZ(i);
    const profile = 1 + .19 * Math.sin(x * 6 + z * 9 + y * 3) * Math.cos(y * 11 - x * 4);
    points.setXYZ(i, x * profile, y * (profile + .065 * Math.sin(y * 18)), z * profile);
  }
  rock.computeVertexNormals();
  const rockNormals = rock.getAttribute('normal');
  const normal = new T.Vector3();
  const radial = new T.Vector3();
  for (let i = 0; i < rockNormals.count; i++) {
    radial.set(points.getX(i), points.getY(i), points.getZ(i)).normalize();
    normal.set(rockNormals.getX(i), rockNormals.getY(i), rockNormals.getZ(i)).lerp(radial, .56).normalize();
    rockNormals.setXYZ(i, normal.x, normal.y, normal.z);
  }
  const stoneMaterial = new T.MeshStandardMaterial({ roughness: .86, bumpMap: relief, bumpScale: .17 });
  const rockCount = compact ? 66 : 118;
  const boulders = new T.InstancedMesh(rock, stoneMaterial, rockCount);
  const transform = new T.Object3D();
  const ridgeHeight = day === 2 ? 5.8 : day === 4 ? 1.4 : 3.7;
  for (let i = 0; i < rockCount; i++) {
    const ridge = i < 28;
    const side = i % 2 ? 1 : -1;
    const distance = variation(i, 3);
    const x = side * (ridge ? 6.8 + distance * 28 : 2.5 + distance * 10);
    const z = ridge ? 6 - variation(i, 9) * 62 : 11 - variation(i, 9) * 34;
    const scale = ridge ? .95 + variation(i, 17) * ridgeHeight : .10 + variation(i, 17) ** 2 * .51;
    transform.position.set(x, heightAt(day, x, z) + (ridge ? scale * .25 : 0), z);
    transform.rotation.set(variation(i, 5), variation(i, 11) * 6.28, variation(i, 8) * .4);
    transform.scale.set(scale * (ridge ? 1.58 : .9), scale * (ridge ? 1.22 : .53), scale * (ridge ? 1.23 : 1.2));
    transform.updateMatrix();
    boulders.setMatrixAt(i, transform.matrix);
    boulders.setColorAt(i, tint.copy(stone).lerp(track, variation(i, 7) * .37).multiplyScalar(.61 + variation(i, 4) * .72));
  }
  boulders.castShadow = !compact;
  boulders.receiveShadow = true;
  scene.add(boulders);

  return { relief, groundColor };
}

export function addCreationVegetation(scene: T.Scene, day: 3 | 5 | 6 | 7, compact: boolean) {
  const groves = new T.Group();
  const treeCount = compact ? 15 : 25;
  const trunkGeometry = new T.CylinderGeometry(.14, .29, 2.9, 8);
  const crownGeometry = new T.IcosahedronGeometry(1, 2);
  const wood = new T.MeshStandardMaterial({ color: '#584538', roughness: .92 });
  const leaf = new T.MeshStandardMaterial({ roughness: .85, flatShading: true });
  const trunks = new T.InstancedMesh(trunkGeometry, wood, treeCount * 3);
  const crowns = new T.InstancedMesh(crownGeometry, leaf, treeCount * 5);
  const transform = new T.Object3D();
  const tint = new T.Color();
  for (let i = 0; i < treeCount; i++) {
    const side = i % 2 ? -1 : 1;
    const x = side * (4.5 + variation(i, 1) * (day === 5 ? 10 : 13));
    const z = 7 - variation(i, 2) * 40;
    const scale = .70 + variation(i, 5) * 1.24;
    const y = heightAt(day, x, z);
    for (let b = 0; b < 3; b++) {
      const lean = b === 0 ? .06 : (b - 1.5) * .94;
      transform.position.set(x + lean * scale, y + (b ? 2.45 : 1.42) * scale, z);
      transform.rotation.set(b * .19, 0, -lean);
      transform.scale.set(b ? scale * .58 : scale, scale * (b ? .64 : 1), scale);
      transform.updateMatrix();
      trunks.setMatrixAt(i * 3 + b, transform.matrix);
    }
    for (let b = 0; b < 5; b++) {
      const angle = b * 2.4 + variation(i, 6);
      const spread = b === 0 ? 0 : 1.05;
      transform.position.set(x + Math.cos(angle) * spread * scale, y + (b === 0 ? 3.9 : 3.05 + variation(i, b + 10) * .6) * scale, z + Math.sin(angle) * spread * scale);
      transform.rotation.set(b * .31, i * .72, angle * .19);
      transform.scale.set(scale * (1.02 + variation(i, b + 3) * .47), scale * .82, scale * 1.06);
      transform.updateMatrix();
      crowns.setMatrixAt(i * 5 + b, transform.matrix);
      const green = day === 7 ? ['#72933a', '#527026', '#a2a953'] : ['#4c793d', '#315738', '#789649'];
      crowns.setColorAt(i * 5 + b, tint.set(green[(i + b) % green.length]!).multiplyScalar(.74 + variation(i, b + 6) * .53));
    }
  }
  crowns.castShadow = !compact;
  trunks.castShadow = !compact;
  crowns.receiveShadow = true;
  groves.add(trunks, crowns);

  const count = compact ? 390 : 950;
  const blade = new T.BufferGeometry();
  blade.setAttribute('position', new T.Float32BufferAttribute([
    -.065, 0, 0, .085, 0, 0, .055, .34, .04,
    -.065, 0, 0, .055, .34, .04, -.025, .32, .035,
    -.025, .32, .035, .055, .34, .04, .19, .69, .11,
  ], 3));
  blade.computeVertexNormals();
  const grass = new T.InstancedMesh(blade, new T.MeshStandardMaterial({ side: T.DoubleSide, roughness: .94 }), count);
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (1.25 + variation(i, 2) ** 1.35 * (day === 5 ? 2.45 : 8));
    const z = 11 - variation(i, 5) * 33;
    const y = heightAt(day, x, z);
    const size = y < -.19 ? .001 : .24 + variation(i, 3) * .69;
    transform.position.set(x, y, z);
    transform.rotation.set(.05, variation(i, 1) * Math.PI * 2, .19);
    transform.scale.set(size, size * (1 + variation(i, 4)), size);
    transform.updateMatrix();
    grass.setMatrixAt(i, transform.matrix);
    const flower = day === 7 && i % 17 === 0;
    grass.setColorAt(i, tint.set(flower ? '#cdb888' : i % 3 === 0 ? '#8b9d43' : '#587537').multiplyScalar(.68 + variation(i, 6) * .57));
  }
  grass.receiveShadow = true;
  groves.add(grass);
  if (day === 7) {
    const count = compact ? 27 : 57;
    const petals = new T.InstancedMesh(new T.SphereGeometry(.1, 6, 4), new T.MeshStandardMaterial({ roughness: .78 }), count * 5);
    const stems = new T.InstancedMesh(new T.CylinderGeometry(.012, .024, 1, 5), new T.MeshStandardMaterial({ color: '#66743f', roughness: .92 }), count);
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? -1 : 1;
      const x = side * (2 + variation(i, 27) * 2.7);
      const z = 8 - variation(i, 30) * 26;
      const height = .25 + variation(i, 32) * .26;
      const y = heightAt(day, x, z) + height;
      transform.position.set(x, y - height * .5, z);
      transform.rotation.set(0, 0, 0);
      transform.scale.set(1, height, 1);
      transform.updateMatrix();
      stems.setMatrixAt(i, transform.matrix);
      for (let petal = 0; petal < 5; petal++) {
        const angle = petal * Math.PI * .4;
        transform.position.set(x + Math.cos(angle) * .075, y, z + Math.sin(angle) * .075);
        transform.rotation.set(.38, -angle, .12);
        transform.scale.set(1.02, .41, .56);
        transform.updateMatrix();
        petals.setMatrixAt(i * 5 + petal, transform.matrix);
        petals.setColorAt(i * 5 + petal, tint.set(i % 3 === 0 ? '#d7a099' : '#eaca8f'));
      }
    }
    groves.add(stems, petals);
  }
  scene.add(groves);
  return { groves, crowns };
}
