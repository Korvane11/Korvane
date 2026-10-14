// Browser checks for the Callahan Cleaning site. Serve sites/callahan-cleaning on port 8800, then:
//   NODE_PATH=$(npm root -g) node tests/behave.cjs [base URL]
// PAGES_ONLY=1 leaves out the opening (section 1), for checking the pages before the film is rendered.
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8800/';
const PAGES = ['index.html', 'services.html', 'about.html', 'book.html'];
const PAGES_ONLY = !!process.env.PAGES_ONLY;
const results = [];
const ok = (name, pass, info = '') => { results.push(pass); console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${info ? '  ' + info : ''}`); };
const VIEWS = [['desk', { width: 1440, height: 900 }, false], ['mob', { width: 390, height: 844 }, true]];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = [];
  const watch = (p, tag) => {
    p.on('pageerror', (e) => errs.push(`${tag}: ${e.message}`));
    p.on('console', (m) => { if (m.type() === 'error') errs.push(`${tag}: ${m.text()}`); });
  };
  // when the opening's stages happen, from navigation start
  const trackIntro = (p) => p.addInitScript(() => {
    window.__t = { intro: false, playing: null, mark: null, out: null, done: null, loop: null, loopFrame: null, filmOff: null, atPlay: null };
    const watchRoot = (root) => {
      const see = () => {
        const t = performance.now(), c = root.classList;
        if (c.contains('intro')) window.__t.intro = true;
        if (c.contains('is-mark') && window.__t.mark === null) window.__t.mark = t;
        if (c.contains('is-out') && window.__t.out === null) window.__t.out = t;
        if (window.__t.intro && !c.contains('intro') && window.__t.done === null) window.__t.done = t;
      };
      see();
      new MutationObserver(see).observe(root, { attributes: true });
    };
    if (document.documentElement) watchRoot(document.documentElement);
    else new MutationObserver((_, o) => { if (document.documentElement) { o.disconnect(); watchRoot(document.documentElement); } }).observe(document, { childList: true });
    document.addEventListener('DOMContentLoaded', () => {
      const intro = document.querySelector('.hero__intro');
      const op = (sel) => parseFloat(getComputedStyle(document.querySelector(sel)).opacity);
      if (intro) intro.addEventListener('playing', () => {
        if (window.__t.playing !== null) return;
        window.__t.playing = performance.now();
        window.__t.atPlay = { head: op('.site-head'), copy: op('.hero__copy > h1'), mark: op('.opening__mark') };
      });
      if (intro) new MutationObserver(() => { if (!intro.classList.contains('is-on') && window.__t.playing !== null && window.__t.filmOff === null) window.__t.filmOff = performance.now(); }).observe(intro, { attributes: true });
      const loop = document.querySelector('.hero__loop');
      if (loop) loop.addEventListener('playing', () => {
        if (window.__t.loop === null) window.__t.loop = performance.now();
        loop.requestVideoFrameCallback?.(() => { if (window.__t.loopFrame === null) window.__t.loopFrame = performance.now(); });
      }, { once: true });
    });
  });

  /* 1. the opening */
  if (!PAGES_ONLY) for (const [v, vp, mob] of VIEWS) {
    const ctx = await b.newContext({ viewport: vp, isMobile: mob, hasTouch: mob });
    const p = await ctx.newPage(); watch(p, `intro ${v}`);
    await trackIntro(p);
    try {
      await p.goto(BASE);
      await p.waitForFunction(() => window.__t.playing !== null, null, { timeout: 15000 });
      const start = await p.evaluate(() => ({ atPlay: window.__t.atPlay, src: document.querySelector('.hero__intro').currentSrc.split('/').pop() }));
      ok(`${v}: the film starts with nothing over it (no nav, no words, no logo yet)`, start.atPlay.head === 0 && start.atPlay.copy === 0 && start.atPlay.mark === 0, JSON.stringify(start.atPlay));
      ok(`${v}: the ${mob ? 'portrait' : 'landscape'} film, WebM in this Chromium`, start.src === `intro-${mob ? 'p' : 'l'}.webm`, start.src);
      await p.waitForFunction(() => window.__t.mark !== null, null, { timeout: 8000 });
      await p.waitForTimeout(2100);   // the sparkles light one by one
      const mark = await p.evaluate(() => ({
        after: Math.round(window.__t.mark - window.__t.playing),
        logo: getComputedStyle(document.querySelector('.opening__mark')).opacity,
        stars: [...document.querySelectorAll('.opening__stars path')].map((s) => getComputedStyle(s).opacity),
      }));
      ok(`${v}: the logo comes up as the light floods in, and its three sparkles light`, mark.after > 1300 && mark.after < 1900 && mark.logo === '1' && mark.stars.length === 3 && mark.stars.every((o) => o === '1'), JSON.stringify(mark));
      await p.waitForFunction(() => window.__t.out !== null && window.__t.loop !== null, null, { timeout: 15000 });
      await p.waitForTimeout(1600);
      const end = await p.evaluate(() => ({
        outAfter: Math.round(window.__t.out - window.__t.playing), loopAfter: Math.round(window.__t.loop - window.__t.playing),
        head: getComputedStyle(document.querySelector('.site-head')).opacity, h1: getComputedStyle(document.querySelector('.hero h1')).opacity,
        opening: getComputedStyle(document.querySelector('.opening')).opacity,
        loopOn: document.querySelector('.hero__loop').classList.contains('is-on'), loopPlaying: !document.querySelector('.hero__loop').paused,
        toggle: !document.getElementById('motionToggle').hidden, loopFrame: window.__t.loopFrame, filmOff: window.__t.filmOff,
      }));
      ok(`${v}: the logo clears and the page comes in about 3.5 s in`, end.outAfter > 3200 && end.outAfter < 4000 && end.head === '1' && end.h1 === '1' && end.opening === '0', JSON.stringify({ outAfter: end.outAfter, head: end.head, h1: end.h1, opening: end.opening }));
      ok(`${v}: the loop takes over at the end of the film, with a pause button`, end.loopOn && end.loopPlaying && end.toggle && end.loopAfter > 3800, `loopAfter ${end.loopAfter}`);
      ok(`${v}: no black frame at the hand-over (the film stays up until the loop has a frame on screen)`, end.loopFrame !== null && (end.filmOff === null || end.filmOff >= end.loopFrame), JSON.stringify({ loopFrame: Math.round(end.loopFrame), filmOff: Math.round(end.filmOff) }));
      await p.click('#motionToggle'); await p.waitForTimeout(400);
      const paused = await p.evaluate(() => ({ paused: document.querySelector('.hero__loop').paused, pressed: document.getElementById('motionToggle').getAttribute('aria-pressed') }));
      await p.click('#motionToggle'); await p.waitForTimeout(400);
      const resumed = await p.evaluate(() => !document.querySelector('.hero__loop').paused);
      ok(`${v}: the pause button stops and restarts the loop`, paused.paused && paused.pressed === 'true' && resumed, JSON.stringify({ ...paused, resumed }));
      // back to home from another page of the site: no opening
      await p.goto(BASE + 'services.html'); await p.waitForTimeout(300);
      await p.click('.site-head .brand').catch(() => {});
      if (mob) await p.goto(BASE, { referer: BASE + 'services.html' });
      await p.waitForLoadState('load'); await p.waitForTimeout(600);
      const back = await p.evaluate(() => ({ intro: document.documentElement.classList.contains('intro'), h1: getComputedStyle(document.querySelector('.hero h1')).opacity }));
      ok(`${v}: coming back to home from another page skips the opening`, !back.intro && back.h1 === '1', JSON.stringify(back));
    } catch (e) { ok(`${v}: the opening ran`, false, e.message.split('\n')[0]); }
    await ctx.close();
  }
  // ?skip, and a film that never comes: the still and the words within 2.5 s
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage(); watch(p, 'skip');
    await p.goto(BASE + '?skip'); await p.waitForTimeout(400);
    const s = await p.evaluate(() => ({ intro: document.documentElement.classList.contains('intro'), h1: getComputedStyle(document.querySelector('.hero h1')).opacity }));
    ok('?skip: no opening, the words are up at once', !s.intro && s.h1 === '1', JSON.stringify(s));
    await p.route('**/assets/film/*.{webm,mp4}', (r) => r.abort());
    const p2 = await ctx.newPage();
    await p2.route('**/assets/film/*.{webm,mp4}', (r) => r.abort());
    await p2.goto(BASE + '?intro'); await p2.waitForTimeout(3600);
    const f = await p2.evaluate(() => ({ h1: getComputedStyle(document.querySelector('.hero h1')).opacity, still: document.querySelector('.hero__still').naturalWidth }));
    ok('no film (blocked): the page opens on the still with its words', f.h1 === '1' && f.still > 0, JSON.stringify(f));
    await ctx.close();
  }

  /* 2. every page, desktop and phone */
  for (const [v, vp, mob] of VIEWS) {
    const ctx = await b.newContext({ viewport: vp, isMobile: mob, hasTouch: mob });
    const p = await ctx.newPage(); watch(p, `pages ${v}`);
    for (const pg of PAGES) {
      await p.goto(BASE + pg + '?skip', { waitUntil: 'load' }); await p.waitForTimeout(500);
      const info = await p.evaluate(async () => {
        const h = document.documentElement.scrollHeight;
        for (let y = 0; y <= h; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); }
        await new Promise((r) => setTimeout(r, 1400));
        const imgs = [...document.images].filter((i) => i.loading !== 'lazy' || i.complete);
        return {
          over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          h1: document.querySelectorAll('h1').length,
          title: document.title, desc: document.querySelector('meta[name=description]')?.content || '',
          canon: document.querySelector('link[rel=canonical]')?.href || '', og: document.querySelector('meta[property="og:image"]')?.content || '',
          noindex: document.querySelector('meta[name=robots]')?.content,
          broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src.split('/').pop()),
          hidden: [...document.querySelectorAll('.reveal')].filter((e) => getComputedStyle(e).opacity !== '1').length,
          dashes: (document.body.innerText.match(/[–—]/g) || []).length,
        };
      });
      ok(`${v} ${pg}: no sideways scroll`, info.over <= 0, `${info.over}px`);
      ok(`${v} ${pg}: one h1, a title, a description, canonical, og:image, noindex`, info.h1 === 1 && info.title && info.desc.length > 60 && info.canon.endsWith(pg === 'index.html' ? '/callahan-cleaning/' : pg) && info.og.startsWith('https://') && info.noindex === 'noindex', JSON.stringify({ h1: info.h1, canon: info.canon.split('/').pop() }));
      ok(`${v} ${pg}: every image loads, everything has come in`, info.broken.length === 0 && info.hidden === 0, JSON.stringify({ broken: info.broken, hidden: info.hidden }));
      ok(`${v} ${pg}: no en or em dashes in the text`, info.dashes === 0, `${info.dashes}`);
      // tap targets on phones: every visible link and button at least 44 px tall (inline text links in paragraphs aside)
      if (mob) {
        const small = await p.evaluate(() => [...document.querySelectorAll('a, button, select, input:not([type=radio])')].filter((e) => {
          const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
          if (!r.width || cs.visibility === 'hidden' || e.closest('.menu:not(.is-open)') || e.closest('p') || e.classList.contains('skip')) return false;
          return r.height < 44;
        }).map((e) => (e.textContent || e.name || e.className).trim().slice(0, 30)));
        ok(`${v} ${pg}: tap targets are 44 px or more`, small.length === 0, JSON.stringify(small));
      }
    }
    // the main controls answer at their centre (nothing laid over them), menu closed and open
    await p.goto(BASE + 'services.html', { waitUntil: 'load' }); await p.waitForTimeout(300);
    const sel = mob ? ['.menu-btn', '.site-head .brand', '.callbar a[href^="tel"]', '.callbar a[href="book.html"]'] : ['.nav a[href="services.html"]', '.nav a[href="about.html"]', '.nav a[href^="tel"]', '.nav .btn', '.site-head .brand'];
    const hits = await p.evaluate((sel) => sel.map((s) => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return [s, !!top && (top === e || e.contains(top))]; }), sel);
    ok(`${v}: the header${mob ? ' and the call bar' : ''} controls answer at their centre`, hits.every((h) => h[1]), JSON.stringify(hits.filter((h) => !h[1])));
    if (mob) {
      await p.click('.menu-btn'); await p.waitForTimeout(500);
      const m = await p.evaluate(() => ({ open: document.getElementById('menu').classList.contains('is-open'), exp: document.querySelector('.menu-btn').getAttribute('aria-expanded'), focus: document.activeElement.className,
        hits: [...document.querySelectorAll('#menu a, #menu button')].map((e) => { const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!t && (t === e || e.contains(t)); }) }));
      ok('mob: the menu opens over everything, focus on its close button, every link answers', m.open && m.exp === 'true' && m.focus.includes('menu__close') && m.hits.every(Boolean), JSON.stringify(m));
      await p.keyboard.press('Escape'); await p.waitForTimeout(500);
      const closed = await p.evaluate(() => !document.getElementById('menu').classList.contains('is-open') && getComputedStyle(document.getElementById('menu')).visibility === 'hidden');
      ok('mob: Escape closes it', closed);
      // the call bar: hidden over the home hero (its own buttons are there), up once past it
      await p.goto(BASE + '?skip', { waitUntil: 'load' }); await p.waitForTimeout(500);
      const atTop = await p.evaluate(() => document.querySelector('.callbar').getBoundingClientRect().top >= innerHeight - 2);
      await p.evaluate(() => scrollTo(0, innerHeight * 1.3)); await p.waitForTimeout(800);
      const past = await p.evaluate(() => document.querySelector('.callbar').getBoundingClientRect().bottom <= innerHeight + 1);
      ok('mob: the call bar waits below the hero, comes up past it', atTop && past, JSON.stringify({ atTop, past }));
      // hero buttons fit on a short phone
      const p2 = await ctx.newPage(); await p2.setViewportSize({ width: 375, height: 667 });
      await p2.goto(BASE + '?skip', { waitUntil: 'load' }); await p2.waitForTimeout(400);
      const fit = await p2.evaluate(() => [...document.querySelectorAll('.hero .actions .btn')].every((e) => e.getBoundingClientRect().bottom <= innerHeight));
      ok('mob 375x667: the hero buttons are on the first screen', fit);
      await p2.close();
    }
    await ctx.close();
  }

  /* 3. the quote form opens an email to Callahan with everything filled in */
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage(); watch(p, 'form');
    await p.goto(BASE + 'book.html', { waitUntil: 'load' });
    await p.click('#quoteForm button[type=submit]'); await p.waitForTimeout(200);
    const errors = await p.evaluate(() => [...document.querySelectorAll('[data-error]')].filter((e) => e.textContent).map((e) => e.dataset.error));
    ok('form: sent empty, it asks for a name, a way to reply and a service', ['name', 'phone', 'service'].every((n) => errors.includes(n)), JSON.stringify(errors));
    let mail = null;
    p.on('request', (r) => { if (r.url().startsWith('mailto:')) mail = r.url(); });
    await p.fill('#f-name', 'Test Visitor'); await p.fill('#f-phone', '520 555 0100'); await p.selectOption('#f-service', 'Deep cleaning');
    await p.check('input[name=often][value="Monthly"]', { force: true }); await p.fill('#f-place', '3 bed, 2 bath'); await p.fill('#f-area', '85710');
    await p.click('#quoteForm button[type=submit]'); await p.waitForTimeout(800);
    const body = mail ? decodeURIComponent(mail.split('body=')[1] || '') : '';
    const subj = mail ? decodeURIComponent((mail.split('subject=')[1] || '').split('&')[0]) : '';
    ok('form: filled in, it opens an email to callahan.cleaning74@gmail.com with every answer', !!mail && mail.startsWith('mailto:callahan.cleaning74@gmail.com?') && subj === 'Quote request: Deep cleaning, 85710' && /Name: Test Visitor/.test(body) && /How often: Monthly/.test(body) && /3 bed, 2 bath/.test(body), subj);
    const done = await p.evaluate(() => !document.getElementById('formDone').hidden);
    ok('form: and says what happens next', done);
    await ctx.close();
  }

  /* 4. reduced motion: no opening, no loop, everything shown */
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); watch(p, 'reduced');
    await p.goto(BASE, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    const r = await p.evaluate(() => ({ intro: document.documentElement.classList.contains('intro'), loopSrc: !!document.querySelector('.hero__loop').getAttribute('src'), h1: getComputedStyle(document.querySelector('.hero h1')).opacity, still: document.querySelector('.hero__still').naturalWidth, hidden: [...document.querySelectorAll('.reveal')].filter((e) => getComputedStyle(e).opacity !== '1').length }));
    ok('reduced motion: no opening, no video, the still and the words, everything shown', !r.intro && !r.loopSrc && r.h1 === '1' && r.still > 0 && r.hidden === 0, JSON.stringify(r));
    await ctx.close();
  }

  /* 5. no JavaScript: every page readable, links live */
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false, isMobile: true });
    const p = await ctx.newPage();
    for (const pg of PAGES) {
      await p.goto(BASE + pg, { waitUntil: 'load' });
      const r = await p.evaluate(() => ({ h1: getComputedStyle(document.querySelector('h1')).opacity, hidden: [...document.querySelectorAll('.reveal')].filter((e) => getComputedStyle(e).opacity !== '1').length, quote: !!document.querySelector('a[href="book.html"]'), tel: !!document.querySelector('a[href^="tel:"]') }));
      ok(`no JavaScript ${pg}: readable, with a quote link and the phone number`, r.h1 === '1' && r.hidden === 0 && r.quote && r.tel, JSON.stringify(r));
    }
    await ctx.close();
  }

  /* 6. links, structured data, hours */
  {
    const ctx = await b.newContext();
    const p = await ctx.newPage();
    const seen = new Set(), bad = [];
    for (const pg of PAGES) {
      await p.goto(BASE + pg, { waitUntil: 'load' });
      const hrefs = await p.evaluate(() => [...document.querySelectorAll('a[href], link[rel=icon], link[rel=apple-touch-icon], img[src], source[srcset]')].map((e) => e.href || e.src || e.srcset).filter((h) => h && h.startsWith(location.origin)));
      for (const h of hrefs) {
        const u = h.split('#')[0];
        if (seen.has(u)) continue; seen.add(u);
        const res = await ctx.request.get(u);
        if (res.status() !== 200) bad.push(`${pg} -> ${u.replace(BASE, '')} ${res.status()}`);
      }
      // in-page anchors resolve
      const anchors = await p.evaluate(() => [...document.querySelectorAll('a[href*="#"]')].map((a) => a.getAttribute('href')).filter((h) => !h.startsWith('http')));
      for (const a of anchors) {
        const [file, id] = a.split('#');
        if (!id) continue;
        await p.goto(BASE + (file || pg), { waitUntil: 'load' });
        if (!(await p.evaluate((id) => !!document.getElementById(id), id))) bad.push(`${pg}: ${a}`);
      }
    }
    ok(`every internal link, image and icon answers 200, every #anchor exists (${seen.size} checked)`, bad.length === 0, bad.join(', '));
    await p.goto(BASE, { waitUntil: 'load' });
    const ld = await p.evaluate(() => JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent));
    const shown = await p.evaluate(() => document.body.innerText);
    ok('structured data matches what the page shows (phone, email, hours)', ld.telephone === '+1-520-448-6169' && shown.includes('(520) 448-6169') && shown.includes(ld.email) && ld.openingHoursSpecification.length === 3 && shown.includes('7 am - 6 pm') && shown.includes('8 am - 3 pm'));
    const today = await p.evaluate(() => {
      const d = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Phoenix', weekday: 'long' }).format(new Date());
      const row = document.querySelector('[data-hours] tr.is-today th');
      return { d, row: row && row.textContent, status: document.querySelector('[data-status]').textContent };
    });
    ok("hours: today (Tucson time) is marked, with whether they're open", today.row === today.d && /^(Open now|Closed now)/.test(today.status), JSON.stringify(today));
    await ctx.close();
  }

  ok('no script errors or failed requests on any page', errs.length === 0, errs.slice(0, 6).join(' | '));
  await b.close();
  const pass = results.filter(Boolean).length;
  console.log(`\n${pass} of ${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
