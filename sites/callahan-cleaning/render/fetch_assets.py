"""Download the Poly Haven (CC0) models, textures and HDRIs the scenes use.

    python3 render/fetch_assets.py [cache_dir]

Files land in cache_dir (default: render/cache, not committed). Every asset is
CC0 from polyhaven.com; the list is also in the site README (Licences).
"""
import json, os, sys, urllib.request

CACHE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'cache')
MODELS = ['potted_plant_04', 'ceramic_vase_01', 'ceramic_vase_02', 'ceramic_vase_04', 'modern_arm_chair_01',
          'modern_coffee_table_01', 'side_table_01', 'wooden_bowl_01',
          'cardboard_box_01', 'wicker_basket_02', 'throw_pillows_01', 'mid_century_lounge_chair', 'lemon']
TEXTURES = ['white_stucco', 'terracotta_floor_tiles', 'wood_floor', 'rough_linen', 'white_oak_veneer',
            'waffle_pique_cotton', 'marble_01', 'white_plaster_02']
HDRIS = ['goegap_road', 'kiara_1_dawn']
RES = '2k'
UA = {'User-Agent': 'korvane-site-render/1.0 (static site build)'}


def get(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r, open(dest + '.part', 'wb') as f:
        f.write(r.read())
    os.replace(dest + '.part', dest)


def files(asset):
    with urllib.request.urlopen(urllib.request.Request('https://api.polyhaven.com/files/' + asset, headers=UA)) as r:
        return json.load(r)


for m in MODELS:
    fm = files(m)
    if 'gltf' not in fm:
        print('model', m, 'has no glTF; skipped', list(fm))
        continue
    g = fm['gltf'][RES]['gltf']
    d = os.path.join(CACHE, 'models', m)
    get(g['url'], os.path.join(d, os.path.basename(g['url'])))
    for rel, inc in g.get('include', {}).items():
        get(inc['url'], os.path.join(d, rel))
    print('model', m)

for t in TEXTURES:
    f = files(t)
    d = os.path.join(CACHE, 'textures', t)
    for kind in ('Diffuse', 'nor_gl', 'Rough', 'Displacement', 'AO'):
        if kind in f and RES in f[kind]:
            u = f[kind][RES]['jpg']['url'] if 'jpg' in f[kind][RES] else f[kind][RES]['png']['url']
            get(u, os.path.join(d, kind + os.path.splitext(u)[1]))
    print('texture', t, sorted(os.listdir(d)))

for h in HDRIS:
    u = files(h)['hdri'][RES]['hdr']['url']
    get(u, os.path.join(CACHE, 'hdri', h + '.hdr'))
    print('hdri', h)
