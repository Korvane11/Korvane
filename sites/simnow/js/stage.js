// SimNow 3D stage: a supercar on a wet night circuit, rendered with three.js.
// Everything the page animates lives in `state`; GSAP tweens those numbers and
// the render loop turns them into lights, camera moves and road motion.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

const MODEL_URL = 'assets/models/supercar.glb';
const SHADOW_URL = 'assets/models/supercar-shadow.png';
const DRACO_PATH = 'vendor/three/addons/libs/draco/gltf/';

const ROAD_WIDTH = 14;
const ROAD_LENGTH = 260;
const ROAD_TILE = 12;          // metres of road per texture repeat
const DRIVE_SPEED = 30;        // metres per second at state.speed = 1
const POLE_SPACING = 32;
const POLES_PER_SIDE = 9;

// Camera: the intro pose faces the headlights; the story path is a spline
// through these keyframes, one per scroll chapter.
const INTRO_POSE = { pos: [0, 0.74, -8.6], tgt: [0, 0.6, 0] };
const PATH = [
  { pos: [4.3, 0.92, -6.1], tgt: [0.1, 0.52, -0.5] },   // hero: front three-quarter
  { pos: [7.4, 0.78, 0.4], tgt: [0, 0.5, 0] },          // side profile
  { pos: [4.0, 1.05, 6.7], tgt: [0, 0.6, 0.3] },        // rear three-quarter, taillights
  { pos: [-1.5, 0.8, 7.4], tgt: [0, 0.55, -4] },        // chase cam while driving
  { pos: [-8.2, 6.2, 10.5], tgt: [0, 0.3, -1.2] },     // high crane, rear left
  { pos: [-4.4, 0.98, -6.0], tgt: [0, 0.52, -0.4] },    // front three-quarter, other side
];
const PATH_FOV = [32, 30, 32, 40, 34, 32];
// Horizontal framing per shot (fraction of width): positive puts the car on
// the right, clear of left-aligned chapter text; negative puts it on the left.
const PATH_SHIFT = [0.17, -0.13, 0.15, -0.1, 0, 0.15];

// Ferrari badges baked into the chrome mesh (world-space boxes, metres).
const BADGES = [
  { min: [-0.07, 0.2, -2.27], max: [0.07, 0.38, -2.13] },   // nose
  { min: [-0.07, 0.76, 2.12], max: [0.07, 0.93, 2.25] },    // tail
  { min: [0.88, 0.32, 0.8], max: [0.97, 0.42, 1.04] },      // side scripts
  { min: [-0.97, 0.32, 0.8], max: [-0.88, 0.42, 1.04] },
];

function removeBadges(mesh) {
  const g = mesh.geometry;
  const pos = g.attributes.position;
  const index = g.index;
  if (!index) return;
  mesh.updateWorldMatrix(true, false);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const keep = [];
  for (let t = 0; t < index.count; t += 3) {
    const i0 = index.getX(t), i1 = index.getX(t + 1), i2 = index.getX(t + 2);
    a.fromBufferAttribute(pos, i0).applyMatrix4(mesh.matrixWorld);
    b.fromBufferAttribute(pos, i1).applyMatrix4(mesh.matrixWorld);
    c.fromBufferAttribute(pos, i2).applyMatrix4(mesh.matrixWorld);
    a.add(b).add(c).divideScalar(3);
    const hit = BADGES.some((k) => a.x > k.min[0] && a.x < k.max[0] && a.y > k.min[1] && a.y < k.max[1] && a.z > k.min[2] && a.z < k.max[2]);
    if (!hit) keep.push(i0, i1, i2);
  }
  g.setIndex(keep);
}

