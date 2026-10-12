/* SimNow: black screen, the headlights come on, then the scroll story.
 *
 * Two stages can drive the story:
 * - photo (default): the owner's photo of the SVJ with live headlights and
 *   rain; scrolling moves a camera over it (js/photo.js)
 * - film: pre-rendered frame sequences (Blender, see render/), used when
 *   assets/film/manifest.json exists: the intro plays on its own, the story is
 *   scrubbed by scroll and each hold swaps in a sharper HD still
 */
import { createPhotoStage, SHOTS } from './photo.js';

const { gsap, ScrollTrigger, Lenis } = window;

const $ = (s) => document.querySelector(s);
const body = document.body;
const canvas = $('#film');
const ctx = canvas.getContext('2d', { alpha: false });
const shade = $('#filmShade');
const loader = $('#loader');
const loaderBar = $('#loaderBar');
const loaderLabel = $('#loaderLabel');
const skipBtn = $('#skipIntro');
const nav = $('#nav');
const storyEl = $('.story');
const storyBar = $('#storyBar');
const chapters = [...document.querySelectorAll('.chapter')];

const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const BLACK = '#030304';
const INTRO_FPS = 30;

// Small frames on phones and data-saver connections.
const SET = (coarse && Math.min(innerWidth, innerHeight) < 820) || navigator.connection?.saveData ? 'sm' : 'lg';
const HD_SUFFIX = SET === 'sm' ? '-sm' : '';

const state = {
  mode: 'intro',      // intro | story
  introFrame: 0,
  storyFrame: 0,
  hdAlpha: 0,
  hdKey: 0,
  dirty: true,
};

let manifest = null;
let photo = null;
const seqs = { intro: [], story: [] };
const hd = [];
let lenis = null;

/* ---------------------------------------------------------------- small bits */
document.getElementById('year').textContent = new Date().getFullYear();
{
  const rows = document.querySelectorAll('.hours dl > div');
  rows[new Date().getDay()]?.classList.add('is-today');
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/* ---------------------------------------------------------------- loading */
function frameUrl(seq, i) {
  return `assets/film/${SET}/${seq}_${String(i).padStart(4, '0')}.webp`;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { img.decode?.().catch(() => {}).finally(() => resolve(img)); if (!img.decode) resolve(img); };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Loads a list of slots in order with a few requests in flight.
async function fill(list, urls, concurrency, onEach) {
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < urls.length) {
      const i = next++;
      list[i] = await loadImage(urls[i]);
      done++;
      onEach?.(done, urls.length);
      if (state.mode === 'story' || i === 0) state.dirty = true;
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

/* ---------------------------------------------------------------- drawing */
let cw = 0;
let ch = 0;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cw = Math.round(innerWidth * dpr);
  ch = Math.round(innerHeight * dpr);
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
  }
  photo?.resize();
  state.dirty = true;
}

function focusOf(seq, i) {
  return manifest?.sequences?.[seq]?.focus?.[i] || [0.5, 0.5];
}

// Fit a 16:9 frame: cover on landscape screens; on portrait phones the frame
// fills the upper part of the screen, cropped around the subject.
function place(img, focus) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const portrait = cw / ch < 0.9;
  let s;
  let dx;
  let dy;
  if (portrait) {
    s = Math.max(cw / iw, (ch * 0.58) / ih);
    const w = iw * s;
    dx = clamp(cw / 2 - focus[0] * w, cw - w, 0);
    dy = ch * 0.07;
  } else {
    s = Math.max(cw / iw, ch / ih);
    dx = (cw - iw * s) / 2;
    dy = (ch - ih * s) / 2;
  }
  return [dx, dy, iw * s, ih * s];
}

function nearest(list, i) {
  if (list[i]) return list[i];
  for (let d = 1; d < list.length; d++) {
    if (list[i - d]) return list[i - d];
    if (list[i + d]) return list[i + d];
  }
  return null;
}

