// The link-preview image (1200 x 630): the settled cup from the render, their wordmark on the dark side.
// node render/make_og.cjs   (after render/encode.sh has written assets/pour/hero-l.jpg)
const { chromium } = require('playwright');
const path = require('path');
const SITE = path.join(__dirname, '..');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto('file://' + path.join(SITE, 'index.html').replace(/index\.html$/, '') + 'render/og.html');
  await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(SITE, 'assets/brand/og.jpg'), type: 'jpeg', quality: 88 });
  await b.close();
  console.log('assets/brand/og.jpg');
})();
