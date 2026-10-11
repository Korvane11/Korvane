import { createStage, webglAvailable } from './stage.js';

const root = document.documentElement;
const body = document.body;
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPower = window.matchMedia('(max-width: 820px), (pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4;
const { gsap, ScrollTrigger } = window;

gsap.registerPlugin(ScrollTrigger);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// Lights fully on: where the intro ends and where reduced motion starts.
const LIT = { drl: 1.1, beams: 1, bloom: 0.55, env: 1, rim: 1, world: 1, tail: 1, fade: 1, intro: 1 };

/* ---------- Smooth scrolling (Lenis) kept in sync with ScrollTrigger ---------- */
let lenis = null;
if (!reduceMotion && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}

/* ---------- Intro ---------- */
const loader = $('#loader');
const loaderBar = $('#loaderBar');
let introTl = null;
let skipRequested = false;
let pageOpen = false;

function openPage() {
  if (pageOpen) return;
  pageOpen = true;
  body.classList.remove('intro-active');
  revealHero();
  if (reduceMotion) loader.remove();
  else gsap.to(loader, { autoAlpha: 0, duration: 0.4, onComplete: () => loader.remove() });
  lenis && lenis.start();
  ScrollTrigger.refresh();
}

let heroShown = false;
function revealHero(instant) {
  if (heroShown) return;
  heroShown = true;
  const items = $$('.chapter--hero .reveal');
  if (instant || reduceMotion) { gsap.set([items, '.nav'], { autoAlpha: 1, y: 0 }); return; }
  gsap.to(items, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.09, ease: 'power3.out' });
  gsap.to('.nav', { autoAlpha: 1, duration: 1, ease: 'power2.out' });
}

$('#skipIntro').addEventListener('click', () => {
  skipRequested = true;
  if (introTl) introTl.progress(1);
  else openPage();            // still loading: open the page over the fallback backdrop
});
document.addEventListener('keydown', (e) => {
  if (!pageOpen && (e.key === 'Escape' || e.key === 'Enter')) $('#skipIntro').click();
});

function playIntro(stage) {
  const s = stage.state;
  if (reduceMotion || skipRequested) {
    Object.assign(s, LIT);
    openPage();
    return;
  }
  // Black screen -> LED signatures flicker on -> main beams flare -> the car
  // is revealed by its own light -> camera glides to the hero framing.
  introTl = gsap.timeline({ onComplete: openPage });
  introTl
    .to(loaderBar.parentElement, { autoAlpha: 0, duration: 0.3 }, 0)
    .set(s, { fade: 1 }, 0.2)
    .set(loader, { backgroundColor: 'rgba(0,0,0,0)' }, 0.2)   // the unlit scene is the black screen now
    .to(s, { bloom: 0.5, duration: 0.3 }, 0.5)
    .to(s, {
      keyframes: [
        { drl: 1, duration: 0.05 }, { drl: 0.1, duration: 0.09 }, { drl: 0.9, duration: 0.05 },
        { drl: 0.3, duration: 0.12 }, { drl: 1.1, duration: 0.1 },
      ],
      ease: 'none',
    }, 0.55)
    .to(s, { beams: 1, duration: 0.45, ease: 'power2.out' }, 1.35)
    .to(s, { bloom: 0.75, duration: 0.25, ease: 'power2.out' }, 1.35)
    .to(s, { bloom: LIT.bloom, duration: 1.4, ease: 'power2.inOut' }, 1.6)
    .to(s, { env: 1, rim: 1, duration: 1.8, ease: 'power2.inOut' }, 1.5)
    .to(s, { world: 1, duration: 2.2, ease: 'power1.inOut' }, 1.9)
    .to(s, { tail: 1, duration: 0.6, ease: 'power1.out' }, 2.1)
    .to(s, { intro: 1, duration: 2.8, ease: 'power2.inOut' }, 2.2)
    .add(revealHero, 3.4)
    .add(openPage, 3.9);
  if (new URLSearchParams(location.search).get('debug') === 'pause') introTl.pause(0);
}

/* ---------- Scroll story ---------- */
const smooth = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };

