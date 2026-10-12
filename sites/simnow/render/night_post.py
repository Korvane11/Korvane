"""Grade the night-drive frames and encode the background videos.

    python3 -I night_post.py RAW_DIR SITE_ASSETS_DIR

RAW_DIR holds night_0001.png .. night_0192.png and night.json from
night_drive.py. Writes into SITE_ASSETS_DIR:
    drive/intro-{1280,854}.{mp4,webm}           lights-on intro, plays once
    drive/loop-{1280,854}.{mp4,webm}            seamless loop, plays forever
    drive/poster.webp                            first loop frame (no-video fallback)
    drive/card.webp                              a later loop frame for the race-nights card
    og.jpg                                       social preview
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ProcessPoolExecutor

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from post import grade  # noqa: E402


def grade_one(args):
    src, dst = args
    grade(Image.open(src)).save(dst, 'PNG', compress_level=1)


def encode(frames_dir, first, count, out, width, crf):
    """H.264 MP4 (Safari, Chrome, Edge, Firefox) or VP9 WebM (browsers without H.264)."""
    cmd = ['ffmpeg', '-v', 'error', '-y', '-framerate', '24', '-start_number', str(first),
           '-i', os.path.join(frames_dir, 'g_%04d.png'), '-frames:v', str(count),
           '-vf', f'scale={width}:-2:flags=lanczos', '-pix_fmt', 'yuv420p', '-an']
    if out.endswith('.webm'):
        cmd += ['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', str(crf + 9), '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', out]
    else:
        cmd += ['-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf), '-profile:v', 'high', '-movflags', '+faststart', out]
    subprocess.run(cmd, check=True)


def main():
    raw, assets = sys.argv[1], sys.argv[2]
    meta = json.load(open(os.path.join(raw, 'night.json')))
    i0, i1 = meta['intro']
    l0, l1 = meta['loop']
    out = os.path.join(assets, 'drive')
    os.makedirs(out, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix='night_graded_')
    try:
        jobs = [(os.path.join(raw, 'night_%04d.png' % f), os.path.join(tmp, 'g_%04d.png' % f)) for f in range(i0, l1 + 1)]
        missing = [s for s, _ in jobs if not os.path.exists(s)]
        if missing:
            sys.exit(f'{len(missing)} frames missing, first {missing[0]}')
        with ProcessPoolExecutor() as ex:
            list(ex.map(grade_one, jobs, chunksize=4))
        for width, crf in ((1280, 23), (854, 26)):
            for ext in ('mp4', 'webm'):
                encode(tmp, i0, i1 - i0 + 1, os.path.join(out, f'intro-{width}.{ext}'), width, crf)
                encode(tmp, l0, l1 - l0 + 1, os.path.join(out, f'loop-{width}.{ext}'), width, crf)
        first = Image.open(os.path.join(tmp, 'g_%04d.png' % l0))
        first.save(os.path.join(out, 'poster.webp'), 'WEBP', quality=82, method=6)
        mid = Image.open(os.path.join(tmp, 'g_%04d.png' % (l0 + (l1 - l0) // 2)))
        mid.save(os.path.join(out, 'card.webp'), 'WEBP', quality=82, method=6)
        w, h = first.size
        ch = int(w * 630 / 1200)
        first.crop((0, (h - ch) // 2, w, (h - ch) // 2 + ch)).resize((1200, 630), Image.LANCZOS).save(
            os.path.join(assets, 'og.jpg'), 'JPEG', quality=86)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    for name in sorted(os.listdir(out)):
        print(name, os.path.getsize(os.path.join(out, name)) // 1024, 'KB')


if __name__ == '__main__':
    main()
