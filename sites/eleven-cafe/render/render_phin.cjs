// Renders render/phin.html frame by frame in headless Chromium (SwiftShader) and writes PNGs.
// node render_phin.cjs <outDir> <width> <height> <fps> <passes> [from] [to] [step] [times]
// The scene file is copied into <outDir> first and rendered from that copy, so an edit (or git) can't change it
// mid-run, and the copy records what made the frames. LOOP is 4 s: frames 0..fps*4-1.
// times (optional): comma-separated seconds instead of frames, for previews (written as t<seconds>.png).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [out, w, h, fps, passes, from, to, step, times] = process.argv.slice(2);
const LOOP = 4.0;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const scene = path.join(path.resolve(out), 'phin.html');
  fs.copyFileSync(path.join(__dirname, 'phin.html'), scene);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 400, height: 300 } });
  p.on('pageerror', (e) => console.error('pageerror', e.message));
  p.on('console', (m) => { if (m.type() === 'error') console.error(m.text()); });
  await p.goto('file://' + scene);
  await p.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  const shots = times ? times.split(',').map((s) => [+s, `t${(+s).toFixed(3)}.png`])
    : (() => {
      const n = Math.round(LOOP * +fps), a = from !== undefined && from !== '' ? +from : 0;
      const z = to !== undefined && to !== '' ? Math.min(+to, n - 1) : n - 1, st = step ? +step : 1, list = [];
      for (let i = a; i <= z; i += st) list.push([i / +fps, `f${String(i).padStart(4, '0')}.png`]);
      return list;
    })();
  for (const [t, name] of shots) {
    const t0 = Date.now();
    const url = await p.evaluate(([t, ps, w, h]) => window.renderFrame(t, ps, w, h), [t, +passes, +w, +h]);
    fs.writeFileSync(path.join(out, name), Buffer.from(url.split(',')[1], 'base64'));
    console.log(`${name} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  await b.close();
})();
