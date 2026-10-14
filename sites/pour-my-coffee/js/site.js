/* Pour My Coffee Co, every page: the nav and phone menu, today's row in the hours, the
 * email forms, the year, and sections fading in as they scroll into view. The home page also
 * runs the opening (js/home.js).
 */
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

/* ---------------------------------------------------------------- hours */
// Monday to Friday 6am to 5pm, Saturday and Sunday 7am to 5pm, Tucson time (Arizona keeps standard
// time all year). Their home page, Instagram and Google agree on these, but two footers on their
// old site say otherwise, so the page marks today's row and never claims "Open now" until Pour
// confirms them. Once they do: set HOURS_CONFIRMED to true (README, "Hours").
const HOURS_CONFIRMED = false;
const TZ = 'America/Phoenix';
const OPEN = [7, 6, 6, 6, 6, 6, 7], CLOSE = 17;           // Sunday first
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
  .formatToParts(window.__now || new Date()).map((p) => [p.type, p.value]));
const day = DAYS.indexOf(parts.weekday);
const hour = (+parts.hour % 24) + +parts.minute / 60;
$$('[data-day]').forEach((el) => el.classList.toggle('is-today', +el.dataset.day === day));
if (HOURS_CONFIRMED) {
  const open = hour >= OPEN[day] && hour < CLOSE;
  const next = hour < OPEN[day] ? `today at ${OPEN[day]}am` : `tomorrow at ${OPEN[(day + 1) % 7]}am`;
  $$('[data-status]').forEach((el) => { el.textContent = open ? 'Open now, until 5pm' : `Opens ${next}`; el.hidden = false; });
}
$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

/* ---------------------------------------------------------------- nav */
// see-through over the home page's picture, solid once it has scrolled away
const nav = $('#nav');
const hero = $('.hero');
if (nav && hero) {
  new IntersectionObserver(([e]) => nav.classList.toggle('is-solid', !e.isIntersecting), { rootMargin: `-${64}px 0px 0px 0px`, threshold: 0.02 }).observe(hero);
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
    requestAnimationFrame(() => { menu.classList.add('is-open'); $('#menuClose')?.focus(); });
  } else {
    menu.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 260);
    lastFocus?.focus();
  }
}
toggle?.addEventListener('click', () => setMenu(true));
$('#menuClose')?.addEventListener('click', () => setMenu(false));
addEventListener('keydown', (e) => {
  if (!menu || menu.hidden) return;
  if (e.key === 'Escape') setMenu(false);
  if (e.key === 'Tab') {   // keep the keyboard inside the open menu
    const f = $$('a, button', menu), first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
addEventListener('resize', () => { if (menu && !menu.hidden && innerWidth > 860) setMenu(false); });

/* ---------------------------------------------------------------- reveals */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
$$('.reveal').forEach((el) => io.observe(el));

/* ---------------------------------------------------------------- email forms */
// There is no server behind this site: a form checks its fields, then opens the visitor's own email app
// with the message written out, addressed to Pour. The address is printed beside every form too.
const TO = 'PourMyCoffeeCo@gmail.com';
$$('form[data-mailto]').forEach((form) => {
  const status = $('.status', form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let firstBad = null;
    $$('input, textarea', form).forEach((el) => {
      const err = $(`#${el.id}-err`, form);
      let msg = '';
      const v = el.value.trim();
      if (el.required && !v) msg = `Please fill in your ${el.dataset.name || 'details'}.`;
      else if (el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = 'Please check your email address.';
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg;
      if (msg && !firstBad) firstBad = el;
    });
    if (firstBad) { status.textContent = ''; firstBad.focus(); return; }
    const f = Object.fromEntries(new FormData(form));
    const subject = form.dataset.mailto === 'job' ? `Job application: ${f.first} ${f.last}` : `Message from the website: ${f.name}`;
    const who = form.dataset.mailto === 'job' ? `${f.first} ${f.last}` : f.name;
    const body = `${f.message}\n\n${who}\n${f.email}`;
    location.href = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = `Your email app should open with the message ready to send. If it doesn't, write to ${TO}.`;
  });
});

/* ---------------------------------------------------------------- home */
if (document.body.dataset.page === 'home') import('./home.js');
