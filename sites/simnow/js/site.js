/* SimNow, every page: the night drive behind everything, the nav and menu,
 * reveals, the email forms and the opening hours. The home page
 * (body data-page="home") adds the tail-lights intro and the scroll story
 * (js/home.js); every other page opens straight onto the drive.
 *
 * The background is one looping clip (assets/drive/drive.mp4|webm, and the
 * lighter drive-phone.* for the phone layout; footage by @nghtstlkr.idn, used
 * with permission). Each page sets its source in an inline script so the
 * download starts while the page is still being read.
 */
const $ = (s) => document.querySelector(s);

export const body = document.body;
export const page = body.dataset.page || 'home';
export const video = $('#driveVideo');
export const shade = $('#filmShade');
export const nav = $('#nav');
export const params = new URLSearchParams(location.search);
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const ext = video.canPlayType('video/mp4; codecs="avc1.640028"') ? 'mp4' : 'webm';
export const state = { wantPlay: false, lenis: null };

// The site used to be one long page. Links to its sections (shared before the
// split, e.g. .../simnow/#events) go to the page that now holds them.
const MOVED = {
  '#drive': 'book.html#prices', '#how': 'book.html#how', '#faq': 'book.html#faq',
  '#experience': 'experience.html', '#events': 'events.html', '#shop': 'gear.html',
  '#contact': 'visit.html#contact', '#visit': 'visit.html',
};
const moved = page === 'home' && MOVED[location.hash];
if (moved) location.replace(moved);

/* ---------------------------------------------------------------- hours */
// SimNow keeps the same hours every day: 1 to 9 PM, by appointment, in Salem
// (Pacific time). Work in their time zone, not the visitor's.
const TZ = 'America/Los_Angeles', OPEN = 13, CLOSE = 21;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function salemNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { day: DAYS.indexOf(p.weekday), hour: (+p.hour % 24) + +p.minute / 60 };
}
const now = salemNow();
document.querySelectorAll('.hours dl > div')[now.day]?.classList.add('is-today');
document.querySelectorAll('[data-status]').forEach((el) => {
  const open = now.hour >= OPEN && now.hour < CLOSE;
  el.textContent = open ? 'Open now, until 9 PM' : now.hour < OPEN ? 'Opens today at 1 PM' : 'Opens tomorrow at 1 PM';
  el.closest('.status')?.classList.toggle('is-open', open);
});
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

/* ---------------------------------------------------------------- the drive */
// No clip at all with reduced motion: the poster frame stands in.
if (!video.getAttribute('src') && !reduced && !moved) {
  video.src = `assets/drive/${matchMedia('(max-aspect-ratio: 1/1)').matches ? 'drive-phone' : 'drive'}.${ext}`;
}

// Start the clip and resolve true once it is actually moving; false if the
// browser refuses to autoplay or it hasn't started within `wait` ms.
export function startPlayback(v, wait) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), wait);
    v.addEventListener('playing', () => { clearTimeout(timer); resolve(true); }, { once: true });
    v.play().catch(() => { clearTimeout(timer); resolve(false); });
  });
}

// One drive across the whole site: leaving a page remembers where the clip
// was, and the next page picks it up there, so changing pages doesn't restart
// the car.
const KEY = 'simnow:drive';
addEventListener('pagehide', () => {
  try { sessionStorage.setItem(KEY, JSON.stringify({ t: video.currentTime, at: Date.now() })); } catch { /* private mode */ }
});
export function resumeDrive() {
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { /* private mode */ }
  if (!saved || !(saved.t >= 0)) return false;
  const apply = () => {
    const gap = Math.min(3, Math.max(0, (Date.now() - saved.at) / 1000));   // time spent between the pages
    video.currentTime = (saved.t + gap) % (video.duration || 12.7);
  };
  if (video.readyState >= 1) apply(); else video.addEventListener('loadedmetadata', apply, { once: true });
  return true;
}

// Save battery: pause the drive when the tab is hidden.
document.addEventListener('visibilitychange', () => {
  if (reduced) return;
  if (document.hidden) video.pause();
  else if (state.wantPlay) video.play().catch(() => {});
});

// Keep the drive going. Browsers can pause a muted background video on their
// own (power saving, a stalled download, a page restored from the back
// button), so resume it whenever it stops while the page is on screen, and on
// the visitor's first tap, scroll or key (which every browser accepts as
// permission to play, even where autoplay was refused).
function resume() {
  if (!state.wantPlay || reduced || document.hidden) return;
  if (video.paused || video.ended) video.play().catch(() => {});
}
video.addEventListener('pause', () => setTimeout(resume, 250));
video.addEventListener('ended', () => { video.currentTime = 0; resume(); });   // if looping is ever ignored
video.addEventListener('stalled', resume);
['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'].forEach((t) => addEventListener(t, resume, { passive: true }));
addEventListener('pageshow', resume);
let lastT = -1, stuck = 0;
setInterval(() => {
  resume();
  if (!state.wantPlay || video.paused || document.hidden) { stuck = 0; return; }
  // playing but not moving (a decoder hiccup): nudge it along
  stuck = video.currentTime === lastT ? stuck + 1 : 0;
  lastT = video.currentTime;
  if (stuck >= 2) { stuck = 0; video.currentTime = (video.currentTime + 0.05) % (video.duration || 1); video.play().catch(() => {}); }
}, 2000);

/* ---------------------------------------------------------------- smooth scroll */
export function startLenis(options = {}) {
  if (state.lenis || !window.Lenis || reduced) return state.lenis;
  state.lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4, ...options });
  return state.lenis;
}

/* ---------------------------------------------------------------- nav and menu */
const toggle = $('#navToggle');
const menu = $('#menu');
function setMenu(open) {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (open) {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('is-open'));
    state.lenis?.stop();
  } else {
    menu.classList.remove('is-open');
    setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 500);
    state.lenis?.start();
  }
}
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

// Links to a spot on the same page glide there; links to other pages are
// ordinary links (the page change itself cross-fades, see styles.css).
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    if (!menu.hidden) setMenu(false);
    if (state.lenis) state.lenis.scrollTo(target, { offset: -90, duration: 1.4 });
    else if (target === 0) scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });
});

/* ---------------------------------------------------------------- forms */
// No server here: a form opens the visitor's email app with everything they
// typed laid out, addressed to SimNow. Each field's label becomes a line.
// data-subject may use {name}; the mailto action is the no-JS fallback.
document.querySelectorAll('form[data-mailto]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const lines = [];
    let name = '';
    form.querySelectorAll('input[name], select[name], textarea[name]').forEach((el) => {
      const value = String(el.value || '').trim();
      if (el.name === 'name') name = value;
      if (!value) return;
      const label = (el.closest('label')?.firstChild?.textContent || el.name).trim();
      lines.push(el.tagName === 'TEXTAREA' ? `\n${value}\n` : `${label}: ${value}`);
    });
    const subject = (form.dataset.subject || 'Message from the website').replace('{name}', name || 'the website');
    location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    form.querySelector('.form__sent')?.removeAttribute('hidden');
  });
});

/* ---------------------------------------------------------------- reveals */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* ---------------------------------------------------------------- boot */
function bootPage() {
  nav.classList.add('is-visible');
  shade.classList.add('is-on');
  body.classList.add('is-ready');
  if (reduced) {
    body.classList.add('is-static');
    video.preload = 'none';
    return;
  }
  resumeDrive();
  state.wantPlay = true;
  video.classList.add('is-on');
  video.play().catch(() => {});
  startLenis({ autoRaf: true });
}

if (moved) { /* on its way to the new page */ }
else if (page === 'home') import('./home.js');
else bootPage();
