// The drink stills (our renders, from pour.html) and the share image.
// node render/stills.cjs <work dir>   (after render_all.sh; about 10 min)
//   assets/photos/pour-still.*  the heart forming, the stream in (Home, "Great coffee. Amazing service.")
//   assets/photos/heart-still.* the finished heart, steam, a lower angle (About us)
//   assets/brand/og.jpg         1200x630: the hero still with their logo
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const work = process.argv[2]; fs.mkdirSync(work, { recursive: true });
const SITE = path.join(__dirname, '..');
const SHOTS = [
  { name: 'pour-still', w: 960, h: 1200, t: 2.45, mode: 0, cam: { pos: [-3, 31, 25], tgt: [0.2, 2.8, 0.0], fov: 32, shift: [0.07, 0.04] } },
  { name: 'heart-still', w: 1200, h: 900, t: 1.5, mode: 1, cam: { pos: [9, 17, 29], tgt: [0.0, 3.2, 0.0], fov: 27, shift: [0.0, 0.02] } },
];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 400, height: 300 } });
  p.on('pageerror', (e) => console.error('pageerror', e.message));
  await p.goto('file://' + path.join(__dirname, 'pour.html'));
  await p.waitForFunction(() => window.ready === true);
  for (const s of SHOTS) {
    if (process.env.ONLY && process.env.ONLY !== s.name) continue;
    await p.evaluate((c) => { window.camOverride = [c, c]; }, s.cam);
    const url = await p.evaluate(([t, m, w, h]) => window.renderFrame(t, 0, 8, m, w, h), [s.t, s.mode, s.w, s.h]);
    const png = path.join(work, s.name + '.png');
    fs.writeFileSync(png, Buffer.from(url.split(',')[1], 'base64'));
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', png, '-q:v', '3', path.join(SITE, 'assets/photos', s.name + '.jpg')]);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', png, '-c:v', 'libwebp', '-quality', '80', path.join(SITE, 'assets/photos', s.name + '.webp')]);
    console.log(s.name, 'done');
  }
  // the share image: the hero still, their logo on the table to its left
  const og = path.join(SITE, 'render', '_og.html');
  fs.writeFileSync(og, `<!doctype html><body style="margin:0"><div style="position:relative;width:1200px;height:630px;overflow:hidden;background:#e9dfd0">
    <img src="../assets/pour/hero-l.jpg" style="position:absolute;left:-60px;top:-25px;width:1320px;height:742px;object-fit:cover">
    <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(246,240,230,.85) 0%,rgba(246,240,230,.5) 36%,rgba(246,240,230,0) 58%)"></div>
    <img src="../assets/brand/logo-teal.svg" style="position:absolute;left:70px;top:225px;width:400px"></div></body>`);
  const q = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await q.goto('file://' + og); await q.waitForTimeout(400);
  await q.screenshot({ path: path.join(work, 'og.png') });
  fs.unlinkSync(og);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(work, 'og.png'), '-q:v', '3', path.join(SITE, 'assets/brand/og.jpg')]);
  console.log('og done');
  await b.close();
})();
