/* SimNow: a black screen, then a Lambo comes out of the dark with its lights
 * on, driving at night, and the site opens over it.
 *
 * The background is one looping clip (assets/drive/drive.mp4|webm; footage by
 * @supercar_driven, used with permission). It fades up from black, the hero
 * appears, and the chapters fade in and out over the drive as you scroll.
 */
const { gsap, ScrollTrigger, Lenis } = window;

const $ = (s) => document.querySelector(s);
const body = document.body;
const video = $('#driveVideo');
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
const ext = video.canPlayType('video/mp4; codecs="avc1.640028"') ? 'mp4' : 'webm';
const FADE_IN = 1.6;   // seconds of black-to-drive before the site opens

let lenis = null;
let introDone = false;

/* ---------------------------------------------------------------- small bits */
document.getElementById('year').textContent = new Date().getFullYear();
document.querySelectorAll('.hours dl > div')[new Date().getDay()]?.classList.add('is-today');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/* ---------------------------------------------------------------- chapters */
// Scroll timeline: hold on each chapter, then cross to the next.
const HOLDS = [0.8, 1, 1, 1, 1, 1.2];
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

/* ---------------------------------------------------------------- video */
function ready(v) {
  return new Promise((resolve) => {
    if (v.readyState >= 3) { resolve(); return; }
    const done = () => resolve();
    v.addEventListener('canplaythrough', done, { once: true });
    v.addEventListener('error', done, { once: true });
    setTimeout(done, 9000);
  });
}

// Save battery: pause the drive when the tab is hidden.
document.addEventListener('visibilitychange', () => {
  if (reduced) return;
  if (document.hidden) video.pause();
  else video.play().catch(() => {});
});

/* ---------------------------------------------------------------- intro */
function revealHero(instant) {
  const hero = chapters[0];
  const parts = [hero.querySelector('.eyebrow'), hero.querySelector('.hero__lead'), hero.querySelector('.hero__ctas')];
  if (instant) {
    gsap.set(hero.querySelectorAll('.line > span'), { yPercent: 0, y: 0 });
    gsap.set(parts, { opacity: 1 });
  } else {
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .to(parts[0], { opacity: 1, duration: 1.2 }, 0)
      .fromTo(hero.querySelectorAll('.line > span'), { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1.4, stagger: 0.12 }, 0.1)
      .fromTo(parts[1], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2 }, 0.5)
      .fromTo(parts[2], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2 }, 0.62);
  }
  nav.classList.add('is-visible');
  body.classList.add('is-ready');
  shade.classList.add('is-on');
}

function finishIntro(instant = false) {
  if (introDone) return;
  introDone = true;
  video.classList.add('is-on');
  if (instant) video.play().catch(() => {});
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
  ScrollTrigger.create({ trigger: storyEl, start: 'top top', end: 'bottom bottom', onUpdate: (self) => setStory(self.progress) });
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
async function boot() {
  buildSegments(chapters.length);
  video.src = `assets/drive/drive.${ext}`;

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

  skipBtn.addEventListener('click', () => finishIntro(true));
  if (params.has('skip')) { finishIntro(true); return; }

  loaderBar.style.transform = 'scaleX(0.35)';
  await ready(video);
  loaderBar.style.transform = 'scaleX(1)';
  loaderLabel.textContent = '';
  if (introDone) return;
  loader.classList.add('is-done');

  try {
    await video.play();
  } catch {
    finishIntro(true);   // autoplay refused: show the site with the poster
    return;
  }
  // black, then the car drives out of the dark; the site opens behind it
  requestAnimationFrame(() => video.classList.add('is-on'));
  setTimeout(() => finishIntro(false), FADE_IN * 1000);
}

if (params.has('debug')) window.__simnow = { setStory, video };
boot();
