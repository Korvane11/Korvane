/* RC Cleaning, every page: the nav and menu, reveals, the email forms and
 * the opening hours. The home page also runs the wipe (js/wipe.js).
 */
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------- hours */
// Every day 8am to 8pm, in Tucson's time (Arizona keeps standard time all year).
const TZ = 'America/Phoenix', OPEN = 8, CLOSE = 20;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
  .formatToParts(new Date()).map((p) => [p.type, p.value]));
const day = DAYS.indexOf(parts.weekday);
const hour = (+parts.hour % 24) + +parts.minute / 60;
const open = hour >= OPEN && hour < CLOSE;
$$('[data-day]').forEach((el) => el.classList.toggle('is-today', +el.dataset.day === day));
$$('[data-status]').forEach((el) => {
  el.textContent = open ? 'Open now, until 8pm' : hour < OPEN ? 'Opens today at 8am' : 'Opens tomorrow at 8am';
  el.closest('.status')?.classList.toggle('is-open', open);
});
$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

/* ---------------------------------------------------------------- nav */
const nav = $('#nav');
const hero = $('.hero');
if (nav && hero && nav.classList.contains('nav--over')) {
  // white over the photo, solid once the photo has scrolled away
  new IntersectionObserver(([e]) => nav.classList.toggle('is-solid', !e.isIntersecting), { rootMargin: '-80px 0px 0px 0px' })
    .observe(hero);
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
    requestAnimationFrame(() => { menu.classList.add('is-open'); $('a, button', menu)?.focus(); });
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
$$('#menu a').forEach((a) => a.addEventListener('click', () => { if (a.hash && a.pathname === location.pathname) setMenu(false); }));

// Phones: the call bar slides up once the page's own call buttons have
// scrolled out of view, so the two never sit on screen together.
const firstCtas = $('.hero__ctas');
const callbar = $('.callbar');
if (firstCtas && callbar) {
  new IntersectionObserver(([e]) => callbar.classList.toggle('is-away', e.isIntersecting || e.boundingClientRect.top > innerHeight))
    .observe(firstCtas);
}

/* ---------------------------------------------------------------- reveals */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
}, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
$$('.reveal').forEach((el) => io.observe(el));

/* ---------------------------------------------------------------- forms */
// No server: a form opens the visitor's email app, addressed to RC Cleaning,
// with each filled-in field as a line. data-subject may use {name} and
// {service}; the form's mailto action is the no-JavaScript fallback.
$$('form[data-mailto]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const v = (n) => String(form.elements[n]?.value || '').trim();
    const lines = [];
    $$('input[name], select[name], textarea[name]', form).forEach((el) => {
      const value = String(el.value || '').trim();
      if (!value || el.name === 'subject') return;
      const label = (form.querySelector(`label[for="${el.id}"]`)?.firstChild?.textContent || el.name).trim();
      lines.push(el.tagName === 'TEXTAREA' ? `\n${value}\n` : `${label}: ${value}`);
    });
    const subject = (v('subject') || form.dataset.subject || 'Message from the website')
      .replace('{name}', v('name') || 'the website').replace('{service}', v('service') || 'cleaning');
    location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    $('.form__sent', form)?.removeAttribute('hidden');
  });
});
// a service link on the booking page picks that service in the form
$$('[data-pick]').forEach((a) => a.addEventListener('click', () => {
  const select = $('#req-service');
  if (select) select.value = a.dataset.pick;
}));
const wanted = new URLSearchParams(location.search).get('service');
if (wanted && $('#req-service')) $('#req-service').value = wanted;

/* ---------------------------------------------------------------- home */
if (document.body.dataset.page === 'home') import('./home.js');

