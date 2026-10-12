"""Grade the raw Cycles frames and write the web versions.

    python3 post.py RAW_DIR SITE_ASSETS_DIR

RAW_DIR holds intro_####.png, story_####.png, intro.json, story.json and an
hd/ folder with the 1920x1080 key shots (test_0002..0007.png).

Writes into SITE_ASSETS_DIR:
    film/lg/{intro,story}_####.webp   1280x720 frames for large screens
    film/sm/{intro,story}_####.webp    960x540 frames for phones
    film/hd/{hero,headlight,...}.webp 1920x1080 stills shown while a chapter holds
    film/manifest.json                frame counts, key frames and focus points
    stills/*.webp                     1600x900 stills for the page sections
"""
import json
import os
import sys
from concurrent.futures import ProcessPoolExecutor

import numpy as np
from PIL import Image, ImageFilter

KEY_NAMES = ['hero', 'headlight', 'wheel', 'flank', 'rear', 'profile']


def grade(img):
    """Contrast, bloom, a cool shadow tint and a soft vignette."""
    a = np.asarray(img.convert('RGB'), dtype=np.float32) / 255.0
    h, w, _ = a.shape
    lin = a ** 2.2

    # bloom from the brightest parts (lamps, lit lenses, hot reflections)
    lum = lin @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    mask = np.clip((lum - 0.55) / 0.45, 0, 1)[..., None]
    bright = Image.fromarray((np.clip(lin * mask, 0, 1) ** (1 / 2.2) * 255).astype(np.uint8))
    small = bright.resize((max(1, w // 4), max(1, h // 4)), Image.BILINEAR)
    glow = np.zeros_like(lin)
    for radius, weight in ((w / 400, 0.55), (w / 140, 0.35), (w / 50, 0.25)):
        b = small.filter(ImageFilter.GaussianBlur(radius)).resize((w, h), Image.BILINEAR)
        glow += (np.asarray(b, dtype=np.float32) / 255.0) ** 2.2 * weight
    lin = lin + glow * np.array([1.0, 0.97, 0.95], dtype=np.float32)

    x = np.clip(lin, 0, None) ** (1 / 2.2)
    x = np.clip(x, 0, 1)
    # S-curve and deeper blacks
    s = x * x * (3 - 2 * x)
    x = x + (s - x) * 0.45
    x = np.clip((x - 0.018) / (1 - 0.018), 0, 1)
    # cool shadows, neutral highlights
    l = x.mean(axis=2, keepdims=True)
    shadow = (1 - l) ** 3
    x = x + shadow * np.array([-0.006, 0.0, 0.012], dtype=np.float32)
    # vignette
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / np.sqrt(2)
    x = x * (1 - 0.42 * r[..., None] ** 2.4)
    return Image.fromarray((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8))


def frame_job(args):
    src, out_lg, out_sm = args
    if os.path.exists(out_lg) and os.path.exists(out_sm):
        return
    g = grade(Image.open(src))
    g.save(out_lg, 'WEBP', quality=80, method=5)
    g.resize((960, 540), Image.LANCZOS).save(out_sm, 'WEBP', quality=76, method=5)


def still_job(args):
    src, out_hd, out_still, out_hd_sm = args
    g = grade(Image.open(src))
    g.save(out_hd, 'WEBP', quality=84, method=5)
    g.resize((1280, 720), Image.LANCZOS).save(out_hd_sm, 'WEBP', quality=80, method=5)
    if out_still:
        g.resize((1600, 900), Image.LANCZOS).save(out_still, 'WEBP', quality=80, method=5)
        if out_still.endswith('hero.webp'):
            # social preview: 1200x630 crop of the hero shot
            w, h = g.size
            ch = int(w * 630 / 1200)
            g.crop((0, (h - ch) // 2, w, (h - ch) // 2 + ch)).resize((1200, 630), Image.LANCZOS).save(
                os.path.join(os.path.dirname(out_still), '..', 'og.jpg'), 'JPEG', quality=86)


def main():
    raw, assets = sys.argv[1], sys.argv[2]
    film = os.path.join(assets, 'film')
    for d in ('lg', 'sm', 'hd'):
        os.makedirs(os.path.join(film, d), exist_ok=True)
    os.makedirs(os.path.join(assets, 'stills'), exist_ok=True)

    manifest = {'sequences': {}, 'stills': {}}
    jobs = []
    for seq in ('intro', 'story'):
        meta_path = os.path.join(raw, seq + '.json')
        if not os.path.exists(meta_path):
            continue
        meta = json.load(open(meta_path))
        count = 0
        for i in range(meta['frames']):
            src = os.path.join(raw, '%s_%04d.png' % (seq, i))
            if not os.path.exists(src):
                break
            count += 1
            name = '%s_%04d.webp' % (seq, i)
            jobs.append((src, os.path.join(film, 'lg', name), os.path.join(film, 'sm', name)))
        manifest['sequences'][seq] = {'frames': count, 'focus': meta['focus'][:count]}

    still_jobs = []
    for k, name in enumerate(KEY_NAMES):
        src = os.path.join(raw, 'hd', 'test_%04d.png' % (k + 2))
        if os.path.exists(src):
            still_jobs.append((src, os.path.join(film, 'hd', name + '.webp'),
                               os.path.join(assets, 'stills', name + '.webp'),
                               os.path.join(film, 'hd', name + '-sm.webp')))
            manifest['stills'][name] = True

    with ProcessPoolExecutor() as ex:
        list(ex.map(frame_job, jobs, chunksize=4))
        list(ex.map(still_job, still_jobs))

    import shots  # key frame indices of the story
    keys, acc = [0], 0
    for n in shots.STORY_FRAMES:
        acc += n
        keys.append(acc)
    manifest['storyKeys'] = keys
    manifest['keyNames'] = KEY_NAMES
    with open(os.path.join(film, 'manifest.json'), 'w') as fh:
        json.dump(manifest, fh, separators=(',', ':'))
    print('frames', len(jobs), 'stills', len(still_jobs))


if __name__ == '__main__':
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    main()
