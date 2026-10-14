"""The five service stills, each a room of the same Tucson house as the opening
(same plaster, tile, vigas, window and morning sun). Called by scene.py:

    python3 render/scene.py <living|kitchen|moving|rental|office> <out_dir> [--samples N] [--layout land|port]

Every still is 1600 x 1067 (3:2) unless --layout port (1067 x 1600).
"""
import math, os
import bpy
from mathutils import Vector


def _render(S, out, name, layout):
    sc = bpy.context.scene
    if layout == 'port':
        sc.render.resolution_x, sc.render.resolution_y = 1067, 1600
    else:
        sc.render.resolution_x, sc.render.resolution_y = 1600, 1067
    sc.render.filepath = os.path.join(out, f'{name}-{layout}.png')
    bpy.ops.render.render(write_still=True)
    print('still', name, layout, flush=True)


def _light(S, sun_dir=None, strength=10.0, haze=0.010):
    S.world('goegap_road', strength=1.1, rot=math.radians(200))
    S.sun(sun_dir or S.SUN_DIR, strength)
    if haze:
        S.haze(haze, (S.X0 - 0.02, S.Y0, 0.0), (S.X1, S.Y1, S.H))


def _open_blinds(S, M, angle=-16):
    slats = S.build_blinds(M)
    S.set_blinds(slats, math.radians(angle))
    S.build_canopy(M)
    return slats


# ---------------------------------------------------------------- regular cleaning: the living room, up close
def living(S, out, layout):
    M = S.make_mats()
    S.living_room(M)
    _open_blinds(S, M)
    _light(S)
    if layout == 'port':
        S.camera((0.95, 1.7, 0.78), (-0.15, 4.4, 0.55), lens=40, fstop=2.8, focus=3.0)
    else:
        S.camera((1.25, 1.55, 0.86), (-0.35, 4.3, 0.5), lens=35, fstop=2.8, focus=3.15)
    _render(S, out, 'living', layout)


