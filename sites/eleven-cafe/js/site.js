/* Eleven Cafē, every page: the nav and menu, today's hours (Tucson time),
 * the year and things fading in as they scroll into view. The home page also
 * runs the pour (js/home.js).
 */
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

/* ---------------------------------------------------------------- hours */
// Monday to Friday, 7am to 2pm, in Tucson's time (Arizona keeps standard time all year).
// These are the hours Google lists; Eleven Cafē hasn't confirmed them yet. Until they
// do, the page shows the table with today's row marked and a "call ahead" note, but
// never says "Open now". Once they confirm: set this to true and put the hours back in
// index.html's structured data (README, "Hours").
const HOURS_CONFIRMED = false;
const TZ = 'America/Phoenix', OPEN = 7, CLOSE = 14;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
  .formatToParts(new Date()).map((p) => [p.type, p.value]));
const day = DAYS.indexOf(parts.weekday);
const hour = (+parts.hour % 24) + +parts.minute / 60;
const isWorkday = (d) => d >= 1 && d <= 5;
const openNow = isWorkday(day) && hour >= OPEN && hour < CLOSE;
function nextOpening() {
  for (let i = 0; i < 8; i++) {
    const d = (day + i) % 7;
    if (!isWorkday(d) || (i === 0 && hour >= OPEN)) continue;
    return i === 0 ? 'today' : i === 1 ? 'tomorrow' : NAMES[d];
  }
  return 'Monday';
}
$$('[data-day]').forEach((el) => el.classList.toggle('is-today', +el.dataset.day === day));
if (HOURS_CONFIRMED) {
  $$('[data-status]').forEach((el) => {
    el.textContent = openNow ? 'Open now, until 2pm' : `Opens ${nextOpening()} at 7am`;
    el.closest('.status')?.classList.add('is-live');
    el.closest('.status')?.classList.toggle('is-open', openNow);
  });
  $$('[data-hours-note]').forEach((el) => el.remove());
}
$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

/* ---------------------------------------------------------------- nav */
// see-through over the top of the page, solid once it has scrolled away
const nav = $('#nav');
const top = $('.hero') || $('.page-head');
if (nav && top) {
  new IntersectionObserver(([e]) => nav.classList.toggle('is-solid', !e.isIntersecting), { rootMargin: '-90% 0px 0px 0px' }).observe(top);
}

const toggle = $('#navToggle');
const menu = $('#menu');
let lastFocus = null;
function setMenu(open) {
  toggle.setAttribute('aria-expanded', String(open));
  if (open) {
    lastFocus = document.activeElement;
    menu.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => { menu.classList.add('is-open'); $('button, a', menu)?.focus(); });
  } else {
    menu.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 260);
    lastFocus?.focus();
  }
}
toggle?.addEventListener('click', () => setMenu(true));
$('#menuClose')?.addEventListener('click', () => setMenu(false));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu && !menu.hidden) setMenu(false); });

/* ---------------------------------------------------------------- reveals */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
$$('.reveal').forEach((el) => io.observe(el));

/* ---------------------------------------------------------------- home */
if (document.body.dataset.page === 'index') import('./home.js');
