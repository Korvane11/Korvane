// Pour My Coffee Co: behaviour checks in Chromium, desktop and phone.
// Serve the site first:  cd sites/pour-my-coffee && python3 -m http.server 8810
// Then:  NODE_PATH=$(npm root -g) node tests/behave.cjs     (PAGES_ONLY=1 leaves out the opening; VIEWS=desk|mob narrows it)
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8810/';
const PAGES = ['index', 'menu', 'location', 'about'];
const VIEWS = {
  desk: { viewport: { width: 1440, height: 900 } },
  mob: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};
const SHARE = 'https://korvane11.github.io/Korvane/sites/pour-my-coffee/';
let pass = 0, fail = 0;
const ok = (cond, name, extra = '') => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra); } };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const views = process.env.VIEWS ? process.env.VIEWS.split(',') : Object.keys(VIEWS);

  for (const vn of views) {
    const ctx = await b.newContext(VIEWS[vn]);
    // a fixed moment: Wednesday 2026-10-14, 9:30am in Tucson
    await ctx.addInitScript(() => { window.__now = new Date('2026-10-14T16:30:00Z'); });
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    p.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(BASE)) errors.push(`${r.status()} ${r.url()}`); });

    for (const pg of PAGES) {
      const tag = `${vn} ${pg}`;
      errors.length = 0;
      await p.goto(`${BASE}${pg}.html?skip`, { waitUntil: 'load' });
      await p.waitForTimeout(400);
      // 1. layout: no sideways scroll (scrollWidth against clientWidth, not innerWidth)
      const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(ov <= 0, `${tag}: no sideways scroll`, `overflow ${ov}px`);
      // 2. the basics: one h1, title, description, noindex, canonical and share tags pointing at the page itself
      const meta = await p.evaluate(() => ({
        h1: document.querySelectorAll('h1').length, title: document.title,
        desc: document.querySelector('meta[name=description]')?.content || '',
        robots: document.querySelector('meta[name=robots]')?.content,
        canon: document.querySelector('link[rel=canonical]')?.href, ogurl: document.querySelector('meta[property="og:url"]')?.content,
        ogimg: document.querySelector('meta[property="og:image"]')?.content,
        icons: [...document.querySelectorAll('link[rel~=icon], link[rel=apple-touch-icon], link[rel=manifest]')].map((l) => l.href),
      }));
      ok(meta.h1 === 1, `${tag}: one h1`, meta.h1);
      ok(meta.title.includes('Pour My Coffee Co') && meta.desc.length > 60, `${tag}: title and description`);
      ok(meta.robots === 'noindex', `${tag}: noindex until Pour approves`);
      const self = SHARE + (pg === 'index' ? '' : `${pg}.html`);
      ok(meta.canon === self && meta.ogurl === self, `${tag}: canonical and og:url`, meta.canon);
      ok(meta.ogimg === SHARE + 'assets/brand/og.jpg', `${tag}: absolute og:image`);
      for (const href of meta.icons) { const r = await p.request.get(href); ok(r.ok(), `${tag}: ${href.split('/').pop()} loads`); }
      // 3. no em or en dashes in anything a visitor reads
      const dash = await p.evaluate(() => (document.body.innerText + [...document.querySelectorAll('[alt],[aria-label]')].map((e) => e.getAttribute('alt') || e.getAttribute('aria-label')).join(' ') + document.title).match(/[–—]/g));
      ok(!dash, `${tag}: no em or en dashes`);
      // 4. images: alt text (or marked decorative), real files, sizes set
      const imgs = await p.evaluate(() => [...document.images].map((i) => ({ src: i.currentSrc || i.src, alt: i.getAttribute('alt'), w: i.getAttribute('width'), h: i.getAttribute('height') })));
      for (const i of imgs) {
        ok(i.alt !== null, `${tag}: alt on ${i.src.split('/').pop()}`);
        ok(i.w && i.h, `${tag}: width and height on ${i.src.split('/').pop()}`);
      }
      // 5. every internal link resolves (anchors included)
      const links = await p.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.href));
      for (const href of [...new Set(links)]) {
        if (!href.startsWith(BASE)) continue;
        const [u, hash] = href.split('#');
        const r = await p.request.get(u);
        ok(r.ok(), `${tag}: link ${href}`);
        if (hash) ok((await r.text()).includes(`id="${hash}"`), `${tag}: anchor #${hash} exists`);
      }
      // 6. external links point where they should
      const ext = links.filter((h) => !h.startsWith(BASE));
      ok(ext.every((h) => /^(tel:\+15208495359|mailto:PourMyCoffeeCo@gmail\.com|https:\/\/www\.google\.com\/maps\/|https:\/\/www\.instagram\.com\/pourmycoffeeco\/|https:\/\/www\.facebook\.com\/profile\.php\?id=100090196694802|https:\/\/x\.com\/PourMyCoffeeCo)/.test(h)), `${tag}: external links are theirs`, ext.filter((h) => !/^(tel|mailto|https:\/\/(www\.google|www\.instagram|www\.facebook|x\.com))/.test(h)).join(' '));
      // 7. the main controls: big enough to tap, and the topmost thing at their centre (nothing laid over them)
      const ctrls = await p.evaluate(() => [...document.querySelectorAll('.nav a, .nav button, .callbar a, main .btn, main .link, .socials a')]
        .filter((e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !e.closest('[hidden]'); })
        .map((e) => { e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { name: (e.textContent.trim() || e.getAttribute('aria-label') || '').slice(0, 30), w: r.width, h: r.height, top: !!t && (t === e || e.contains(t)), fixed: !!e.closest('.nav, .callbar') }; }));
      for (const c of ctrls) {
        ok(c.h >= 44 && c.w >= 44, `${tag}: "${c.name}" at least 44px`, `${Math.round(c.w)}x${Math.round(c.h)}`);
        ok(c.top || c.fixed, `${tag}: "${c.name}" not covered`);
      }
      // the call bar covers nothing it shouldn't: the last thing on the page clears it
      if (vn === 'mob') {
        const clear = await p.evaluate(() => { scrollTo(0, document.body.scrollHeight); const bar = document.querySelector('.callbar').getBoundingClientRect(); const last = [...document.querySelectorAll('.footer__small p')].pop().getBoundingClientRect(); return last.bottom <= bar.top + 1; });
        ok(clear, `${tag}: the footer ends above the call bar`);
      }
      // 8. today's row (the fixed moment is a Wednesday) and no "open now" claim while the hours are unconfirmed
      const today = await p.evaluate(() => [...document.querySelectorAll('tr.is-today th')].map((t) => t.textContent));
      if (pg === 'index' || pg === 'location') {
        ok(today.length === 1 && today[0] === 'Wednesday', `${tag}: today's row marked`, today.join());
        ok(await p.evaluate(() => [...document.querySelectorAll('[data-status]')].every((e) => e.hidden)), `${tag}: no open-now claim`);
      }
      ok(errors.length === 0, `${tag}: no console errors or missing files`, errors.join(' | '));
    }

    // 9. the phone menu: opens, takes focus, keeps it, closes with Escape and gives focus back
    if (vn === 'mob') {
      await p.goto(`${BASE}menu.html`);
      await p.click('#navToggle');
      await p.waitForTimeout(350);
      ok(await p.evaluate(() => !document.getElementById('menu').hidden && document.activeElement.id === 'menuClose'), 'mob: menu opens with focus on close');
      const links = await p.evaluate(() => [...document.querySelectorAll('#menu nav a')].map((a) => { const r = a.getBoundingClientRect(); const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return t === a && r.height >= 44; }));
      ok(links.length === 4 && links.every(Boolean), 'mob: menu links tappable', links.join());
      for (let i = 0; i < 8; i++) await p.keyboard.press('Tab');
      ok(await p.evaluate(() => document.getElementById('menu').contains(document.activeElement)), 'mob: focus stays in the menu');
      await p.keyboard.press('Escape');
      await p.waitForTimeout(350);
      ok(await p.evaluate(() => document.getElementById('menu').hidden && document.activeElement.id === 'navToggle'), 'mob: Escape closes, focus back on the toggle');
    }

    // 10. the forms: empty and bad input stop with messages; good input opens a mailto to Pour, read from the request
    for (const [pg, sel, fill, subj] of [
      ['location', 'form[data-mailto=note]', { '#note-name': 'Test Visitor', '#note-email': 'test@example.com', '#note-msg': 'Hello from the test.' }, 'Message from the website: Test Visitor'],
      ['about', 'form[data-mailto=job]', { '#job-first': 'Test', '#job-last': 'Applicant', '#job-email': 'test@example.com', '#job-msg': 'I would like to apply.' }, 'Job application: Test Applicant'],
    ]) {
      await p.goto(`${BASE}${pg}.html`);
      const mails = [];
      const onReq = (r) => { if (r.url().startsWith('mailto:')) mails.push(r.url()); };
      p.on('request', onReq);
      await p.click(`${sel} button[type=submit]`);
      await p.waitForTimeout(200);
      const errs = await p.evaluate((s) => [...document.querySelectorAll(`${s} .err`)].filter((e) => e.textContent).length, sel);
      ok(errs === Object.keys(fill).length, `${vn} ${pg}: empty form shows every message`, errs);
      ok(await p.evaluate((s) => document.activeElement === document.querySelector(`${s} input, ${s} textarea`), sel), `${vn} ${pg}: focus on the first problem`);
      for (const [k, v] of Object.entries(fill)) await p.fill(k, v);
      await p.fill(Object.keys(fill).find((k) => k.endsWith('email')), 'not-an-email');
      await p.click(`${sel} button[type=submit]`);
      await p.waitForTimeout(200);
      ok(mails.length === 0, `${vn} ${pg}: a bad email address is stopped`);
      await p.fill(Object.keys(fill).find((k) => k.endsWith('email')), 'test@example.com');
      await p.click(`${sel} button[type=submit]`);
      await p.waitForTimeout(500);
      p.off('request', onReq);
      const m = mails[0] || '';
      ok(m.startsWith('mailto:PourMyCoffeeCo@gmail.com?') && decodeURIComponent(m).includes(`subject=${subj}`) && decodeURIComponent(m).includes('test@example.com'), `${vn} ${pg}: mailto to Pour with the message`, m.slice(0, 120));
      ok(await p.evaluate((s) => document.querySelector(`${s} .status`).textContent.includes('PourMyCoffeeCo@gmail.com'), sel), `${vn} ${pg}: status line after sending`);
    }
    await ctx.close();
  }

  // 11. structured data matches the visible facts
  {
    const ctx = await b.newContext(); const p = await ctx.newPage();
    await p.goto(`${BASE}index.html?skip`);
    const ld = await p.evaluate(() => JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent));
    const text = await p.evaluate(() => document.body.innerText);
    ok(ld['@type'] === 'CafeOrCoffeeShop' && ld.telephone === '+1-520-849-5359' && text.includes('520-849-5359'), 'structured data: phone');
    ok(ld.address.streetAddress === '9136 E Valencia Rd, Ste 160' && text.includes('9136 E Valencia Rd, Ste 160') && ld.address.postalCode === '85747', 'structured data: address');
    ok(!ld.openingHoursSpecification, 'structured data: no hours until Pour confirms them');
    await ctx.close();
  }

  // 12. without JavaScript: every section readable, links live
  {
    const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage();
    for (const pg of PAGES) {
      await p.goto(`${BASE}${pg}.html`);
      const hidden = await p.evaluate(() => [...document.querySelectorAll('main *')].filter((e) => e.children.length === 0 && e.textContent.trim() && getComputedStyle(e).opacity === '0').length);
      ok(hidden === 0, `no JS ${pg}: nothing left invisible`, hidden);
      if (pg === 'index') ok(await p.evaluate(() => { const i = document.querySelector('.hero picture img'); return getComputedStyle(i.closest('picture')).opacity === '1'; }), 'no JS: the hero still shows');
    }
    await ctx.close();
  }

  // 13. the opening
  if (!process.env.PAGES_ONLY) {
    for (const vn of views) {
      const ctx = await b.newContext(VIEWS[vn]); const p = await ctx.newPage();
      const errors = []; p.on('pageerror', (e) => errors.push(e.message));
      await p.goto(`${BASE}index.html`);
      ok(await p.evaluate(() => document.documentElement.classList.contains('intro')), `${vn} opening: plays on a fresh open`);
      const want = vn === 'mob' ? 'intro-p.webm' : 'intro-l.webm';   // Playwright's Chromium has no H.264: it gets the WebM
      await p.waitForFunction(() => document.querySelector('.hero__intro.is-on'), null, { timeout: 4000 }).catch(() => {});
      ok(await p.evaluate((w) => (document.querySelector('.hero__intro').currentSrc || '').endsWith(w), want), `${vn} opening: the ${want}`);
      // the words come in by 2.5 s, beside the cup and clear of it
      await p.waitForTimeout(2300);
      const copy = await p.evaluate(() => ({ lit: document.documentElement.classList.contains('is-lit'), op: getComputedStyle(document.querySelector('.hero h1')).opacity, btn: (() => { const a = document.querySelector('.hero .btn--fill'); const r = a.getBoundingClientRect(); const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return t === a || a.contains(t); })() }));
      ok(copy.lit && +copy.op > 0.95, `${vn} opening: headline showing by 2.5 s`, JSON.stringify(copy));
      ok(copy.btn, `${vn} opening: Get directions clickable during the pour`);
      // the hand-over: the loop takes over without a gap, the intro class goes
      await p.waitForFunction(() => document.querySelector('.hero__loop.is-on'), null, { timeout: 8000 }).catch(() => {});
      ok(await p.evaluate(() => document.querySelector('.hero__loop.is-on') && !document.querySelector('.hero__loop').paused), `${vn} opening: the steam loops after the pour`);
      ok(await p.evaluate(() => !document.documentElement.classList.contains('intro')), `${vn} opening: done`);
      // the loop pauses off screen and with the button
      await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(500);
      ok(await p.evaluate(() => document.querySelector('.hero__loop').paused), `${vn} opening: the loop pauses off screen`);
      await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(500);
      ok(await p.evaluate(() => !document.querySelector('.hero__loop').paused), `${vn} opening: and plays again on screen`);
      await p.click('#steamToggle'); await p.waitForTimeout(200);
      ok(await p.evaluate(() => document.querySelector('.hero__loop').paused && document.getElementById('steamToggle').getAttribute('aria-pressed') === 'true'), `${vn} opening: the pause button`);
      // coming back from another page of the site: no second pour
      await p.goto(`${BASE}menu.html`);
      await p.click('a.logo');
      await p.waitForLoadState('load');
      ok(await p.evaluate(() => !document.documentElement.classList.contains('intro')), `${vn} opening: not again when coming back from the menu`);
      ok(errors.length === 0, `${vn} opening: no errors`, errors.join(' | '));
      await ctx.close();
    }
    // reduced motion and data saver: no opening, no video at all
    for (const opt of [{ reducedMotion: 'reduce' }]) {
      const ctx = await b.newContext({ ...opt, viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
      const vids = []; p.on('request', (r) => { if (/\.(webm|mp4)$/.test(r.url())) vids.push(r.url()); });
      await p.goto(`${BASE}index.html`); await p.waitForTimeout(1500);
      ok(await p.evaluate(() => !document.documentElement.classList.contains('intro') && getComputedStyle(document.querySelector('.hero h1')).opacity === '1'), 'reduced motion: no opening, the words at once');
      ok(vids.length === 0, 'reduced motion: no video loads', vids.join());
      await ctx.close();
    }
  }

  await b.close();
  console.log(`\n${pass} of ${pass + fail} passed`);
  process.exit(fail ? 1 : 0);
})();
