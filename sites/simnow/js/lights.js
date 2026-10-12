/* Tail lights first. For the intro the drive clip is drawn through a small
 * WebGL shader instead of shown directly: at first only the car's light bar
 * comes through, drawing on from the middle outward with a soft red glow and
 * a long, thin lens streak; then the streak gives way and the night spreads
 * out from the lights as the site opens. It ends on the plain video frame,
 * so the page hands back to the <video> element unseen.
 *
 * CLIP holds what is measured on the clip's first shot (0-3.9 s, the car
 * from behind). Swapping the clip means re-measuring it (README).
 */
const { gsap } = window;

const CLIP = {
  zone: [0.42, 0.86, 0.50, 0.67],   // the light bar's track: x0, x1, y0, y1 (texture uv, y up)
  center: [0.635, 0.58],            // the middle of the bar: the sweep and the reveal start here
  sweep: 0.22,                      // half-width of the bar, for the sweep
  glow: '1.0, 0.18, 0.10',          // glow colour around the bar
  streak: '1.0, 0.30, 0.22',        // the lens streak, a touch warmer
  phonePan: 0.73,                   // where a narrow crop starts, across the clip (object-position x)
};
const GW = 256, GH = 144;   // bloom buffer: the clip (16:9) at 1/4 size

const VERT = `
attribute vec2 p;
varying vec2 vUv;
void main() { vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const f = (n) => n.toFixed(3);
const LAMPS = `
uniform sampler2D uTex;
uniform float uSweep;
const vec3 W = vec3(0.2126, 0.7152, 0.0722);
// where the tail lights are in the first shot, and how much of the bar is on
float zone(vec2 uv) {
  float box = smoothstep(${f(CLIP.zone[0])}, ${f(CLIP.zone[0] + 0.03)}, uv.x) * (1.0 - smoothstep(${f(CLIP.zone[1] - 0.03)}, ${f(CLIP.zone[1])}, uv.x))
            * smoothstep(${f(CLIP.zone[2])}, ${f(CLIP.zone[2] + 0.02)}, uv.y) * (1.0 - smoothstep(${f(CLIP.zone[3] - 0.02)}, ${f(CLIP.zone[3])}, uv.y));
  float on = 1.0 - smoothstep(uSweep * ${f(CLIP.sweep)}, uSweep * ${f(CLIP.sweep)} + 0.03, abs(uv.x - ${f(CLIP.center[0])}));
  return box * on;
}
// tail light: bright and warm. The bar's core burns orange-white, so this
// asks for strong red and red well above blue, not for pure red.
float hot(vec2 uv) {
  vec3 c = texture2D(uTex, uv).rgb;
  return smoothstep(0.42, 0.75, c.r) * smoothstep(0.1, 0.3, c.r - c.b) * zone(uv);
}`;

// The glow buffers are 8-bit, so they store the square root of the light:
// that spends the precision on the faint edges of the glow, where plain 8-bit
// shows as stripes once the glow is brightened.
// pass 1: the lamps alone, at bloom size
const HOT = `
precision mediump float;
${LAMPS}
uniform vec2 uStep;
varying vec2 vUv;
void main() {
  float h = 0.25 * (hot(vUv - uStep) + hot(vUv + uStep)
                  + hot(vUv + vec2(uStep.x, -uStep.y)) + hot(vUv + vec2(-uStep.x, uStep.y)));
  h = sqrt(h);
  gl_FragColor = vec4(h, h, h, 1.0);
}`;

// the blurs: a separable gaussian, run several times at growing widths
const BLUR = `
precision mediump float;
uniform sampler2D uSrc;
uniform vec2 uDir;
varying vec2 vUv;
float px(vec2 uv) { float t = texture2D(uSrc, uv).r; return t * t; }
void main() {
  float s = px(vUv) * 0.2270;
  s += (px(vUv + uDir * 1.3846) + px(vUv - uDir * 1.3846)) * 0.3162;
  s += (px(vUv + uDir * 3.2308) + px(vUv - uDir * 3.2308)) * 0.0703;
  s = sqrt(s);
  gl_FragColor = vec4(s, s, s, 1.0);
}`;

// last pass: the picture
const FINAL = `
precision mediump float;
${LAMPS}
uniform sampler2D uBloom, uStreakTex;
uniform vec2 uScale, uOffset, uAspect;
uniform float uLights, uReveal, uStreak;
varying vec2 vUv;
const vec3 LAMP = vec3(${CLIP.glow});
const vec3 STREAK = vec3(${CLIP.streak});
void main() {
  vec2 uv = vUv * uScale + uOffset;
  vec3 c = texture2D(uTex, uv).rgb;
  float bloom = texture2D(uBloom, uv).r;  bloom *= bloom;
  float streak = texture2D(uStreakTex, uv).r;  streak *= streak;

  // the night spreads out from the lamps, brighter things first
  float near = 1.0 - clamp(length((uv - vec2(${f(CLIP.center[0])}, ${f(CLIP.center[1])})) * uAspect) * 0.9, 0.0, 1.0);
  float t = mix(1.05, -0.35, uReveal);
  vec3 scene = c * smoothstep(t, t + 0.25, 0.3 * dot(c, W) + 0.7 * near);

  // the bar itself, a soft glow around it, and a long thin lens streak
  float fade = uLights * (1.0 - uReveal);
  vec3 col = max(scene, c * hot(uv) * uLights * 1.25)
           + LAMP * bloom * 2.6 * fade
           + STREAK * streak * 1.8 * uStreak * (1.0 - uReveal);
  // dither, so the dark halo doesn't band
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 1.5 / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`;

export function createLights(video, canvas) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false });
  if (!gl) return null;

  function program(frag, names) {
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, 'p');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    const u = { prog };
    names.forEach((n) => { u[n] = gl.getUniformLocation(prog, n); });
    return u;
  }
  const pHot = program(HOT, ['uTex', 'uStep', 'uSweep']);
  const pBlur = program(BLUR, ['uSrc', 'uDir']);
  const pFinal = program(FINAL, ['uTex', 'uBloom', 'uStreakTex', 'uScale', 'uOffset', 'uAspect', 'uLights', 'uReveal', 'uStreak', 'uSweep']);
  if (!pHot || !pBlur || !pFinal) return null;

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function texture() {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  function target() {
    const tex = texture();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GW, GH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fb };
  }
  const clipTex = texture();
  const a = target(), b = target(), c = target();
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return null;
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  function pass(prog, into) {
    gl.useProgram(prog.prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, into ? into.fb : null);
    if (into) gl.viewport(0, 0, GW, GH);
  }
  function blur(from, into, dx, dy) {
    pass(pBlur, into);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, from.tex);
    gl.uniform1i(pBlur.uSrc, 1);
    gl.uniform2f(pBlur.uDir, dx / GW, dy / GH);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // pan: where the crop sits across a clip wider than the screen (like
  // object-position x). Phones start on the car (right of the clip, both
  // lamps in view), then settle to centre.
  const state = { lights: 0, reveal: 0, sweep: 0, streak: 0, pan: CLIP.phonePan };
  let raf = 0;
  let tl = null;
  let alive = true;

  function draw() {
    raf = requestAnimationFrame(draw);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!w || !h || !vw || video.readyState < 2) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const cw = Math.round(w * dpr), ch = Math.round(h * dpr);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, clipTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);

    // the lamps alone, at 1/4 size
    pass(pHot, a);
    gl.uniform1i(pHot.uTex, 0);
    gl.uniform2f(pHot.uStep, 0.25 / GW, 0.25 / GH);
    gl.uniform1f(pHot.uSweep, state.sweep);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // Each blur step's taps must sit closer than the blur already done, or a
    // thin line comes out as stacked copies; so: many small steps.
    // streak: blurred sideways only, wider and wider, then softened a hair (ends in b)
    blur(a, b, 3, 0);
    blur(b, c, 6, 0);
    blur(c, b, 10, 0);
    blur(b, c, 16, 0);
    blur(c, b, 26, 0);
    blur(b, c, 40, 0);
    blur(c, b, 0, 1);
    // glow: blurred both ways (ends in a)
    for (const r of [1, 1.5, 2, 2.5, 3]) {
      blur(a, c, r, 0);
      blur(c, a, 0, r);
    }

    // the picture, cropped like object-fit: cover
    pass(pFinal, null);
    gl.viewport(0, 0, cw, ch);
    const box = w / h, clip = vw / vh;
    let sx = 1, sy = 1;
    if (box > clip) sy = clip / box; else sx = box / clip;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, a.tex);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, b.tex);
    gl.uniform1i(pFinal.uTex, 0);
    gl.uniform1i(pFinal.uBloom, 1);
    gl.uniform1i(pFinal.uStreakTex, 2);
    gl.uniform1f(pFinal.uStreak, state.streak);
    gl.uniform2f(pFinal.uScale, sx, sy);
    gl.uniform2f(pFinal.uOffset, (1 - sx) * state.pan, (1 - sy) * 0.5);
    gl.uniform2f(pFinal.uAspect, vw / vh, 1);
    gl.uniform1f(pFinal.uLights, state.lights);
    gl.uniform1f(pFinal.uSweep, state.sweep);
    gl.uniform1f(pFinal.uReveal, state.reveal);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function stop() {
    if (!alive) return;
    alive = false;
    tl?.kill();
    cancelAnimationFrame(raf);
    canvas.classList.add('is-off');
    setTimeout(() => {
      canvas.hidden = true;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }, 700);
  }

  /* Wall-clock seconds. onOpen fires as the night comes in (the site opens
   * then); onDone when the canvas has handed back to the video. */
  function run({ onOpen, onDone }) {
    if (!alive) return;
    canvas.hidden = false;
    draw();
    tl = gsap.timeline()
      // the bar draws on from the middle, and the streak grows out of it
      .set(state, { lights: 1 }, 0.1)
      .to(state, { sweep: 1.12, duration: 1.0, ease: 'power2.inOut' }, 0.1)
      .to(state, { streak: 1, duration: 1.2, ease: 'power2.out' }, 0.35)
      // then the night comes in from the lights and the streak gives way
      .to(state, { reveal: 1, duration: 1.6, ease: 'power2.inOut' }, 1.3)
      .to(state, { streak: 0, duration: 1.2, ease: 'power1.in' }, 1.7)
      .to(state, { pan: 0.5, duration: 1.6, ease: 'power2.inOut' }, 1.3)
      .call(() => onOpen?.(), null, 1.95)
      .call(() => { stop(); onDone?.(); }, null, 3.5);
  }

  return { run, stop, get timeline() { return tl; } };   // timeline: for ?debug tests
}
