/* Headlights first. For the intro the drive clip is drawn through a small
 * WebGL shader instead of shown directly: at first only the car's headlights
 * come through (they flicker on, with a bloom), then the night spreads out
 * around them. It ends on the plain video frame, so the page hands back to
 * the <video> element unseen.
 *
 * The lamp zone is where the headlights sit in the clip's first shot
 * (0-3.1 s, the car head-on). Swapping the clip means re-measuring it.
 */
const { gsap } = window;

const GW = 144, GH = 256;   // bloom buffer: the clip at 1/4 size

const VERT = `
attribute vec2 p;
varying vec2 vUv;
void main() { vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const LAMPS = `
uniform sampler2D uTex;
const vec3 W = vec3(0.2126, 0.7152, 0.0722);
// the band across the car's front in the first shot (texture uv, y up)
float zone(vec2 uv) {
  return smoothstep(0.24, 0.30, uv.x) * (1.0 - smoothstep(0.97, 0.995, uv.x))
       * smoothstep(0.455, 0.475, uv.y) * (1.0 - smoothstep(0.565, 0.585, uv.y));
}
float hot(vec2 uv) { return smoothstep(0.62, 0.9, dot(texture2D(uTex, uv).rgb, W)) * zone(uv); }`;

// pass 1: the lamps alone, at bloom size
const HOT = `
precision mediump float;
${LAMPS}
uniform vec2 uStep;
varying vec2 vUv;
void main() {
  float h = 0.25 * (hot(vUv - uStep) + hot(vUv + uStep)
                  + hot(vUv + vec2(uStep.x, -uStep.y)) + hot(vUv + vec2(-uStep.x, uStep.y)));
  gl_FragColor = vec4(h, h, h, 1.0);
}`;

// passes 2-7: separable gaussian, three times at growing widths
const BLUR = `
precision mediump float;
uniform sampler2D uSrc;
uniform vec2 uDir;
varying vec2 vUv;
void main() {
  float s = texture2D(uSrc, vUv).r * 0.2270;
  s += (texture2D(uSrc, vUv + uDir * 1.3846).r + texture2D(uSrc, vUv - uDir * 1.3846).r) * 0.3162;
  s += (texture2D(uSrc, vUv + uDir * 3.2308).r + texture2D(uSrc, vUv - uDir * 3.2308).r) * 0.0703;
  gl_FragColor = vec4(s, s, s, 1.0);
}`;

// last pass: the picture
const FINAL = `
precision mediump float;
${LAMPS}
uniform sampler2D uBloom;
uniform vec2 uScale, uOffset, uAspect;
uniform float uLights, uReveal;
varying vec2 vUv;
const vec3 LAMP = vec3(0.62, 0.74, 1.0);
void main() {
  vec2 uv = vUv * uScale + uOffset;
  vec3 c = texture2D(uTex, uv).rgb;
  float bloom = texture2D(uBloom, uv).r;

  // the night spreads out from the lamps, brighter things first
  float near = 1.0 - clamp(length((uv - vec2(0.64, 0.5)) * uAspect) * 1.5, 0.0, 1.0);
  float t = mix(1.05, -0.35, uReveal);
  vec3 scene = c * smoothstep(t, t + 0.25, 0.3 * dot(c, W) + 0.7 * near);

  vec3 col = max(scene, c * hot(uv) * uLights) + LAMP * bloom * 2.2 * uLights * (1.0 - uReveal);
  // dither, so the dark halo doesn't band
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
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
  const pHot = program(HOT, ['uTex', 'uStep']);
  const pBlur = program(BLUR, ['uSrc', 'uDir']);
  const pFinal = program(FINAL, ['uTex', 'uBloom', 'uScale', 'uOffset', 'uAspect', 'uLights', 'uReveal']);
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
  const a = target(), b = target();
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
  const state = { lights: 0, reveal: 0, pan: 1 };
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

    // bloom: the lamps at 1/4 size, blurred three times
    pass(pHot, a);
    gl.uniform1i(pHot.uTex, 0);
    gl.uniform2f(pHot.uStep, 0.25 / GW, 0.25 / GH);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    for (const r of [1.5, 3, 4.5]) {
      blur(a, b, r, 0);
      blur(b, a, 0, r);
    }

    // the picture, cropped like object-fit: cover
    pass(pFinal, null);
    gl.viewport(0, 0, cw, ch);
    const box = w / h, clip = vw / vh;
    let sx = 1, sy = 1;
    if (box > clip) sy = clip / box; else sx = box / clip;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, a.tex);
    gl.uniform1i(pFinal.uTex, 0);
    gl.uniform1i(pFinal.uBloom, 1);
    gl.uniform2f(pFinal.uScale, sx, sy);
    gl.uniform2f(pFinal.uOffset, (1 - sx) * state.pan, (1 - sy) * 0.5);
    gl.uniform2f(pFinal.uAspect, vw / vh, 1);
    gl.uniform1f(pFinal.uLights, state.lights);
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
      // ignition: two blinks, then the lamps come up
      .set(state, { lights: 0.85 }, 0.35)
      .set(state, { lights: 0 }, 0.42)
      .set(state, { lights: 0.45 }, 0.56)
      .set(state, { lights: 0 }, 0.61)
      .to(state, { lights: 1, duration: 0.5, ease: 'power2.out' }, 0.8)
      // then the night comes in around them
      .to(state, { reveal: 1, duration: 1.5, ease: 'power2.inOut' }, 1.6)
      .to(state, { pan: 0.5, duration: 1.5, ease: 'power2.inOut' }, 1.6)
      .call(() => onOpen?.(), null, 2.1)
      .call(() => { stop(); onDone?.(); }, null, 3.9);
  }

  return { run, stop, get timeline() { return tl; } };   // timeline: for ?debug tests
}
