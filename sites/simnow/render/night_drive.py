"""SimNow background: the matte black SVJ driving down a wet highway at night.

    python -I night_drive.py -- MODEL.gltf OUT_DIR [first last] [--res 1280x720] [--samples 24]

Frames 1..48 are the intro: black, the daytime running lights flicker on,
the headlight beams hit the road, then the street lights switch on down the
road. Frames 49..192 are a seamless loop: everything that moves repeats every
144 m of road, so frame 193 would equal frame 49.

The car stays at the origin (nose toward -X) and the world slides past it:
the road, its markings, the guardrail posts and the street lights are
parented to a "Mover" that travels +X at SPEED. The camera tracks just ahead
of the car with a gentle, loop-periodic sway. Motion blur on.

Reuses the car set-up (materials, SVJ wing and splitter) from svj_studio.py.
"""
import json
import math
import os
import random
import sys
import time

import bpy
import bmesh
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import svj_studio as S  # noqa: E402

FPS = 24
INTRO = 48                      # frames 1..48
LOOP = 144                      # frames 49..192 (6 s)
F0 = INTRO + 1
F_END = INTRO + LOOP
SPEED = 24.0                    # m/s, about 86 km/h
PERIOD = SPEED * LOOP / FPS     # 144 m: the repeat length of everything that moves
LAMP_GAP = 36.0                 # divides PERIOD (144 m)
DASH = 12.0                     # dash + gap, divides PERIOD
POST_GAP = 4.0                  # guardrail posts, divides PERIOD
LANE = 3.7
TAU = math.tau


def t_of(f):
    """Seconds since the loop starts (negative during the intro)."""
    return (f - F0) / FPS


def keyed(f, keys):
    if f <= keys[0][0]:
        return keys[0][1]
    for (f0, v0), (f1, v1) in zip(keys, keys[1:]):
        if f <= f1:
            return v0 + (v1 - v0) * (f - f0) / (f1 - f0)
    return keys[-1][1]


def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


# --------------------------------------------------------------------------
# node helpers

