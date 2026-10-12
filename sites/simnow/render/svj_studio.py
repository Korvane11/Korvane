"""SimNow hero renders: a matte black Lamborghini Aventador SVJ in a dark,
hazy studio with overhead spotlights and a wet concrete floor.

Builds the whole scene from the car model, then renders frames of one of the
sequences defined in shots.py:

    python -I svj_studio.py -- MODEL.gltf OUT_DIR SEQUENCE [first last] [--res 1600x900] [--samples 64]

Requires the `bpy` module (Blender 5.2 as a Python package: `pip install bpy`).
Units are metres; the car's nose points along -X and it sits on z = 0.
"""
import json
import math
import os
import sys
import time

import bpy
import bmesh
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import shots  # noqa: E402

CAR_LENGTH = 4.943  # Aventador SVJ, metres

# Brand red from the site (#d0312c) in linear RGB, used for the calipers.
SIMNOW_RED = (0.630, 0.030, 0.025)


# --------------------------------------------------------------------------
# helpers

def principled(mat):
    mat.use_nodes = True
    return next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')


def fresh_material(name):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs[0], out.inputs['Surface'])
    return mat, bsdf, nt


def setp(bsdf, **kw):
    names = {
        'base': 'Base Color', 'metal': 'Metallic', 'rough': 'Roughness', 'ior': 'IOR',
        'alpha': 'Alpha', 'spec': 'Specular IOR Level', 'trans': 'Transmission Weight',
        'coat': 'Coat Weight', 'coat_rough': 'Coat Roughness', 'aniso': 'Anisotropic',
        'emit': 'Emission Color', 'emit_str': 'Emission Strength', 'sheen': 'Sheen Weight',
    }
    for k, v in kw.items():
        sock = bsdf.inputs[names[k]]
        if isinstance(v, tuple) and len(v) == 3:
            v = (*v, 1.0)
        sock.default_value = v


def world_bbox(objs):
    mn = Vector((1e9,) * 3)
    mx = Vector((-1e9,) * 3)
    for o in objs:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            mn = Vector(map(min, mn, w))
            mx = Vector(map(max, mx, w))
    return mn, mx


def link(obj, coll=None):
    (coll or bpy.context.scene.collection).objects.link(obj)
    return obj


def mesh_object(name, bm, mat):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    obj = bpy.data.objects.new(name, me)
    obj.data.materials.append(mat)
    return link(obj)


# --------------------------------------------------------------------------
# car

def import_car(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]

    # Two wheel designs ship on top of each other; keep design A. Drop stray hub copies.
    for o in list(new):
        if o.name.startswith('Obj_Rim_T0B') or (o.name.startswith('Obj_WheelHub') and '.0' in o.name):
            new.remove(o)
            bpy.data.objects.remove(o, do_unlink=True)

    meshes = [o for o in new if o.type == 'MESH']
    mn, mx = world_bbox(meshes)
    root = bpy.data.objects.new('CarRoot', None)
    link(root)
    for o in new:
        if o.parent is None:
            o.parent = root
    s = CAR_LENGTH / (mx.x - mn.x)
    root.scale = (s, s, s)
    root.location = (-(mn.x + mx.x) / 2 * s, -(mn.y + mx.y) / 2 * s, -mn.z * s)
    bpy.context.view_layer.update()
    return root, meshes


def carbon_material():
    mat, bsdf, nt = fresh_material('SVJ_Carbon')
    tc = nt.nodes.new('ShaderNodeTexCoord')
    chk = nt.nodes.new('ShaderNodeTexChecker')
    chk.inputs['Scale'].default_value = 220.0
    chk.inputs['Color1'].default_value = (0.010, 0.010, 0.011, 1)
    chk.inputs['Color2'].default_value = (0.022, 0.022, 0.024, 1)
    nt.links.new(tc.outputs['Object'], chk.inputs['Vector'])
    nt.links.new(chk.outputs['Color'], bsdf.inputs['Base Color'])
    setp(bsdf, metal=0.0, rough=0.32, coat=1.0, coat_rough=0.04, aniso=0.4)
    return mat


