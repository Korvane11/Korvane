"""Trace the SIMNOW lettering out of SimNow's logo badge into a clean SVG, for
places where the whole badge is too small to read (the nav).

    python3 -I render/trace_logo.py assets/simnow-logo.webp assets/simnow-wordmark.svg

The badge is a raster (an oval with an F1 car behind the name). Its lettering
separates by colour: SIM and the speed streaks are white, NOW is red. Each
colour is scored per pixel, upsampled smoothly, cut at half strength and
traced with potrace (`pip install potracer`), so the shapes are the badge's
own letters, not a lookalike font. The fills copy the badge's glossy split:
lighter above the middle, a shade darker below.
"""
import sys

import numpy as np
import potrace
from PIL import Image, ImageFilter

UP = 8  # trace at 8x the badge's pixels

# regions in badge pixels (585x330): x0, y0, x1, y1. The oval's silver ring
# runs close to the left end of the name, so the left edge steps in where it does.
SIM_BOXES = [(30, 112, 266, 150), (17, 150, 266, 188)]   # S, I, M and the streak into the S
STREAK_BOX = (30, 186, 240, 212)                          # the speed streaks under SIM
NOW_BOX = (252, 116, 562, 188)
LETTERS_Y = (118, 184)                                    # the letters' height, for the fills

# sampled from the badge: each half of the letters is near flat, with a step
# at the middle
FILLS = {
    'sim': [('0', '#ffffff'), ('0.5', '#f5f6f6'), ('0.53', '#dedfdf'), ('1', '#d2d3d4')],
    'now': [('0', '#ff0a1e'), ('0.5', '#f40416'), ('0.53', '#d9020c'), ('1', '#c4010a')],
}


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def scores(img):
    a = np.asarray(img.convert('RGBA')).astype(np.float32)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3] / 255
    lo, hi = np.minimum(np.minimum(r, g), b), np.maximum(np.maximum(r, g), b)
    white = smoothstep(110, 170, lo) * (1 - smoothstep(40, 70, hi - lo)) * al
    red = smoothstep(90, 150, r) * smoothstep(50, 100, r - np.maximum(g, b)) * al
    return white, red


def region(score, box):
    x0, y0, x1, y1 = box
    out = np.zeros_like(score)
    out[y0:y1, x0:x1] = score[y0:y1, x0:x1]
    return out


def mask(score, blur=0.7):
    # upsample, then blur a little: the badge is a compressed raster, and its
    # block noise would otherwise trace as wavy edges on straight strokes
    h, w = score.shape
    big = Image.fromarray((score * 255).astype(np.uint8)).resize((w * UP, h * UP), Image.BICUBIC)
    big = big.filter(ImageFilter.GaussianBlur(UP * blur))
    return np.asarray(big) > 127


def trace(m):
    path = potrace.Bitmap(~m).trace(   # potracer fills the False pixels
        turdsize=6 * UP * UP, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY,
                                   alphamax=1.0, opticurve=True, opttolerance=0.4)
    f = lambda p: f'{p.x / UP:.1f} {p.y / UP:.1f}'
    parts = []
    for curve in path:
        d = [f'M{f(curve.start_point)}']
        for s in curve:
            if s.is_corner:
                d.append(f'L{f(s.c)}L{f(s.end_point)}')
            else:
                d.append(f'C{f(s.c1)} {f(s.c2)} {f(s.end_point)}')
        parts.append(''.join(d) + 'Z')
    return ''.join(parts)


def bounds(*masks):
    ys, xs = np.nonzero(np.logical_or.reduce(masks))
    return xs.min() / UP, ys.min() / UP, (xs.max() + 1) / UP, (ys.max() + 1) / UP


def main():
    src, out = sys.argv[1], sys.argv[2]
    white, red = scores(Image.open(src))
    # the thin streaks are noisier than the letters: smooth them harder
    m_sim = mask(sum(region(white, b) for b in SIM_BOXES)) | mask(region(white, STREAK_BOX), blur=1.2)
    m_now = mask(region(red, NOW_BOX))
    x0, y0, x1, y1 = bounds(m_sim, m_now)
    pad = 1
    vb = f'{x0 - pad:.2f} {y0 - pad:.2f} {x1 - x0 + 2 * pad:.2f} {y1 - y0 + 2 * pad:.2f}'
    grads = []
    for name, stops in FILLS.items():
        ly0, ly1 = LETTERS_Y   # not the streaks under them
        s = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
        grads.append(f'<linearGradient id="sn-{name}" gradientUnits="userSpaceOnUse" x1="0" y1="{ly0}" x2="0" y2="{ly1}">{s}</linearGradient>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="SimNow">'
           f'<defs>{"".join(grads)}</defs>'
           f'<path fill="url(#sn-sim)" fill-rule="evenodd" d="{trace(m_sim)}"/>'
           f'<path fill="url(#sn-now)" fill-rule="evenodd" d="{trace(m_now)}"/>'
           '</svg>\n')
    open(out, 'w').write(svg)
    print('wrote', out, f'({len(svg) // 1024} KB), viewBox {vb}')


if __name__ == '__main__':
    main()
