// Behaviour checks for the RC Cleaning site (55). Serve sites/rc-cleaning on
// port 8780, then: NODE_PATH=$(npm root -g) node tests/behave.cjs [base URL]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8780/';
const PAGES = ['index.html', 'book-online.html', 'about.html', 'hours.html'];
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
    p.on('requestfailed', (r) => { if (!r.url().startsWith('mailto:')) errs.push(`${tag}: failed ${r.url()}`); });
  };
  const trackWipe = (p) => p.addInitScript(() => {
    window.__wiped = false; window.__open = null;
    document.addEventListener('DOMContentLoaded', () => {
      const sq = document.querySelector('.squeegee');
      if (sq) new MutationObserver(() => { if (sq.style.display === 'block') window.__wiped = true; }).observe(sq, { attributes: true });
      new MutationObserver(() => { if (!document.documentElement.classList.contains('wipe-pending') && window.__open === null) window.__open = performance.now(); }).observe(document.documentElement, { attributes: true });
    });
  });

  /* 1. the wipe: on opening, on refresh, not when coming back from inside the site */
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage(); watch(p, 'wipe');
    await trackWipe(p);
    await p.goto(BASE);
    await p.waitForFunction(() => window.__open !== null, null, { timeout: 15000 });
    await p.waitForTimeout(2200);
    let r = await p.evaluate(() => ({ wiped: window.__wiped, open: Math.round(window.__open), haze: getComputedStyle(document.querySelector('.hero__haze')).display, copy: getComputedStyle(document.querySelector('.hero__title')).opacity }));
    ok('opening the site plays the wipe', r.wiped && r.haze === 'none' && r.copy === '1', JSON.stringify(r));
    await p.reload();
    await p.waitForFunction(() => window.__open !== null, null, { timeout: 15000 });
    r = await p.evaluate(() => ({ wiped: window.__wiped }));
    ok('a refresh plays it again', r.wiped, JSON.stringify(r));
    await p.waitForTimeout(2500);
    await p.click('.nav__links a[href="about.html"]');
    await p.waitForURL('**/about.html');
    await p.click('.nav__links a[href="index.html"]');
    await p.waitForURL((u) => /\/(index\.html)?$/.test(u.pathname));
    await p.waitForFunction(() => window.__open !== null, null, { timeout: 15000 });
    r = await p.evaluate(() => ({ wiped: window.__wiped, open: Math.round(window.__open) }));
    ok('back to home from another page: no second wipe', !r.wiped, JSON.stringify(r));
    await ctx.close();
    // landing on an inner page first still gets the wipe on reaching home
    const ctx2 = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p2 = await ctx2.newPage(); watch(p2, 'landing');
    await trackWipe(p2);
    await p2.goto(BASE + 'hours.html');
    await p2.click('.nav__links a[href="index.html"]');
    await p2.waitForFunction(() => window.__open !== null, null, { timeout: 15000 });
    r = await p2.evaluate(() => ({ wiped: window.__wiped }));
    ok('first reaching home from another page: the wipe plays', r.wiped, JSON.stringify(r));
    await ctx2.close();
  }

  /* 2. forms open the email app with everything filled in */
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const cases = [
      ['hours.html', '#msg', { name: 'Dan Whitaker', email: 'dan@example.com', message: 'Do you clean on Sundays?' }, {}, 'Message from Dan Whitaker'],
      ['hours.html', '#msg', { name: 'Marisol Reyes', email: 'marisol@example.com', subject: 'Move-out clean', message: 'Two bedroom apartment near Reid Park, end of the month.' }, {}, 'Move-out clean'],
      ['book-online.html', '#req', { name: 'Lena Ortiz', phone: '520-555-0142', when: 'Weekday mornings', where: 'Speedway and Campbell', notes: 'Office, about 2,000 sq ft' }, { service: 'Commercial cleaning' }, 'Free consultation request: Commercial cleaning (Lena Ortiz)'],
    ];
    for (const [path, sel, fields, selects, subject] of cases) {
      const p = await ctx.newPage(); watch(p, path);
      let mail = null;
      p.on('request', (r) => { if (r.url().startsWith('mailto:')) mail = r.url(); });
      await p.goto(BASE + path); await p.waitForTimeout(600);
      const form = p.locator(sel);
      await form.locator('button[type="submit"]').click();
      await p.waitForTimeout(200);
      const early = mail;
      for (const [k, v] of Object.entries(fields)) await form.locator(`[name="${k}"]`).fill(v);
      for (const [k, v] of Object.entries(selects)) await form.locator(`select[name="${k}"]`).selectOption({ label: v });
      await form.locator('button[type="submit"]').click();
      await p.waitForTimeout(400);
      const sent = await p.evaluate((s) => !document.querySelector(`${s} .form__sent`).hidden, sel);
      if (!mail) { ok(`${path} form sends`, false, 'no mailto'); await p.close(); continue; }
      const u = new URL(mail);
      const body = u.searchParams.get('body');
      const allIn = [...Object.values(fields).filter((v) => v !== fields.subject), ...Object.values(selects)].every((v) => body.includes(v));
      ok(`${path}: an empty form doesn't send`, early === null);
      ok(`${path}: opens a mail to rccleaningtucson@gmail.com`, u.pathname === 'rccleaningtucson@gmail.com' && u.searchParams.get('subject') === subject && allIn && sent, `subject "${u.searchParams.get('subject')}"`);
      console.log('       body: ' + JSON.stringify(body));
      await p.close();
    }
    // home: no second form; "Send a message" lands on the Hours form
    const h = await ctx.newPage();
    await h.goto(BASE + 'index.html?skip');
    const home = await h.evaluate(() => ({ forms: document.forms.length, msg: document.querySelector('.closing__more a[href="hours.html#contact"]')?.textContent }));
    let lands = false;
    if (home.msg) {
      await h.click('.closing__more a[href="hours.html#contact"]');
      await h.waitForURL('**/hours.html#contact');
      lands = await h.evaluate(() => { const f = document.querySelector('#contact form#msg'); const r = f?.getBoundingClientRect(); return !!f && r.top < innerHeight; });
    }
    ok('home: one clear way to write, landing on the Hours form', home.forms === 0 && home.msg === 'Send a message' && lands, JSON.stringify({ ...home, lands }));
    await h.close();
    // a service link on the booking page picks that service
    const p = await ctx.newPage();
    await p.goto(BASE + 'book-online.html');
    await p.click('#windows .link');
    const picked = await p.evaluate(() => document.querySelector('#req-service').value);
    ok('Request this (windows) picks Window cleaning', picked === 'Window cleaning', picked);
    await p.goto(BASE + 'book-online.html?service=House%20cleaning#request');
    ok('a home-page service link arrives with its service picked', await p.evaluate(() => document.querySelector('#req-service').value) === 'House cleaning');
    await ctx.close();
  }

  /* 2b. the review on glass: frosted until it scrolls in, then clear */
  {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion });
      const p = await ctx.newPage(); watch(p, `glass ${reducedMotion}`);
      await p.goto(BASE + 'index.html?skip'); await p.waitForTimeout(600);
      const clip = () => p.evaluate(() => { const f = document.querySelector('.glass .frost'); return f ? getComputedStyle(f).clipPath : 'no glass'; });
      const before = await clip();
      if (before !== 'no glass') { await p.locator('.glass').scrollIntoViewIfNeeded(); await p.waitForTimeout(2400); }
      const after = await clip();
      const clear = 'inset(0px 0px 0px 100%)';
      ok(`review glass (${reducedMotion}): ${reducedMotion === 'reduce' ? 'clear from the start' : 'frosted, then clear'}`, reducedMotion === 'reduce' ? before === clear && after === clear : before !== clear && after === clear, JSON.stringify({ before, after }));
      await ctx.close();
    }
  }

  /* 3. taps: nav, header buttons, menu, call bar */
  for (const [v, vp, mob] of [['desk', { width: 1440, height: 900 }, false], ['mob', { width: 390, height: 844 }, true]]) {
    const ctx = await b.newContext({ viewport: vp, isMobile: mob, hasTouch: mob });
    for (const path of PAGES) {
      const p = await ctx.newPage(); watch(p, `${v} ${path}`);
      await p.goto(BASE + path + (path === 'index.html' ? '?skip' : ''));
      await p.waitForTimeout(1200);
      const blocked = await p.evaluate(() => {
        const out = [];
        document.querySelectorAll('.nav a, #navToggle, .hero__ctas a, .closing__ctas a, .closing__more a, form button[type="submit"], .line-link').forEach((el) => {
          if (!el.closest('.nav')) el.scrollIntoView({ block: 'center', behavior: 'instant' });
          const r = el.getBoundingClientRect();
          if (!r.width || getComputedStyle(el).visibility === 'hidden' || getComputedStyle(el).display === 'none') return;
          const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          if (!el.contains(h)) out.push(`${el.textContent.trim().slice(0, 30) || el.id} under ${h?.className?.baseVal ?? h?.className ?? h}`);
          if (r.height < 44 && !el.closest('.footer')) out.push(`${el.textContent.trim().slice(0, 20)} only ${Math.round(r.height)}px tall`);
        });
        // text links: the hit area reaches 44px around the text
        document.querySelectorAll('main .link').forEach((el) => {
          el.scrollIntoView({ block: 'center', behavior: 'instant' });
          const r = el.getBoundingClientRect(); const cx = r.x + r.width / 2;
          const ends = [r.y + r.height / 2 - 22, r.y + r.height / 2 + 21].map((y) => document.elementFromPoint(cx, y));
          if (!ends.every((h) => el.contains(h))) out.push(`${el.textContent.trim().slice(0, 20)} link target under 44px`);
        });
        return out;
      });
      ok(`${v} ${path}: controls tappable, 44px+`, !blocked.length, blocked.join('; '));
      if (mob) {
        await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
        await p.tap('#navToggle'); await p.waitForTimeout(400);
        const m = await p.evaluate(() => {
          const links = [...document.querySelectorAll('#menu a, #menu button')];
          const bad = links.filter((a) => { const r = a.getBoundingClientRect(); const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !r.width || !a.contains(h); }).map((a) => a.textContent.trim());
          return { n: links.length, bad, current: document.querySelector('#menu a[aria-current="page"]')?.textContent, focus: document.activeElement?.className };
        });
        ok(`mob ${path}: menu open, links tappable, focus moved in`, m.n >= 6 && !m.bad.length && /menu__close/.test(m.focus || ''), JSON.stringify(m));
        await p.keyboard.press('Escape'); await p.waitForTimeout(350);
        ok(`mob ${path}: Escape closes the menu`, await p.evaluate(() => document.getElementById('menu').hidden));
        // call bar: hidden while the page's own buttons show, up once they scroll away
        const atTop = await p.evaluate(() => document.querySelector('.callbar').classList.contains('is-away'));
        await p.evaluate(() => scrollTo(0, 1600)); await p.waitForTimeout(700);
        const later = await p.evaluate(() => { const c = document.querySelector('.callbar'); const r = c.getBoundingClientRect(); return { away: c.classList.contains('is-away'), top: Math.round(r.top) }; });
        ok(`mob ${path}: call bar waits, then shows`, atTop && !later.away && later.top < 844, JSON.stringify({ atTop, later }));
      }
      await p.close();
    }
    await ctx.close();
  }

  /* 4. reduced motion: no wipe, everything visible after scrolling */
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    for (const path of PAGES) {
      const p = await ctx.newPage(); watch(p, `reduced ${path}`);
      await trackWipe(p);
      await p.goto(BASE + path); await p.waitForTimeout(500);
      const H = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < H; y += 600) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(60); }
      const r = await p.evaluate(() => ({ wiped: !!window.__wiped, pending: document.documentElement.classList.contains('wipe-pending'), hidden: [...document.querySelectorAll('h1, h2, h3, p, .btn, .form')].filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99).length }));
      ok(`reduced ${path}: no motion, all shown`, !r.wiped && !r.pending && r.hidden === 0, JSON.stringify(r));
      await p.close();
    }
    await ctx.close();
  }

  /* 5. no JavaScript: content readable, links live */
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    for (const path of PAGES) {
      const p = await ctx.newPage();
      await p.goto(BASE + path);
      const r = await p.evaluate(() => ({ hidden: [...document.querySelectorAll('h1, h2, h3, p, .btn')].filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99 || getComputedStyle(e).visibility === 'hidden').length, tel: !!document.querySelector('a[href^="tel:"]'), action: [...document.forms].every((f) => f.action.startsWith('mailto:')) }));
      ok(`no JS ${path}: readable, phone link, forms fall back to mailto`, r.hidden === 0 && r.tel && r.action, JSON.stringify(r));
      await p.close();
    }
    await ctx.close();
  }

  /* 6. share tags, icons and structured data */
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
      const want = 'https://korvane11.github.io/Korvane/sites/rc-cleaning/' + (path === 'index.html' ? '' : path);
      const good = m.url === want && m.canon === want && /^https:\/\//.test(m.img) && m.tw === m.img && m.desc.length > 60 && m.desc.length < 170 && !titles.has(m.title) && m.h1 === 1 && m.robots === 'noindex';
      titles.add(m.title);
      ok(`${path}: share tags, one h1, noindex for now`, good, `"${m.title}" desc ${m.desc.length} chars`);
      if (path === 'index.html') ok('structured data matches the visible facts', m.ld && m.ld.telephone === '+1-520-833-0865' && m.ld.email === 'rccleaningtucson@gmail.com' && m.ld.openingHoursSpecification[0].opens === '08:00' && m.ld.openingHoursSpecification[0].closes === '20:00', m.ld?.name);
    }
    for (const f of ['assets/brand/og.jpg', 'assets/brand/favicon.ico', 'assets/brand/apple-touch-icon.png', 'assets/brand/icon-192.png', 'assets/brand/icon-512.png', 'assets/brand/site.webmanifest']) {
      const r = await ctx.request.get(BASE + f);
      ok(`${f} served`, r.status() === 200, String(r.status()));
    }
    // every internal link and anchor resolves
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
