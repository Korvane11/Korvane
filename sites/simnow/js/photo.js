/* The photo stage: the owner's photo of the SVJ, brought to life on a canvas.
 *
 * - the intro starts black, the headlights flicker on, then the street fades up
 * - rain keeps falling over the photo
 * - scrolling moves a camera over the photo (headlight, windscreen, wing, night)
 *
 * Photo coordinates are normalised 0..1 (x across, y down).
 */
const BLACK = '#030304';

// Where things are in the photo.
const LIGHTS = [
  { x: 0.386, y: 0.622, r: 0.055, angle: -0.38 },   // headlight nearest the camera
  { x: 0.793, y: 0.594, r: 0.034, angle: 0.9 },     // far headlight
];

// Camera per chapter: centre, zoom, headlight glow, night grade.
// `m` overrides apply on portrait screens, where the text sits at the bottom.
export const SHOTS = [
  { x: 0.56, y: 0.60, zoom: 1.0, glow: 0.55, night: 0.0, m: { y: 0.70, zoom: 1.22 } },   // hero
  { x: 0.40, y: 0.62, zoom: 2.3, glow: 1.0, night: 0.45, m: { y: 0.66 } },                // lights out
  { x: 0.56, y: 0.55, zoom: 1.8, glow: 0.7, night: 0.15, m: { y: 0.58 } },                // rent by the hour: rain on the glass
  { x: 0.34, y: 0.49, zoom: 2.1, glow: 0.3, night: 0.1, m: { y: 0.53 } },                 // every driver: the wing
  { x: 0.56, y: 0.60, zoom: 1.3, glow: 1.0, night: 0.78 },   // race nights
  { x: 0.50, y: 0.50, zoom: 1.0, glow: 0.5, night: 0.0 },    // take it home: the whole street
];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

