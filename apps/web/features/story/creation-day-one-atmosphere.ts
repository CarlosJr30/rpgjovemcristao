import * as T from 'three';

export function stoneRelief() {
  const size = 256;
  const pixels = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size * Math.PI * 2;
      const v = y / size * Math.PI * 2;
      const strata = Math.sin(v * 14 + Math.sin(u * 4) * 2.8);
      const grain = Math.sin(u * 37 + v * 53) * Math.cos(u * 81 - v * 29);
      const fractures = Math.pow(Math.abs(Math.sin(u * 7 - v * 5 + strata * 0.52)), 24);
      pixels[y * size + x] = 150 + strata * 24 + grain * 17 - fractures * 54;
    }
  }
  const texture = new T.DataTexture(pixels, size, size, T.RedFormat);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 2;
  texture.needsUpdate = true;
  return texture;
}

export function buildAtmosphere(scene: T.Scene, compact: boolean) {
  const light = { value: 0 };
  const eclipse = { value: 0 };
  const time = { value: 0 };
  const sky = new T.Mesh(new T.SphereGeometry(90, 32, 16), new T.ShaderMaterial({
    side: T.BackSide,
    depthWrite: false,
    uniforms: { light, eclipse, time },
    vertexShader: `
      varying vec3 direction;
      void main() {
        direction = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 direction;
      uniform float light, eclipse, time;
      void main() {
        vec3 d = normalize(direction);
        float horizon = exp(-abs(d.y - 0.06) * 5.0);
        float division = smoothstep(-0.28, 0.22, -d.x - 0.18 + d.y * 0.48);
        float layers = sin(d.x * 14.0 + d.y * 28.0 + sin(d.x * 7.0 + time * 0.08) * 2.1);
        float mist = horizon * (0.73 + layers * 0.12);
        vec3 base = mix(vec3(0.009, 0.016, 0.044), vec3(0.064, 0.131, 0.205), mist);
        vec3 glow = mix(vec3(0.30, 0.065, 0.042), vec3(1.22, 0.53, 0.18), horizon);
        vec3 color = base * (1.0 - eclipse * 0.72) + glow * light * division * (0.26 + mist * 0.74);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  }));
  sky.position.z = -9;
  sky.renderOrder = -1;
  scene.add(sky);

  // Crossed translucent ribbons approximate illuminated mist without a postprocess pass.
  const rayGeometry = new T.PlaneGeometry(1, 1);
  const rays = new T.ShaderMaterial({
    uniforms: { light, time },
    side: T.DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: T.AdditiveBlending,
    vertexShader: `
      varying vec2 coord;
      void main() {
        coord = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 coord;
      uniform float light, time;
      void main() {
        float width = mix(0.94, 0.58, coord.y);
        float edge = 1.0 - smoothstep(0.02, width, abs(coord.x * 2.0 - 1.0));
        float fade = smoothstep(0.02, 0.30, coord.y) * (1.0 - smoothstep(0.70, 1.0, coord.y));
        float haze = 0.84 + 0.16 * sin(coord.y * 13.0 - time * 0.64 + coord.x * 5.0);
        gl_FragColor = vec4(1.0, 0.67, 0.34, edge * edge * fade * haze * light * 0.43);
      }
    `,
  });
  for (let i = 0; i < (compact ? 4 : 7); i++) {
    const ray = new T.Mesh(rayGeometry, rays);
    ray.position.set(-9 + i * 1.22, 7.2 + (i % 3), -19 - i * 2.3);
    ray.scale.set(2.6 + (i % 2), 24, 1);
    ray.rotation.set(0.14, (i % 3 - 1) * 0.58, -0.38 - i * 0.054);
    scene.add(ray);
  }

  const motes = new Float32Array((compact ? 70 : 150) * 3);
  for (let i = 0; i < motes.length; i += 3) {
    motes[i] = Math.sin(i * 4.37) * 18;
    motes[i + 1] = 0.25 + (i * 2.113) % 11;
    motes[i + 2] = 11 - (i * 0.757) % 69;
  }
  const points = new T.BufferGeometry();
  points.setAttribute('position', new T.BufferAttribute(motes, 3));
  const dust = new T.Points(points, new T.ShaderMaterial({
    uniforms: { light, eclipse, time, size: { value: compact ? 1.35 : 2.2 } },
    transparent: true,
    blending: T.AdditiveBlending,
    depthWrite: false,
    vertexShader: `
      uniform float time, size;
      varying float glow;
      void main() {
        vec3 p = position;
        p.x += sin(time * 0.7 + p.z) * 0.43;
        p.y += sin(time * 0.9 + p.x) * 0.22;
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        glow = (0.4 + 0.6 * abs(sin(position.z * 4.0 + time))) * smoothstep(0.6, 4.0, -view.z);
        gl_PointSize = clamp(size * 15.0 / -view.z, 1.0, size * 2.0);
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: `
      uniform float light, eclipse;
      varying float glow;
      void main() {
        float shape = 1.0 - smoothstep(0.06, 0.5, length(gl_PointCoord - 0.5));
        vec3 color = mix(vec3(0.32, 0.64, 0.9), vec3(1.0, 0.66, 0.29), light);
        gl_FragColor = vec4(color, shape * glow * (0.35 + light * 0.45) * (1.0 - eclipse * 0.7));
      }
    `,
  }));
  scene.add(dust);
  return { light, eclipse, time };
}
