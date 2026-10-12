"""Square icons for the site, made from SimNow's own badge.

    python3 -I render/make_icons.py assets/simnow-logo.webp assets/icons

The badge is wide (an oval), so squeezed into a square browser-tab icon it
turns into a smudge. Small icons (the tab, bookmarks) get an "SN" monogram cut
from the badge's own lettering: the S of SIM and the N of NOW, traced the way
render/trace_logo.py traces the whole name. Home-screen icons are big enough
for the real thing, so they get the whole badge on black.

Writes favicon.svg, favicon.ico (16/32/48), apple-touch-icon.png (180),
icon-192.png, icon-512.png and site.webmanifest.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # trace_logo sits beside this file

import cv2
import numpy as np
from PIL import Image

import trace_logo as tl

UP = tl.UP
BG = '#050506'
S_SEED, N_SEED = (90, 122), (268, 178)   # a point inside the S and inside the N, badge pixels
S_CUT_X = 48                              # the S's own tail ends here; left of it is a speed streak
GAP = 6                                   # space between S and N at their closest, badge pixels
PAD = 0.1                                 # tile margin around the monogram, of the tile's side


def letter(score, seed, cut_x=None):
    """The score of one letter: the connected shape under `seed`, edges kept soft."""
    m = (score > 0.5).astype(np.uint8)
    _, lab = cv2.connectedComponents(m)
    keep = cv2.dilate((lab == lab[seed[1], seed[0]]).astype(np.uint8), np.ones((5, 5), np.uint8))
    out = score * keep
    if cut_x is not None:
        out[:, :cut_x] = 0
    return out


def bbox(m):
    ys, xs = np.nonzero(m)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def place_n(m_s, m_n):
    """Shift N left until it sits GAP badge-pixels from the S at their closest row."""
    rows = np.nonzero(m_s.any(1) & m_n.any(1))[0]
    s_right = np.array([np.nonzero(m_s[y])[0].max() for y in rows])
    n_left = np.array([np.nonzero(m_n[y])[0].min() for y in rows])
    return int((n_left - s_right).min() - GAP * UP)


def gradient_fill(h, stops, y0):
    """Per-row RGB for the badge's two-tone fill, rows in 8x pixels from y0."""
    ly0, ly1 = (v * UP for v in tl.LETTERS_Y)
    offs = np.array([float(o) for o, _ in stops])
    cols = np.array([[int(c[i:i + 2], 16) for i in (1, 3, 5)] for _, c in stops], float)
    t = np.clip((np.arange(h) + y0 - ly0) / (ly1 - ly0), 0, 1)
    return np.stack([np.interp(t, offs, cols[:, k]) for k in range(3)], 1)


def render_tile(m_s, m_n, side_px, rounded):
    """The monogram on a dark tile, as a PIL image `side_px` square."""
    both = m_s | m_n
    x0, y0, x1, y1 = bbox(both)
    w, h = x1 - x0, y1 - y0
    side = int(max(w, h) / (1 - 2 * PAD))
    ox, oy = (side - w) // 2 - x0, (side - h) // 2 - y0
    rgb = np.zeros((side, side, 3), float)
    rgb[:] = [int(BG[i:i + 2], 16) for i in (1, 3, 5)]
    for m, name in ((m_s, 'sim'), (m_n, 'now')):
        ys, xs = np.nonzero(m)
        fill = gradient_fill(m.shape[0], tl.FILLS[name], 0)
        rgb[ys + oy, xs + ox] = fill[ys]
    alpha = np.full((side, side), 255, np.uint8)
    if rounded:   # a rounded square, like an app tile
        r = int(side * 0.22)
        a = np.zeros((side, side), np.uint8)
        cv2.rectangle(a, (r, 0), (side - r, side), 255, -1)
        cv2.rectangle(a, (0, r), (side, side - r), 255, -1)
        for cx, cy in ((r, r), (side - r, r), (r, side - r), (side - r, side - r)):
            cv2.circle(a, (cx, cy), r, 255, -1, cv2.LINE_AA)
        alpha = a
    img = np.dstack([rgb.astype(np.uint8), alpha])
    return Image.fromarray(cv2.resize(img, (side_px, side_px), interpolation=cv2.INTER_AREA), 'RGBA'), (side, ox, oy)


def svg(m_s, m_n, side, ox, oy):
    s = side / UP
    grads = ''.join(
        f'<linearGradient id="sn-{n}" gradientUnits="userSpaceOnUse" x1="0" y1="{tl.LETTERS_Y[0]}" x2="0" y2="{tl.LETTERS_Y[1]}">'
        + ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in st) + '</linearGradient>'
        for n, st in tl.FILLS.items())
    vx, vy = -ox / UP, -oy / UP
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vx:.1f} {vy:.1f} {s:.1f} {s:.1f}">'
            f'<defs>{grads}</defs>'
            f'<rect x="{vx:.1f}" y="{vy:.1f}" width="{s:.1f}" height="{s:.1f}" rx="{s * 0.22:.1f}" fill="{BG}"/>'
            f'<path fill="url(#sn-sim)" fill-rule="evenodd" d="{tl.trace(m_s)}"/>'
            f'<path fill="url(#sn-now)" fill-rule="evenodd" d="{tl.trace(m_n)}"/>'
            '</svg>\n')


def badge_tile(src, side_px):
    """The whole badge, centred on black: for home screens, which are big enough to read it."""
    badge = Image.open(src).convert('RGBA')
    tile = Image.new('RGBA', (side_px, side_px), BG)
    w = int(side_px * 0.9)
    h = round(badge.height * w / badge.width)
    tile.alpha_composite(badge.resize((w, h), Image.LANCZOS), ((side_px - w) // 2, (side_px - h) // 2))
    return tile.convert('RGB')


def main():
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    white, red = tl.scores(Image.open(src))
    m_s = tl.mask(letter(white, S_SEED, S_CUT_X))
    m_n = tl.mask(letter(red, N_SEED))
    m_n = np.roll(m_n, -place_n(m_s, m_n), axis=1)

    tile, (side, ox, oy) = render_tile(m_s, m_n, 256, rounded=True)
    tile.save(os.path.join(out, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
    open(os.path.join(out, 'favicon.svg'), 'w').write(svg(m_s, m_n, side, ox, oy))

    badge_tile(src, 180).save(os.path.join(out, 'apple-touch-icon.png'), optimize=True)
    for px in (192, 512):
        badge_tile(src, px).save(os.path.join(out, f'icon-{px}.png'), optimize=True)
    manifest = {
        'name': 'SimNow', 'short_name': 'SimNow', 'start_url': '../../', 'display': 'browser',
        'background_color': BG, 'theme_color': '#030304',
        'icons': [{'src': f'icon-{px}.png', 'sizes': f'{px}x{px}', 'type': 'image/png'} for px in (192, 512)],
    }
    open(os.path.join(out, 'site.webmanifest'), 'w').write(json.dumps(manifest, indent=2) + '\n')
    print('wrote', ', '.join(sorted(os.listdir(out))))


if __name__ == '__main__':
    main()