def rain_bump(nt, strength=0.35, scale=60.0, coverage=0.22):
    """Small round droplets for glass: voronoi cells masked by noise."""
    tc = nt.nodes.new('ShaderNodeTexCoord')
    vor = nt.nodes.new('ShaderNodeTexVoronoi')
    vor.inputs['Scale'].default_value = scale
    nt.links.new(tc.outputs['Object'], vor.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeMapRange')
    ramp.inputs['From Min'].default_value = 0.0
    ramp.inputs['From Max'].default_value = 0.32
    ramp.inputs['To Min'].default_value = 1.0
    ramp.inputs['To Max'].default_value = 0.0
    nt.links.new(vor.outputs['Distance'], ramp.inputs['Value'])
    noise = nt.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = scale * 0.35
    nt.links.new(tc.outputs['Object'], noise.inputs['Vector'])
    mask = nt.nodes.new('ShaderNodeMapRange')
    mask.inputs['From Min'].default_value = 1.0 - coverage - 0.02
    mask.inputs['From Max'].default_value = 1.0 - coverage + 0.02
    nt.links.new(noise.outputs['Fac'], mask.inputs['Value'])
    mul = nt.nodes.new('ShaderNodeMath')
    mul.operation = 'MULTIPLY'
    nt.links.new(ramp.outputs['Result'], mul.inputs[0])
    nt.links.new(mask.outputs['Result'], mul.inputs[1])
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = strength
    bump.inputs['Distance'].default_value = 0.002
    nt.links.new(mul.outputs['Value'], bump.inputs['Height'])
    return bump


def car_materials():
    """Re-dress the model to match the reference photo: satin matte black SVJ."""
    M = bpy.data.materials
    controls = {}

    # Matte black paint: dark base, soft broad sheen, a hint of satin coat.
    for name in ('Mt_Body', 'Mt_MirrorCover'):
        setp(principled(M[name]), base=(0.014, 0.014, 0.016), metal=0.0, rough=0.5, spec=0.5, coat=0.0)

    for name in ('Mt_ABS_Black_Mat', 'UNTERBODEN', 'LICHTER5'):
        setp(principled(M[name]), base=(0.018, 0.018, 0.019), metal=0.0, rough=0.62, spec=0.4)
    setp(principled(M['Mt_Abs_Black_Gloss']), base=(0.008, 0.008, 0.009), metal=0.0, rough=0.12, coat=1.0, coat_rough=0.02)
    setp(principled(M['Mt_Metal_Black_Glossy']), base=(0.02, 0.02, 0.021), metal=0.4, rough=0.18)
    setp(principled(M['Mt_Interior_Black']), base=(0.03, 0.03, 0.03), metal=0.0, rough=0.7)
    for name in ('lines', 'signs', 'Mirror'):
        setp(principled(M[name]), base=(0.03, 0.03, 0.03), metal=0.0, rough=0.7)

    # Gloss black forged wheels, brushed discs, SimNow-red calipers.
    setp(principled(M['Mt_AlloyWheels']), base=(0.012, 0.012, 0.013), metal=0.25, rough=0.22, coat=0.8, coat_rough=0.08)
    setp(principled(M['Mt_Metal_Brushed']), base=(0.45, 0.45, 0.46), metal=1.0, rough=0.32, aniso=0.6)
    setp(principled(M['Mt_BrakeCaliper']), base=SIMNOW_RED, metal=0.0, rough=0.3, coat=1.0, coat_rough=0.05)
    setp(principled(M['Mt_Chrome']), base=(0.8, 0.8, 0.82), metal=1.0, rough=0.06)
    setp(principled(M['Mt_Mirror']), base=(0.9, 0.9, 0.9), metal=1.0, rough=0.0)

    # Rubber keeps its sidewall texture but loses the bogus metalness.
    setp(principled(M['Mt_Tyres']), metal=0.0, rough=0.82, spec=0.3)
    setp(principled(M['Mt_AventadorAtlas']), metal=0.0, rough=0.35)

    # Glass.
    setp(principled(M['Mt_Glass_Translucent']), base=(1, 1, 1), metal=0.0, rough=0.0, alpha=1.0, trans=1.0, ior=1.5)
    setp(principled(M['Mt_Glass_Lens']), base=(1, 1, 1), metal=0.0, rough=0.02, alpha=1.0, trans=1.0, ior=1.5)
    ws = M['Mt_WindScreens']
    b = principled(ws)
    setp(b, base=(0.32, 0.34, 0.35), metal=0.0, rough=0.0, alpha=1.0, trans=1.0, ior=1.52)
    bump = rain_bump(ws.node_tree)
    ws.node_tree.links.new(bump.outputs['Normal'], b.inputs['Normal'])

    # Y-shaped daytime running lights.
    b = principled(M['Mt_Abs_White_Mat'])
    setp(b, base=(0.9, 0.9, 0.9), metal=0.0, rough=0.3, emit=(0.80, 0.90, 1.0), emit_str=0.0)
    controls['drl'] = b.inputs['Emission Strength']

    # Tail lights: the hex brake texture also drives emission.
    for name, key in (('Mt_Reflector_TL', 'tail'), ('Mt_Reflector_BL', 'tail2'), ('Mt_Reflector_RL', None)):
        mat = M[name]
        b = principled(mat)
        setp(b, metal=0.0, rough=0.25)
        tex = next((n for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE' and 'Normal' not in n.image.name), None)
        if key and tex:
            mat.node_tree.links.new(tex.outputs['Color'], b.inputs['Emission Color'])
            b.inputs['Emission Strength'].default_value = 0.0
            controls[key] = b.inputs['Emission Strength']
    return controls


def add_svj_parts(car_meshes):
    """The bits that make an Aventador an SVJ: the big rear wing and a front splitter."""
    carbon = carbon_material()
    deps = bpy.context.evaluated_depsgraph_get()
    sc = bpy.context.scene

    def surface_z(x, y, top=3.0):
        hit, loc, *_ = sc.ray_cast(deps, Vector((x, y, top)), Vector((0, 0, -1)))
        return loc.z if hit else None

    mn, mx = world_bbox(car_meshes)
    rear = mx.x

    # --- rear wing: inverted cambered aerofoil on two blade struts with end plates
    chord, span = 0.36, 1.92
    le_x = rear - 0.53
    wing_z = 1.115
    aoa = math.radians(-9)  # trailing edge up

    def foil(n=28, m=0.07, p=0.42, t=0.11):
        pts_u, pts_l = [], []
        for i in range(n + 1):
            x = (1 - math.cos(math.pi * i / n)) / 2
            yt = 5 * t * (0.2969 * math.sqrt(x) - 0.1260 * x - 0.3516 * x ** 2 + 0.2843 * x ** 3 - 0.1036 * x ** 4)
            if x < p:
                yc, dy = m / p ** 2 * (2 * p * x - x * x), 2 * m / p ** 2 * (p - x)
            else:
                yc, dy = m / (1 - p) ** 2 * ((1 - 2 * p) + 2 * p * x - x * x), 2 * m / (1 - p) ** 2 * (p - x)
            th = math.atan(dy)
            pts_u.append((x - yt * math.sin(th), yc + yt * math.cos(th)))
            pts_l.append((x + yt * math.sin(th), yc - yt * math.cos(th)))
        loop = pts_u[::-1] + pts_l[1:-1]
        return [(x, -z) for x, z in loop]  # inverted: suction side underneath

    def to_world(px, pz, y):
        x, z = px * chord, pz * chord
        xr = x * math.cos(aoa) - z * math.sin(aoa)
        zr = x * math.sin(aoa) + z * math.cos(aoa)
        return Vector((le_x + xr, y, wing_z + zr))

    prof = foil()
    bm = bmesh.new()
    rings = []
    stations = 24
    for j in range(stations + 1):
        y = -span / 2 + span * j / stations
        # slight sweep-up at the tips like the real ALA wing
        lift = 0.018 * (abs(y) / (span / 2)) ** 3
        rings.append([bm.verts.new(to_world(px, pz, y) + Vector((0, 0, lift))) for px, pz in prof])
    for a, b in zip(rings, rings[1:]):
        n = len(a)
        for i in range(n):
            bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])
    wing = mesh_object('SVJ_Wing', bm, carbon)

    # End plates
    def plate(name, y, pts, thick):
        bm = bmesh.new()
        a = [bm.verts.new((x, y - thick / 2, z)) for x, z in pts]
        b = [bm.verts.new((x, y + thick / 2, z)) for x, z in pts]
        n = len(pts)
        bm.faces.new(a[::-1])
        bm.faces.new(b)
        for i in range(n):
            bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
        o = mesh_object(name, bm, carbon)
        for p in o.data.polygons:
            p.use_smooth = False
        return o

    top = wing_z + 0.07
    bot = wing_z - 0.11
    x0, x1 = le_x - 0.03, le_x + chord + 0.03
    ep = [(x0 + 0.05, bot), (x1, bot + 0.05), (x1, top), (x0 + 0.08, top + 0.01), (x0, top - 0.03), (x0, bot + 0.05)]
    plate('SVJ_Endplate_L', -span / 2 - 0.004, ep, 0.008)
    plate('SVJ_Endplate_R', span / 2 + 0.004, ep, 0.008)

    # Blade struts down to the engine deck
    for side in (-1, 1):
        y = side * 0.40
        sx = le_x + chord * 0.45
        base = surface_z(sx, y) or 0.9
        under = wing_z - 0.035
        pts = [(sx - 0.10, base - 0.02), (sx + 0.10, base - 0.02), (sx + 0.06, under), (sx - 0.06, under)]
        plate('SVJ_Strut_%s' % ('L' if side < 0 else 'R'), y, pts, 0.016)

    # --- front splitter: a thin carbon blade under the nose
    front = mn.x
    outline = []
    half = 0.9
    prev = front + 0.2
    for i in range(19):
        y = -half + 2 * half * i / 18
        hit, loc, *_ = sc.ray_cast(deps, Vector((front - 1.0, y, 0.16)), Vector((1, 0, 0)))
        x = loc.x if hit and loc.x < front + 0.6 else prev
        prev = x
        outline.append((x - 0.03, y))
    bm = bmesh.new()
    back = [(front + 0.62, half), (front + 0.62, -half)]
    pts = outline + back
    z0, z1 = 0.122, 0.134
    a = [bm.verts.new((x, y, z0)) for x, y in pts]
    b = [bm.verts.new((x, y, z1)) for x, y in pts]
    n = len(pts)
    bm.faces.new(a[::-1])
    bm.faces.new(b)
    for i in range(n):
        bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    sp = mesh_object('SVJ_Splitter', bm, carbon)
    for p in sp.data.polygons:
        p.use_smooth = False
    return wing


# --------------------------------------------------------------------------
# studio

def floor_material():
    mat, bsdf, nt = fresh_material('WetConcrete')
    tc = nt.nodes.new('ShaderNodeTexCoord')
    # puddles: large-scale noise thresholded into wet (mirror) and damp areas
    pud = nt.nodes.new('ShaderNodeTexNoise')
    pud.inputs['Scale'].default_value = 0.22
    pud.inputs['Detail'].default_value = 6.0
    pud.inputs['Roughness'].default_value = 0.62
    nt.links.new(tc.outputs['Object'], pud.inputs['Vector'])
    wet = nt.nodes.new('ShaderNodeMapRange')
    wet.inputs['From Min'].default_value = 0.47
    wet.inputs['From Max'].default_value = 0.53
    nt.links.new(pud.outputs['Fac'], wet.inputs['Value'])
    rough = nt.nodes.new('ShaderNodeMapRange')
    rough.inputs['To Min'].default_value = 0.34
    rough.inputs['To Max'].default_value = 0.025
    nt.links.new(wet.outputs['Result'], rough.inputs['Value'])
    nt.links.new(rough.outputs['Result'], bsdf.inputs['Roughness'])
    # concrete albedo: fine grain noise, darker when wet
    grain = nt.nodes.new('ShaderNodeTexNoise')
    grain.inputs['Scale'].default_value = 9.0
    grain.inputs['Detail'].default_value = 10.0
    nt.links.new(tc.outputs['Object'], grain.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (0.018, 0.018, 0.019, 1)
    ramp.color_ramp.elements[1].color = (0.05, 0.05, 0.052, 1)
    nt.links.new(grain.outputs['Fac'], ramp.inputs['Fac'])
    darken = nt.nodes.new('ShaderNodeMix')
    darken.data_type = 'RGBA'
    darken.blend_type = 'MULTIPLY'
    darken.inputs['B'].default_value = (0.45, 0.45, 0.45, 1)
    nt.links.new(wet.outputs['Result'], darken.inputs['Factor'])
    nt.links.new(ramp.outputs['Color'], darken.inputs['A'])
    nt.links.new(darken.outputs['Result'], bsdf.inputs['Base Color'])
    # surface texture only on the dry parts
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Distance'].default_value = 0.002
    inv = nt.nodes.new('ShaderNodeMath')
    inv.operation = 'SUBTRACT'
    inv.inputs[0].default_value = 1.0
    nt.links.new(wet.outputs['Result'], inv.inputs[1])
    s = nt.nodes.new('ShaderNodeMath')
    s.operation = 'MULTIPLY'
    s.inputs[1].default_value = 0.35
    nt.links.new(inv.outputs['Value'], s.inputs[0])
    nt.links.new(s.outputs['Value'], bump.inputs['Strength'])
    nt.links.new(grain.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    setp(bsdf, spec=0.6, metal=0.0)
    return mat


def wall_material():
    mat, bsdf, nt = fresh_material('StudioWall')
    tc = nt.nodes.new('ShaderNodeTexCoord')
    n = nt.nodes.new('ShaderNodeTexNoise')
    n.inputs['Scale'].default_value = 1.5
    n.inputs['Detail'].default_value = 8
    nt.links.new(tc.outputs['Object'], n.inputs['Vector'])
    r = nt.nodes.new('ShaderNodeValToRGB')
    r.color_ramp.elements[0].color = (0.010, 0.010, 0.011, 1)
    r.color_ramp.elements[1].color = (0.03, 0.03, 0.032, 1)
    nt.links.new(n.outputs['Fac'], r.inputs['Fac'])
    nt.links.new(r.outputs['Color'], bsdf.inputs['Base Color'])
    setp(bsdf, rough=0.85, spec=0.3)
    return mat


def emissive_material(name, color, strength):
    mat, bsdf, nt = fresh_material(name)
    setp(bsdf, base=(0.02, 0.02, 0.02), rough=0.4, emit=color, emit_str=strength)
    return mat, bsdf


def build_studio():
    sc = bpy.context.scene
    ctl = {}

    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = 'Floor'
    floor.data.materials.append(floor_material())

    wall = wall_material()
    for name, loc, rot, size in (
        ('WallBack', (0, 11, 4), (math.pi / 2, 0, 0), 40),
        ('WallLeft', (-13, 0, 4), (math.pi / 2, 0, math.pi / 2), 40),
        ('WallRight', (13, 0, 4), (math.pi / 2, 0, math.pi / 2), 40),
        ('WallFront', (0, -14, 4), (math.pi / 2, 0, 0), 40),
        ('Ceiling', (0, 0, 7.5), (0, 0, 0), 40),
    ):
        bpy.ops.mesh.primitive_plane_add(size=size, location=loc, rotation=rot)
        o = bpy.context.active_object
        o.name = name
        o.data.materials.append(wall)

    # Lighting truss: two rails above the car carrying the spot cans.
    truss = bpy.data.materials.new('Truss')
    b = principled(truss)
    setp(b, base=(0.02, 0.02, 0.02), metal=0.8, rough=0.35)
    for y in (-0.9, 0.9):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, y, 5.35), scale=(9.0, 0.06, 0.06))
        o = bpy.context.active_object
        o.name = 'TrussRail'
        o.data.materials.append(truss)

    # Overhead spotlights, switched on one by one in the intro.
    spot_xy = [(-1.7, -0.9), (1.7, 0.9), (0.0, -0.9), (-1.7, 0.9), (1.7, -0.9), (0.0, 0.9)]
    spots = []
    for i, (x, y) in enumerate(spot_xy):
        ld = bpy.data.lights.new('Spot%d' % i, 'SPOT')
        ld.spot_size = math.radians(34)
        ld.spot_blend = 0.35
        ld.shadow_soft_size = 0.06
        ld.color = (1.0, 0.95, 0.88)
        lo = link(bpy.data.objects.new('Spot%d' % i, ld))
        lo.location = (x * 1.0, y * 1.0, 5.2)
        aim = Vector((x * 1.25, y * 2.1, 0.0)) - lo.location
        lo.rotation_euler = aim.to_track_quat('-Z', 'Y').to_euler()
        # the can sits behind the light, its glowing lens just behind the emitter
        d = aim.normalized()
        bpy.ops.mesh.primitive_cylinder_add(radius=0.11, depth=0.26, location=lo.location - d * 0.16)
        can = bpy.context.active_object
        can.rotation_euler = lo.rotation_euler
        can.data.materials.append(truss)
        can.visible_shadow = False
        lens_mat, lens_bsdf = emissive_material('SpotLens%d' % i, (1.0, 0.95, 0.88), 0.0)
        bpy.ops.mesh.primitive_circle_add(radius=0.095, fill_type='NGON', location=lo.location - d * 0.028)
        lens = bpy.context.active_object
        lens.rotation_euler = lo.rotation_euler
        lens.data.materials.append(lens_mat)
        lens.visible_shadow = False
        spots.append((ld, lens_bsdf))
    ctl['spots'] = spots

    # Big overhead soft box (keeps the matte paint readable) and two rim strips.
    def area(name, loc, rot, sx, sy, color=(1, 1, 1), spread=180, volume=False):
        ld = bpy.data.lights.new(name, 'AREA')
        ld.shape = 'RECTANGLE'
        ld.size, ld.size_y = sx, sy
        ld.color = color
        ld.spread = math.radians(spread)
        o = link(bpy.data.objects.new(name, ld))
        o.location = loc
        o.rotation_euler = rot
        o.visible_volume_scatter = volume
        return ld

    ctl['soft'] = area('Softbox', (0, 0, 4.2), (0, 0, 0), 6.5, 1.2, (1.0, 0.98, 0.95), spread=24)
    ctl['rimL'] = area('RimL', (1.0, 4.2, 1.4), (math.radians(-75), 0, 0), 7.0, 0.35, (0.85, 0.9, 1.0), spread=45)
    ctl['rimR'] = area('RimR', (0.4, -3.1, 3.1), (math.radians(48), 0, 0), 6.5, 0.3, (0.85, 0.9, 1.0), spread=60)
    ctl['kick'] = area('Kick', (-6.5, 0, 1.0), (0, math.radians(-80), 0), 0.4, 5.0, (0.95, 0.93, 0.9), spread=90)

    # Headlight beams
    beams = []
    for side in (-1, 1):
        ld = bpy.data.lights.new('Beam', 'SPOT')
        ld.spot_size = math.radians(40)
        ld.spot_blend = 0.6
        ld.shadow_soft_size = 0.03
        ld.color = (0.82, 0.9, 1.0)
        lo = link(bpy.data.objects.new('Beam', ld))
        beams.append((ld, lo, side))
    ctl['beams'] = beams

    # Atmospheric haze filling the room.
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -1.5, 3.7), scale=(25.8, 24.8, 7.39))
    haze = bpy.context.active_object
    haze.name = 'Haze'
    hm = bpy.data.materials.new('HazeMat')
    hm.use_nodes = True
    nt = hm.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    vol = nt.nodes.new('ShaderNodeVolumePrincipled')
    vol.inputs['Density'].default_value = 0.03
    vol.inputs['Anisotropy'].default_value = 0.55
    vol.inputs['Color'].default_value = (0.9, 0.9, 0.92, 1)
    nt.links.new(vol.outputs[0], out.inputs['Volume'])
    haze.data.materials.append(hm)
    if os.environ.get('SVJ_HAZE') == '0':
        haze.hide_render = True
    ctl['haze'] = vol.inputs['Density']

    # pitch-black world
    w = bpy.data.worlds.new('World')
    sc.world = w
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.0
    return ctl


