// Renders render/pour.html frame by frame in headless Chromium (SwiftShader) and writes PNGs.
// node render_pour.cjs <outDir> <layout 0|1> <mode 0|1> <width> <height> <fps> <passes> [from] [to] [stepFrames]
// mode 0: the intro (T_END = 5 s, frames 0..120), mode 1: the steam loop (6 s, frames 0..143).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [out, layout, mode, w, h, fps, passes, from, to, step] = process.argv.slice(2);
const DUR = +mode === 0 ? 5.0 : 6.0;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 400, height: 300 } });
  p.on('pageerror', (e) => console.error('pageerror', e.message));
  p.on('console', (m) => { if (m.type() === 'error') console.error(m.text()); });
  await p.goto('file://' + path.join(__dirname, 'pour.html'));
  await p.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  if (process.env.CAM) await p.evaluate((c) => { window.camOverride = JSON.parse(c); }, process.env.CAM);
  const n = Math.round(DUR * +fps);
  const last = +mode === 0 ? n : n - 1;
  const a = from !== undefined ? +from : 0, z = to !== undefined ? Math.min(+to, last) : last, st = step ? +step : 1;
  for (let i = a; i <= z; i += st) {
    const f = path.join(out, `f${String(i).padStart(4, '0')}.png`);
    if (process.env.RESUME && fs.existsSync(f)) continue;
    const t0 = Date.now();
    const url = await p.evaluate(([t, l, ps, m, w, h]) => window.renderFrame(t, l, ps, m, w, h), [i / +fps, +layout, +passes, +mode, +w, +h]);
    fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
    console.log(`frame ${i}/${last} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  await b.close();
})();
