// The share image: the hero still (assets/pour/hero-l.jpg) with their logo on the table to its left, 1200x630.
// node render/blender/make_og.cjs   (needs NODE_PATH=$(npm root -g) for playwright)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const SITE = path.join(__dirname, '..', '..');
(async () => {
  const og = path.join(SITE, 'render', '_og.html');
  fs.writeFileSync(og, `<!doctype html><body style="margin:0"><div style="position:relative;width:1200px;height:630px;overflow:hidden;background:#2b231d">
    <img src="../assets/pour/hero-l.jpg" style="position:absolute;left:0;top:-30px;width:1200px;height:675px;object-fit:cover">
    <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(246,240,230,.86) 0%,rgba(246,240,230,.55) 36%,rgba(246,240,230,0) 56%)"></div>
    <img src="../assets/brand/logo-teal.svg" style="position:absolute;left:64px;top:228px;width:400px"></div></body>`);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto('file://' + og); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(SITE, 'assets', 'brand', 'og.jpg'), type: 'jpeg', quality: 86 });
  fs.unlinkSync(og);
  await b.close();
})();