// On portrait screens the frame sits in the upper part of the screen; feather
// its edges into the black so there is no hard line.
function featherPortrait() {
  if (cw / ch >= 0.9) return;
  const top = ch * 0.07;
  const h = Math.max(cw / 16 * 9, ch * 0.58);
  const fadeTop = ctx.createLinearGradient(0, top, 0, top + h * 0.18);
  fadeTop.addColorStop(0, BLACK);
  fadeTop.addColorStop(1, 'rgba(3,3,4,0)');
  ctx.fillStyle = fadeTop;
  ctx.fillRect(0, top - 2, cw, h * 0.18 + 2);
  const bottom = top + h;
  const fadeBottom = ctx.createLinearGradient(0, bottom - h * 0.32, 0, bottom);
  fadeBottom.addColorStop(0, 'rgba(3,3,4,0)');
  fadeBottom.addColorStop(1, BLACK);
  ctx.fillStyle = fadeBottom;
  ctx.fillRect(0, bottom - h * 0.32, cw, h * 0.32 + 2);
}

function drawImg(img, focus, alpha) {
  if (!img) return;
  ctx.globalAlpha = alpha;
  const [x, y, w, h] = place(img, focus);
  ctx.drawImage(img, x, y, w, h);
  ctx.globalAlpha = 1;
}

function draw() {
  if (photo || !state.dirty) return;
  state.dirty = false;
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, cw, ch);
  const seq = state.mode === 'intro' ? 'intro' : 'story';
  const list = seqs[seq];
  const f = state.mode === 'intro' ? state.introFrame : state.storyFrame;
  if (!list.length) return;
  const i0 = clamp(Math.floor(f), 0, list.length - 1);
  const i1 = Math.min(i0 + 1, list.length - 1);
  const t = f - i0;
  const a = nearest(list, i0);
  drawImg(a, focusOf(seq, i0), 1);
  if (t > 0.02 && i1 !== i0) {
    const b = list[i1];
    if (b && b !== a) drawImg(b, focusOf(seq, i1), t);
  }
  if (state.mode === 'story' && state.hdAlpha > 0.01) {
    const still = hd[state.hdKey];
    const keyFrame = manifest.storyKeys[state.hdKey];
    if (still) drawImg(still, focusOf('story', keyFrame), state.hdAlpha);
  }
  featherPortrait();
}

gsap.ticker.add(draw);

/* ---------------------------------------------------------------- story mapping */
// Scroll timeline: hold on each key shot, then move to the next.
const HOLDS = [0.7, 1, 1, 1, 1, 1.4];
const MOVE = 1.15;
let segments = [];

function buildSegments(count) {
  const out = [];
  let total = 0;
  for (let k = 0; k < count; k++) {
    out.push({ type: 'hold', k, w: HOLDS[k] ?? 1 });
    total += HOLDS[k] ?? 1;
    if (k < count - 1) { out.push({ type: 'move', k, w: MOVE }); total += MOVE; }
  }
  let acc = 0;
  segments = out.map((s) => { const seg = { ...s, a: acc / total, b: (acc + s.w) / total }; acc += s.w; return seg; });
}

function chapterPresence(k, seg, t) {
  if (seg.type === 'hold') return seg.k === k ? 1 : 0;
  if (seg.k === k) return 1 - smooth(t / 0.32);           // leaving shot k
  if (seg.k === k - 1) return smooth((t - 0.68) / 0.32);   // arriving at shot k
  return 0;
}

