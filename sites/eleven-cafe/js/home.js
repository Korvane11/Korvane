/* Home: the opening scene. Whether the pour plays was decided by the inline script in the page
 * head (html.intro): it plays whenever the site is opened, not when coming back here from
 * another page of the site after seeing it, with ?skip, or with reduced motion.
 * With a data saver on (Save-Data, or prefers-reduced-data) no video loads at all: the
 * still stays, and the three lines still take turns with the scroll.
 *
 * The light comes up on a dark café counter by a window; espresso pours into the cup, the stream
 * stops, steam rises into the light. The words and the nav come in once the light is up
 * (html.is-lit). The steam then loops (a seamless loop whose first frame is the pour's last).
 * If the video can't start within 2.5 s the scene opens on the still.
 *
 * Scrolling: the scene stays put (sticky) while three lines take turns over it, the camera
 * leans in a little, and at the end the scene sinks into the page (--p, data-beat).
 */
const root = document.documentElement;
const hero = document.querySelector('.hero');
const media = document.getElementById('heroMedia');
const intro = media?.querySelector('.hero__intro');
const loop = media?.querySelector('.hero__loop');
const pauseBtn = document.getElementById('steamToggle');
let userPaused = false;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection?.saveData === true || matchMedia('(prefers-reduced-data: reduce)').matches;
const tall = matchMedia('(max-aspect-ratio: 1/1)').matches;
const SEEN = 'e11:poured';
const LIT_AT = 650;          // ms after the pour starts playing: the light is up, the words come in
const START_WAIT = 2500;     // no picture by then: open on the still
const EXT = intro && intro.canPlayType('video/mp4; codecs="avc1.640028"') ? 'mp4' : 'webm';
const src = (kind) => `assets/pour/${kind}-${tall ? 'p' : 'l'}.${EXT}`;

function lit() { root.classList.add('is-lit'); }
function done() {
  root.classList.remove('intro', 'is-lit');
  try { sessionStorage.setItem(SEEN, '1'); } catch { /* private mode */ }
}

// the steam keeps rising behind the page
function startLoop() {
  if (reduced || saveData || !loop) return;
  if (!loop.getAttribute('src')) loop.src = src('loop');   // the pour may have readied it already; setting it again reloads it
  loop.preload = 'auto';
  loop.addEventListener('playing', () => {
    loop.classList.add('is-on');
    if (pauseBtn) pauseBtn.hidden = false;
    // the pour stays underneath until the loop has a frame on screen (the loop's first frame is the pour's last), so no black flash
    const off = () => intro?.classList.remove('is-on');
    if (loop.requestVideoFrameCallback) loop.requestVideoFrameCallback(() => requestAnimationFrame(off));
    else setTimeout(off, 500);
  }, { once: true });
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
  intro.src = src('intro');
  let started = false;
  const fallback = setTimeout(() => { if (!started) { intro.removeAttribute('src'); intro.load(); done(); startLoop(); } }, START_WAIT);
  intro.addEventListener('playing', () => {
    if (started) return;
    started = true; clearTimeout(fallback);
    intro.classList.add('is-on');
    setTimeout(lit, LIT_AT);
    // ready the loop now, so it can take over the moment the pour ends
    loop.src = src('loop'); loop.preload = 'auto'; loop.load();
  });
  intro.addEventListener('ended', () => { done(); startLoop(); }, { once: true });
  intro.addEventListener('error', () => { clearTimeout(fallback); done(); startLoop(); }, { once: true });
  intro.play().catch(() => { /* autoplay refused: the fallback opens the scene */ });
}

// the scroll: which line is showing, how far the camera has leaned in, when the scene sinks away
function pinned() { return !reduced && hero && getComputedStyle(hero.querySelector('.hero__stage')).position === 'sticky'; }
const BEATS = [0.30, 0.62];   // progress at which the second and third lines take over
let ticking = false, beat = 0;
function onScroll() {
  ticking = false;
  const r = hero.getBoundingClientRect(), run = r.height - innerHeight;
  const p = run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
  hero.style.setProperty('--p', p.toFixed(4));
  const b = p < BEATS[0] ? 0 : p < BEATS[1] ? 1 : 2;
  if (b !== beat) { beat = b; hero.dataset.beat = String(b); }
}
function watchScroll() {
  if (!pinned()) { hero.dataset.beat = '2'; return; }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
  // a keyboard visitor tabbing to the buttons before the headline is showing: bring it up
  hero.querySelector('.beat:last-child')?.addEventListener('focusin', () => {
    if (beat === 2) return;
    const r = hero.getBoundingClientRect(), run = r.height - innerHeight;
    scrollTo({ top: scrollY + r.top + run * (BEATS[1] + 0.06), behavior: 'instant' });
  });
}

// the phin (the cà phê sữa đá section): its loop drips while it's on screen, never with reduced motion or a data saver;
// a pause button, as for the steam. Every drip cycle divides the loop's 4 s, so it loops without a seam.
function phinLoop() {
  const box = document.getElementById('phin');
  const v = box?.querySelector('video'), btn = document.getElementById('phinToggle');
  if (!v || reduced || saveData) return;
  const ext = v.canPlayType('video/mp4; codecs="avc1.640028"') ? 'mp4' : 'webm';
  let inView = false, paused = false;
  const sync = () => {
    if (inView && !paused && !document.hidden) {
      if (!v.getAttribute('src')) v.src = `assets/phin/phin.${ext}`;
      v.play().catch(() => {});
    } else if (!v.paused) v.pause();
  };
  v.addEventListener('playing', () => { v.classList.add('is-on'); if (btn) btn.hidden = false; }, { once: true });
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }, { rootMargin: '160px 0px' }).observe(box);
  document.addEventListener('visibilitychange', sync);
  btn?.addEventListener('click', () => {
    paused = !paused;
    btn.setAttribute('aria-pressed', String(paused));
    btn.setAttribute('aria-label', paused ? 'Play the drip' : 'Pause the drip');
    sync();
  });
}

if (hero) watchScroll();
phinLoop();
if (!media || !intro || !loop) done();
else if (root.classList.contains('intro')) runIntro();
else { done(); startLoop(); }
