// Browser checks for the Eleven Cafē site. Serve sites/eleven-cafe on port 8790, then:
//   NODE_PATH=$(npm root -g) node tests/behave.cjs [base URL]
// PAGES_ONLY=1 leaves out the opening (sections 1-3), for checking the pages before the pour is rendered;
// VIEWS=desk (or mob) times the opening in one layout only.
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8790/';
const PAGES = ['index.html', 'menu.html', 'story.html', 'visit.html'];
const PAGES_ONLY = !!process.env.PAGES_ONLY;
const results = [];
const ok = (name, pass, info = '') => { results.push(pass); console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${info ? '  ' + info : ''}`); };

(async () => {
  const launch = { executablePath: '/opt/pw-browsers/chromium' };
  if (process.env.HTTPS_PROXY && !BASE.includes('localhost')) launch.proxy = { server: process.env.HTTPS_PROXY };
  const b = await chromium.launch(launch);
  const errs = [];
  const watch = (p, tag) => {
    p.on('pageerror', (e) => errs.push(`${tag}: ${e.message}`));
    p.on('console', (m) => { if (m.type() === 'error') errs.push(`${tag}: ${m.text()}`); });
  };
  // record when the opening's stages happen, from navigation start
  const trackIntro = (p) => p.addInitScript(() => {
    // intro: whether html.intro was ever set; done: when it was removed again (never, if it was never set)
    // loopFrame: the loop's first frame on screen once playing; pourOff: when the pour was hidden
    window.__t = { intro: false, playing: null, opening: null, done: null, loop: null, loopFrame: null, pourOff: null };
    const watchRoot = (root) => {
      const see = () => {
        const t = performance.now();
        if (root.classList.contains('intro')) window.__t.intro = true;
        if (root.classList.contains('is-opening') && window.__t.opening === null) window.__t.opening = t;
        if (window.__t.intro && !root.classList.contains('intro') && window.__t.done === null) window.__t.done = t;
      };
      see();
      new MutationObserver(see).observe(root, { attributes: true });
    };
    // init scripts can run before <html> exists
    if (document.documentElement) watchRoot(document.documentElement);
    else new MutationObserver((_, o) => { if (document.documentElement) { o.disconnect(); watchRoot(document.documentElement); } }).observe(document, { childList: true });
    document.addEventListener('DOMContentLoaded', () => {
      const intro = document.querySelector('.hero__intro');
      if (intro) intro.addEventListener('playing', () => { if (window.__t.playing === null) window.__t.playing = performance.now(); });
      if (intro) new MutationObserver(() => { if (!intro.classList.contains('is-on') && window.__t.playing !== null && window.__t.pourOff === null) window.__t.pourOff = performance.now(); }).observe(intro, { attributes: true });
      const loop = document.querySelector('.hero__loop');
      if (loop) loop.addEventListener('playing', () => { if (window.__t.loop === null) window.__t.loop = performance.now(); });
      // the first frame the loop puts on screen once playing (a preloaded loop can show its first frame long before)
      if (loop) loop.addEventListener('playing', () => loop.requestVideoFrameCallback?.(() => { if (window.__t.loopFrame === null) window.__t.loopFrame = performance.now(); }), { once: true });
    });
  });

  /* 1. the opening: the beats, in order, at the right times */
  if (!PAGES_ONLY) for (const [v, vp, mob] of [['desk', { width: 1440, height: 900 }, false], ['mob', { width: 390, height: 844 }, true]].filter(([v]) => !process.env.VIEWS || process.env.VIEWS.split(',').includes(v))) {
    const ctx = await b.newContext({ viewport: vp, isMobile: mob, hasTouch: mob });
    const p = await ctx.newPage(); watch(p, `intro ${v}`);
    await trackIntro(p);
    await p.goto(BASE);
    // while the pour plays: the wall, an opening around the cup, nothing else
    await p.waitForFunction(() => document.querySelector('.hero__intro')?.currentTime > 1.5, null, { timeout: 15000 });
    const mid = await p.evaluate(() => {
      const r = document.querySelector('.hero__edge').getBoundingClientRect();
      const nav = parseFloat(getComputedStyle(document.getElementById('nav')).opacity);
      const copy = parseFloat(getComputedStyle(document.querySelector('.hero__title')).opacity);
      const clip = getComputedStyle(document.getElementById('heroMedia')).clipPath;
      return { hole: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], vw: innerWidth, vh: innerHeight, nav, copy, clip: clip.slice(0, 60), src: document.querySelector('.hero__intro').currentSrc.split('/').pop() };
    });
    const [hx, hy, hw, hh] = mid.hole;
    const holeOk = hw > 150 && hh > 300 && hw < mid.vw * 0.9 && hh < mid.vh && hx >= 0 && hy >= 0 && hx + hw <= mid.vw;
    ok(`${v}: the pour plays through an opening in the dark wall, nothing else shows`, holeOk && mid.nav === 0 && mid.copy === 0 && /^inset/.test(mid.clip), JSON.stringify(mid));
    ok(`${v}: the ${mob ? 'portrait' : 'landscape'} render, WebM in this Chromium`, mid.src === `intro-${mob ? 'p' : 'l'}.webm`, mid.src);
    // then it opens into the site, and the steam carries on
    await p.waitForFunction(() => window.__t.done !== null && window.__t.loop !== null, null, { timeout: 15000 });
    await p.waitForTimeout(400);
    const end = await p.evaluate(() => ({ t: window.__t, clip: getComputedStyle(document.getElementById('heroMedia')).clipPath, nav: getComputedStyle(document.getElementById('nav')).opacity, copy: getComputedStyle(document.querySelector('.hero__title')).opacity, loopOn: document.querySelector('.hero__loop').classList.contains('is-on'), loopPlaying: !document.querySelector('.hero__loop').paused, pause: !document.getElementById('steamToggle').hidden }));
    const opensAt = end.t.opening - end.t.playing;
    ok(`${v}: it opens up into the site about 3.5 s into the pour`, opensAt > 3000 && opensAt < 4300 && /inset\(0px( 0px)*( round 0px)?\)|none/.test(end.clip) && end.nav === '1' && end.copy === '1', JSON.stringify({ opensAt: Math.round(opensAt), clip: end.clip, nav: end.nav, copy: end.copy }));
    ok(`${v}: the steam loop takes over, with a pause button`, end.loopOn && end.loopPlaying && end.pause && end.t.loop > end.t.opening, JSON.stringify({ loopAt: Math.round(end.t.loop), opening: Math.round(end.t.opening) }));
    ok(`${v}: no black frame at the hand-over: the pour stays up until the loop has a frame on screen`, end.t.loopFrame !== null && (end.t.pourOff === null || end.t.pourOff >= end.t.loopFrame), JSON.stringify({ loopFrame: Math.round(end.t.loopFrame), pourOff: Math.round(end.t.pourOff) }));
    // pause and play again
    await p.click('#steamToggle');
    await p.waitForTimeout(500);
    const paused = await p.evaluate(() => ({ paused: document.querySelector('.hero__loop').paused, pressed: document.getElementById('steamToggle').getAttribute('aria-pressed'), label: document.getElementById('steamToggle').getAttribute('aria-label') }));
    await p.click('#steamToggle'); await p.waitForTimeout(500);
    const again = await p.evaluate(() => !document.querySelector('.hero__loop').paused);
    ok(`${v}: the pause button stops the steam and starts it again`, paused.paused && paused.pressed === 'true' && paused.label === 'Play the steam' && again, JSON.stringify({ ...paused, again }));
    await ctx.close();
  }

  /* 2. when it plays: on opening and refresh, not coming back from inside the site */
  if (!PAGES_ONLY) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage(); watch(p, 'when');
    await trackIntro(p);
    await p.goto(BASE);
    await p.waitForFunction(() => window.__t.done !== null, null, { timeout: 15000 });
    await p.reload();
    ok('a refresh plays it again', await p.evaluate(() => window.__t.intro === true));
    await p.waitForFunction(() => window.__t.done !== null, null, { timeout: 15000 });
    await p.click('.nav__links a[href="menu.html"]'); await p.waitForURL('**/menu.html');
    await p.click('.wordmark'); await p.waitForURL((u) => /\/(index\.html)?$/.test(u.pathname));
    ok('back to home from another page: straight to the site', await p.evaluate(() => window.__t.intro === false && !document.documentElement.classList.contains('intro')));
    await ctx.close();
    const ctx2 = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p2 = await ctx2.newPage(); watch(p2, 'landing');
    await trackIntro(p2);
    await p2.goto(BASE + 'visit.html');
    await p2.click('.wordmark'); await p2.waitForURL((u) => /\/(index\.html)?$/.test(u.pathname));
    ok('first reaching home from another page: the pour plays', await p2.evaluate(() => window.__t.intro === true));
    await ctx2.close();
  }

  /* 3. no video, or a slow one: the site opens on the still, never stuck on the wall */
  if (!PAGES_ONLY) for (const how of ['fails', 'slow']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.route(/\/assets\/pour\/.*\.(webm|mp4)$/, (r) => (how === 'fails' ? r.abort() : setTimeout(() => r.continue().catch(() => {}), 6000)));
    const p = await ctx.newPage();
    await trackIntro(p);
    await p.goto(BASE);
    await p.waitForFunction(() => window.__t.done !== null, null, { timeout: 12000 }).catch(() => {});
    await p.waitForTimeout(1200);   // the still and the words fade in
    const r = await p.evaluate(() => ({ done: Math.round(window.__t.done), img: getComputedStyle(document.querySelector('.hero__media img')).opacity, title: getComputedStyle(document.querySelector('.hero__title')).opacity, clip: getComputedStyle(document.getElementById('heroMedia')).clipPath }));
    ok(`video ${how}: opens on the still within 3 s`, r.done !== null && r.done < 3200 && r.img === '1' && r.title === '1' && /none|inset\(0px\)/.test(r.clip), JSON.stringify(r));
    await ctx.close();
  }

  /* 4. reduced motion and 5. no JavaScript */
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    for (const path of PAGES) {
      const p = await ctx.newPage(); watch(p, `reduced ${path}`);
      await trackIntro(p);
      await p.goto(BASE + path); await p.waitForTimeout(800);
      const H = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < H; y += 600) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(40); }
      const r = await p.evaluate(() => ({ intro: !!window.__t.intro, videos: [...document.querySelectorAll('video')].filter((v) => !v.paused || v.currentSrc).length, hidden: [...document.querySelectorAll('h1, h2, h3, p, .btn, img')].filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99).length }));
      ok(`reduced motion ${path}: no pour, no video, everything shown`, !r.intro && r.videos === 0 && r.hidden === 0, JSON.stringify(r));
      await p.close();
    }
    await ctx.close();
    const nj = await b.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    for (const path of PAGES) {
      const p = await nj.newPage();
      await p.goto(BASE + path);
      const r = await p.evaluate(() => ({ hidden: [...document.querySelectorAll('h1, h2, h3, p, .btn, img')].filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99).length, tel: !!document.querySelector('a[href^="tel:"]') }));
      ok(`no JavaScript ${path}: everything readable, phone link live`, r.hidden === 0 && r.tel, JSON.stringify(r));
      await p.close();
    }
    await nj.close();
  }

  /* 6. open now, in Tucson time, at fixed moments of the week */
  {
    const cases = [
      ['2026-10-13T17:00:00Z', 'Open now, until 2pm', 2],      // Tuesday 10am in Tucson
      ['2026-10-13T13:00:00Z', 'Opens today at 7am', 2],       // Tuesday 6am
      ['2026-10-14T21:00:00Z', 'Opens tomorrow at 7am', 3],    // Wednesday 2pm, just closed
      ['2026-10-16T22:00:00Z', 'Opens Monday at 7am', 5],      // Friday 3pm
      ['2026-10-17T20:00:00Z', 'Opens Monday at 7am', 6],      // Saturday 1pm
      ['2026-10-18T16:00:00Z', 'Opens tomorrow at 7am', 0],    // Sunday 9am
      ['2026-10-19T14:00:00Z', 'Open now, until 2pm', 1],      // Monday 7am, just opened
    ];
    const ctx = await b.newContext();
    const bad = [];
    for (const [iso, want, dow] of cases) {
      const p = await ctx.newPage();
      await p.clock.setFixedTime(new Date(iso));
      await p.goto(BASE + 'visit.html');
      const r = await p.evaluate(() => ({ s: document.querySelector('[data-status]').textContent, today: document.querySelector('.hours .is-today')?.dataset.day }));
      if (r.s !== want || +r.today !== dow) bad.push(`${iso}: "${r.s}" today=${r.today}, wanted "${want}" ${dow}`);
      await p.close();
    }
    ok('open-now status and today\'s row, seven moments of the week', !bad.length, bad.join('; '));
    await ctx.close();
  }

  /* 7. type: the Vietnamese and the macron come from the site's fonts */
  {
    const ctx = await b.newContext();
    const p = await ctx.newPage();
    await p.goto(BASE + 'menu.html'); await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(async () => {
      await document.fonts.load('400 40px Playfair', 'Cà phê sữa đá Cafē');
      await document.fonts.load('400 16px "Be Vietnam Pro"', 'Cafē');
      const used = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.unicodeRange.slice(0, 10)}`);
      return { pf: document.fonts.check('400 40px Playfair', 'ữđ'), bvp: document.fonts.check('400 16px "Be Vietnam Pro"', 'ē'), used };
    });
    ok('Cà phê sữa đá and Cafē render in the site\'s own fonts', r.pf && r.bvp && r.used.some((u) => /^Playfair U\+0?102/.test(u)), JSON.stringify(r));
    await ctx.close();
  }

  /* 8. taps, menu, overflow */
  for (const [v, vp, mob] of [['desk', { width: 1440, height: 900 }, false], ['mob', { width: 390, height: 844 }, true]]) {
    const ctx = await b.newContext({ viewport: vp, isMobile: mob, hasTouch: mob });
    for (const path of PAGES) {
      const p = await ctx.newPage(); watch(p, `${v} ${path}`);
      await p.goto(BASE + path + (path === 'index.html' ? '?skip' : ''));
      await p.waitForTimeout(1000);
      const r = await p.evaluate(() => {
        const out = [];
        document.querySelectorAll('.nav a, #navToggle, main .btn, main .link, .line, #steamToggle:not([hidden])').forEach((el) => {
          if (!el.closest('.nav')) el.scrollIntoView({ block: 'center', behavior: 'instant' });
          const s = getComputedStyle(el); const r = el.getBoundingClientRect();
          if (!r.width || s.display === 'none' || s.visibility === 'hidden') return;
          const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
          const pts = el.classList.contains('link') ? [cy - 21, cy + 21] : [cy];
          pts.forEach((y) => { const h = document.elementFromPoint(cx, y); if (!el.contains(h)) out.push(`${(el.textContent.trim() || el.getAttribute('aria-label')).slice(0, 24)} under ${h?.className?.baseVal ?? h?.className ?? h}`); });
          if (!el.classList.contains('link') && r.height < 44) out.push(`${el.textContent.trim().slice(0, 20)} ${Math.round(r.height)}px`);
        });
        return { out, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      ok(`${v} ${path}: every control tappable (44px+), nothing wider than the screen`, !r.out.length && !r.overflow, r.out.join('; ') + (r.overflow ? ' OVERFLOW' : ''));
      if (mob) {
        await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
        await p.tap('#navToggle'); await p.waitForTimeout(400);
        const m = await p.evaluate(() => {
          const els = [...document.querySelectorAll('#menu a, #menu button')];
          const bad = els.filter((a) => { const r = a.getBoundingClientRect(); const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !r.width || !a.contains(h) || r.height < 44; }).map((a) => a.textContent.trim());
          return { n: els.length, bad, current: document.querySelector('#menu a[aria-current="page"]')?.textContent, focus: document.activeElement?.id };
        });
        ok(`mob ${path}: the menu opens with every link tappable, focus inside`, m.n >= 7 && !m.bad.length && m.focus === 'menuClose', JSON.stringify(m));
        await p.keyboard.press('Escape'); await p.waitForTimeout(350);
        ok(`mob ${path}: Escape closes it`, await p.evaluate(() => document.getElementById('menu').hidden));
      }
      await p.close();
    }
    await ctx.close();
  }

  /* 9. share tags, structured data, files and links */
  {
    const ctx = await b.newContext();
    const p = await ctx.newPage();
    const titles = new Set();
    for (const path of PAGES) {
      await p.goto(BASE + path + (path === 'index.html' ? '?skip' : ''));
      const m = await p.evaluate(() => {
        const q = (s, a = 'content') => document.querySelector(s)?.getAttribute(a) || '';
        let ld = null; try { ld = JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent || 'null'); } catch { ld = 'bad'; }
        return { title: document.title, desc: q('meta[name="description"]'), url: q('meta[property="og:url"]'), canon: q('link[rel="canonical"]', 'href'), img: q('meta[property="og:image"]'), tw: q('meta[name="twitter:image"]'), robots: q('meta[name="robots"]'), h1: document.querySelectorAll('h1').length, ld };
      });
      const want = 'https://korvane11.github.io/Korvane/sites/eleven-cafe/' + (path === 'index.html' ? '' : path);
      const good = m.url === want && m.canon === want && /^https:\/\//.test(m.img) && m.tw === m.img && m.desc.length > 60 && m.desc.length < 170 && !titles.has(m.title) && m.h1 === 1 && m.robots === 'noindex';
      titles.add(m.title);
      ok(`${path}: share tags, one h1, noindex for now`, good, `"${m.title}" desc ${m.desc.length}`);
      if (path === 'index.html') {
        const ld = m.ld; const h = ld?.openingHoursSpecification?.[0];
        ok('structured data matches the facts on the page', ld && ld['@type'] === 'CafeOrCoffeeShop' && ld.telephone === '+1-520-624-8852' && ld.address.streetAddress === '33 N Stone Ave, Suite 150' && ld.address.postalCode === '85701' && h.opens === '07:00' && h.closes === '14:00' && h.dayOfWeek.length === 5, ld?.name);
      }
    }
    for (const f of ['assets/brand/og.jpg', 'assets/brand/favicon.ico', 'assets/brand/apple-touch-icon.png', 'assets/brand/icon-192.png', 'assets/brand/icon-512.png', 'assets/brand/site.webmanifest', 'assets/brand/wordmark.svg',
      'assets/pour/intro-l.mp4', 'assets/pour/intro-l.webm', 'assets/pour/loop-l.mp4', 'assets/pour/loop-l.webm', 'assets/pour/intro-p.mp4', 'assets/pour/intro-p.webm', 'assets/pour/loop-p.mp4', 'assets/pour/loop-p.webm']) {
      const r = await ctx.request.get(BASE + f);
      ok(`${f} served`, r.status() === 200, String(r.status()));
    }
    const all = new Set();
    for (const path of PAGES) {
      await p.goto(BASE + path + (path === 'index.html' ? '?skip' : ''));
      (await p.evaluate(() => [...document.querySelectorAll('a[href], img[src], source[srcset], link[href]')].flatMap((e) => (e.getAttribute('srcset') ? e.getAttribute('srcset').split(',').map((x) => new URL(x.trim().split(' ')[0], location.href).href) : [e.href || e.src])))).forEach((h) => all.add(h));
    }
    const dead = [];
    for (const h of all) {
      if (!h.startsWith(BASE)) continue;
      const [file, hash] = h.slice(BASE.length).split('#');
      const r = await ctx.request.get(BASE + file.split('?')[0]);
      if (r.status() >= 400) { dead.push(`${r.status()} ${h}`); continue; }
      if (hash && !(await r.text()).includes(`id="${hash}"`)) dead.push(`no #${hash} in ${file || 'index'}`);
    }
    ok('every internal link, image and anchor resolves', !dead.length, `${[...all].filter((h) => h.startsWith(BASE)).length} checked${dead.length ? ': ' + dead.join(', ') : ''}`);
    await ctx.close();
  }

  await b.close();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  console.log(`${results.filter(Boolean).length}/${results.length} passed`);
  process.exit(results.every(Boolean) && !errs.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