function setStory(p) {
  if (!segments.length) return;
  const seg = segments.find((s) => p <= s.b) || segments[segments.length - 1];
  const t = clamp((p - seg.a) / (seg.b - seg.a), 0, 1);
  if (photo) {
    if (seg.type === 'hold') photo.between(seg.k, seg.k, 0);
    else photo.between(seg.k, seg.k + 1, t);
  } else if (seg.type === 'hold') {
    const keys = manifest.storyKeys;
    state.storyFrame = keys[seg.k];
    state.hdKey = seg.k;
    state.hdAlpha = 1;
  } else {
    const keys = manifest.storyKeys;
    state.storyFrame = keys[seg.k] + t * (keys[seg.k + 1] - keys[seg.k]);
    // ease out of the still leaving, into the next still arriving
    if (t < 0.5) { state.hdKey = seg.k; state.hdAlpha = 1 - smooth(t / 0.12); }
    else { state.hdKey = seg.k + 1; state.hdAlpha = smooth((t - 0.88) / 0.12); }
  }
  state.dirty = true;

  let shadeOn = false;
  let shadeRight = false;
  chapters.forEach((el, k) => {
    const c = chapterPresence(k, seg, t);
    const leaving = (seg.type === 'move' && seg.k === k);
    el.style.opacity = c.toFixed(3);
    el.style.visibility = c > 0.001 ? 'visible' : 'hidden';
    el.style.setProperty('--y', `${((1 - c) * (leaving ? -36 : 36)).toFixed(1)}px`);
    if (c > 0.35) {
      shadeOn = true;
      shadeRight = el.classList.contains('chapter--right');
    }
  });
  shade.classList.toggle('is-on', shadeOn);
  shade.classList.toggle('is-right', shadeRight);
  storyBar.style.transform = `scaleX(${p.toFixed(4)})`;
}

/* ---------------------------------------------------------------- intro */
let introDone = false;

function playIntro() {
  const total = seqs.intro.length;
  let clock = 0;
  let last = performance.now();
  return new Promise((resolve) => {
    function tick(now) {
      if (introDone) return resolve();
      const dt = Math.min(now - last, 100);
      last = now;
      const next = Math.floor(((clock + dt) / 1000) * INTRO_FPS);
      // wait for frames that haven't arrived yet rather than skipping them
      if (next < total && !seqs.intro[next]) { requestAnimationFrame(tick); return; }
      clock += dt;
      state.introFrame = Math.min(total - 1, (clock / 1000) * INTRO_FPS);
      state.dirty = true;
      if (state.introFrame >= total - 1) return resolve();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

function revealHero(instant) {
  const hero = chapters[0];
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (instant) {
    gsap.set(hero.querySelectorAll('.line > span'), { yPercent: 0, y: 0 });
    gsap.set([hero.querySelector('.eyebrow'), hero.querySelector('.hero__lead'), hero.querySelector('.hero__ctas')], { opacity: 1 });
  } else {
    tl.to(hero.querySelector('.eyebrow'), { opacity: 1, duration: 1.2 }, 0)
      .fromTo(hero.querySelectorAll('.line > span'), { yPercent: 110 }, { yPercent: 0, y: 0, duration: 1.4, stagger: 0.12 }, 0.1)
      .fromTo(hero.querySelector('.hero__lead'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2 }, 0.5)
      .fromTo(hero.querySelector('.hero__ctas'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2 }, 0.62);
  }
  nav.classList.add('is-visible');
  body.classList.add('is-ready');
  shade.classList.add('is-on');
}

function finishIntro(instant = false) {
  if (introDone) return;
  introDone = true;
  state.mode = 'story';
  setStory(0);
  body.classList.remove('is-intro');
  loader.classList.add('is-done');
  revealHero(instant);
  startScroll();
}

/* ---------------------------------------------------------------- scroll */
function startScroll() {
  if (lenis) return;
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.create({
    trigger: storyEl,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => setStory(self.progress),
  });
  ScrollTrigger.refresh();
}

/* ---------------------------------------------------------------- nav, menu, reveals */
const toggle = $('#navToggle');
const menu = $('#menu');
function setMenu(open) {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (open) {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('is-open'));
    lenis?.stop();
  } else {
    menu.classList.remove('is-open');
    setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 500);
    lenis?.start();
  }
}
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    if (!menu.hidden) setMenu(false);
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
    else if (target === 0) scrollTo({ top: 0 });
    else target.scrollIntoView();
  });
});

const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* ---------------------------------------------------------------- boot */
function staticPage() {
  body.classList.add('is-static', 'is-ready');
  body.classList.remove('is-intro');
  loader.classList.add('is-done');
  nav.classList.add('is-visible');
  state.mode = 'story';
  shade.classList.add('is-on');
}