// Split a mesh's triangles into two material groups by world-space z.
function splitByZ(mesh, zSplit, frontMat, backMat) {
  const g = mesh.geometry;
  const pos = g.attributes.position;
  const index = g.index;
  if (!index) return;
  mesh.updateWorldMatrix(true, false);
  const v = new THREE.Vector3();
  const front = [], back = [];
  for (let t = 0; t < index.count; t += 3) {
    let z = 0;
    for (let k = 0; k < 3; k++) z += v.fromBufferAttribute(pos, index.getX(t + k)).applyMatrix4(mesh.matrixWorld).z;
    (z / 3 < zSplit ? front : back).push(index.getX(t), index.getX(t + 1), index.getX(t + 2));
  }
  g.setIndex(front.concat(back));
  g.clearGroups();
  g.addGroup(0, front.length, 0);
  g.addGroup(front.length, back.length, 1);
  mesh.material = [frontMat, backMat];
}

const clamp = THREE.MathUtils.clamp;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function seeded(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Procedural textures (no image downloads needed)
// ---------------------------------------------------------------------------
function makeRoadTextures(anisotropy) {
  const W = 1024, H = 1024;
  const rand = seeded(7);
  const px = (m) => (m / ROAD_WIDTH) * W;           // metres across -> pixels
  const py = (m) => (m / ROAD_TILE) * H;            // metres along -> pixels

  // Shared puddle layout so colour, roughness and wetness agree.
  const puddles = [];
  for (let i = 0; i < 26; i++) {
    puddles.push({ x: rand() * W, y: rand() * H, rx: 30 + rand() * 120, ry: 40 + rand() * 220, a: 0.5 + rand() * 0.5 });
  }
  const drawPuddles = (ctx, inner, outer) => {
    for (const p of puddles) {
      for (const dy of [-H, 0, H]) {               // wrap vertically for seamless tiling
        ctx.save();
        ctx.translate(p.x, p.y + dy);
        ctx.scale(p.rx / 100, p.ry / 100);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
        g.addColorStop(0, inner.replace('A', String(p.a)));
        g.addColorStop(1, outer);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, 100, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  };
  const lanes = (ctx, color) => {
    ctx.fillStyle = color;
    const edge = px(0.15);
    ctx.fillRect(px(0.75), 0, edge, H);                       // left edge line
    ctx.fillRect(W - px(0.75) - edge, 0, edge, H);            // right edge line
    ctx.fillRect(W / 2 - px(0.06), 0, px(0.12), py(4));       // centre dash, 4 m on / 8 m off
  };

  // Albedo: dark asphalt with aggregate speckle and painted lines.
  const albedo = document.createElement('canvas'); albedo.width = W; albedo.height = H;
  let ctx = albedo.getContext('2d');
  ctx.fillStyle = '#1d1e22'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 90000; i++) {
    const v = 18 + rand() * 34;
    ctx.fillStyle = `rgba(${v},${v},${v + 3},${0.35 + rand() * 0.5})`;
    ctx.fillRect(rand() * W, rand() * H, 1 + rand() * 1.6, 1 + rand() * 1.6);
  }
  // Worn racing lines are slightly darker and smoother.
  for (const u of [0.32, 0.68]) {
    const g = ctx.createLinearGradient(W * (u - 0.07), 0, W * (u + 0.07), 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,0.28)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(W * (u - 0.07), 0, W * 0.14, H);
  }
  drawPuddles(ctx, 'rgba(6,7,9,A)', 'rgba(6,7,9,0)');
  lanes(ctx, 'rgba(225,226,228,0.92)');

  // Roughness: wet sheen in puddles and on the racing lines, dry elsewhere.
  const rough = document.createElement('canvas'); rough.width = W; rough.height = H;
  ctx = rough.getContext('2d');
  ctx.fillStyle = 'rgb(150,150,150)'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 40000; i++) {
    const v = 120 + rand() * 70;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(rand() * W, rand() * H, 2, 2);
  }
  for (const u of [0.32, 0.68]) {
    const g = ctx.createLinearGradient(W * (u - 0.08), 0, W * (u + 0.08), 0);
    g.addColorStop(0, 'rgba(70,70,70,0)'); g.addColorStop(0.5, 'rgba(70,70,70,0.75)'); g.addColorStop(1, 'rgba(70,70,70,0)');
    ctx.fillStyle = g; ctx.fillRect(W * (u - 0.08), 0, W * 0.16, H);
  }
  drawPuddles(ctx, 'rgba(18,18,18,A)', 'rgba(18,18,18,0)');
  lanes(ctx, 'rgb(110,110,110)');

  // Alpha: puddles turn semi-transparent to reveal the mirror underneath.
  const alpha = document.createElement('canvas'); alpha.width = W; alpha.height = H;
  ctx = alpha.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  drawPuddles(ctx, 'rgba(70,70,70,A)', 'rgba(70,70,70,0)');
  for (const u of [0.32, 0.68]) {
    const g = ctx.createLinearGradient(W * (u - 0.06), 0, W * (u + 0.06), 0);
    g.addColorStop(0, 'rgba(150,150,150,0)'); g.addColorStop(0.5, 'rgba(150,150,150,0.55)'); g.addColorStop(1, 'rgba(150,150,150,0)');
    ctx.fillStyle = g; ctx.fillRect(W * (u - 0.06), 0, W * 0.12, H);
  }

  const out = {};
  for (const [key, cnv] of Object.entries({ map: albedo, roughnessMap: rough, alphaMap: alpha })) {
    const t = new THREE.CanvasTexture(cnv);
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, ROAD_LENGTH / ROAD_TILE);
    t.anisotropy = anisotropy;
    if (key === 'map') t.colorSpace = THREE.SRGBColorSpace;
    out[key] = t;
  }
  return out;
}