class Nodes:
    def __init__(self, mat):
        mat.use_nodes = True
        self.nt = mat.node_tree
        self.nt.nodes.clear()

    def new(self, kind, **inputs):
        n = self.nt.nodes.new(kind)
        for k, v in inputs.items():
            if k.startswith('_'):
                setattr(n, k[1:], v)
            else:
                n.inputs[k].default_value = v
        return n

    def link(self, a, b):
        self.nt.links.new(a, b)

    def math(self, op, a, b=None, clamp=False):
        n = self.nt.nodes.new('ShaderNodeMath')
        n.operation = op
        n.use_clamp = clamp
        for i, v in enumerate((a, b)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                self.link(v, n.inputs[i])
        return n.outputs[0]


def road_material():
    """Wet asphalt with lane markings, periodic along X so the loop is seamless."""
    mat = bpy.data.materials.new('WetRoad')
    N = Nodes(mat)
    out = N.new('ShaderNodeOutputMaterial')
    bsdf = N.new('ShaderNodeBsdfPrincipled')
    N.link(bsdf.outputs[0], out.inputs['Surface'])
    tc = N.new('ShaderNodeTexCoord')
    sep = N.new('ShaderNodeSeparateXYZ')
    N.link(tc.outputs['Object'], sep.inputs[0])
    x, y = sep.outputs['X'], sep.outputs['Y']

    # tube mapping: noise sampled on a cylinder of circumference PERIOD
    R = PERIOD / TAU
    theta = N.math('MULTIPLY', x, TAU / PERIOD)
    cx = N.math('MULTIPLY', N.math('COSINE', theta), R)
    cy = N.math('MULTIPLY', N.math('SINE', theta), R)
    comb = N.new('ShaderNodeCombineXYZ')
    N.link(cx, comb.inputs['X'])
    N.link(cy, comb.inputs['Y'])
    N.link(y, comb.inputs['Z'])
    p = comb.outputs[0]

    grain = N.new('ShaderNodeTexNoise', Scale=7.0, Detail=10.0, Roughness=0.6)
    N.link(p, grain.inputs['Vector'])
    puddle = N.new('ShaderNodeTexNoise', Scale=0.16, Detail=4.0, Roughness=0.55)
    N.link(p, puddle.inputs['Vector'])
    wet = N.new('ShaderNodeMapRange')
    wet.inputs['From Min'].default_value = 0.42
    wet.inputs['From Max'].default_value = 0.56
    N.link(puddle.outputs['Fac'], wet.inputs['Value'])

    # lane markings: dashed lines between lanes, solid edge lines
    ay = N.math('ABSOLUTE', y)
    dash_band = N.math('LESS_THAN', N.math('ABSOLUTE', N.math('SUBTRACT', ay, LANE / 2)), 0.075)
    dash_on = N.math('LESS_THAN', N.math('FRACT', N.math('DIVIDE', x, DASH)), 0.3)
    dashes = N.math('MULTIPLY', dash_band, dash_on)
    edge = N.math('LESS_THAN', N.math('ABSOLUTE', N.math('SUBTRACT', ay, LANE * 1.5)), 0.085)
    paint = N.math('MAXIMUM', dashes, edge)
    # shoulder beyond the edge lines is rougher and darker
    shoulder = N.math('GREATER_THAN', ay, LANE * 1.5 + 0.1)

    ramp = N.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (0.016, 0.016, 0.017, 1)
    ramp.color_ramp.elements[1].color = (0.045, 0.044, 0.043, 1)
    N.link(grain.outputs['Fac'], ramp.inputs['Fac'])
    wet_dark = N.new('ShaderNodeMix', _data_type='RGBA', _blend_type='MULTIPLY')
    wet_dark.inputs['B'].default_value = (0.55, 0.55, 0.55, 1)
    N.link(wet.outputs['Result'], wet_dark.inputs['Factor'])
    N.link(ramp.outputs['Color'], wet_dark.inputs['A'])
    with_paint = N.new('ShaderNodeMix', _data_type='RGBA')
    with_paint.inputs['B'].default_value = (0.42, 0.42, 0.40, 1)
    N.link(paint, with_paint.inputs['Factor'])
    N.link(wet_dark.outputs['Result'], with_paint.inputs['A'])
    N.link(with_paint.outputs['Result'], bsdf.inputs['Base Color'])

    # roughness: mostly wet (it has been raining), puddles are mirrors
    rough = N.new('ShaderNodeMapRange')
    rough.inputs['To Min'].default_value = 0.22
    rough.inputs['To Max'].default_value = 0.02
    N.link(wet.outputs['Result'], rough.inputs['Value'])
    r = N.math('ADD', rough.outputs['Result'], N.math('MULTIPLY', paint, 0.18))
    r = N.math('ADD', r, N.math('MULTIPLY', shoulder, 0.25))
    N.link(r, bsdf.inputs['Roughness'])

    bump = N.new('ShaderNodeBump', Distance=0.003)
    dry = N.math('SUBTRACT', 1.0, wet.outputs['Result'])
    N.link(N.math('MULTIPLY', dry, 0.4), bump.inputs['Strength'])
    N.link(grain.outputs['Fac'], bump.inputs['Height'])
    N.link(bump.outputs['Normal'], bsdf.inputs['Normal'])
    bsdf.inputs['Specular IOR Level'].default_value = 0.6
    return mat


def simple_material(name, base, rough=0.5, metal=0.0, emit=None, strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    b = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (*base, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = strength
    return mat, b


def box(name, size, loc, mat, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, scale=size)
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(mat)
    if parent:
        o.parent = parent
    return o


# --------------------------------------------------------------------------
# world

def build_world():
    sc = bpy.context.scene
    ctl = {}
    mover = bpy.data.objects.new('Mover', None)
    sc.collection.objects.link(mover)
    ctl['mover'] = mover

    # road: long enough to cover the view for every offset the loop reaches
    road_mat = road_material()
    bm = bmesh.new()
    x0, x1, half = -470.0, 90.0, 13.0
    v = [bm.verts.new(p) for p in ((x0, -half, 0), (x1, -half, 0), (x1, half, 0), (x0, half, 0))]
    bm.faces.new(v)
    me = bpy.data.meshes.new('Road')
    bm.to_mesh(me)
    bm.free()
    road = bpy.data.objects.new('Road', me)
    road.data.materials.append(road_mat)
    road.parent = mover
    sc.collection.objects.link(road)

    # dark ground beyond the road (uniform, so it can stay still)
    ground_mat, _ = simple_material('Ground', (0.006, 0.006, 0.007), rough=0.9)
    bpy.ops.mesh.primitive_plane_add(size=3000, location=(0, 0, -0.02))
    bpy.context.active_object.data.materials.append(ground_mat)

    # guardrails: the rail is uniform along X (static); the posts move
    steel, _ = simple_material('Steel', (0.42, 0.43, 0.45), rough=0.32, metal=1.0)
    for side in (-1, 1):
        box('Rail', (600, 0.06, 0.32), (-200, side * 7.35, 0.62), steel)
        post = box('Posts', (0.09, 0.09, 0.75), (x0 + 2, side * 7.45, 0.37), steel, mover)
        arr = post.modifiers.new('arr', 'ARRAY')
        arr.count = int((x1 - x0) / POST_GAP)
        arr.use_relative_offset = False
        arr.use_constant_offset = True
        arr.constant_offset_displace = (POST_GAP / 0.09, 0, 0)  # local space, post is scaled 0.09 in X

    # street lights on both sides, staggered
    pole_mat, _ = simple_material('Pole', (0.05, 0.05, 0.055), rough=0.4, metal=0.6)
    lamps = []
    for side in (-1, 1):
        k = math.floor(x0 / LAMP_GAP)
        while k * LAMP_GAP < x1:
            lx = k * LAMP_GAP + (LAMP_GAP / 2 if side < 0 else 0.0)
            k += 1
            if not (x0 <= lx <= x1):
                continue
            py = side * 8.4
            bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=9.0, location=(lx, py, 4.5))
            pole = bpy.context.active_object
            pole.data.materials.append(pole_mat)
            pole.parent = mover
            box('Arm', (0.12, 2.6, 0.1), (lx, py - side * 1.3, 8.95), pole_mat, mover)
            head_y = py - side * 2.5
            mat, bsdf = simple_material('LampHead', (0.05, 0.05, 0.05), rough=0.3,
                                        emit=(1.0, 0.86, 0.68), strength=0.0)
            head = box('LampHead', (0.7, 0.32, 0.1), (lx, head_y, 8.86), mat, mover)
            ld = bpy.data.lights.new('Lamp', 'SPOT')
            ld.spot_size = math.radians(125)
            ld.spot_blend = 0.85
            ld.shadow_soft_size = 0.3
            ld.color = (1.0, 0.86, 0.68)
            lo = bpy.data.objects.new('Lamp', ld)
            lo.location = (lx, head_y, 8.78)
            lo.parent = mover
            sc.collection.objects.link(lo)
            lamps.append({'x': lx, 'light': ld, 'emit': bsdf.inputs['Emission Strength']})
    ctl['lamps'] = lamps

    # distant city lights behind the car (static, far, out of focus)
    rnd = random.Random(7)
    city = []
    for name, col, count in (('CityWarm', (1.0, 0.7, 0.4), 260), ('CityWhite', (0.85, 0.9, 1.0), 160), ('CityRed', (1.0, 0.15, 0.1), 40)):
        bm = bmesh.new()
        for _ in range(count):
            cx = rnd.uniform(500, 1600)
            cy = rnd.uniform(-700, 700)
            cz = rnd.uniform(3, 60) * (0.35 + 0.65 * rnd.random())
            bmesh.ops.create_icosphere(bm, subdivisions=1, radius=rnd.uniform(0.8, 2.2),
                                       matrix=Matrix.Translation((cx, cy, cz)))
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        o = bpy.data.objects.new(name, me)
        mat, bsdf = simple_material(name, (0, 0, 0), emit=col, strength=0.0)
        o.data.materials.append(mat)
        sc.collection.objects.link(o)
        city.append(bsdf.inputs['Emission Strength'])
    ctl['city'] = city

    # night sky: near black overhead, a faint orange city glow on the horizon
    w = bpy.data.worlds.new('Night')
    sc.world = w
    N = Nodes(w)
    out = N.new('ShaderNodeOutputWorld')
    bg = N.new('ShaderNodeBackground')
    N.link(bg.outputs[0], out.inputs['Surface'])
    tc = N.new('ShaderNodeTexCoord')
    sep = N.new('ShaderNodeSeparateXYZ')
    N.link(tc.outputs['Generated'], sep.inputs[0])
    ramp = N.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (0.035, 0.022, 0.016, 1)
    ramp.color_ramp.elements[1].position = 0.12
    ramp.color_ramp.elements[1].color = (0.0025, 0.003, 0.006, 1)
    N.link(sep.outputs['Z'], ramp.inputs['Fac'])
    N.link(ramp.outputs['Color'], bg.inputs['Color'])
    ctl['sky'] = bg.inputs['Strength']
    return ctl


# --------------------------------------------------------------------------
# car rig

def rig_wheels(car_meshes):
    sc = bpy.context.scene
    pivots = []
    for corner in ('FL', 'FR', 'RL', 'RR'):
        parts = [o for o in car_meshes if o.name.endswith('_' + corner) and not o.name.startswith('Obj_Caliper')
                 and o.name in bpy.data.objects]
        tyre = [o for o in parts if o.name.startswith('Obj_Tyre')]
        mn, mx = S.world_bbox(tyre or parts)
        piv = bpy.data.objects.new('Wheel_' + corner, None)
        piv.location = (mn + mx) / 2
        sc.collection.objects.link(piv)
        bpy.context.view_layer.update()
        for o in parts:
            mw = o.matrix_world.copy()
            o.parent = piv
            o.matrix_world = mw
        pivots.append((piv, (mx.z - mn.z) / 2))
    return pivots


def add_beams(ctl):
    hl = bpy.data.objects['Obj_HeadLight']
    mn, mx = S.world_bbox([hl])
    beams = []
    for side in (-1, 1):
        ld = bpy.data.lights.new('Beam', 'SPOT')
        ld.spot_size = math.radians(48)
        ld.spot_blend = 0.55
        ld.shadow_soft_size = 0.04
        ld.color = (0.84, 0.91, 1.0)
        lo = bpy.data.objects.new('Beam', ld)
        lo.location = (mn.x - 0.12, side * (mx.y - 0.14), (mn.z + mx.z) / 2)  # just ahead of the glass
        aim = Vector((mn.x - 25.0, side * (mx.y + 1.2), -0.9)) - lo.location
        lo.rotation_euler = aim.to_track_quat('-Z', 'Y').to_euler()
        bpy.context.scene.collection.objects.link(lo)
        beams.append(ld)
    ctl['beams'] = beams


# --------------------------------------------------------------------------
# animation

CAM_BASE = Vector((-5.3, -3.05, 0.66))
CAM_TARGET = Vector((0.25, 0.1, 0.5))


def camera_at(f):
    t = t_of(f)
    T = LOOP / FPS
    ph = TAU * t / T
    pos = CAM_BASE + Vector((0.45 * math.sin(ph + 0.7), 0.4 * math.sin(ph), 0.07 * math.sin(2 * ph + 1.0)))
    # small road vibration, a whole number of cycles per loop
    pos.z += 0.006 * math.sin(TAU * 56 * t / T) + 0.003 * math.sin(TAU * 91 * t / T + 2.0)
    tgt = CAM_TARGET + Vector((0.0, 0.0, 0.004 * math.sin(TAU * 56 * t / T + 0.5)))
    return pos, tgt


def animate(ctl, cam, pivots, root):
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, F_END
    sc.render.fps = FPS
    bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'
    mover = ctl['mover']
    for f in (1, F_END + 1):
        mover.location = (SPEED * t_of(f), 0, 0)
        mover.keyframe_insert('location', frame=f)
        for piv, r in pivots:
            piv.rotation_euler = (0, -SPEED * t_of(f) / r, 0)
            piv.keyframe_insert('rotation_euler', frame=f)
    _linearise(mover)
    for p, _ in pivots:
        _linearise(p)

    base_z = root.location.z
    for f in range(1, F_END + 2):
        pos, tgt = camera_at(f)
        cam.location = pos
        cam.rotation_euler = (tgt - pos).to_track_quat('-Z', 'Y').to_euler()
        cam.keyframe_insert('location', frame=f)
        cam.keyframe_insert('rotation_euler', frame=f)
        t = t_of(f)
        root.location.z = base_z + 0.004 * math.sin(TAU * 8 * t / (LOOP / FPS)) + 0.002 * math.sin(TAU * 21 * t / (LOOP / FPS))
        root.keyframe_insert('location', index=2, frame=f)


def _linearise(ob):
    """Set every keyframe of an object's action to linear (works with layered actions too)."""
    ad = ob.animation_data
    if not ad or not ad.action:
        return
    act = ad.action
    curves = []
    if hasattr(act, 'fcurves'):
        try:
            curves = list(act.fcurves)
        except Exception:  # noqa: BLE001
            curves = []
    if not curves and hasattr(act, 'layers'):
        for layer in act.layers:
            for strip in layer.strips:
                for bag in getattr(strip, 'channelbags', []):
                    curves.extend(bag.fcurves)
    for fc in curves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def lights_at(f, ctl):
    """Intro cues (frames 1..48), then everything on for the loop."""
    drl = keyed(f, [(8, 0), (9, 0.45), (10, 0.0), (12, 0.75), (13, 0.15), (15, 1.0)])
    beams = smooth((f - 17) / 5) * (0.8 if f == 19 else 1.0)
    ctl['drl'].default_value = 18.0 * drl
    for key in ('tail', 'tail2'):
        if key in ctl:
            ctl[key].default_value = 6.0 * smooth((f - 11) / 3)
    for ld in ctl['beams']:
        ld.energy = 2600.0 * beams
    # street lights switch on in a wave running away from the camera
    mover_x = SPEED * t_of(f)
    order = sorted(ctl['lamps'], key=lambda L: abs((L['x'] + mover_x) - (-6.0)))
    for i, L in enumerate(order):
        on = smooth((f - (24 + 0.9 * i)) / 2.0)
        L['light'].energy = 5200.0 * on
        L['emit'].default_value = 70.0 * on
    amb = smooth((f - 28) / 18)
    if 'fill' in ctl:
        ctl['fill'].energy = 110.0 * amb
    for s in ctl['city']:
        s.default_value = 6.0 * amb
    ctl['sky'].default_value = amb


# --------------------------------------------------------------------------

def main():
    argv = sys.argv[sys.argv.index('--') + 1:]
    opts = {'--res': '1280x720', '--samples': '24', '--tree': '0'}
    pos = []
    i = 0
    while i < len(argv):
        if argv[i] in opts:
            opts[argv[i]] = argv[i + 1]
            i += 2
        else:
            pos.append(argv[i])
            i += 1
    model, out_dir = pos[:2]
    first = int(pos[2]) if len(pos) > 2 else 1
    last = int(pos[3]) if len(pos) > 3 else F_END
    res = tuple(int(v) for v in opts['--res'].split('x'))

    bpy.ops.wm.read_factory_settings(use_empty=True)
    root, car_meshes = S.import_car(model)
    ctl = S.car_materials()
    S.add_svj_parts(car_meshes)
    ctl.update(build_world())
    add_beams(ctl)
    pivots = rig_wheels(car_meshes)
    S.setup_render(res, int(opts['--samples']))
    sc = bpy.context.scene
    sc.cycles.use_light_tree = opts['--tree'] == '1'
    sc.render.use_motion_blur = True
    sc.render.motion_blur_shutter = 0.5
    cam = S.make_camera()
    cam.data.lens = 32
    sc.view_settings.exposure = 1.1
    # soft fill riding with the camera car, as on a real night shoot
    fd = bpy.data.lights.new('Fill', 'AREA')
    fd.shape = 'RECTANGLE'
    fd.size, fd.size_y = 2.4, 1.1
    fd.energy = 0.0
    fd.color = (0.9, 0.93, 1.0)
    fill = bpy.data.objects.new('Fill', fd)
    fill.parent = cam
    fill.location = (0.0, 0.7, 0.4)
    sc.collection.objects.link(fill)
    fill.visible_camera = False
    ctl['fill'] = fd
    cam.data.shift_x = -0.1
    cam.data.dof.use_dof = True
    cam.data.dof.aperture_fstop = 4.0
    cam.data.dof.focus_distance = (CAM_TARGET - CAM_BASE).length
    animate(ctl, cam, pivots, root)

    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, 'night.json'), 'w') as fh:
        json.dump({'fps': FPS, 'intro': [1, INTRO], 'loop': [F0, F_END], 'width': res[0], 'height': res[1]}, fh)
    for f in range(first, last + 1):
        path = os.path.join(out_dir, 'night_%04d.png' % f)
        if os.path.exists(path) and os.path.getsize(path) > 0:
            continue
        sc.frame_set(f)
        lights_at(f, ctl)
        sc.render.filepath = path
        t = time.time()
        bpy.ops.render.render(write_still=True)
        print('FRAME night %d %.1fs' % (f, time.time() - t), flush=True)


if __name__ == '__main__':
    main()