async function boot() {
  resize();
  addEventListener('resize', resize);
  // The rendered film is opt-in: <html data-stage="film"> once assets/film exists.
  if (document.documentElement.dataset.stage === 'film') {
    try {
      manifest = await (await fetch('assets/film/manifest.json')).json();
    } catch {
      manifest = null;
    }
  }
  if (!manifest || !manifest.sequences?.story) {
    await photoBoot();
    return;
  }
  buildSegments(manifest.storyKeys.length);
  const intro = manifest.sequences.intro?.frames || 0;
  const story = manifest.sequences.story.frames;
  seqs.intro = new Array(intro).fill(null);
  seqs.story = new Array(story).fill(null);
  const introUrls = Array.from({ length: intro }, (_, i) => frameUrl('intro', i));
  const storyUrls = Array.from({ length: story }, (_, i) => frameUrl('story', i));
  const hdUrls = manifest.keyNames.map((n) => `assets/film/hd/${n}${HD_SUFFIX}.webp`);

  if (reduced) {
    // No intro and no camera move: the hero still sits behind stacked content.
    staticPage();
    hd[0] = await loadImage(hdUrls[0]);
    seqs.story[0] = hd[0];
    state.storyFrame = 0;
    state.dirty = true;
    return;
  }

  let storyLoading = null;
  const loadStory = () => (storyLoading ||= Promise.all([fill(hd, hdUrls, 2), fill(seqs.story, storyUrls, 6)]));
  skipBtn.addEventListener('click', () => { loadStory(); finishIntro(true); });
  if (params.has('skip')) {
    // straight to the story (also used by tests)
    loadStory();
    finishIntro(true);
    return;
  }

  // Black screen until enough of the intro is in to play without stalling.
  const needed = Math.min(intro, 48);
  let shown = 0;
  const introLoad = fill(seqs.intro, introUrls, 6, (n) => {
    shown = Math.max(shown, Math.min(1, n / needed));
    loaderBar.style.transform = `scaleX(${shown})`;
  });
  await new Promise((resolve) => {
    const check = () => (seqs.intro.slice(0, needed).every(Boolean) ? resolve() : setTimeout(check, 60));
    check();
  });
  loaderLabel.textContent = '';
  loader.classList.add('is-done');
  introLoad.then(loadStory);
  await playIntro();
  // Hand over to the story once the first story frame is in.
  if (!seqs.story[0]) seqs.story[0] = seqs.intro[seqs.intro.length - 1];
  finishIntro(false);
}

async function photoBoot() {
  body.classList.add('is-photo');
  const small = (coarse && Math.min(innerWidth, innerHeight) < 820) || navigator.connection?.saveData;
  photo = createPhotoStage(canvas, { src: `assets/photo/svj${small ? '-sm' : ''}.webp`, reduced });
  photo.resize();
  buildSegments(SHOTS.length);
  loaderBar.style.transform = 'scaleX(0.2)';
  const ok = await photo.load();
  loaderBar.style.transform = 'scaleX(1)';
  if (!ok) { photo = null; staticPage(); return; }
  // only animate while the story is on screen
  new IntersectionObserver(([en]) => (en.isIntersecting ? photo.start() : photo.stop()), { rootMargin: '10% 0px' }).observe(storyEl);

  if (reduced) {
    staticPage();
    photo.between(0, 0, 0);
    photo.start();
    return;
  }
  skipBtn.addEventListener('click', () => finishIntro(true));
  if (params.has('skip')) { finishIntro(true); return; }

  loaderLabel.textContent = '';
  loader.classList.add('is-done');
  photo.start();
  const t0 = performance.now();
  await new Promise((resolve) => {
    const tick = (now) => {
      if (introDone || photo.intro((now - t0) / 1000)) return resolve();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  finishIntro(false);
}

if (params.has('debug')) window.__simnow = { state, seqs, hd, setStory, get manifest() { return manifest; }, get photo() { return photo; } };
boot();