export function createPhotoStage(canvas, { src, reduced = false }) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const img = new Image();
  img.decoding = 'async';
  const cam = { ...SHOTS[0], exposure: 0, lights: 0, rain: 0 };
  let cw = 0;
  let ch = 0;
  let dpr = 1;
  let ready = false;
  let running = false;
  let last = 0;
  let drops = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = Math.round(innerWidth * dpr);
    ch = Math.round(innerHeight * dpr);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    seedRain();
  }

  // Phones: the photo fills the screen. Wider screens: it fills the right part
  // of the screen and fades into the black on its left edge.
  function panel() {
    const portrait = cw / ch < 0.9;
    if (portrait) return { x: 0, w: cw, portrait };
    const w = Math.round(cw * clamp(0.62 - (cw / ch - 1.6) * 0.08, 0.5, 0.66));
    return { x: cw - w, w, portrait };
  }

  // Photo to screen mapping for the current camera.
  function transform() {
    const p = panel();
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const base = Math.max(p.w / iw, ch / ih);
    const s = base * cam.zoom;
    const w = iw * s;
    const h = ih * s;
    let x = p.x + p.w / 2 - cam.x * w;
    let y = ch / 2 - cam.y * h;
    x = clamp(x, p.x + p.w - w, p.x);
    y = clamp(y, ch - h, 0);
    return { x, y, w, h, s, p };
  }

  function seedRain() {
    const n = Math.round(clamp((cw * ch) / (dpr * dpr) / 2600, 120, 520));
    drops = Array.from({ length: n }, () => newDrop(true));
  }
  function newDrop(anywhere) {
    const z = Math.random();                // 0 far .. 1 near
    return {
      x: Math.random() * cw * 1.2 - cw * 0.1,
      y: anywhere ? Math.random() * ch : -Math.random() * ch * 0.3,
      z,
      len: (10 + z * 34) * dpr,
      speed: (900 + z * 1500) * dpr,
      a: 0.05 + z * 0.16,
    };
  }

  function drawLights(t, T) {
    if (cam.lights <= 0.001) return;
    ctx.globalCompositeOperation = 'lighter';
    for (const L of LIGHTS) {
      const px = t.x + L.x * t.w;
      const py = t.y + L.y * t.h;
      if (px < t.p.x - 200 || px > cw + 200) continue;
      const r = L.r * t.w * (0.9 + cam.night * 0.5);
      const k = cam.lights * (0.85 + 0.15 * Math.sin(T * 0.0021 + L.x * 9));
      // core
      let g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, `rgba(235,243,255,${0.95 * k})`);
      g.addColorStop(0.25, `rgba(200,220,255,${0.55 * k})`);
      g.addColorStop(1, 'rgba(120,160,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
      // wide bloom
      const R = r * 4.5;
      g = ctx.createRadialGradient(px, py, 0, px, py, R);
      g.addColorStop(0, `rgba(170,200,255,${0.32 * k})`);
      g.addColorStop(1, 'rgba(80,120,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, R, 0, Math.PI * 2);
      ctx.fill();
      // anamorphic streak
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(1, 0.035);
      const S = r * 11;
      g = ctx.createRadialGradient(0, 0, 0, 0, 0, S);
      g.addColorStop(0, `rgba(180,210,255,${0.42 * k})`);
      g.addColorStop(1, 'rgba(100,150,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, S, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawRain(dt, t) {
    if (cam.rain <= 0.001) return;
    const wind = 0.16;
    ctx.lineCap = 'round';
    for (const d of drops) {
      d.y += d.speed * dt;
      d.x += d.speed * wind * dt;
      if (d.y > ch + d.len || d.x > cw + 40) Object.assign(d, newDrop(false));
      if (d.x < t.p.x) continue;
      ctx.strokeStyle = `rgba(205,215,232,${d.a * cam.rain})`;
      ctx.lineWidth = (0.6 + d.z * 0.9) * dpr;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.len * wind, d.y - d.len);
      ctx.stroke();
    }
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    ctx.globalAlpha = 1;
    ctx.fillStyle = BLACK;
    ctx.fillRect(0, 0, cw, ch);
    if (ready) {
      const t = transform();
      ctx.save();
      ctx.beginPath();
      ctx.rect(t.p.x, 0, t.p.w, ch);
      ctx.clip();
      if (cam.exposure > 0.001) {
        ctx.globalAlpha = cam.exposure;
        ctx.drawImage(img, t.x, t.y, t.w, t.h);
        ctx.globalAlpha = 1;
        if (cam.night > 0.001) {
          // night grade: crush and cool everything except the lamps drawn next
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = `rgba(${Math.round(lerp(255, 46, cam.night))},${Math.round(lerp(255, 56, cam.night))},${Math.round(lerp(255, 86, cam.night))},1)`;
          ctx.fillRect(t.p.x, 0, t.p.w, ch);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      drawLights(t, now);
      if (!reduced) drawRain(dt, t);
      ctx.restore();
      // feather the panel into the page on wide screens
      if (!t.p.portrait) {
        const f = t.p.w * 0.32;
        const g = ctx.createLinearGradient(t.p.x, 0, t.p.x + f, 0);
        g.addColorStop(0, BLACK);
        g.addColorStop(1, 'rgba(3,3,4,0)');
        ctx.fillStyle = g;
        ctx.fillRect(t.p.x - 2, 0, f + 2, ch);
      }
    }
    requestAnimationFrame(frame);
  }

  return {
    cam,
    load() {
      return new Promise((resolve) => {
        img.onload = () => { (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => { ready = true; resolve(true); }); };
        img.onerror = () => resolve(false);
        img.src = src;
      });
    },
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    },
    stop() { running = false; },
    resize,
    // Intro timeline, t in seconds: black, lamps flicker on, the street fades up.
    intro(t) {
      const flick = [[0.55, 0], [0.62, 0.5], [0.7, 0.05], [0.82, 0.8], [0.9, 0.3], [1.05, 1.0]];
      let v = 0;
      for (let i = 0; i < flick.length; i++) if (t >= flick[i][0]) v = flick[i][1];
      const hero = cw / ch < 0.9 && SHOTS[0].m ? { ...SHOTS[0], ...SHOTS[0].m } : SHOTS[0];
      cam.x = hero.x;
      cam.y = hero.y;
      cam.zoom = hero.zoom;
      cam.lights = v * lerp(1, hero.glow, smooth((t - 2.2) / 1.6));
      cam.exposure = smooth((t - 1.5) / 2.0);
      cam.rain = smooth((t - 1.8) / 1.5);
      cam.night = lerp(0.6, 0, smooth((t - 1.5) / 2.2));
      return t >= 3.8;
    },
    // Camera between shot a and b, u in 0..1.
    between(a, b, u) {
      const portrait = cw / ch < 0.9;
      const pick = (s) => (portrait && s.m ? { ...s, ...s.m } : s);
      const A = pick(SHOTS[a]);
      const B = pick(SHOTS[b]);
      const e = smooth(u);
      cam.x = lerp(A.x, B.x, e);
      cam.y = lerp(A.y, B.y, e);
      cam.zoom = lerp(A.zoom, B.zoom, e);
      cam.lights = lerp(A.glow, B.glow, e);
      cam.night = lerp(A.night, B.night, e);
      cam.exposure = 1;
      cam.rain = 1;
    },
  };
}
