// Square icons from the traced wordmark: the first E of their own "ELEVEN", white on their grey.
// node render/make_icons.cjs   (writes assets/brand/icon-*.png, apple-touch-icon.png and the PNGs for favicon.ico)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BRAND = path.join(__dirname, '..', 'assets', 'brand');
const svg = fs.readFileSync(path.join(BRAND, 'wordmark.svg'), 'utf8');
const paths = svg.match(/<path[^>]*\/>/g).join('');
const E = { x: 134, y: 217, w: 61, h: 155 };            // the E's bounds in the logo (render/trace_logo.py's source)
const SIZES = { 'icon-512.png': 512, 'icon-192.png': 192, 'apple-touch-icon.png': 180, 'favicon-48.png': 48, 'favicon-32.png': 32, 'favicon-16.png': 16 };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [name, s] of Object.entries(SIZES)) {
    const p = await b.newPage({ viewport: { width: s, height: s }, deviceScaleFactor: 1 });
    const h = s * (s <= 32 ? 0.74 : 0.62);               // a bigger letter where pixels are few
    const w = h * E.w / E.h;
    await p.setContent(`<body style="margin:0;background:#7e7e7e;width:${s}px;height:${s}px;display:grid;place-items:center">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="${E.x} ${E.y} ${E.w} ${E.h}" width="${w}" height="${h}" fill="#ffffff">${paths.replace(/fill="[^"]*"/g, '')}</svg></body>`);
    await p.screenshot({ path: path.join(BRAND, name), clip: { x: 0, y: 0, width: s, height: s } });
    await p.close();
  }
  await b.close();
  console.log('icons written');
})();
