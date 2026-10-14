// Makes the tab and home-screen icons from their own cup mark (assets/brand/mark-*.svg, traced from their logo files):
// the teal cup in its ring on white for tabs, the white cup on their aqua for home screens.
// node render/make_icons.cjs   (from sites/pour-my-coffee), then python3 -I render/make_ico.py
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const B = path.join(__dirname, '..', 'assets', 'brand');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  const shot = async (file, size, bg, mark, pad, round) => {
    await p.setViewportSize({ width: size, height: size });
    const tmp = path.join(B, '_icon.html');
    fs.writeFileSync(tmp, `<body style="margin:0;background:transparent"><div style="width:${size}px;height:${size}px;background:${bg};border-radius:${round};display:flex;align-items:center;justify-content:center"><img src="file://${path.join(B, mark)}" style="width:${size - 2 * pad}px;height:${size - 2 * pad}px"></div></body>`);
    await p.goto('file://' + tmp);
    await p.waitForTimeout(150);
    fs.unlinkSync(tmp);
    await p.screenshot({ path: path.join(B, file), omitBackground: true });
  };
  await shot('icon-512.png', 512, '#a1d0d8', 'mark-white.svg', 72, '0');
  await shot('icon-192.png', 192, '#a1d0d8', 'mark-white.svg', 27, '0');
  await shot('apple-touch-icon.png', 180, '#a1d0d8', 'mark-white.svg', 26, '0');
  await shot('tab-64.png', 64, '#ffffff', 'mark-teal.svg', 2, '50%');
  await shot('tab-32.png', 32, '#ffffff', 'mark-teal.svg', 1, '50%');
  await b.close();
})();