# ---------------------------------------------------------------- deep cleaning: the kitchen island, marble
def kitchen(S, out, layout):
    M = S.make_mats()
    S.build_room(M)
    _open_blinds(S, M, angle=-12)
    marble = S.tex_material('marble', 'marble_01', scale=0.55, box=True, bump=0.1,
                            rough_mul=0.15, rough_add=0.02, coat=0.8, sat=0.12, val=1.32)
    cab = S.plain_material('cabinet', (0.80, 0.78, 0.73), rough=0.38)
    bronze = M['frame']
    # the island: a base, door fronts with shadow gaps, a thick marble top
    x, y = 0.15, 3.0
    w, d, h = 2.4, 0.95, 0.88
    S.box('island_base', (w - 0.04, d - 0.06, h - 0.1), (x, y, (h - 0.1) / 2 + 0.06), cab, bevel=0.004)
    S.box('island_kick', (w - 0.12, d - 0.16, 0.08), (x, y, 0.04), M['plinth'])
    n = 4
    for i in range(n):
        dx = x - w / 2 + (i + 0.5) * w / n
        S.box(f'door_{i}', (w / n - 0.006, 0.02, h - 0.12), (dx, y - d / 2 + 0.03, 0.06 + (h - 0.1) / 2), cab, bevel=0.003)
        S.box(f'pull_{i}', (0.012, 0.025, 0.22), (dx + (0.18 if i % 2 else -0.18), y - d / 2 + 0.01, h - 0.2), bronze, bevel=0.004)
    S.box('island_top', (w + 0.08, d + 0.06, 0.045), (x, y, h + 0.0225), marble, bevel=0.006, segs=4)
    # tap: a bronze arc
    cu = bpy.data.curves.new('tap', 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = 0.012
    cu.bevel_resolution = 6
    sp = cu.splines.new('BEZIER')
    sp.bezier_points.add(2)
    pts = [(x + 0.55, y + 0.25, h + 0.045), (x + 0.55, y + 0.25, h + 0.42), (x + 0.55, y + 0.02, h + 0.30)]
    for bp, p in zip(sp.bezier_points, pts):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    tap = bpy.data.objects.new('tap', cu)
    bpy.context.scene.collection.objects.link(tap)
    tap.data.materials.append(bronze)
    # on the counter: a wooden bowl of lemons, a white jug, a folded linen cloth
    S.load_model('wooden_bowl_01', (x - 0.45, y - 0.1, h + 0.045), rot_z=0.4, scale=1.1)
    for i, (lx, ly, lz, rz) in enumerate([(-0.48, -0.12, 0.03, 0.2), (-0.38, -0.05, 0.035, 1.3), (-0.46, 0.0, 0.07, 2.1)]):
        S.load_model('lemon', (x + lx, y + ly, h + 0.045 + lz), rot_z=rz, height=0.065)
    S.load_model('ceramic_vase_02', (x - 0.85, y + 0.2, h + 0.045), rot_z=0.6, height=0.3, mat=M['glaze_white'])
    S.cushion('cloth', (0.3, 0.2, 0.012), (x + 0.05, y - 0.22, h + 0.051), M['teal'], soft=0.004, sag=0.002, rot=(0, 0, 0.18))
    # back wall: an open oak shelf with a few pieces
    S.box('shelf', (1.6, 0.26, 0.05), (0.4, S.Y1 - 0.13, 1.55), M['oak'], bevel=0.005)
    S.load_model('ceramic_vase_01', (0.0, S.Y1 - 0.13, 1.575), rot_z=0.2, height=0.3, mat=M['glaze_white'])
    S.load_model('ceramic_vase_04', (0.35, S.Y1 - 0.12, 1.575), rot_z=1.0, height=0.24, mat=M['glaze_teal'])
    S.load_model('potted_plant_04', (-2.35, 4.3, 0.0), rot_z=0.6, height=1.15)
    _light(S, strength=10.0, haze=0.008)
    if layout == 'port':
        S.camera((0.75, 1.75, 1.12), (-0.3, 2.95, 0.93), lens=40, fstop=2.2)
    else:
        S.camera((1.05, 1.75, 1.13), (-0.42, 3.0, 0.92), lens=38, fstop=2.2)
    _render(S, out, 'kitchen', layout)


# ---------------------------------------------------------------- move-in / move-out: the empty room, boxes, light
def moving(S, out, layout):
    M = S.make_mats()
    S.build_room(M)
    _open_blinds(S, M, angle=-18)
    for i, (bx, by, bz, rz, hgt) in enumerate([(0.55, 4.55, 0.0, 0.05, 0.44), (1.2, 4.5, 0.0, -0.08, 0.44),
                                                (0.85, 4.52, 0.44, 0.2, 0.40), (1.6, 3.95, 0.0, 0.5, 0.36)]):
        S.load_model('cardboard_box_01', (bx, by, bz), rot_z=rz, height=hgt)
    S.load_model('wicker_basket_02', (-1.9, 4.6, 0.0), rot_z=0.2, height=0.3)
    _light(S, strength=11.0, haze=0.008)
    if layout == 'port':
        S.camera((2.0, 1.3, 0.85), (-0.2, 4.2, 0.55), lens=30, fstop=3.5)
    else:
        S.camera((2.55, 1.2, 0.9), (-0.5, 4.2, 0.55), lens=28, fstop=3.5)
    _render(S, out, 'moving', layout)


# ---------------------------------------------------------------- Airbnb and vacation rentals: a made bed, towels
def rental(S, out, layout):
    M = S.make_mats()
    S.build_room(M)
    _open_blinds(S, M, angle=-14)
    white = S.linen('sheet', (0.93, 0.92, 0.89), scale=4.5)
    towel = S.tex_material('towel', 'waffle_pique_cotton', scale=6.0, bump=0.9, sat=0.0, val=1.25, tint=(0.97, 0.96, 0.93))
    x, y = 0.7, 4.0
    # oak platform, headboard against the back wall
    S.box('bed_frame', (1.78, 2.12, 0.26), (x, y - 0.05, 0.13), M['oak'], bevel=0.012)
    S.box('headboard', (1.9, 0.07, 0.95), (x, S.Y1 - 0.04, 0.475), M['oak'], bevel=0.012)
    S.cushion('mattress', (1.6, 2.0, 0.24), (x, y - 0.05, 0.38), white, soft=0.05, sag=0.004)
    # the duvet drapes over the mattress's sides and foot, with a folded-back top
    S.cushion('duvet', (1.78, 1.62, 0.36), (x, y - 0.27, 0.36), white, soft=0.09, sag=0.035)
    S.cushion('duvet_fold', (1.76, 0.34, 0.1), (x, y + 0.38, 0.565), white, soft=0.05, sag=0.02, rot=(math.radians(-4), 0, 0))
    for sx in (-0.4, 0.4):
        S.cushion(f'pillow_{sx}', (0.66, 0.45, 0.17), (x + sx, y + 0.72, 0.6), white, soft=0.08, sag=0.02, rot=(math.radians(-18), 0, 0))
    S.cushion('accent', (0.48, 0.13, 0.32), (x, y + 0.55, 0.66), M['teal'], soft=0.06, sag=0.012, rot=(math.radians(-14), 0, 0))
    S.cushion('throw', (1.84, 0.46, 0.06), (x, y - 0.78, 0.545), M['clay'], soft=0.028, sag=0.016)
    # folded towels at the foot, for the next guests
    for i in range(3):
        S.cushion(f'towel_{i}', (0.36, 0.26, 0.055), (x + 0.42, y - 0.5, 0.6 + i * 0.055), towel, soft=0.022, sag=0.003, rot=(0, 0, 0.12 - i * 0.04))
    for sx in (-1, 1):
        S.load_model('side_table_01', (x + sx * 1.22, S.Y1 - 0.35, 0.0), rot_z=0.0, height=0.5)
    S.load_model('ceramic_vase_01', (x - 1.22, S.Y1 - 0.35, 0.5), rot_z=0.3, height=0.34, mat=M['glaze_white'])
    S.load_model('ceramic_vase_04', (x + 1.22, S.Y1 - 0.35, 0.5), rot_z=1.0, height=0.26, mat=M['glaze_teal'])
    S.load_model('potted_plant_04', (-2.35, 4.4, 0.0), rot_z=0.6, height=1.15)
    _light(S, strength=10.0, haze=0.008)
    if layout == 'port':
        S.camera((1.85, 1.75, 1.1), (0.45, 3.95, 0.55), lens=36, fstop=3.0)
    else:
        S.camera((2.15, 1.6, 1.15), (0.25, 3.95, 0.55), lens=34, fstop=3.0)
    _render(S, out, 'rental', layout)


# ---------------------------------------------------------------- commercial and offices: a clear desk
def office(S, out, layout):
    M = S.make_mats()
    S.build_room(M)
    _open_blinds(S, M, angle=-16)
    x, y = 0.6, 3.7
    S.box('desk_top', (1.7, 0.8, 0.04), (x, y, 0.74), M['oak'], bevel=0.006)
    for sx in (-1, 1):
        S.box(f'desk_leg_{sx}', (0.04, 0.72, 0.72), (x + sx * 0.8, y, 0.36), M['frame'], bevel=0.003)
    S.box('notebook', (0.3, 0.22, 0.014), (x + 0.25, y - 0.12, 0.767), S.plain_material('cover', (0.04, 0.2, 0.21), rough=0.6), bevel=0.003)
    S.box('paper', (0.21, 0.29, 0.002), (x - 0.25, y - 0.08, 0.761), S.plain_material('paper', (0.92, 0.91, 0.88), rough=0.7), rot=(0, 0, 0.1))
    S.load_model('ceramic_vase_04', (x - 0.62, y + 0.18, 0.76), rot_z=1.0, height=0.26, mat=M['glaze_teal'])
    S.load_model('wooden_bowl_01', (x + 0.55, y + 0.15, 0.76), rot_z=0.4, scale=0.75)
    S.load_model('modern_arm_chair_01', (x, y + 0.75, 0.0), rot_z=math.radians(180), height=0.86)
    S.load_model('mid_century_lounge_chair', (2.3, 2.5, 0.0), rot_z=math.radians(120), height=0.95)
    S.load_model('side_table_01', (2.5, 3.4, 0.0), height=0.5)
    S.load_model('potted_plant_04', (-2.35, 4.4, 0.0), rot_z=0.6, height=1.2)
    S.cushion('rug', (2.6, 1.8, 0.012), (0.8, 3.4, 0.006), M['rug'], soft=0.004, sag=0.0)
    _light(S, strength=10.0, haze=0.01)
    if layout == 'port':
        S.camera((1.6, 2.0, 1.15), (0.35, 3.75, 0.8), lens=36, fstop=3.0)
    else:
        S.camera((1.9, 1.85, 1.18), (0.2, 3.8, 0.78), lens=34, fstop=3.0)
    _render(S, out, 'office', layout)


def render(shot, out, layout, S):
    S.setup_render(layout, bpy.context.scene.cycles.samples, bpy.context.scene.render.resolution_percentage,
                   exposure=bpy.context.scene.view_settings.exposure)
    globals()[shot](S, out, layout)
