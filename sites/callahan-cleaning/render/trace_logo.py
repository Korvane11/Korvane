"""Trace Callahan Cleaning's own logo (their Facebook profile picture, 960 px, deep teal
on white) into SVGs for the site: the script "Callahan", the broom and its three
sparkles, "Cleaning", and their line "Where Quality Meets Clean".

    python3 -I render/trace_logo.py render/logo-source.jpg assets/brand

Writes, for each fill (teal #0c454c, the ink measured on their logo, and cream):
  logo-<fill>.svg          the mark: Callahan + broom + sparkles + Cleaning
  logo-full-<fill>.svg     the mark and their line under it
and sparkles.svg, the three sparkles on their own, placed in the mark's viewBox
(the opening lights them one by one over the mark).

The letters are their logo's, not a lookalike font: each pixel is scored for ink,
upsampled smoothly, cut at half strength and traced with potrace
(`pip install potracer`). Ask Callahan Cleaning for their original logo file;
this trace stands in until then.
"""
import os
import sys

import numpy as np
import potrace
from PIL import Image, ImageFilter

UP = 4
MARK = (50, 16, 832, 570)        # x0, y0, x1, y1 in the 960 px source: Callahan, broom, sparkles, Cleaning
LINE = (60, 576, 814, 640)       # Where Quality Meets Clean
# the three sparkles (four-point stars) around the broom, as boxes in the source
STARS = [(510, 130, 576, 216), (562, 62, 626, 146), (708, 155, 760, 225)]
FILLS = {'teal': '#0c454c', 'cream': '#f4efe6'}


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def score(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    lum = a.mean(axis=2)
    return 1 - smoothstep(70, 200, lum)      # the ink is about 52, the paper 250


def trace(s, box):
    """Returns [(bbox, path_d)] per closed curve (outer outlines and their holes)."""
    x0, y0, x1, y1 = box
    crop = s[y0:y1, x0:x1]
    im = Image.fromarray((crop * 255).astype(np.uint8))
    im = im.resize((im.width * UP, im.height * UP), Image.BICUBIC).filter(ImageFilter.GaussianBlur(UP * 0.45))
    m = np.asarray(im) > 127
    bmp = potrace.Bitmap(~m)                 # potracer fills the False pixels
    path = bmp.trace(turdsize=30, alphamax=1.0, opticurve=True, opttolerance=0.6)
    out = []
    for curve in path:
        pts = []
        sx, sy = curve.start_point.x / UP + x0, curve.start_point.y / UP + y0
        d = [f'M{sx:.1f} {sy:.1f}']
        pts.append((sx, sy))
        for seg in curve.segments:
            ex, ey = seg.end_point.x / UP + x0, seg.end_point.y / UP + y0
            if seg.is_corner:
                cx, cy = seg.c.x / UP + x0, seg.c.y / UP + y0
                d.append(f'L{cx:.1f} {cy:.1f}L{ex:.1f} {ey:.1f}')
                pts.append((cx, cy))
            else:
                c1x, c1y = seg.c1.x / UP + x0, seg.c1.y / UP + y0
                c2x, c2y = seg.c2.x / UP + x0, seg.c2.y / UP + y0
                d.append(f'C{c1x:.1f} {c1y:.1f} {c2x:.1f} {c2y:.1f} {ex:.1f} {ey:.1f}')
            pts.append((ex, ey))
        d.append('Z')
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        out.append(((min(xs), min(ys), max(xs), max(ys)), ''.join(d)))
    return out


def inside(b, box):
    return b[0] >= box[0] and b[1] >= box[1] and b[2] <= box[2] and b[3] <= box[3]


def bounds(curves):
    bs = [b for b, _ in curves]
    return min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs)


def svg(view, paths, fill):
    x0, y0, x1, y1 = view
    body = ''.join(f'<path fill-rule="evenodd" d="{p}"/>' for p in paths)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.0f} {y0:.0f} {x1 - x0:.0f} {y1 - y0:.0f}" '
            f'fill="{fill}">{body}</svg>\n')


def main(src, outdir):
    s = score(Image.open(src))
    mark, line = trace(s, MARK), trace(s, LINE)
    stars = [c for c in mark if any(inside(c[0], b) for b in STARS)]
    rest = [c for c in mark if c not in stars]
    print('curves: mark', len(mark), 'stars', len(stars), 'line', len(line))
    assert len(stars) == 3, 'expected three sparkles; check STARS'
    pad = 4
    mb = bounds(mark)
    mv = (mb[0] - pad, mb[1] - pad, mb[2] + pad, mb[3] + pad)
    fb = bounds(mark + line)
    fv = (fb[0] - pad, fb[1] - pad, fb[2] + pad, fb[3] + pad)
    os.makedirs(outdir, exist_ok=True)
    for name, fill in FILLS.items():
        open(os.path.join(outdir, f'logo-{name}.svg'), 'w').write(svg(mv, [p for _, p in mark], fill))
        open(os.path.join(outdir, f'logo-full-{name}.svg'), 'w').write(svg(fv, [p for _, p in mark + line], fill))
        # the mark without its sparkles, for the opening (the sparkles come in on their own)
        open(os.path.join(outdir, f'logo-nostars-{name}.svg'), 'w').write(svg(mv, [p for _, p in rest], fill))
    open(os.path.join(outdir, 'sparkles.svg'), 'w').write(svg(mv, [p for _, p in stars], FILLS['cream']))
    print('mark viewBox', [round(v) for v in mv], 'full', [round(v) for v in fv])
    print('stars', [[round(v) for v in b] for b, _ in stars])


if __name__ == '__main__':
    main(*sys.argv[1:3])
