/* The opening: dusty glass over the photo, wiped clean by a squeegee in
 * alternating strokes (the way window cleaners work a pane), then one glint.
 *
 * The haze is painted once on a canvas; each frame the strip the blade has
 * just crossed is erased (destination-out). The squeegee is a plain element
 * moved with transforms. About 2 s on desktop, a little less on phones.
 */
const ease = (t) => 0.5 - Math.cos(Math.PI * t) / 2;   // in-out sine

// A seeded random, so the dust looks the same on every visit.
function rng(seed) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}

export function paintHaze(canvas) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const r = rng(2016);

  // desert dust: warm grey, a little heavier towards the bottom
  const base = g.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, 'rgba(208, 200, 187, 0.86)');
  base.addColorStop(1, 'rgba(188, 179, 166, 0.92)');
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);

  // patches where the dirt sits thicker
  for (let i = 0; i < 16; i++) {
    const x = r() * w, y = r() * h, rad = 90 + r() * 260;
    const p = g.createRadialGradient(x, y, 0, x, y, rad);
    p.addColorStop(0, `rgba(150, 138, 120, ${0.12 + r() * 0.12})`);
    p.addColorStop(1, 'rgba(150, 138, 120, 0)');
    g.fillStyle = p;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  // fine grit, from a small tile
  const tile = document.createElement('canvas');
  tile.width = tile.height = 180;
  const t = tile.getContext('2d');
  for (let i = 0; i < 900; i++) {
    const dark = r() < 0.6;
    t.fillStyle = dark ? `rgba(110, 98, 82, ${0.08 + r() * 0.22})` : `rgba(255, 252, 245, ${0.1 + r() * 0.25})`;
    const s = r() < 0.85 ? 1 : 2;
    t.fillRect(r() * 180, r() * 180, s, s);
  }
  g.fillStyle = g.createPattern(tile, 'repeat');
  g.fillRect(0, 0, w, h);

  // dried water spots
  for (let i = 0; i < 70; i++) {
    const x = r() * w, y = r() * h, rad = 2 + r() * 6;
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.strokeStyle = `rgba(255, 255, 255, ${0.12 + r() * 0.16})`;
    g.lineWidth = 1;
    g.stroke();
  }
  return g;
}

export function runWipe(hero, { onReveal } = {}) {
  const canvas = hero.querySelector('.hero__haze');
  const sq = hero.querySelector('.squeegee');
  const glint = hero.querySelector('.hero__glint');
  const g = canvas.getContext('2d');
  const w = canvas.clientWidth, h = canvas.clientHeight;

  const passes = h > w * 1.3 ? 4 : 3;
  const band = h / passes;
  const blade = band * 1.12;                     // overlap so no line is missed
  const dur = Math.min(560, Math.max(360, w / 2.4));
  const turn = 130;
  const margin = 40;
  sq.style.height = `${blade}px`;
  sq.style.setProperty('--handle', `${Math.round(Math.min(160, Math.max(80, blade * 0.36)))}px`);
  sq.style.setProperty('--grip', `${Math.round(Math.min(30, Math.max(20, blade * 0.07)))}px`);
  sq.style.display = 'block';

  // erase the strip between two blade positions, softened top and bottom
  const clear = (x0, x1, top) => {
    const a = Math.min(x0, x1), b = Math.max(x0, x1);
    if (b - a < 0.5) return;
    const soft = g.createLinearGradient(0, top, 0, top + blade);
    soft.addColorStop(0, 'rgba(0,0,0,0)');
    soft.addColorStop(0.06, 'rgba(0,0,0,1)');
    soft.addColorStop(0.94, 'rgba(0,0,0,1)');
    soft.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = soft;
    g.fillRect(a - 1, top, b - a + 2, blade);
    g.globalCompositeOperation = 'source-over';
  };
  const place = (x, top, dir) => {
    // the blade leads, the handle trails behind it
    sq.style.transform = `translate3d(${x}px, ${top}px, 0) scaleX(${dir > 0 ? -1 : 1})`;
  };

  // the plan: pass k runs left-to-right when k is even
  const plan = [];
  for (let k = 0; k < passes; k++) {
    const dir = k % 2 === 0 ? 1 : -1;
    const top = k * band - (blade - band) / 2;
    const from = dir > 0 ? -margin : w + margin;
    const to = dir > 0 ? w + margin : -margin;
    plan.push({ dir, top, from, to });
  }
  const total = passes * dur + (passes - 1) * turn;
  const revealAt = total - dur * 0.9;

  return new Promise((resolve) => {
    let start = 0, lastX = null, lastPass = -1, revealed = false;
    const frame = (now) => {
      if (!start) start = now;
      const t = now - start;
      if (!revealed && t >= revealAt) { revealed = true; onReveal?.(); }
      const k = Math.min(passes - 1, Math.floor(t / (dur + turn)));
      const p = plan[k];
      const local = t - k * (dur + turn);
      if (k !== lastPass) { lastPass = k; lastX = p.from; }
      if (local <= dur) {
        const x = p.from + (p.to - p.from) * ease(Math.min(1, local / dur));
        clear(lastX, x, p.top);
        lastX = x;
        place(x, p.top, p.dir);
      } else if (k < passes - 1) {
        // turn at the edge: drop to the next row
        clear(lastX, p.to, p.top);
        lastX = p.to;
        const f = ease((local - dur) / turn);
        place(p.to, p.top + (plan[k + 1].top - p.top) * f, plan[k + 1].dir);
      }
      if (t < total) { requestAnimationFrame(frame); return; }
      clear(lastX, plan[passes - 1].to, plan[passes - 1].top);
      sq.style.display = 'none';
      canvas.style.transition = 'opacity 450ms ease-out';
      canvas.style.opacity = '0';
      glint?.classList.add('is-on');
      setTimeout(() => { canvas.style.display = 'none'; resolve(); }, 460);
    };
    requestAnimationFrame(frame);
  });
}
