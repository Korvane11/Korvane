/* Home: the opening wipe. Whether it runs was decided by the inline script
 * in the page head (it sets html.wipe-pending before anything is drawn):
 * it plays whenever the site is opened, and not when coming back to the home
 * page from another page of the site after seeing it, with ?skip, or with
 * reduced motion.
 */
import { paintHaze, runWipe } from './wipe.js';

const root = document.documentElement;
const hero = document.querySelector('.hero');
const photo = hero?.querySelector('.hero__photo img');
const canvas = hero?.querySelector('.hero__haze');
const SEEN = 'rc:wiped';

function done() {
  root.classList.remove('wipe-pending');
  try { sessionStorage.setItem(SEEN, '1'); } catch { /* private mode */ }
}

// wait for the photo behind the glass, but never long
function photoReady(ms) {
  if (!photo || (photo.complete && photo.naturalWidth)) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), ms);
    photo.addEventListener('load', () => { clearTimeout(timer); resolve(true); }, { once: true });
    photo.addEventListener('error', () => { clearTimeout(timer); resolve(false); }, { once: true });
  });
}

async function boot() {
  if (!root.classList.contains('wipe-pending') || !hero || !canvas?.getContext) { done(); return; }
  canvas.style.display = 'block';
  paintHaze(canvas);
  canvas.style.background = 'none';
  if (!(await photoReady(2500)) || document.hidden) {
    canvas.style.display = 'none';
    done();
    return;
  }
  await runWipe(hero, { onReveal: done });
  done();
}

boot().catch(() => { if (canvas) canvas.style.display = 'none'; done(); });