def place_beams(ctl, car_meshes):
    hl = bpy.data.objects['Obj_HeadLight']
    mn, mx = world_bbox([hl])
    for ld, lo, side in ctl['beams']:
        lo.location = (mn.x + 0.08, side * (mx.y - 0.12), (mn.z + mx.z) / 2)
        aim = Vector((mn.x - 8.0, side * (mx.y + 0.6), -0.4)) - lo.location
        lo.rotation_euler = aim.to_track_quat('-Z', 'Y').to_euler()


# --------------------------------------------------------------------------
# render

def setup_render(res, samples):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    cy = sc.cycles
    cy.device = 'CPU'
    cy.samples = samples
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.04
    cy.use_denoising = True
    try:
        cy.denoiser = 'OPENIMAGEDENOISE'
        cy.denoising_input_passes = 'RGB_ALBEDO_NORMAL'
        cy.denoising_prefilter = 'ACCURATE'
    except Exception as e:  # noqa: BLE001
        print('denoiser setting:', e)
    cy.use_light_tree = False
    for m in bpy.data.materials:
        m.cycles.emission_sampling = 'NONE'
    cy.max_bounces = 8
    cy.diffuse_bounces = 2
    cy.glossy_bounces = 4
    cy.transmission_bounces = 6
    cy.volume_bounces = 0
    cy.transparent_max_bounces = 8
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    cy.sample_clamp_indirect = 6.0
    cy.blur_glossy = 1.0
    for attr, val in (('volume_step_rate', 2.0), ('volume_max_steps', 256)):
        if hasattr(cy, attr):
            setattr(cy, attr, val)
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.use_persistent_data = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGB'
    sc.render.image_settings.color_depth = '8'
    vs = sc.view_settings
    vs.view_transform = 'AgX'
    for look in ('AgX - Punchy', 'Punchy', 'AgX - Medium High Contrast', 'None'):
        try:
            vs.look = look
            break
        except TypeError:
            continue
    vs.exposure = 0.0


