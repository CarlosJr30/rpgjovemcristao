import * as T from 'three';

const noise = `
float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * .1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float layers(vec2 p) {
  return .54*noise(p) + .28*noise(p*2.03) + .12*noise(p*4.11) + .06*noise(p*8.07);
}`;

const palettes = {
  2: ['#2b6397', '#cce8eb', '#ffdec1', '#125b76'],
  3: ['#4d9ec8', '#edf2cf', '#ffe1a9', '#1b7886'],
  4: ['#4386c1', '#eab68d', '#ffc481', '#254065'],
  5: ['#428fbf', '#dcecdc', '#fff0c4', '#087f8b'],
  6: ['#508ab0', '#e8c69a', '#ffe0ad', '#23696f'],
  7: ['#779198', '#ffdfae', '#ffcc79', '#286e69'],
} as const;

export function addCreationSky(scene: T.Scene, day: keyof typeof palettes, compact: boolean) {
  const [zenith, horizon, glow] = palettes[day].map((color) => new T.Color(color));
  const time = { value: 0 };
  const phase = { value: 0 };
  const night = { value: 0 };
  const sky = new T.Mesh(new T.SphereGeometry(116, 40, 22), new T.ShaderMaterial({
    side: T.BackSide,
    depthWrite: false,
    uniforms: { time, phase, night, zenith: { value: zenith }, horizon: { value: horizon }, glow: { value: glow } },
    defines: { FIRMAMENT: Number(day === 2), COMPACT: Number(compact) },
    vertexShader: `varying vec3 direction;
      void main() {
        direction = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 direction;
      uniform vec3 zenith, horizon, glow;
      uniform float time, phase, night;
      ${noise}
      void main() {
        vec3 d = normalize(direction);
        float elevation = max(d.y,0.0);
        float haze = exp(-elevation*5.5);
        vec3 day = mix(zenith,horizon,haze);
        vec3 dusk = mix(vec3(.008,.016,.056),vec3(.16,.14,.26),haze);
        vec3 lightDir = normalize(vec3(-.49,.24,-1.));
        float light = max(dot(d,lightDir),0.0);
        vec3 color = mix(day,dusk,night) + glow*pow(light,12.0)*(.35-.27*night);
        vec2 p = d.xz/max(.13,d.y+.16)*2.9 + vec2(time*.022,0);
        float density = layers(p);
        float cloud = smoothstep(.48,.72,density) * smoothstep(.015,.23,elevation);
        float edge = smoothstep(.39,.69,layers(p+vec2(.11,.07)));
        vec3 shade = mix(vec3(.32,.44,.59),vec3(.91,.95,.95),1.0-edge*.7);
        color = mix(color,shade*(1.0-.80*night)+glow*pow(light,7.0)*.18,cloud*.95);
        #if COMPACT == 0
          float veil = smoothstep(.55,.79,noise(p*.43+vec2(12.4,9.7))) * haze;
          color += glow*veil*.13*(1.0-night);
        #endif
        #if FIRMAMENT == 1
          float boundary = .23 + phase*.22 + sin(d.x*8.)*.036;
          float upper = smoothstep(boundary-.025,boundary+.16,elevation);
          float strands = layers(vec2(d.x*9.,d.y*22.)+vec2(time*.04,0));
          color = mix(color,vec3(.073,.24,.38)+(strands*strands)*vec3(.16,.43,.51),upper*.6);
          color += vec3(.31,.65,.71)*exp(-abs(elevation-boundary)*34.)*(.15+strands*.42);
        #endif
        gl_FragColor = vec4(color,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  sky.position.z = -9;
  sky.frustumCulled = false;
  sky.renderOrder = -2;
  scene.add(sky);
  return { time, phase, night };
}

export function addCreationWater(scene: T.Scene, day: keyof typeof palettes | 1, compact: boolean) {
  const [, horizon, glow, water] = day === 1
    ? ['#101b2c', '#37516a', '#ffc68a', '#0d2637'] : palettes[day];
  const time = { value: 0 };
  const light = { value: day === 1 ? 0 : 1 };
  const level = day === 1 ? -.24 : -.16;
  const surface = new T.Mesh(new T.PlaneGeometry(174, 170, compact ? 40 : 64, compact ? 36 : 56), new T.ShaderMaterial({
    transparent: day === 5,
    depthWrite: day !== 5,
    uniforms: {
      time, light, horizon: { value: new T.Color(horizon) }, glow: { value: new T.Color(glow) },
      water: { value: new T.Color(water) },
    },
    defines: { PRIMORDIAL: Number(day === 1), SEA: Number(day === 2 || day === 5), SHOAL: Number(day === 5) },
    vertexShader: `
      varying vec3 surface;
      uniform float time;
      void main() {
        vec4 p = modelMatrix * vec4(position, 1.0);
        p.y += .024*sin(p.x*1.5+p.z*.7+time*1.2) + .019*cos(p.z*2.4-time*.9);
        surface = p.xyz;
        gl_Position = projectionMatrix * viewMatrix * p;
      }`,
    fragmentShader: `
      uniform float time, light;
      uniform vec3 horizon, glow, water;
      varying vec3 surface;
      ${noise}
      void main() {
        vec2 p = surface.xz;
        vec3 view = normalize(cameraPosition-surface);
        float size = 1.0-smoothstep(18.0,61.0,length(cameraPosition-surface));
        float turbulence = noise(p*.7+vec2(0,time*.09))*2.7;
        float wave = sin(p.x*2.1+p.y*3.8+time*2.0+turbulence) + sin(p.x*4.7-p.y*2.1+time*1.7-turbulence)*.55;
        float fine = sin(p.x*9.0+p.y*12.0-time*3.1)*cos(p.y*5.0+p.x*4.0+time*1.9);
        vec3 n = normalize(vec3(.075*wave+.035*fine*size,1.,.11*cos(p.y*4.4+p.x*1.6-time*1.9+turbulence)+.023*fine*size));
        float fresnel = pow(1.0-max(0.0,dot(view,n)),3.4);
        vec3 reflection = reflect(-view,n);
        float cloud = noise(reflection.xz/max(.16,reflection.y+.2)*3.1);
        vec3 reflected = horizon*(.32+cloud*.58);
        float specular = pow(max(dot(reflection,normalize(vec3(-.44,.19,-1.))),0.0),40.0);
        float teal = .70+.28*noise(p*.42+vec2(time*.07,0))+.06*wave;
        vec3 color = mix(water*teal,reflected,fresnel*.85);
        #if SEA == 1
          float shore = abs(abs(p.x)- (4.05+.23*sin(p.y*.51)));
          float foam = exp(-shore*1.8) * smoothstep(.25,.86,noise(vec2(p.x*7.0,p.y*1.7+time*.24))+.15*wave);
          color += vec3(.47,.75,.74)*foam*size*.39;
        #endif
        #if PRIMORDIAL == 1
          color *= .34+light*.69;
          color += glow*specular*(.018+light*.68);
        #else
          color += glow*specular*.38;
        #endif
        color = mix(color,horizon*.55,smoothstep(25.0,116.0,length(cameraPosition-surface)));
        float opacity = 1.0;
        #if SHOAL == 1
          opacity = mix(1.0, .49+.45*fresnel, size);
        #endif
        gl_FragColor = vec4(color,opacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  surface.rotation.x = -Math.PI / 2;
  surface.position.set(0,level,-26);
  scene.add(surface);
  return { time, light, surface };
}
