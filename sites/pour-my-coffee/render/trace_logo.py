"""Trace Pour My Coffee Co's own logo files (from their Wix site, transparent PNGs
at 3365 px and 2000 px) into crisp SVGs. The shapes are theirs, traced from the
alpha channel, not redrawn; only the fill colour is set here.

    python3 -I render/trace_logo.py      (from sites/pour-my-coffee; pip install potracer)

Writes assets/brand/logo-white.svg, logo-teal.svg (the full logo) and
mark-teal.svg (the cup in its ring, for the icons).
"""
import os

import numpy as np
import potrace
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'source')
OUT = os.path.join(HERE, '..', 'assets', 'brand')


def trace(path, scale=1.0):
    im = Image.open(path).convert('RGBA')
    if scale != 1.0:
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    a = np.asarray(im)[:, :, 3].astype(np.float32) / 255.0
    ys, xs = np.where(a > 0.5)
    pad = 4
    x0, y0, x1, y1 = max(xs.min() - pad, 0), max(ys.min() - pad, 0), xs.max() + pad, ys.max() + pad
    bm = potrace.Bitmap(~(a[y0:y1, x0:x1] > 0.5))   # potracer fills the False pixels
    pl = bm.trace(turdsize=6, alphamax=1.0, opticurve=True, opttolerance=0.2)
    d = []
    for c in pl:
        s = c.start_point
        d.append(f'M{s.x:.1f} {s.y:.1f}')
        for seg in c.segments:
            if seg.is_corner:
                d.append(f'L{seg.c.x:.1f} {seg.c.y:.1f}L{seg.end_point.x:.1f} {seg.end_point.y:.1f}')
            else:
                d.append(f'C{seg.c1.x:.1f} {seg.c1.y:.1f} {seg.c2.x:.1f} {seg.c2.y:.1f} {seg.end_point.x:.1f} {seg.end_point.y:.1f}')
        d.append('Z')
    return ''.join(d), x1 - x0, y1 - y0


def write(name, d, w, h, fill, label):
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="{label}">'
           f'<path fill="{fill}" fill-rule="evenodd" d="{d}"/></svg>\n')
    with open(os.path.join(OUT, name), 'w') as f:
        f.write(svg)
    print(name, w, h, len(svg))


os.makedirs(OUT, exist_ok=True)
d, w, h = trace(os.path.join(SRC, 'pour-logo-white.png'), 0.5)
write('logo-white.svg', d, w, h, '#ffffff', 'Pour My Coffee Co')
write('logo-teal.svg', d, w, h, '#17575e', 'Pour My Coffee Co')
write('logo-aqua.svg', d, w, h, '#a1d0d8', 'Pour My Coffee Co')
d, w, h = trace(os.path.join(SRC, 'cup-ring-white.png'), 0.5)
write('mark-teal.svg', d, w, h, '#17575e', 'Pour My Coffee Co')
write('mark-white.svg', d, w, h, '#ffffff', 'Pour My Coffee Co')