def make_camera():
    cd = bpy.data.cameras.new('Cam')
    cd.sensor_width = 36
    cam = link(bpy.data.objects.new('Cam', cd))
    bpy.context.scene.camera = cam
    return cam


def apply_state(st, cam, ctl):
    pos, tgt = Vector(st['pos']), Vector(st['target'])
    cam.location = pos
    cam.rotation_euler = (tgt - pos).to_track_quat('-Z', 'Y').to_euler()
    cam.rotation_euler.rotate_axis('Z', 0)  # keep it level
    cd = cam.data
    cd.lens = st['lens']
    cd.shift_x = st.get('shift_x', 0.0)
    cd.shift_y = st.get('shift_y', 0.0)
    cd.dof.use_dof = st.get('fstop', 0) > 0
    if cd.dof.use_dof:
        cd.dof.focus_distance = (tgt - pos).length
        cd.dof.aperture_fstop = st['fstop']

    ctl['drl'].default_value = 18.0 * st['drl']
    for key in ('tail', 'tail2'):
        if key in ctl:
            ctl[key].default_value = 6.0 * st['tail']
    for i, (ld, lens) in enumerate(ctl['spots']):
        v = st['spots'][i] if i < len(st['spots']) else 0.0
        ld.energy = 2000.0 * v
        lens.inputs['Emission Strength'].default_value = 60.0 * v
    for ld, lo, side in ctl['beams']:
        ld.energy = 900.0 * st['beams']
    ctl['soft'].energy = 180.0 * st['soft']
    ctl['rimL'].energy = 420.0 * st['rim']
    ctl['rimR'].energy = 160.0 * st['rim']
    ctl['kick'].energy = 70.0 * st['rim']
    ctl['haze'].default_value = 0.03 * st.get('haze', 1.0)


