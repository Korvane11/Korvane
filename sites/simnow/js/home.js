/* SimNow home: a black screen, the car's tail lights come on, the night comes
 * in around them as it drives, and the site opens over it. Then the hero, and
 * a short scroll story whose chapters each point to a page.
 *
 * The intro (js/lights.js, WebGL; a fade from black without it) plays on the
 * first visit to the home page in a browsing session. Coming back to it from
 * another page opens straight onto the drive. ?intro forces the intro, ?skip
 * skips it, ?debug exposes window.__simnow for tests.
 */
import { createLights } from './lights.js';
import { body, video, shade, nav, params, reduced, state, startPlayback, startLenis, resumeDrive } from './site.js';

const { gsap, ScrollTrigger } = window;
const $ = (s) => document.querySelector(s);
const loader = $('#loader');
const storyEl = $('.story');
const storyBar = $('#storyBar');
const chapters = [...document.querySelectorAll('.chapter')];

const FADE_IN = 1.6;      // seconds of black-to-drive before the site opens (no-WebGL path)
const START_WAIT = 2500;  // ms of black at most: a clip that hasn't started by then opens on its poster
const INTRO_RATE = 0.8;   // the first shot plays a little slow under the intro
const SEEN = 'simnow:intro';

let lights = null;
let introDone = false;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/* ---------------------------------------------------------------- chapters */
// Scroll timeline: hold on each chapter, then cross to the next.
const HOLDS = [0.8, 1, 1, 1, 1.2];
const MOVE = 0.8;
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

function presence(k, seg, t) {
  if (seg.type === 'hold') return seg.k === k ? 1 : 0;
  if (seg.k === k) return 1 - smooth(t / 0.45);
  if (seg.k === k - 1) return smooth((t - 0.55) / 0.45);
  return 0;
}

function setStory(p) {
  const seg = segments.find((s) => p <= s.b) || segments[segments.length - 1];
  const t = clamp((p - seg.a) / (seg.b - seg.a), 0, 1);
  chapters.forEach((el, k) => {
    const c = presence(k, seg, t);
    const leaving = seg.type === 'move' && seg.k === k;
    el.style.opacity = c.toFixed(3);
    el.style.visibility = c > 0.001 ? 'visible' : 'hidden';
    el.style.setProperty('--y', `${((1 - c) * (leaving ? -36 : 36)).toFixed(1)}px`);
  });
  storyBar.style.transform = `scaleX(${p.toFixed(4)})`;
}

/* ---------------------------------------------------------------- intro */
function revealHero(instant) {
  const hero = chapters[0];
  const parts = [hero.querySelector('.eyebrow'), hero.querySelector('.hero__lead'), hero.querySelector('.hero__ctas'), hero.querySelector('.hero__facts')];
  if (instant) {
    gsap.set(hero.querySelectorAll('.line > span'), { yPercent: 0, y: 0 });
    gsap.set(parts, { opacity: 1 });
  } else {
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .to(parts[0], { opacity: 1, duration: 1.2 }, 0)
      .fromTo(hero.querySelectorAll('.line > span'), { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1.4, stagger: 0.12 }, 0.1)
      .fromTo(parts[1], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2 }, 0.5)
      .fromTo(parts[2], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2 }, 0.62)
      .fromTo(parts[3], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2 }, 0.74);
  }
  nav.classList.add('is-visible');
  body.classList.add('is-ready');
  shade.classList.add('is-on');
}

function finishIntro(instant = false) {
  if (introDone) return;
  introDone = true;
  state.wantPlay = true;
  video.classList.add('is-on');
  if (instant) {
    lights?.stop();
    video.playbackRate = 1;
    video.play().catch(() => {});
  }
  setStory(0);
  body.classList.remove('is-intro');
  loader.classList.add('is-done');
  revealHero(instant);
  startScroll();
}

/* ---------------------------------------------------------------- scroll */
function startScroll() {
  const lenis = startLenis({ autoRaf: false });
  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  ScrollTrigger.create({ trigger: storyEl, start: 'top top', end: 'bottom bottom', onUpdate: (self) => setStory(self.progress) });
  ScrollTrigger.refresh();
}

/* ---------------------------------------------------------------- boot */
function seenIntro() {
  try { return sessionStorage.getItem(SEEN) === '1'; } catch { return false; }
}
function markSeen() {
  try { sessionStorage.setItem(SEEN, '1'); } catch { /* private mode */ }
}

async function boot() {
  buildSegments(chapters.length);

  if (reduced) {
    // No intro and no motion: the poster frame sits behind stacked content.
    body.classList.add('is-static', 'is-ready');
    body.classList.remove('is-intro');
    loader.classList.add('is-done');
    nav.classList.add('is-visible');
    shade.classList.add('is-on');
    video.classList.add('is-on');
    video.preload = 'none';
    return;
  }

  if (params.has('skip')) { finishIntro(true); return; }

  // Back on the home page in the same visit: no intro again, the drive just
  // carries on from where the last page left it, and the hero rises in.
  if (seenIntro() && !params.has('intro')) {
    resumeDrive();
    state.wantPlay = true;
    video.play().catch(() => {});
    finishIntro(false);
    return;
  }

  // No waiting for the whole clip to buffer: play as soon as the browser can.
  lights = createLights(video, $('#lightsCanvas'));
  if (lights) video.playbackRate = INTRO_RATE;
  state.wantPlay = true;
  if (!(await startPlayback(video, START_WAIT))) {
    finishIntro(true);   // autoplay refused or a slow start: show the site with the poster
    return;
  }
  markSeen();
  if (lights) loader.style.transitionDuration = '250ms';   // black on black: get out of the lamps' way
  loader.classList.add('is-done');
  if (lights) {
    // black, the tail lights come on, then the night around them; the site
    // opens as it does
    lights.run({
      onOpen: () => finishIntro(false),
      onDone: () => { video.playbackRate = 1; },
    });
    // shown (under the opaque canvas) from the start: some browsers pause a
    // video they think is invisible
    video.classList.add('is-on');
  } else {
    // black, then the car drives out of the dark; the site opens behind it
    requestAnimationFrame(() => video.classList.add('is-on'));
    setTimeout(() => finishIntro(false), FADE_IN * 1000);
  }
}

if (params.has('debug')) window.__simnow = { setStory, video, get lights() { return lights; } };
boot();
