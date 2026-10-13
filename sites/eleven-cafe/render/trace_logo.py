"""Trace Eleven Cafē's own lettering ("ELEVEN" over "cafē") out of their Facebook
profile logo (720 px, white on grey) into a crisp SVG for the site.

    python3 -I render/trace_logo.py <profile.jpg> assets/brand/wordmark.svg [fill]

The letters are their logo's, not a lookalike font: each pixel is scored for
"white on grey", upsampled smoothly, cut at half strength and traced with
potrace (`pip install potracer`). The fill defaults to the site's warm white
(the SVG is used as an <img>, so it can't take the page's colour). Ask Eleven Cafē for their original logo file;
this trace stands in until then.
"""
import sys

import numpy as np
import potrace
from PIL import Image, ImageFilter

UP = 6
# regions in the 720 px source: x0, y0, x1, y1
ELEVEN = (120, 205, 600, 380)
CAFE = (195, 385, 525, 515)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def score(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    lum = a.mean(axis=2)
    return smoothstep(150, 225, lum)        # the grey ground is 126, the letters 255


def trace(s, box):
    x0, y0, x1, y1 = box
    crop = s[y0:y1, x0:x1]
    im = Image.fromarray((crop * 255).astype(np.uint8))
    im = im.resize((im.width * UP, im.height * UP), Image.BICUBIC).filter(ImageFilter.GaussianBlur(UP * 0.45))
    m = np.asarray(im) > 127
    bmp = potrace.Bitmap(~m)                 # potracer fills the False pixels
    path = bmp.trace(turdsize=20, alphamax=1.0, opticurve=True, opttolerance=0.2)
    d = []
    for curve in path:
        sx, sy = curve.start_point.x / UP + x0, curve.start_point.y / UP + y0
        d.append(f'M{sx:.1f} {sy:.1f}')
        for seg in curve.segments:
            ex, ey = seg.end_point.x / UP + x0, seg.end_point.y / UP + y0
            if seg.is_corner:
                cx, cy = seg.c.x / UP + x0, seg.c.y / UP + y0
                d.append(f'L{cx:.1f} {cy:.1f}L{ex:.1f} {ey:.1f}')
            else:
                c1x, c1y = seg.c1.x / UP + x0, seg.c1.y / UP + y0
                c2x, c2y = seg.c2.x / UP + x0, seg.c2.y / UP + y0
                d.append(f'C{c1x:.1f} {c1y:.1f} {c2x:.1f} {c2y:.1f} {ex:.1f} {ey:.1f}')
        d.append('Z')
    return ''.join(d)


def bounds(s, box):
    x0, y0, x1, y1 = box
    ys, xs = np.nonzero(s[y0:y1, x0:x1] > 0.5)
    return xs.min() + x0, ys.min() + y0, xs.max() + x0 + 1, ys.max() + y0 + 1


def main(src, out, fill='#f1f0ed'):
    s = score(Image.open(src))
    e, c = trace(s, ELEVEN), trace(s, CAFE)
    bx = [bounds(s, ELEVEN), bounds(s, CAFE)]
    x0, y0 = min(b[0] for b in bx) - 2, min(b[1] for b in bx) - 2
    x1, y1 = max(b[2] for b in bx) + 2, max(b[3] for b in bx) + 2
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {x1 - x0} {y1 - y0}" fill="{fill}">'
           f'<path fill-rule="evenodd" d="{e}"/><path fill-rule="evenodd" d="{c}"/></svg>\n')
    open(out, 'w').write(svg)
    print(out, f'{x1 - x0}x{y1 - y0}', len(svg), 'bytes; ELEVEN', bx[0], 'cafe', bx[1])


if __name__ == '__main__':
    main(*sys.argv[1:4])
