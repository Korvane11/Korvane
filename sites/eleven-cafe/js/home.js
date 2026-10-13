/* Home: the pour. Whether it plays was decided by the inline script in the page
 * head (html.intro): it plays whenever the site is opened, not when coming back
 * here from another page of the site after seeing it, with ?skip, or with
 * reduced motion.
 *
 * The wall is dark. When the video actually plays, an opening appears in it
 * around the cup: espresso pours, crema rises, the stream stops. Then the
 * opening widens to the whole screen and the site comes in around the cup,
 * and the steam keeps rising (a seamless loop whose first frame is the pour's
 * last). If the video can't start within 2.5 s the site opens on the still.
 */
const root = document.documentElement;
const media = document.getElementById('heroMedia');
const intro = media?.querySelector('.hero__intro');
const loop = media?.querySelector('.hero__loop');
const edge = document.querySelector('.hero__edge');
const pauseBtn = document.getElementById('steamToggle');
let userPaused = false;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tall = matchMedia('(max-aspect-ratio: 1/1)').matches;
const SEEN = 'e11:poured';
const OPEN_AT = 3.55;        // seconds into the pour: the stream has stopped
const START_WAIT = 2500;     // no picture by then: open on the still
const OPEN_MS = 1150;        // the opening widening (matches the CSS transition)

// each render's size and the opening around its cup, as fractions of the frame (x0, y0, x1, y1)
const SHOT = tall ? { name: 'p', w: 900, h: 1600, hole: [0.13, 0.03, 0.87, 0.6] }
                  : { name: 'l', w: 1600, h: 900, hole: [0.415, 0.06, 0.815, 0.9] };
const EXT = intro && intro.canPlayType('video/mp4; codecs="avc1.640028"') ? 'mp4' : 'webm';
const src = (kind) => `assets/pour/${kind}-${SHOT.name}.${EXT}`;

function done() {
  root.classList.remove('intro', 'is-opening');
  try { sessionStorage.setItem(SEEN, '1'); } catch { /* private mode */ }
}

// the opening in screen pixels, following the video's object-fit: cover
function holeRect(f = SHOT.hole) {
  const vw = media.clientWidth, vh = media.clientHeight;
  const s = Math.max(vw / SHOT.w, vh / SHOT.h), dw = SHOT.w * s, dh = SHOT.h * s;
  // object-position (styles.css shifts the frame on narrower landscape screens)
  const pos = getComputedStyle(intro).objectPosition.split(' ').map((v) => (v.endsWith('%') ? parseFloat(v) / 100 : 0.5));
  const ox = (vw - dw) * pos[0], oy = (vh - dh) * (pos[1] ?? 0.5);
  const x0 = Math.max(12, ox + f[0] * dw), x1 = Math.min(vw - 12, ox + f[2] * dw);
  const y0 = Math.max(12, oy + f[1] * dh), y1 = Math.min(vh - 12, oy + f[3] * dh);
  return { vw, vh, x0, y0, x1, y1 };
}
function setHole(r, round = 18) {
  media.style.setProperty('--hole', `inset(${r.y0}px ${r.vw - r.x1}px ${r.vh - r.y1}px ${r.x0}px round ${round}px)`);
  Object.assign(edge.style, { left: `${r.x0}px`, top: `${r.y0}px`, width: `${r.x1 - r.x0}px`, height: `${r.y1 - r.y0}px` });
}

// the steam keeps rising behind the page
function startLoop() {
  if (reduced || !loop) return;
  if (!loop.getAttribute('src')) loop.src = src('loop');   // the pour may have readied it already; setting it again reloads it
  loop.preload = 'auto';
  loop.addEventListener('playing', () => { loop.classList.add('is-on'); intro?.classList.remove('is-on'); if (pauseBtn) pauseBtn.hidden = false; }, { once: true });
  loop.play().catch(() => {});
  // keep it going: browsers pause muted video to save power; play again unless the tab is hidden or the visitor paused it
  loop.addEventListener('pause', () => { if (!userPaused && !document.hidden && !loop.ended) loop.play().catch(() => {}); });
  document.addEventListener('visibilitychange', () => { if (!userPaused && !document.hidden && loop.paused) loop.play().catch(() => {}); });
  pauseBtn?.addEventListener('click', () => {
    userPaused = !userPaused;
    if (userPaused) loop.pause(); else loop.play().catch(() => {});
    pauseBtn.setAttribute('aria-pressed', String(userPaused));
    pauseBtn.setAttribute('aria-label', userPaused ? 'Play the steam' : 'Pause the steam');
  });
}

function runIntro() {
  const r = holeRect();
  // a closed opening at the cup's centre, so it opens from there
  const cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2;
  setHole({ ...r, x0: cx, x1: cx, y0: cy, y1: cy }, 18);
  intro.src = src('intro');
  let started = false, opened = false;
  const fallback = setTimeout(() => { if (!started) { intro.removeAttribute('src'); intro.load(); done(); startLoop(); } }, START_WAIT);
  intro.addEventListener('playing', () => {
    if (started) return;
    started = true; clearTimeout(fallback);
    intro.classList.add('is-on');
    requestAnimationFrame(() => setHole(holeRect()));          // the opening appears around the cup
    // ready the loop now, so it can take over the moment the pour ends
    loop.src = src('loop'); loop.preload = 'auto'; loop.load();
    const tick = () => {
      if (!opened && intro.currentTime >= OPEN_AT) {
        opened = true;
        root.classList.add('is-opening');
        const v = { vw: media.clientWidth, vh: media.clientHeight };
        setHole({ ...v, x0: 0, y0: 0, x1: v.vw, y1: v.vh }, 0);  // the opening widens to the whole screen
        setTimeout(done, OPEN_MS + 50);
      }
      if (!opened) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  intro.addEventListener('ended', () => { if (!opened) done(); startLoop(); }, { once: true });
  intro.addEventListener('error', () => { clearTimeout(fallback); done(); startLoop(); }, { once: true });
  addEventListener('resize', () => { if (root.classList.contains('intro') && !opened && started) setHole(holeRect()); });
  intro.play().catch(() => { /* autoplay refused: the fallback opens the site */ });
}

if (!media || !intro || !loop) done();
else if (root.classList.contains('intro')) runIntro();
else { done(); startLoop(); }