function buildStory(stage) {
  const s = stage.state;
  if (reduceMotion) return;
  root.classList.add('story-mode');

  const proxy = { p: 0 };
  const rail = $('#storyRail');
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.story', start: 'top top', end: 'bottom bottom', scrub: 0.9 },
  });
  tl.to(proxy, {
    p: 1,
    duration: 1,
    onUpdate() {
      const p = proxy.p;
      // Camera keyframes sit at raw progress 0.02, 0.2, 0.38, 0.56, 0.74, 0.92,
      // leaving a short hold at the start and the end of the story.
      const cp = Math.min(Math.max((p - 0.02) / 0.9, 0), 1);
      s.progress = cp;
      s.speed = smooth(0.36, 0.5, cp) * (1 - smooth(0.7, 0.84, cp));
      s.brake = smooth(0.66, 0.74, cp) * (1 - smooth(0.86, 0.94, cp));
      rail.style.transform = `scaleY(${p})`;
    },
  }, 0);

  // Chapter text: each title holds while the camera dwells on its keyframe.
  const windows = [null, [0.13, 0.29], [0.31, 0.47], [0.49, 0.66], [0.83, 1.01]];
  tl.to('.chapter--hero', { autoAlpha: 0, y: -50, duration: 0.06 }, 0.05);
  tl.to('.story__hint', { autoAlpha: 0, duration: 0.04 }, 0.02);
  windows.forEach((w, i) => {
    if (!w) return;
    const el = document.querySelector(`[data-chapter="${i}"]`);
    tl.fromTo(el, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.05 }, w[0]);
    if (w[1] < 1) tl.to(el, { autoAlpha: 0, y: -60, duration: 0.05 }, w[1] - 0.05);
  });

  // Stop rendering once the info sections cover the screen.
  ScrollTrigger.create({
    trigger: '.story',
    start: 'top top',
    end: 'bottom top',
    onLeave: () => stage.setPaused(true),
    onEnterBack: () => stage.setPaused(false),
  });
}

/* ---------- Fallback when WebGL is missing or the model fails ---------- */
function fallback(reason) {
  console.warn('SimNow 3D stage unavailable:', reason);
  root.classList.add('no-stage');
  openPage();
}

async function boot() {
  if (!webglAvailable()) { fallback('webgl'); return; }
  let stage;
  try {
    stage = await createStage($('#stage'), {
      lowPower,
      drift: !reduceMotion,
      onProgress: (p) => { loaderBar.style.transform = `scaleX(${Math.max(0.04, p)})`; },
    });
  } catch (err) {
    console.error(err);
    fallback('load');
    return;
  }
  root.classList.add('has-stage');
  if (new URLSearchParams(location.search).has('debug')) window.__simnow = { stage, get intro() { return introTl; } };
  buildStory(stage);
  if (pageOpen) {                     // the visitor skipped while it was loading
    Object.assign(stage.state, LIT);
    ScrollTrigger.refresh();
    return;
  }
  playIntro(stage);
}
boot();

/* ---------- Navigation ---------- */
const nav = $('#nav');
const navToggle = $('#navToggle');
const navLinks = $('#navLinks');

function onScroll() { nav.classList.toggle('nav--solid', window.scrollY > 40); }
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

function setMenu(open) {
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  navLinks.classList.toggle('is-open', open);
  nav.classList.toggle('nav--open', open);
}
navToggle.addEventListener('click', () => setMenu(navToggle.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navLinks.classList.contains('is-open')) { setMenu(false); navToggle.focus(); }
});

// In-page links glide with Lenis instead of jumping.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = id === '#top' ? document.body : document.querySelector(id);
  if (!target) return;
  setMenu(false);
  if (lenis) {
    e.preventDefault();
    lenis.scrollTo(id === '#top' ? 0 : target, { offset: -70, duration: 1.6 });
  }
});

/* ---------- Hours: highlight today (Salem is on Pacific time) ---------- */
try {
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'America/Los_Angeles' }).format(new Date());
  $$('.hours dl div').forEach((row) => {
    if (row.querySelector('dt').textContent.trim() === today) row.classList.add('is-today');
  });
} catch (e) { /* older browsers: no highlight */ }

const year = $('#year');
if (year) year.textContent = String(new Date().getFullYear());