def main():
    argv = sys.argv[sys.argv.index('--') + 1:]
    opts = {'--res': '1600x900', '--samples': '64'}
    pos = []
    i = 0
    while i < len(argv):
        if argv[i] in opts:
            opts[argv[i]] = argv[i + 1]
            i += 2
        else:
            pos.append(argv[i])
            i += 1
    model, out_dir, seq = pos[:3]
    frames = shots.SEQUENCES[seq]()
    first = int(pos[3]) if len(pos) > 3 else 0
    last = int(pos[4]) if len(pos) > 4 else len(frames) - 1
    res = tuple(int(v) for v in opts['--res'].split('x'))

    bpy.ops.wm.read_factory_settings(use_empty=True)
    root, car_meshes = import_car(model)
    ctl = car_materials()
    add_svj_parts(car_meshes)
    ctl.update(build_studio())
    place_beams(ctl, car_meshes)
    setup_render(res, int(opts['--samples']))
    cam = make_camera()

    os.makedirs(out_dir, exist_ok=True)
    sc = bpy.context.scene

    # Where the subject sits in each frame, so the site can crop around it on
    # narrow screens.
    from bpy_extras.object_utils import world_to_camera_view
    focus = []
    for st in frames:
        apply_state(st, cam, ctl)
        bpy.context.view_layer.update()
        p = world_to_camera_view(sc, cam, Vector(st['target']))
        focus.append([round(p.x, 4), round(1 - p.y, 4)])
    with open(os.path.join(out_dir, '%s.json' % seq), 'w') as fh:
        json.dump({'frames': len(frames), 'width': res[0], 'height': res[1], 'focus': focus}, fh)

    for f in range(first, last + 1):
        path = os.path.join(out_dir, '%s_%04d.png' % (seq, f))
        if os.path.exists(path) and os.path.getsize(path) > 0:
            continue
        apply_state(frames[f], cam, ctl)
        sc.render.filepath = path
        t = time.time()
        bpy.ops.render.render(write_still=True)
        print('FRAME %s %d %.1fs' % (seq, f, time.time() - t), flush=True)


if __name__ == '__main__':
    main()
