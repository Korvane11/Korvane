/* Home: the opening. Whether it plays was decided by the inline script in the head (html.intro).
 *
 * Black, then a Tucson living room with its blinds closed; the blinds tilt open and the morning sun comes in
 * through them in stripes. As the light floods in, their logo comes up over the room and its three sparkles
 * light one by one (html.is-mark), then it clears and the page comes in (html.is-out). The film then hands over
 * to the loop: the same room, the stripes of light moving a little as a mesquite outside sways. The loop's first
 * frame is the opening's last, and the opening stays on screen until the loop has a frame showing (no flash).
 *
 * Starts on the first frame the browser can play; if none comes within 2.5 s (or the video fails) the page
 * opens on the still. No loader, label or skip button.
 */
const root = document.documentElement;
const media = document.getElementById('heroMedia');
const intro = media?.querySelector('.hero__intro');
const loop = media?.querySelector('.hero__loop');
const toggle = document.getElementById('motionToggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tall = matchMedia('(max-aspect-ratio: 1/1)').matches;
const MARK_AT = 1500;        // ms after the film starts: the light is in, the logo comes up
const OUT_AT = 3500;         // the logo clears, the page comes in (the film is 4 s)
const START_WAIT = 2500;     // no picture by then: open on the still
const EXT = intro && intro.canPlayType('video/mp4; codecs="avc1.640028"') ? 'mp4' : 'webm';
const src = (kind) => `assets/film/${kind}-${tall ? 'p' : 'l'}.${EXT}`;
let userPaused = false;

function out() {
  root.classList.add('is-out');
  try { sessionStorage.setItem('cc:opened', '1'); } catch { /* private mode */ }
}
function finish() {
  out();
  // drop the opening's classes once the page has come in, so nothing waits on them later
  setTimeout(() => root.classList.remove('intro', 'is-mark', 'is-out'), 1900);
}

function startLoop() {
  if (reduced || !loop) return;
  if (!loop.getAttribute('src')) loop.src = src('loop');
  loop.preload = 'auto';
  loop.addEventListener('playing', () => {
    loop.classList.add('is-on');
    if (toggle) toggle.hidden = false;
    const off = () => intro?.classList.remove('is-on');
    if (loop.requestVideoFrameCallback) loop.requestVideoFrameCallback(() => requestAnimationFrame(off));
    else setTimeout(off, 500);
  }, { once: true });
  loop.play().catch(() => {});
  // browsers pause muted video to save power: play again unless the tab is hidden or the visitor paused it
  loop.addEventListener('pause', () => { if (!userPaused && !document.hidden && !loop.ended) loop.play().catch(() => {}); });
  document.addEventListener('visibilitychange', () => { if (!userPaused && !document.hidden && loop.paused) loop.play().catch(() => {}); });
  toggle?.addEventListener('click', () => {
    userPaused = !userPaused;
    if (userPaused) loop.pause(); else loop.play().catch(() => {});
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggle.setAttribute('aria-label', userPaused ? 'Play the background video' : 'Pause the background video');
    toggle.querySelector('use')?.setAttribute('href', `assets/icons/sprite.svg#${userPaused ? 'play' : 'pause'}`);
  });
}

function runIntro() {
  intro.src = src('intro');
  let started = false;
  const fallback = setTimeout(() => {
    if (started) return;
    intro.removeAttribute('src'); intro.load();
    finish(); startLoop();
  }, START_WAIT);
  intro.addEventListener('playing', () => {
    if (started) return;
    started = true; clearTimeout(fallback);
    intro.classList.add('is-on');
    setTimeout(() => root.classList.add('is-mark'), MARK_AT);
    setTimeout(finish, OUT_AT);
    loop.src = src('loop'); loop.preload = 'auto'; loop.load();   // ready to take over the moment the film ends
  });
  intro.addEventListener('ended', startLoop, { once: true });
  intro.addEventListener('error', () => { clearTimeout(fallback); finish(); startLoop(); }, { once: true });
  intro.play().catch(() => { /* autoplay refused: the fallback opens the page */ });
}

if (!media || !intro || !loop) finish();
else if (root.classList.contains('intro')) runIntro();
else startLoop();
