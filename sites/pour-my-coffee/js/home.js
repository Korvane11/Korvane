/* Home: the opening. Whether it plays was decided by the inline script in the page head
 * (html.intro): it plays whenever the site is opened, not when coming back here from another
 * page of the site after seeing it, with ?skip, with reduced motion or with a data saver on.
 *
 * Six in the morning: the light comes up on the table, milk pours into the espresso and leaves a
 * heart, steam rises. The words and the nav come in once the light is up (html.is-lit), beside the
 * cup, never over it. Then the steam loops (its first frame is the pour's last). If the video
 * can't start within 2.5 s the page opens on the still.
 */
const root = document.documentElement;
const hero = document.querySelector('.hero');
const media = document.getElementById('heroMedia');
const intro = media?.querySelector('.hero__intro');
const loop = media?.querySelector('.hero__loop');
const pauseBtn = document.getElementById('steamToggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection?.saveData === true || matchMedia('(prefers-reduced-data: reduce)').matches;
const tall = matchMedia('(max-aspect-ratio: 1/1)').matches;
const SEEN = 'pour:poured';
const LIT_AT = 1100;         // ms after the pour starts playing: the light is up, the words come in
const START_WAIT = 2500;     // no picture by then: open on the still
const EXT = intro && intro.canPlayType('video/mp4; codecs="avc1.640028"') ? 'mp4' : 'webm';
const src = (kind) => `assets/pour/${kind}-${tall ? 'p' : 'l'}.${EXT}`;
let userPaused = false, heroVisible = true;

function lit() { root.classList.add('is-lit'); }
function done() {
  root.classList.remove('intro', 'is-lit');
  try { sessionStorage.setItem(SEEN, '1'); } catch { /* private mode */ }
}
const wantPlay = () => !userPaused && heroVisible && !document.hidden;
function sync() { if (!loop?.getAttribute('src')) return; if (wantPlay()) loop.play().catch(() => {}); else if (!loop.paused) loop.pause(); }

// the steam keeps rising while the picture is on screen
function startLoop() {
  if (reduced || saveData || !loop) return;
  if (!loop.getAttribute('src')) loop.src = src('loop');
  loop.preload = 'auto';
  loop.addEventListener('playing', () => {
    loop.classList.add('is-on');
    if (pauseBtn) pauseBtn.hidden = false;
    // the pour stays underneath until the loop has a frame on screen, so there's no flash
    const off = () => intro?.classList.remove('is-on');
    if (loop.requestVideoFrameCallback) loop.requestVideoFrameCallback(() => requestAnimationFrame(off));
    else setTimeout(off, 500);
  }, { once: true });
  // browsers pause muted video to save power: play again unless the tab is hidden, the picture is off screen or the visitor paused it
  loop.addEventListener('pause', () => { if (wantPlay() && !loop.ended) loop.play().catch(() => {}); });
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; sync(); }).observe(hero);
  pauseBtn?.addEventListener('click', () => {
    userPaused = !userPaused;
    pauseBtn.setAttribute('aria-pressed', String(userPaused));
    pauseBtn.setAttribute('aria-label', userPaused ? 'Play the steam' : 'Pause the steam');
    sync();
  });
  sync();
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
    loop.src = src('loop'); loop.preload = 'auto'; loop.load();   // ready to take over the moment the pour ends
  });
  intro.addEventListener('ended', () => { done(); startLoop(); }, { once: true });
  intro.addEventListener('error', () => { clearTimeout(fallback); done(); startLoop(); }, { once: true });
  intro.play().catch(() => { /* autoplay refused: the fallback opens the page */ });
}

if (!media || !intro || !loop) done();
else if (root.classList.contains('intro')) runIntro();
else { done(); startLoop(); }
