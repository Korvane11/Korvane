// Check every demo (or the ones named) in a real browser, the way they were
// verified when they were written:
//   - no page errors and no console errors
//   - it animates: two desktop frames 1 s apart differ
//   - no horizontal overflow on a 390px phone
//   - with prefers-reduced-motion the frame is finished, not blank
//
//   NODE_PATH=$(npm root -g) node scripts/check-demos.cjs [out-dir] [--thumbs] [NN ...]
//
// Screenshots go to out-dir (default: a new temp folder). --thumbs also
// rewrites assets/demos/thumbs/NN-slug.jpg (640x400: the 1280x800 layout at
// half scale), which the gallery uses. Needs Node, the playwright package and
// Chromium; set CHROMIUM_PATH if it is not at /opt/pw-browsers/chromium.
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');

const DEMOS = path.join(__dirname, '..', 'assets', 'demos');
const args = process.argv.slice(2);
const thumbs = args.includes('--thumbs');
const only = args.filter((a) => /^\d{2}$/.test(a));
const out = args.find((a) => !a.startsWith('--') && !/^\d{2}$/.test(a)) || fs.mkdtempSync(path.join(os.tmpdir(), 'demos-'));
fs.mkdirSync(out, { recursive: true });
if (thumbs) fs.mkdirSync(path.join(DEMOS, 'thumbs'), { recursive: true });

const files = fs.readdirSync(DEMOS)
  .filter((f) => /^\d{2}-.+\.html$/.test(f) && (!only.length || only.includes(f.slice(0, 2))))
  .sort();

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],   // WebGL without a GPU
  });
  let failed = 0;
  for (const f of files) {
    const url = 'file://' + path.join(DEMOS, f);
    const name = f.replace(/\.html$/, '');
    const errors = [];
    const open = async (opts) => {
      const ctx = await browser.newContext(opts);
      const page = await ctx.newPage();
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForTimeout(1500);
      return { ctx, page };
    };

    const desk = await open({ viewport: { width: 1440, height: 900 } });
    const a = await desk.page.screenshot({ path: path.join(out, `${name}-desk.png`) });
    await desk.page.waitForTimeout(1000);
    const b = await desk.page.screenshot();
    const animates = !a.equals(b);
    await desk.ctx.close();

    const phone = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await phone.page.screenshot({ path: path.join(out, `${name}-mob.png`) });
    const overflow = await phone.page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    await phone.ctx.close();

    const still = await open({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const r = await still.page.screenshot({ path: path.join(out, `${name}-reduced.png`) });
    const spread = await contrast(still.page, r);
    await still.ctx.close();

    if (thumbs) {
      const t = await open({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 0.5 });
      await t.page.screenshot({ path: path.join(DEMOS, 'thumbs', `${name}.jpg`), type: 'jpeg', quality: 80 });
      await t.ctx.close();
    }

    const finished = spread > 0.015;   // a flat frame scores ~0; text on black ~0.02
    const ok = !errors.length && animates && !overflow && finished;
    if (!ok) failed++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}  errors:${errors.length} animates:${animates} phone-overflow:${overflow} reduced-frame:${finished ? 'ok' : 'blank?'} (spread ${spread.toFixed(3)})`);
    errors.slice(0, 3).forEach((e) => console.log('       ' + e));
  }
  await browser.close();
  console.log(`${files.length - failed}/${files.length} passed; screenshots in ${out}`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });

// How much is drawn in a screenshot: the standard deviation of luminance
// (0-1) over a coarse grid. A blank or single-colour frame scores near 0.
// Decoded in the page itself, so no image library is needed.
async function contrast(page, png) {
  return page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = 96; c.height = 60;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let n = 0, s = 0, s2 = 0;
    for (let i = 0; i < d.length; i += 4) {
      const y = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
      n++; s += y; s2 += y * y;
    }
    const m = s / n;
    return Math.sqrt(Math.max(0, s2 / n - m * m));
  }, 'data:image/png;base64,' + png.toString('base64'));
}
