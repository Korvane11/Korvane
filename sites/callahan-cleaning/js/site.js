/* Every page: the header over the film or solid, the phone menu, reveals, today's hours (Tucson time),
 * the services list's render (home), the year, and the quote form (book.html). */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- header: light over the film, solid after it
  const head = document.querySelector('.site-head');
  const hero = document.querySelector('.hero');
  if (head) {
    if (hero && 'IntersectionObserver' in window) {
      root.classList.add('has-hero');
      const io = new IntersectionObserver(([e]) => {
        const over = e.isIntersecting;
        head.classList.toggle('is-over', over);
        head.classList.toggle('is-solid', !over);
        root.classList.toggle('past-hero', !over);   // the phone's call bar comes up once the hero's own buttons are gone
      }, { rootMargin: `-${78 + 8}px 0px 0px 0px`, threshold: 0 });
      // the sentinel: the hero minus the header's height
      io.observe(hero);
    } else {
      head.classList.remove('is-over');
      head.classList.add('is-solid');
    }
  }

  // ---------------------------------------------------------------- the phone menu
  const menu = document.getElementById('menu');
  const openBtn = document.querySelector('.menu-btn');
  const closeBtn = menu?.querySelector('.menu__close');
  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle('is-open', open);
    openBtn?.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) closeBtn?.focus(); else openBtn?.focus();
  }
  openBtn?.addEventListener('click', () => setMenu(true));
  closeBtn?.addEventListener('click', () => setMenu(false));
  menu?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
    if (e.key === 'Tab') {    // keep focus inside the open menu
      const f = [...menu.querySelectorAll('a, button')];
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  matchMedia('(min-width: 961px)').addEventListener('change', (m) => { if (m.matches && menu?.classList.contains('is-open')) setMenu(false); });

  // ---------------------------------------------------------------- reveals
  const items = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) items.forEach((el) => el.classList.add('is-in'));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach((el) => io.observe(el));
  }

  // ---------------------------------------------------------------- hours: today, and open now (Tucson: Arizona time, no daylight saving)
  const HOURS = { 0: [8, 15], 1: [7, 18], 2: [7, 18], 3: [7, 18], 4: [7, 18], 5: [7, 18], 6: [8, 17] };
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const fmt = (h) => `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`;
  function tucsonNow() {
    try {
      const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Phoenix', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
        .formatToParts(new Date()).map((x) => [x.type, x.value]));
      return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), hour: +p.hour + +p.minute / 60 };
    } catch {
      const d = new Date(Date.now() - 7 * 3600e3);
      return { day: d.getUTCDay(), hour: d.getUTCHours() + d.getUTCMinutes() / 60 };
    }
  }
  function hours() {
    const { day, hour } = tucsonNow();
    document.querySelectorAll('[data-hours] tr').forEach((tr) => {
      const today = +tr.dataset.day === day;
      tr.classList.toggle('is-today', today);
      if (today) tr.setAttribute('aria-current', 'date'); else tr.removeAttribute('aria-current');
    });
    const [o, c] = HOURS[day];
    let msg;
    if (hour >= o && hour < c) msg = `Open now, until ${fmt(c)} today.`;
    else if (hour < o) msg = `Closed now. Open today from ${fmt(o)}.`;
    else msg = `Closed now. Open ${DAYS[(day + 1) % 7] === 'Sunday' ? 'Sunday' : 'tomorrow'} from ${fmt(HOURS[(day + 1) % 7][0])}.`;
    document.querySelectorAll('[data-status]').forEach((el) => { el.textContent = msg; });
  }
  if (document.querySelector('[data-hours]')) { hours(); setInterval(hours, 60e3); }

  // ---------------------------------------------------------------- the year
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // ---------------------------------------------------------------- home: the services' render follows the list
  const svcMedia = document.querySelector('.svc__media');
  if (svcMedia && 'IntersectionObserver' in window) {
    const imgs = [...svcMedia.querySelectorAll('img')];
    const lis = [...document.querySelectorAll('.svc__item')];
    const show = (key) => {
      imgs.forEach((im) => im.classList.toggle('is-on', im.dataset.for === key));
      lis.forEach((li) => li.classList.toggle('is-on', li.dataset.svc === key));
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) show(e.target.dataset.svc); }),
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    lis.forEach((li) => io.observe(li));
    lis.forEach((li) => li.addEventListener('mouseenter', () => show(li.dataset.svc)));
    lis.forEach((li) => li.addEventListener('focusin', () => show(li.dataset.svc)));
  }

  // ---------------------------------------------------------------- book: the quote request opens an email, filled in
  const form = document.getElementById('quoteForm');
  if (form) {
    const TO = 'callahan.cleaning74@gmail.com';
    const done = document.getElementById('formDone');
    const err = (name, text) => {
      const input = form.elements[name];
      const box = form.querySelector(`[data-error="${name}"]`);
      const el = input instanceof RadioNodeList ? input[0] : input;
      if (el && !(input instanceof RadioNodeList)) el.setAttribute('aria-invalid', text ? 'true' : 'false');
      if (box) box.textContent = text || '';
      return !text;
    };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = (n) => (form.elements[n]?.value || '').trim();
      const phone = v('phone'), email = v('email');
      let ok = true;
      ok = err('name', v('name') ? '' : 'Please add your name.') && ok;
      ok = err('phone', phone || email ? '' : 'Add a phone number or an email, so we can reply.') && ok;
      ok = err('email', !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'That email doesn’t look right.') && ok;
      ok = err('service', v('service') ? '' : 'Pick the kind of clean you need.') && ok;
      if (!ok) { form.querySelector('[aria-invalid="true"], [data-error]:not(:empty)')?.closest('.field')?.querySelector('input, select, textarea')?.focus(); return; }
      const lines = [
        `Name: ${v('name')}`,
        phone && `Phone: ${phone}`,
        email && `Email: ${email}`,
        `Service: ${v('service')}`,
        v('often') && `How often: ${v('often')}`,
        v('place') && `Home or space: ${v('place')}`,
        v('area') && `Area or ZIP: ${v('area')}`,
        v('when') && `Best days and times: ${v('when')}`,
        v('message') && `\n${v('message')}`,
      ].filter(Boolean);
      const subject = `Quote request: ${v('service')}${v('area') ? ', ' + v('area') : ''}`;
      const url = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n') + '\n\nSent from the Callahan Cleaning website')}`;
      location.href = url;
      if (done) { done.hidden = false; done.focus(); }
    });
    form.querySelectorAll('input, select, textarea').forEach((el) => el.addEventListener('input', () => {
      if (el.getAttribute('aria-invalid') === 'true') err(el.name, '');
    }));
  }
})();