function makeCurbTexture(anisotropy) {
  const c = document.createElement('canvas'); c.width = 32; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#b8241e'; ctx.fillRect(0, 0, 32, 64);
  ctx.fillStyle = '#d9d9d6'; ctx.fillRect(0, 64, 32, 64);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, ROAD_LENGTH / 2);            // one red + one white stripe per 2 m
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  return t;
}

function makeRadialTexture(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeHorizonTexture() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 256, 0, 0);
  g.addColorStop(0, 'rgba(208,49,44,0.3)');
  g.addColorStop(0.25, 'rgba(150,60,70,0.14)');
  g.addColorStop(0.6, 'rgba(40,50,80,0.06)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Studio-style light strips baked into an environment map. Long soft strips
// are what give real car photography its glossy highlight lines.
function makeEnvironment(renderer) {
  const env = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 40), new THREE.MeshBasicMaterial({ color: 0x050609, side: THREE.BackSide }));
  room.position.y = 8;
  env.add(room);
  const strip = (w, h, intensity, color, pos, rot) => {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    mesh.position.set(...pos); mesh.rotation.set(...rot);
    env.add(mesh);
  };
  strip(2.2, 22, 3.2, 0xffffff, [0, 12, 0], [Math.PI / 2, 0, 0]);          // overhead softbox
  strip(1.0, 22, 1.6, 0xdde6ff, [-3.6, 11.5, 0], [Math.PI / 2, 0, 0]);
  strip(1.0, 22, 1.6, 0xdde6ff, [3.6, 11.5, 0], [Math.PI / 2, 0, 0]);
  strip(22, 1.4, 1.2, 0xffffff, [0, 3, -18], [0, 0, 0]);                  // horizon strip ahead
  strip(1.2, 6, 2.0, 0xffffff, [-17, 4, 6], [0, Math.PI / 2, 0]);          // side kickers
  strip(1.2, 6, 2.0, 0xffffff, [17, 4, -6], [0, -Math.PI / 2, 0]);
  strip(12, 1.0, 2.4, 0xd0312c, [6, 1.5, 17], [0, Math.PI, 0]);            // SimNow red accent behind
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.035).texture;
  pmrem.dispose();
  return tex;
}

