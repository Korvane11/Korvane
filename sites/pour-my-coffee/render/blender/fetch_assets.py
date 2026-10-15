"""Download the Poly Haven (CC0) texture and HDRI the Blender scene uses.

    python3 -I render/blender/fetch_assets.py [cache_dir]      (default: render/blender/cache, not committed)
"""
import json, os, sys, urllib.request

CACHE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cache')
TEXTURES = ['white_oak_veneer']
HDRIS = ['kiara_interior']
RES = '2k'
UA = {'User-Agent': 'korvane-site-render/1.0 (static site build)'}


def get(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r, open(dest + '.part', 'wb') as f:
        f.write(r.read())
    os.replace(dest + '.part', dest)
    print('got', dest)


def files(asset):
    with urllib.request.urlopen(urllib.request.Request('https://api.polyhaven.com/files/' + asset, headers=UA)) as r:
        return json.load(r)


for t in TEXTURES:
    f = files(t)
    for m in ('Diffuse', 'Rough', 'nor_gl'):
        if m in f:
            u = f[m][RES]['jpg']['url']
            get(u, os.path.join(CACHE, 'textures', t, os.path.basename(u)))
for h in HDRIS:
    u = files(h)['hdri'][RES]['hdr']['url']
    get(u, os.path.join(CACHE, 'hdri', os.path.basename(u)))
