"""The drink stills for the pages, from the Blender scene, plus the share image.

    python3 render/blender/stills.py <work dir>      (about 6 min; run when no render is running)

  assets/photos/pour-still.*  mid-pour, 4:5 (Home, "Great coffee. Amazing service.")
  assets/photos/cup-still.*   the full cup, steam rising, 4:3 (About us)
  assets/brand/og.jpg         1200x630, the hero still with their logo (make_og.cjs)
"""
import os, subprocess, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(HERE, '..', '..')
work = sys.argv[1]
os.makedirs(work, exist_ok=True)


def still(t):
    subprocess.run([sys.executable, os.path.join(HERE, 'scene.py'), work, '--mode', 'still', '--t', str(t),
                    '--size', '1200', '--samples', '48'], check=True, stdout=subprocess.DEVNULL)
    return Image.open(os.path.join(work, f'still-{t:.2f}.png')).convert('RGB')


def save(im, name):
    im.save(os.path.join(SITE, 'assets', 'photos', name + '.jpg'), quality=86, optimize=True, progressive=True)
    im.save(os.path.join(SITE, 'assets', 'photos', name + '.webp'), quality=80)


a = still(2.9)                       # the stream in, the swirl spiralling round it
save(a.crop((480, 250, 1200, 1150)).resize((960, 1200), Image.LANCZOS), 'pour-still')   # 4:5, tight on the cup and stream
b = still(6.5)                       # full, still, steam (loop time 0.5 s)
save(b.crop((0, 300, 1200, 1200)), 'cup-still')            # 1200x900
subprocess.run(['node', os.path.join(HERE, 'make_og.cjs')], check=True)
print('stills and og done')
