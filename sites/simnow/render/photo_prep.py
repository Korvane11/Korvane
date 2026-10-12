"""Grade the owner's SVJ photo for the site and write its web versions.

    python3 -I photo_prep.py upscaled.png SITE_ASSETS_DIR

Takes the 4x upscaled photo (see upscale.py) and writes:
    photo/svj.webp       full photo, graded, for large screens
    photo/svj-sm.webp    1080 px wide, for phones and the visit section
    photo/svj-card.webp  21:9 crop around the car for the race-nights card
    og.jpg               1200x630 social preview
"""
import os
import sys

import numpy as np
from PIL import Image

# Car bounds in the photo, as fractions (x0, y0, x1, y1).
CAR = (0.12, 0.44, 0.92, 0.75)


def grade(img, exposure=0.8, sat=0.78, contrast=0.4, vignette=0.38):
    """Moody: a little darker, less colour, deeper blacks, cool shadows."""
    a = np.asarray(img.convert('RGB'), dtype=np.float32) / 255.0
    h, w, _ = a.shape
    lin = a ** 2.2 * exposure
    x = np.clip(lin, 0, 1) ** (1 / 2.2)
    lum = (x @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32))[..., None]
    x = lum + (x - lum) * sat
    s = x * x * (3 - 2 * x)
    x = x + (s - x) * contrast
    x = np.clip((x - 0.02) / 0.98, 0, 1)
    shadow = (1 - x.mean(axis=2, keepdims=True)) ** 3
    x = x + shadow * np.array([-0.008, 0.0, 0.016], dtype=np.float32)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h * 0.58) / (h / 2)) ** 2) / np.sqrt(2)
    x = x * (1 - vignette * np.clip(r, 0, 1)[..., None] ** 2.2)
    return Image.fromarray((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8))


def crop_around(img, aspect, cx, cy, width_frac):
    w, h = img.size
    cw = int(w * width_frac)
    ch = int(cw / aspect)
    x0 = int(min(max(cx * w - cw / 2, 0), w - cw))
    y0 = int(min(max(cy * h - ch / 2, 0), h - ch))
    return img.crop((x0, y0, x0 + cw, y0 + ch))


def main():
    src, assets = sys.argv[1], sys.argv[2]
    os.makedirs(os.path.join(assets, 'photo'), exist_ok=True)
    img = Image.open(src).convert('RGB')
    g = grade(img)
    g.save(os.path.join(assets, 'photo', 'svj.webp'), 'WEBP', quality=84, method=6)
    w, h = g.size
    g.resize((1080, round(1080 * h / w)), Image.LANCZOS).save(os.path.join(assets, 'photo', 'svj-sm.webp'), 'WEBP', quality=82, method=6)
    cx = (CAR[0] + CAR[2]) / 2
    cy = (CAR[1] + CAR[3]) / 2
    card = crop_around(grade(img, exposure=0.62, sat=0.7, contrast=0.5, vignette=0.5), 21 / 9, cx, cy, 1.0)
    card.resize((1600, 686), Image.LANCZOS).save(os.path.join(assets, 'photo', 'svj-card.webp'), 'WEBP', quality=82, method=6)
    og = crop_around(g, 1200 / 630, cx, cy, 1.0)
    og.resize((1200, 630), Image.LANCZOS).save(os.path.join(assets, 'og.jpg'), 'JPEG', quality=86)
    print('ok', g.size)


if __name__ == '__main__':
    main()
