// The link-preview image: NODE_PATH=$(npm root -g) node render/make_og.cjs (from the site folder, after encode.sh)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto('file://' + path.resolve(__dirname, 'og.html'));
  await p.waitForTimeout(800);
  await p.screenshot({ path: path.resolve(__dirname, '../assets/brand/og.jpg'), type: 'jpeg', quality: 86 });
  await b.close();
})();