// Film pass: subtle chromatic aberration, vignette and grain so the render
// reads as photographed rather than computer-generated.
const FilmShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrain: { value: 0.045 },
    uVignette: { value: 0.85 },
    uAberration: { value: 0.0008 },
    uFade: { value: 0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime, uGrain, uVignette, uAberration, uFade;
    varying vec2 vUv;
    float hash(vec2 p) { p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
    void main() {
      vec2 d = vUv - 0.5;
      float r2 = dot(d, d);
      vec3 col;
      col.r = texture2D(tDiffuse, vUv - d * uAberration * r2 * 8.0).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv + d * uAberration * r2 * 8.0).b;
      float vig = smoothstep(0.95, 0.18, sqrt(r2) * 1.25);
      col *= mix(1.0, vig, uVignette);
      col += (hash(vUv * 1024.0 + fract(uTime) * 97.0) - 0.5) * uGrain;
      gl_FragColor = vec4(col * uFade, 1.0);
    }`,
};

// Additive light shaft for a headlight beam in the night haze.
function makeBeamMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uIntensity: { value: 0 }, uColor: { value: new THREE.Color(0xdfe9ff) }, uLength: { value: 16 } },
    vertexShader: /* glsl */`
      uniform float uLength;
      varying float vAlong;
      varying vec3 vNormalV;
      varying vec3 vViewPos;
      void main() {
        vAlong = clamp(position.y / uLength + 0.5, 0.0, 1.0);   // 1 at the lamp, 0 at the far end
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = mv.xyz;
        vNormalV = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uIntensity;
      uniform vec3 uColor;
      varying float vAlong;
      varying vec3 vNormalV;
      varying vec3 vViewPos;
      void main() {
        float facing = abs(dot(normalize(vNormalV), normalize(-vViewPos)));
        float a = pow(vAlong, 2.2) * pow(facing, 1.6) * uIntensity * 0.11;
        gl_FragColor = vec4(uColor * a, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

// ---------------------------------------------------------------------------
// Stage
// ---------------------------------------------------------------------------
export async function createStage(canvas, { onProgress = () => {}, lowPower = false, drift = true } = {}) {
  const quality = {
    dpr: Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 1.75),
    samples: lowPower ? 0 : 4,
    reflector: !lowPower,
  };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(quality.dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x05060a, 1);
  const anisotropy = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);
  scene.fog = new THREE.FogExp2(0x05060a, 0.03);
  scene.environment = makeEnvironment(renderer);
  scene.environmentIntensity = 0;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);

  // Debug switches for isolating render features (used only with ?debug).
  const flags = { bloom: 1, spots: 1, film: 1, beamsMesh: 1, mirror: 1 };

  // The animatable state. GSAP tweens these from main.js.
  const state = {
    drl: 0, beams: 0, tail: 0, brake: 0, env: 0, rim: 0, world: 0,
    bloom: 0, fade: 0, speed: 0, intro: 0, progress: 0,
  };

  // ----- Ground, road, curbs ----------------------------------------------
  const roadTex = makeRoadTextures(anisotropy);
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH),
    new THREE.MeshStandardMaterial({ ...roadTex, color: 0xffffff, metalness: 0, roughness: 1, transparent: true }),
  );
  road.rotation.x = -Math.PI / 2;
  road.position.z = -ROAD_LENGTH / 2 + 40;
  scene.add(road);

  let mirror = null;
  if (quality.reflector) {
    mirror = new Reflector(new THREE.PlaneGeometry(ROAD_WIDTH, 70), {
      textureWidth: 512, textureHeight: 512, color: 0x7d838e, clipBias: 0.003,
    });
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.set(0, -0.003, -20);
    scene.add(mirror);
  }

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({ color: 0x08090c, roughness: 0.95, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  const curbTex = makeCurbTexture(anisotropy);
  const curbMat = new THREE.MeshStandardMaterial({ map: curbTex, roughness: 0.45, metalness: 0 });
  const curbGeo = new THREE.BoxGeometry(0.9, 0.06, ROAD_LENGTH);
  for (const side of [-1, 1]) {
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(side * (ROAD_WIDTH / 2 + 0.45), 0.03, road.position.z);
    scene.add(curb);
  }

  // Distant glow over the circuit.
  const horizon = new THREE.Mesh(
    new THREE.PlaneGeometry(420, 70),
    new THREE.MeshBasicMaterial({ map: makeHorizonTexture(), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }),
  );
  horizon.position.set(0, 18, -190);
  scene.add(horizon);

  // ----- Floodlight poles that stream past while driving -------------------
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x1a1c21, roughness: 0.6, metalness: 0.6 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xfff3e2, emissiveIntensity: 0 });
  const poolMat = new THREE.MeshBasicMaterial({
    map: makeRadialTexture([[0, 'rgba(255,240,220,1)'], [0.45, 'rgba(255,230,200,0.35)'], [1, 'rgba(0,0,0,0)']]),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0,
  });
  const count = POLES_PER_SIDE * 2;
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.11, 8.6, 10), poleMat, count);
  const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 0.16, 0.55), headMat, count);
  const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(10, 10), poolMat, count);
  poles.frustumCulled = heads.frustumCulled = pools.frustumCulled = false;
  scene.add(poles, heads, pools);
  const poleSpan = POLE_SPACING * POLES_PER_SIDE;
  const poleLights = [-1, 1].map(() => {
    const l = new THREE.PointLight(0xfff1e0, 0, 26, 1.6);
    scene.add(l);
    return l;
  });
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const qFlat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const one = new THREE.Vector3(1, 1, 1);
  const tmp = new THREE.Vector3();
  let roadOffset = 6;     // metres travelled; seeded so a pole sits near the car at rest

  function layoutPoles() {
    const nearest = [{ z: Infinity }, { z: Infinity }];
    for (let s = 0; s < 2; s++) {
      const side = s === 0 ? -1 : 1;
      const stagger = s * POLE_SPACING * 0.5;
      for (let i = 0; i < POLES_PER_SIDE; i++) {
        const idx = s * POLES_PER_SIDE + i;
        let z = ((i * POLE_SPACING + stagger + roadOffset) % poleSpan) - poleSpan + 60;
        m4.compose(tmp.set(side * 9.4, 4.3, z), q.identity(), one); poles.setMatrixAt(idx, m4);
        m4.compose(tmp.set(side * 8.7, 8.55, z), q.identity(), one); heads.setMatrixAt(idx, m4);
        m4.compose(tmp.set(side * 6.0, 0.015, z), qFlat, one); pools.setMatrixAt(idx, m4);
        if (Math.abs(z - 1) < Math.abs(nearest[s].z - 1)) nearest[s] = { z };
      }
    }
    poles.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = pools.instanceMatrix.needsUpdate = true;
    // A real light rides with the nearest pole on each side so floodlight
    // reflections sweep across the bodywork as the car drives.
    nearest.forEach((n, s) => {
      const side = s === 0 ? -1 : 1;
      const falloff = Math.exp(-((n.z - 1) ** 2) / (2 * 13 * 13));
      poleLights[s].position.set(side * 8.4, 8.2, n.z);
      poleLights[s].intensity = 60 * falloff * state.world;
    });
  }

  // ----- Lights -----------------------------------------------------------
  scene.add(new THREE.HemisphereLight(0x1b2234, 0x050505, 0));
  const hemi = scene.children[scene.children.length - 1];

  const rim = new THREE.DirectionalLight(0xa9bcff, 0);
  rim.position.set(-6, 7, 11);
  scene.add(rim);

  const accent = new THREE.SpotLight(0xd0312c, 0, 24, 0.7, 1, 1.4);
  accent.position.set(7.5, 2.4, 7);
  accent.target.position.set(0, 0.5, 0);
  scene.add(accent, accent.target);

  const headSpots = [-1, 1].map((side) => {
    // Narrow, forward-aimed beam with physical falloff, so the road just in
    // front of the bumper doesn't turn into a hotspot.
    const s = new THREE.SpotLight(0xe6efff, 0, 70, 0.22, 0.75, 2);
    s.position.set(side * 0.62, 0.64, -1.95);
    s.target.position.set(side * 1.2, 0, -30);
    scene.add(s, s.target);
    return s;
  });

  const tailGlow = new THREE.PointLight(0xff2014, 0, 7, 2);
  tailGlow.position.set(0, 0.7, 2.6);
  scene.add(tailGlow);

  const beamMat = makeBeamMaterial();
  const beamGeo = new THREE.ConeGeometry(2.6, 16, 40, 1, true);
  const beams = [-1, 1].map((side) => {
    const b = new THREE.Mesh(beamGeo, beamMat);
    b.rotation.x = Math.PI / 2;                     // apex toward the car, opening forward
    b.position.set(side * 0.62, 0.62, -1.95 - 8);
    b.rotation.z = side * -0.05;
    b.renderOrder = 3;
    scene.add(b);
    return b;
  });

  // ----- Car --------------------------------------------------------------
  const draco = new DRACOLoader().setDecoderPath(DRACO_PATH);
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const gltf = await loader.loadAsync(MODEL_URL, (e) => {
    if (e.lengthComputable && e.total) onProgress(e.loaded / e.total);
  });
  draco.dispose();
  const car = gltf.scene.children[0];

  const mats = {
    // Matte black satin paint (reference: matte black Aventador SVJ).
    body: new THREE.MeshPhysicalMaterial({
      color: 0x0d0d0f, metalness: 0.4, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.45, envMapIntensity: 1.7,
    }),
    rim: new THREE.MeshStandardMaterial({ color: 0x0f1012, metalness: 0.85, roughness: 0.36 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x6d7076, metalness: 1, roughness: 0.4 }),
    caliper: new THREE.MeshStandardMaterial({ color: 0xc0261f, metalness: 0.2, roughness: 0.35 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0x9a9da3, metalness: 1, roughness: 0.12 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x15161a, metalness: 0.6, roughness: 0.4 }),
    tire: new THREE.MeshStandardMaterial({ color: 0x101012, metalness: 0, roughness: 0.82 }),
    carbon: new THREE.MeshPhysicalMaterial({ color: 0x0e0f12, metalness: 0.3, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.05 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x07080b, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.86, clearcoat: 1,
    }),
    lens: new THREE.MeshStandardMaterial({ color: 0x1a1c20, metalness: 0.2, roughness: 0.28, emissive: 0xeaf2ff, emissiveIntensity: 0 }),
    drl: new THREE.MeshStandardMaterial({ color: 0x050505, emissive: 0xe9f1ff, emissiveIntensity: 0 }),
    tail: new THREE.MeshStandardMaterial({ color: 0x1a0505, metalness: 0.1, roughness: 0.15, emissive: 0xff1a10, emissiveIntensity: 0 }),
    brake: new THREE.MeshStandardMaterial({ color: 0x1a0505, emissive: 0xff1a10, emissiveIntensity: 0 }),
    marker: new THREE.MeshStandardMaterial({ color: 0x1a0606, metalness: 0.1, roughness: 0.2, emissive: 0xff2a10, emissiveIntensity: 0 }),
  };

  const wheels = [];
  car.traverse((o) => {
    if (o.name && o.name.startsWith('wheel_')) wheels.push(o);
    if (!o.isMesh) return;
    const n = o.name;
    switch (o.material.name) {
      case 'Body_Color': o.material = mats.body; break;
      case 'metal_gray':
        o.material = n.startsWith('rim') ? mats.rim : n === 'brake' ? mats.caliper : mats.metal; break;
      case 'metal_chrome': o.material = mats.chrome; break;
      case 'Projector_Glass': o.material = mats.lens; break;
      case 'Turn_Signal_LED': o.material = mats.drl; break;
      case 'Taillight_Glass': o.material = n === 'brakes' ? mats.brake : mats.tail; break;
      case 'Glass_Gray': o.material = mats.glass; break;
      case 'Tires': o.material = mats.tire; break;
      case 'Carbon_Fiber': o.material = mats.carbon; break;
      case 'Ferrari_Yellow':
      case '_0098_DodgerBlue': o.material = mats.dark; break;          // remove badge colours
      default: break;
    }
  });

  const shadowTex = await new THREE.TextureLoader().loadAsync(SHADOW_URL);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4),
    new THREE.MeshBasicMaterial({ map: shadowTex, blending: THREE.MultiplyBlending, toneMapped: false, transparent: true, premultipliedAlpha: true }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.004;
  shadow.renderOrder = 2;
  car.add(shadow);
  scene.add(car);
  car.updateMatrixWorld(true);
  car.traverse((o) => {
    if (!o.isMesh) return;
    if (o.name === 'chrome') removeBadges(o);
    if (o.name === 'lights_red') splitByZ(o, 1.2, mats.marker, mats.tail);
  });
  const carBaseY = car.position.y;

  // ----- Post-processing ----------------------------------------------------
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: quality.samples });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0, 0.18, 1.2);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const film = new ShaderPass(FilmShader);
  composer.addPass(film);

  // ----- Camera rig -----------------------------------------------------------
  const posCurve = new THREE.CatmullRomCurve3(PATH.map((k) => new THREE.Vector3(...k.pos)), false, 'centripetal');
  const tgtCurve = new THREE.CatmullRomCurve3(PATH.map((k) => new THREE.Vector3(...k.tgt)), false, 'centripetal');
  const introPos = new THREE.Vector3(...INTRO_POSE.pos);
  const introTgt = new THREE.Vector3(...INTRO_POSE.tgt);
  const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
  const pathPos = new THREE.Vector3(), pathTgt = new THREE.Vector3();

  let pathShift = 0;
  function pathAt(p) {
    const segs = PATH.length - 1;
    const x = clamp(p, 0, 1) * segs;
    const i = Math.min(Math.floor(x), segs - 1);
    const f = easeInOut(x - i);                  // dwell on each keyframe, glide between
    const t = (i + f) / segs;
    posCurve.getPoint(t, pathPos);
    tgtCurve.getPoint(t, pathTgt);
    pathShift = THREE.MathUtils.lerp(PATH_SHIFT[i], PATH_SHIFT[i + 1], f);
    return THREE.MathUtils.lerp(PATH_FOV[i], PATH_FOV[i + 1], f);
  }

  let aspect = 1, viewW = 1, viewH = 1;
  function updateCamera(time) {
    const pathFov = pathAt(state.progress);
    const k = easeInOut(clamp(state.intro, 0, 1));
    camPos.lerpVectors(introPos, pathPos, k);
    camTgt.lerpVectors(introTgt, pathTgt, k);
    // Pull back on narrow screens so the whole car stays in frame.
    const pull = aspect >= 1.35 ? 1 : 1 + (1.35 - aspect) * 1.05;
    camPos.sub(camTgt).multiplyScalar(pull).add(camTgt);
    if (aspect < 1) camTgt.y -= (pull - 1) * 0.22;
    if (drift) {
      camPos.x += Math.sin(time * 0.31) * 0.05;
      camPos.y += Math.sin(time * 0.23) * 0.025;
    }
    camera.position.copy(camPos);
    camera.lookAt(camTgt);
    camera.fov = THREE.MathUtils.lerp(30, pathFov, k) + (aspect < 1 ? 4 : 0);
    // Shift the frame so the car sits clear of the chapter text.
    const w = viewW, h = viewH;
    const shiftX = aspect >= 1.1 ? pathShift * k : 0;
    const shiftY = aspect < 1 ? 0.24 * k : 0;
    camera.setViewOffset(w, h, -shiftX * w, shiftY * h, w, h);
    camera.updateProjectionMatrix();
  }

  // ----- Sizing ---------------------------------------------------------------
  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    aspect = w / h;
    viewW = w; viewH = h;
    camera.aspect = aspect;
    renderer.setPixelRatio(quality.dpr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(quality.dpr);
    composer.setSize(w, h);
    if (mirror) mirror.getRenderTarget().setSize(Math.round(w * quality.dpr * 0.5), Math.round(h * quality.dpr * 0.5));
  }
  resize();
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 120); });

  // ----- Frame ----------------------------------------------------------------
  function applyState(time) {
    mats.drl.emissiveIntensity = state.drl * 6;
    mats.lens.emissiveIntensity = state.beams * 4.2;
    headSpots.forEach((s) => { s.intensity = state.beams * 170 * flags.spots; });
    const headOn = Math.abs(camera.getWorldDirection(tmp).z);
    beamMat.uniforms.uIntensity.value = state.beams * (1 - Math.pow(headOn, 3));
    const brake = state.brake;
    mats.tail.emissiveIntensity = state.tail * 1.6 + brake * 3.5;
    mats.brake.emissiveIntensity = brake * 6;
    mats.marker.emissiveIntensity = state.tail * 0.25;
    tailGlow.intensity = state.tail * 2 + brake * 9;
    scene.environmentIntensity = state.env * 0.9;
    hemi.intensity = state.env * 0.35;
    rim.intensity = state.rim * 0.7;
    accent.intensity = state.rim * 42;
    headMat.emissiveIntensity = state.world * 7;
    poolMat.opacity = state.world * 0.08;
    horizon.material.opacity = state.world;
    bloom.strength = state.bloom * flags.bloom;
    film.enabled = !!flags.film;
    beams.forEach((b) => { b.visible = !!flags.beamsMesh; });
    if (mirror) mirror.visible = !!flags.mirror;
    film.uniforms.uFade.value = state.fade;
    film.uniforms.uTime.value = time;
  }

  const timer = new THREE.Timer();
  timer.connect(document);
  let wheelAngle = 0;
  let paused = false;
  let frameTimes = [];
  let adapted = false;

  function frame(timestamp) {
    timer.update(timestamp);
    if (paused) return;
    const dt = Math.min(timer.getDelta(), 0.05);
    const time = timer.getElapsed();

    if (state.speed > 0.0005) {
      roadOffset += state.speed * DRIVE_SPEED * dt;
      const v = roadOffset / ROAD_TILE;
      roadTex.map.offset.y = roadTex.roughnessMap.offset.y = roadTex.alphaMap.offset.y = v;
      curbTex.offset.y = roadOffset / 2;
      wheelAngle += state.speed * 26 * dt;      // capped visual spin to avoid wagon-wheel strobing
      wheels.forEach((w) => { w.rotation.x = -wheelAngle; });
      car.position.y = carBaseY + Math.sin(time * 34) * 0.0016 * state.speed;
    }
    layoutPoles();
    updateCamera(time);
    applyState(time);
    composer.render(dt);

    // Adaptive quality: if the first few seconds after the intro run slow,
    // step the resolution down so scrolling stays smooth.
    if (!adapted && state.intro >= 1) {
      frameTimes.push(dt);
      if (frameTimes.length >= 90) {
        const sorted = frameTimes.slice().sort((a, b) => a - b);
        const median = sorted[45];
        if (median > 0.03 && quality.dpr > 1) {
          quality.dpr = Math.max(1, quality.dpr - 0.5);
          if (mirror && median > 0.045) { mirror.visible = false; }
          resize();
          frameTimes = [];
        } else {
          adapted = true;
        }
      }
    }
  }

  layoutPoles();
  updateCamera(0);
  applyState(0);
  await renderer.compileAsync(scene, camera);
  renderer.setAnimationLoop(frame);


  return {
    state,
    quality,
    scene,
    car,
    flags,
    setPaused(v) { paused = v; },
    renderer,
  };
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}
