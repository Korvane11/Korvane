"""Pour My Coffee Co: the opening, in Blender (bpy 5.2) and rendered with Cycles.

The owner (2026-10-15) asked for the cup, the coffee and the pour to look more realistic, and sent a
reference clip for the pour: "Use the pour from this video but just into the cup". The clip (an
AI-generated TikTok by @satisfyloopusa, not used on the site) shows a thick, glossy caramel coffee
falling in a rope, with tan and dark brown swirls that spiral round the point where it lands, and
mirror highlights. That pour is made here, into a white porcelain cup on its saucer, on the same oak
table in the same low morning sun through the desert tree as before. The cup fills from empty, the
stream thins and breaks, the swirl slows to a stop and steam rises; then the steam loops.

    python3 render/blender/scene.py <out_dir> [--mode intro|loop|still] [--frames A-B[:step]]
                                    [--samples N] [--size PX] [--t SECONDS]

One square render serves both layouts (encode.sh crops it): the cup sits in the bottom-right
square, so a 16:9 crop of the bottom rows puts it on the right with room for the words on the left,
and a 9:16 crop of the right columns puts it low with room for the words above.
Everything is in metres; Z is up; the cup stands at the origin. Textures and the sky are Poly Haven's
(CC0, fetch_assets.py).
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, 'cache')

# ---------------------------------------------------------------- timing (seconds, 24 fps)
FPS = 24
INTRO = 6.0             # frames 0..143; the loop's frame 0 is the intro's frame 144
LOOP = 4.0              # frames 0..95
T_LIGHT = 0.9           # the light comes up
T_HEAD = 0.55           # the stream's head leaves the top of the frame
T_LAND = 0.85           # it reaches the bottom of the cup
T_THIN = 3.9            # the pour eases off
T_STOP = 4.35           # the stream breaks
G = 9.81

# ---------------------------------------------------------------- the cup (a classic cappuccino cup)
CUP_Z = 0.0042          # the saucer's well, where the cup stands
H = 0.058               # height
RB, RR = 0.0235, 0.0455 # radius at the foot, at the rim
WALL = 0.0030
IN_BOTTOM = 0.0068      # the inside floor (cup coords)
L_FULL = 0.0505         # the coffee's level when full (cup coords)


def r_out(z):
    h = max(0.0, min(1.0, z / H))
    return RB + (RR - RB) * (1 - (1 - h) ** 2.15)


def r_in(z):
    return r_out(z) - WALL


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * t * (t * (t * 6 - 15) + 10)


def smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------- geometry helpers
def lathe(name, prof, steps=128, smooth_shade=True):
    """A surface of revolution from a (r, z) profile, closed at the axis."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    rings = []
    for k in range(steps):
        a = 2 * math.pi * k / steps
        ca, sa = math.cos(a), math.sin(a)
        rings.append([bm.verts.new((r * ca, r * sa, z)) for r, z in prof])
    for k in range(steps):
        r0, r1 = rings[k], rings[(k + 1) % steps]
        for i in range(len(prof) - 1):
            bm.faces.new((r0[i], r1[i], r1[i + 1], r0[i + 1]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    if smooth_shade:
        for p in me.polygons:
            p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob


def cup_profile():
    P = [(0.0, 0.0021), (0.0175, 0.0021), (0.0192, 0.0003), (0.0205, 0.0), (0.0222, 0.0002), (0.0232, 0.0016)]
    n = 30
    for i in range(1, n + 1):
        z = 0.0016 + (H - 0.0016) * i / n
        P.append((r_out(z), z))
    # the rim: rounded, about 3 mm
    for k in range(1, 8):
        a = math.pi * k / 8
        P.append((RR - WALL / 2 + (WALL / 2) * math.cos(a), H + (WALL / 2) * math.sin(a) * 0.9))
    for i in range(1, n + 1):
        z = H - (H - IN_BOTTOM - 0.004) * i / n
        P.append((r_in(z), z))
    P += [(r_in(IN_BOTTOM + 0.002) - 0.002, IN_BOTTOM + 0.0006), (0.012, IN_BOTTOM), (0.0, IN_BOTTOM - 0.0003)]
    return P


def saucer_profile():
    P = [(0.0, 0.0022)]
    P += [(0.024, 0.0022), (0.0255, 0.0)]                                      # the underside to the foot
    P += [(0.0285, 0.0), (0.030, 0.0018)]
    for i in range(0, 13):
        r = 0.031 + (0.069 - 0.031) * i / 12
        P.append((r, 0.0018 + 0.0052 * smooth(0.031, 0.069, r) ** 1.3))          # the underside, rising
    for k in range(1, 7):
        a = -math.pi / 2 + math.pi * k / 6
        P.append((0.0705 + 0.0016 * math.cos(a), 0.0086 + 0.0016 * math.sin(a)))  # the rolled rim
    for i in range(0, 15):
        r = 0.069 - (0.069 - 0.030) * i / 14
        P.append((r, CUP_Z + 0.0059 * smooth(0.031, 0.069, r) ** 1.25))          # the top, falling to the well
    P += [(0.0, CUP_Z)]
    return P


def handle(mat):
    """The handle: an ear-shaped loop, a flat strap, grown out of the wall on the +X side."""
    cu = bpy.data.curves.new('handle', 'CURVE')
    cu.dimensions = '3D'
    sp = cu.splines.new('BEZIER')
    pts = [((r_out(0.050) - 0.0025, 0, CUP_Z + 0.050), (0.040, 0, CUP_Z + 0.0525), (0.052, 0, CUP_Z + 0.053)),
           ((0.0655, 0, CUP_Z + 0.044), (0.0670, 0, CUP_Z + 0.050), (0.0660, 0, CUP_Z + 0.036)),
           ((r_out(0.022) - 0.0025, 0, CUP_Z + 0.022), (0.052, 0, CUP_Z + 0.024), (0.030, 0, CUP_Z + 0.021))]
    sp.bezier_points.add(len(pts) - 1)
    for bp, (co, hl, hr) in zip(sp.bezier_points, pts):
        bp.co, bp.handle_left, bp.handle_right = co, hl, hr
    pr = bpy.data.curves.new('strap', 'CURVE')
    ps = pr.splines.new('BEZIER')
    ps.bezier_points.add(3)
    for i, bp in enumerate(ps.bezier_points):
        a = math.pi / 2 * i
        bp.co = (0.0046 * math.cos(a), 0.0030 * math.sin(a), 0)
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    ps.use_cyclic_u = True
    prof = bpy.data.objects.new('strap', pr)
    bpy.context.collection.objects.link(prof)
    cu.bevel_mode = 'OBJECT'
    cu.bevel_object = prof
    cu.use_fill_caps = True
    cu.resolution_u = 24
    ob = bpy.data.objects.new('handle', cu)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat)
    prof.hide_render = True
    return ob


# ---------------------------------------------------------------- materials
def nodes_of(m):
    m.use_nodes = True
    return m.node_tree.nodes, m.node_tree.links


def porcelain():
    m = bpy.data.materials.new('porcelain')
    n, l = nodes_of(m)
    b = n['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.86, 0.855, 0.84, 1)
    b.inputs['Roughness'].default_value = 0.22
    b.inputs['Subsurface Weight'].default_value = 0.12
    b.inputs['Subsurface Radius'].default_value = (1.0, 0.9, 0.75)
    b.inputs['Subsurface Scale'].default_value = 0.002
    b.inputs['Coat Weight'].default_value = 1.0
    b.inputs['Coat Roughness'].default_value = 0.025
    b.inputs['Coat IOR'].default_value = 1.52
    # thrown and glazed by hand: a faint waviness in the glaze
    tc = n.new('ShaderNodeTexCoord')
    nz = n.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 90.0
    nz.inputs['Detail'].default_value = 3.0
    bump = n.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.04
    bump.inputs['Distance'].default_value = 0.0004
    l.new(tc.outputs['Object'], nz.inputs['Vector'])
    l.new(nz.outputs['Fac'], bump.inputs['Height'])
    l.new(bump.outputs['Normal'], b.inputs['Coat Normal'])
    return m


def oak():
    d = os.path.join(CACHE, 'textures', 'white_oak_veneer')
    m = bpy.data.materials.new('oak')
    n, l = nodes_of(m)
    b = n['Principled BSDF']
    tc = n.new('ShaderNodeTexCoord')
    mp = n.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (2.2, 2.2, 2.2)
    mp.inputs['Rotation'].default_value = (0, 0, math.radians(90))
    l.new(tc.outputs['Object'], mp.inputs['Vector'])

    def img(f, colour):
        t = n.new('ShaderNodeTexImage')
        t.image = bpy.data.images.load(os.path.join(d, f), check_existing=True)
        t.image.colorspace_settings.name = 'sRGB' if colour else 'Non-Color'
        l.new(mp.outputs['Vector'], t.inputs['Vector'])
        return t
    dif = img('white_oak_veneer_diff_2k.jpg', True)
    hsv = n.new('ShaderNodeHueSaturation')
    hsv.inputs['Saturation'].default_value = 0.9
    hsv.inputs['Value'].default_value = 1.05
    l.new(dif.outputs['Color'], hsv.inputs['Color'])
    l.new(hsv.outputs['Color'], b.inputs['Base Color'])
    rough = img('white_oak_veneer_rough_2k.jpg', False)
    mr = n.new('ShaderNodeMapRange')
    mr.inputs['To Min'].default_value = 0.38
    mr.inputs['To Max'].default_value = 0.62
    l.new(rough.outputs['Color'], mr.inputs['Value'])
    l.new(mr.outputs['Result'], b.inputs['Roughness'])
    nor = img('white_oak_veneer_nor_gl_2k.jpg', False)
    nm = n.new('ShaderNodeNormalMap')
    nm.inputs['Strength'].default_value = 0.5
    l.new(nor.outputs['Color'], nm.inputs['Color'])
    l.new(nm.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Coat Weight'].default_value = 0.15          # an oiled finish: a soft sheen
    b.inputs['Coat Roughness'].default_value = 0.3
    return m


def ramp_colours(cr, stops):
    els = cr.color_ramp.elements
    while len(els) > 2:
        els.remove(els[-1])
    for i, (p, c) in enumerate(stops):
        e = els[i] if i < 2 else els.new(p)
        e.position = p
        e.color = (*c, 1)


COFFEE = [(0.00, (0.14, 0.045, 0.008)),   # dark coffee brown
          (0.20, (0.32, 0.12, 0.025)),
          (0.40, (0.62, 0.28, 0.060)),     # caramel
          (0.58, (0.82, 0.50, 0.18)),      # tan
          (0.72, (0.93, 0.71, 0.42)),      # the cream swirls
          (0.85, (0.72, 0.37, 0.10)),
          (1.00, (0.40, 0.15, 0.030))]


def coffee(name, stream=False):
    """The glossy caramel coffee. In the cup: rings that spiral round where the stream lands (cx, cy),
    turned by 'rot' and wound tighter by 'twist'. In the stream: long streaks along its length that run
    down with 'flow'. The values are set every frame (set_value)."""
    m = bpy.data.materials.new(name)
    n, l = nodes_of(m)
    b = n['Principled BSDF']
    b.inputs['Roughness'].default_value = 0.06
    b.inputs['Coat Weight'].default_value = 0.25
    b.inputs['Coat Roughness'].default_value = 0.03
    b.inputs['Subsurface Weight'].default_value = 0.25          # thin edges glow amber against the light
    b.inputs['Subsurface Radius'].default_value = (1.0, 0.45, 0.15)
    b.inputs['Subsurface Scale'].default_value = 0.004
    tc = n.new('ShaderNodeTexCoord')

    def val(nm, v=0.0):
        x = n.new('ShaderNodeValue')
        x.name = x.label = nm
        x.outputs[0].default_value = v
        return x.outputs[0]

    wave = n.new('ShaderNodeTexWave')
    wave.inputs['Distortion'].default_value = 4.0
    wave.inputs['Detail'].default_value = 4.0
    wave.inputs['Detail Scale'].default_value = 1.4
    wave.inputs['Detail Roughness'].default_value = 0.6
    if stream:
        mp = n.new('ShaderNodeMapping')
        mp.inputs['Scale'].default_value = (90.0, 90.0, 6.0)      # streaks: fine across, long down the stream
        comb = n.new('ShaderNodeCombineXYZ')
        l.new(val('flow'), comb.inputs['Z'])
        l.new(comb.outputs['Vector'], mp.inputs['Location'])
        l.new(tc.outputs['Object'], mp.inputs['Vector'])
        wave.wave_type = 'BANDS'
        wave.bands_direction = 'X'
        wave.inputs['Scale'].default_value = 0.35
        l.new(mp.outputs['Vector'], wave.inputs['Vector'])
    else:
        sub = n.new('ShaderNodeVectorMath')
        sub.operation = 'SUBTRACT'
        cxy = n.new('ShaderNodeCombineXYZ')
        l.new(val('cx'), cxy.inputs['X'])
        l.new(val('cy'), cxy.inputs['Y'])
        l.new(tc.outputs['Object'], sub.inputs[0])
        l.new(cxy.outputs['Vector'], sub.inputs[1])
        ln = n.new('ShaderNodeVectorMath')
        ln.operation = 'LENGTH'
        l.new(sub.outputs['Vector'], ln.inputs[0])
        tw = n.new('ShaderNodeMath')
        tw.operation = 'MULTIPLY'
        l.new(ln.outputs['Value'], tw.inputs[0])
        l.new(val('twist', 120.0), tw.inputs[1])
        ang = n.new('ShaderNodeMath')
        ang.operation = 'ADD'
        l.new(tw.outputs['Value'], ang.inputs[0])
        l.new(val('rot'), ang.inputs[1])
        rotn = n.new('ShaderNodeVectorRotate')
        rotn.rotation_type = 'Z_AXIS'
        l.new(sub.outputs['Vector'], rotn.inputs['Vector'])
        l.new(ang.outputs['Value'], rotn.inputs['Angle'])
        sc = n.new('ShaderNodeVectorMath')
        sc.operation = 'SCALE'
        sc.inputs['Scale'].default_value = 60.0
        l.new(rotn.outputs['Vector'], sc.inputs[0])
        wave.wave_type = 'RINGS'
        wave.rings_direction = 'SPHERICAL'
        wave.inputs['Scale'].default_value = 0.42
        l.new(sc.outputs['Vector'], wave.inputs['Vector'])
    cr = n.new('ShaderNodeValToRGB')
    ramp_colours(cr, COFFEE)
    l.new(wave.outputs['Fac'], cr.inputs['Fac'])
    # broad patches of lighter and darker coffee, so it's never a regular pattern
    big = n.new('ShaderNodeTexNoise')
    big.inputs['Scale'].default_value = 28.0
    big.inputs['Detail'].default_value = 2.0
    l.new(tc.outputs['Object'], big.inputs['Vector'])
    mix = n.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.blend_type = 'MULTIPLY'
    mr = n.new('ShaderNodeMapRange')
    mr.inputs['To Min'].default_value = 0.0
    mr.inputs['To Max'].default_value = 0.55
    l.new(big.outputs['Fac'], mr.inputs['Value'])
    l.new(mr.outputs['Result'], mix.inputs['Factor'])
    l.new(cr.outputs['Color'], mix.inputs[6])            # the colour sockets (A, B, Result) of a Mix node in RGBA mode
    mix.inputs[7].default_value = (0.55, 0.38, 0.28, 1)
    l.new(mix.outputs[2], b.inputs['Base Color'])
    return m


def set_value(mat, name, v):
    nd = mat.node_tree.nodes.get(name)
    if nd:
        nd.outputs[0].default_value = v


def steam_material():
    m = bpy.data.materials.new('steam')
    n, l = nodes_of(m)
    for x in list(n):
        if x.type == 'BSDF_PRINCIPLED':
            n.remove(x)
    out = n['Material Output']
    vol = n.new('ShaderNodeVolumePrincipled')
    vol.inputs['Color'].default_value = (1.0, 1.0, 1.0, 1)
    vol.inputs['Anisotropy'].default_value = 0.25               # a little brighter toward the light behind it
    l.new(vol.outputs['Volume'], out.inputs['Volume'])
    tc = n.new('ShaderNodeTexCoord')

    def val(nm, v=0.0):
        x = n.new('ShaderNodeValue')
        x.name = x.label = nm
        x.outputs[0].default_value = v
        return x.outputs[0]

    # two copies of the same rising noise, one a loop's rise behind the other, cross-faded: a seamless loop
    def field(off_name):
        comb = n.new('ShaderNodeCombineXYZ')
        l.new(val(off_name), comb.inputs['Z'])
        add = n.new('ShaderNodeVectorMath')
        add.operation = 'SUBTRACT'
        l.new(tc.outputs['Object'], add.inputs[0])
        l.new(comb.outputs['Vector'], add.inputs[1])
        mp = n.new('ShaderNodeMapping')
        mp.inputs['Scale'].default_value = (55.0, 55.0, 30.0)
        l.new(add.outputs['Vector'], mp.inputs['Vector'])
        warp = n.new('ShaderNodeTexNoise')
        warp.inputs['Scale'].default_value = 0.8
        warp.inputs['Detail'].default_value = 2.0
        l.new(mp.outputs['Vector'], warp.inputs['Vector'])
        wsum = n.new('ShaderNodeVectorMath')
        wsum.operation = 'MULTIPLY_ADD'
        l.new(warp.outputs['Color'], wsum.inputs[0])
        wsum.inputs[1].default_value = (1.4, 1.4, 0.6)
        l.new(mp.outputs['Vector'], wsum.inputs[2])
        nz = n.new('ShaderNodeTexNoise')
        nz.inputs['Scale'].default_value = 1.6
        nz.inputs['Detail'].default_value = 4.0
        nz.inputs['Roughness'].default_value = 0.55
        l.new(wsum.outputs['Vector'], nz.inputs['Vector'])
        return nz.outputs['Fac']
    a, bb = field('offA'), field('offB')
    mix = n.new('ShaderNodeMix')
    l.new(val('fade'), mix.inputs['Factor'])
    l.new(a, mix.inputs['A'])
    l.new(bb, mix.inputs['B'])
    thr = n.new('ShaderNodeMapRange')
    thr.inputs['From Min'].default_value = 0.44
    thr.inputs['From Max'].default_value = 0.68
    l.new(mix.outputs['Result'], thr.inputs['Value'])
    # shape: a column over the cup that widens and thins as it rises
    sep = n.new('ShaderNodeSeparateXYZ')
    l.new(tc.outputs['Object'], sep.inputs['Vector'])
    zf = n.new('ShaderNodeMapRange')                 # height falloff
    zf.interpolation_type = 'SMOOTHERSTEP'
    zf.inputs['From Min'].default_value = 0.012
    zf.inputs['From Max'].default_value = 0.04
    l.new(sep.outputs['Z'], zf.inputs['Value'])
    zt = n.new('ShaderNodeMapRange')
    zt.interpolation_type = 'SMOOTHERSTEP'
    zt.inputs['From Min'].default_value = 0.16
    zt.inputs['From Max'].default_value = 0.04
    l.new(sep.outputs['Z'], zt.inputs['Value'])
    rr = n.new('ShaderNodeVectorMath')
    rr.operation = 'LENGTH'
    xy = n.new('ShaderNodeCombineXYZ')
    l.new(sep.outputs['X'], xy.inputs['X'])
    l.new(sep.outputs['Y'], xy.inputs['Y'])
    l.new(xy.outputs['Vector'], rr.inputs[0])
    rad = n.new('ShaderNodeMapRange')
    rad.interpolation_type = 'SMOOTHERSTEP'
    rad.inputs['From Min'].default_value = 0.045
    rad.inputs['From Max'].default_value = 0.012
    l.new(rr.outputs['Value'], rad.inputs['Value'])
    m1 = n.new('ShaderNodeMath'); m1.operation = 'MULTIPLY'
    m2 = n.new('ShaderNodeMath'); m2.operation = 'MULTIPLY'
    m3 = n.new('ShaderNodeMath'); m3.operation = 'MULTIPLY'
    m4 = n.new('ShaderNodeMath'); m4.operation = 'MULTIPLY'
    l.new(thr.outputs['Result'], m1.inputs[0]); l.new(zf.outputs['Result'], m1.inputs[1])
    l.new(m1.outputs['Value'], m2.inputs[0]); l.new(zt.outputs['Result'], m2.inputs[1])
    l.new(m2.outputs['Value'], m3.inputs[0]); l.new(rad.outputs['Result'], m3.inputs[1])
    l.new(m3.outputs['Value'], m4.inputs[0]); l.new(val('dens', 40.0), m4.inputs[1])
    l.new(m4.outputs['Value'], vol.inputs['Density'])
    return m


def gobo_material():
    """The tree out front and the storefront's mullion, as a leaf screen far off toward the sun:
    opaque where leaves and branches are, clear in the gaps. Only shadows see it."""
    m = bpy.data.materials.new('gobo')
    n, l = nodes_of(m)
    for x in list(n):
        if x.type == 'BSDF_PRINCIPLED':
            n.remove(x)
    out = n['Material Output']
    tr = n.new('ShaderNodeBsdfTransparent')
    df = n.new('ShaderNodeBsdfDiffuse')
    df.inputs['Color'].default_value = (0.0, 0.0, 0.0, 1)
    mx = n.new('ShaderNodeMixShader')
    tc = n.new('ShaderNodeTexCoord')
    sway = n.new('ShaderNodeValue'); sway.name = sway.label = 'sway'
    comb = n.new('ShaderNodeCombineXYZ')
    l.new(sway.outputs[0], comb.inputs['X'])
    add = n.new('ShaderNodeVectorMath'); add.operation = 'ADD'
    l.new(tc.outputs['Object'], add.inputs[0]); l.new(comb.outputs['Vector'], add.inputs[1])
    # the canopy: big soft masses
    big = n.new('ShaderNodeTexNoise')
    big.inputs['Scale'].default_value = 7.0
    big.inputs['Detail'].default_value = 3.0
    l.new(add.outputs['Vector'], big.inputs['Vector'])
    # leaves: small cells
    vor = n.new('ShaderNodeTexVoronoi')
    vor.feature = 'F1'
    vor.inputs['Scale'].default_value = 16.0
    l.new(add.outputs['Vector'], vor.inputs['Vector'])
    c1 = n.new('ShaderNodeMapRange')
    c1.inputs['From Min'].default_value = 0.40
    c1.inputs['From Max'].default_value = 0.52
    l.new(big.outputs['Fac'], c1.inputs['Value'])
    c2 = n.new('ShaderNodeMapRange')
    c2.inputs['From Min'].default_value = 0.16      # round gaps between the leaves: sun flecks
    c2.inputs['From Max'].default_value = 0.30
    l.new(vor.outputs['Distance'], c2.inputs['Value'])
    mul = n.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
    l.new(c1.outputs['Result'], mul.inputs[0]); l.new(c2.outputs['Result'], mul.inputs[1])
    # where it's open (x < 0 on the screen): no tree, the cup in clear sun
    sep = n.new('ShaderNodeSeparateXYZ')
    l.new(tc.outputs['Object'], sep.inputs['Vector'])
    side = n.new('ShaderNodeMapRange')
    side.inputs['From Min'].default_value = 0.60
    side.inputs['From Max'].default_value = 0.30
    l.new(sep.outputs['X'], side.inputs['Value'])
    mul2 = n.new('ShaderNodeMath'); mul2.operation = 'MULTIPLY'
    l.new(mul.outputs['Value'], mul2.inputs[0]); l.new(side.outputs['Result'], mul2.inputs[1])
    l.new(mul2.outputs['Value'], mx.inputs['Fac'])
    l.new(tr.outputs[0], mx.inputs[1])
    l.new(df.outputs[0], mx.inputs[2])
    l.new(mx.outputs[0], out.inputs['Surface'])
    return m


# ---------------------------------------------------------------- the scene
SUN_DIR = Vector((-0.78, 0.05, 0.62)).normalized()    # toward the sun: from the left, about 38 degrees up, so the coffee is in the light


def build(size):
    sc = bpy.context.scene
    sc.unit_settings.scale_length = 1.0
    P = porcelain()
    cup = lathe('cup', cup_profile())
    cup.location.z = CUP_Z
    cup.data.materials.append(P)
    hd = handle(P)
    hd.rotation_euler.z = math.radians(-20)      # the handle toward the camera's right
    cup.rotation_euler.z = math.radians(-20)
    sau = lathe('saucer', saucer_profile())
    sau.data.materials.append(P)
    for ob in (cup, sau):
        mod = ob.modifiers.new('sub', 'SUBSURF')
        mod.levels = mod.render_levels = 1
    # the table
    bpy.ops.mesh.primitive_plane_add(size=3.0, location=(0, 0, 0))
    tab = bpy.context.object
    tab.name = 'table'
    tab.data.materials.append(oak())
    # coffee
    CS, CT = coffee('coffee-surface'), coffee('coffee-stream', stream=True)
    surf = bpy.data.objects.new('surface', bpy.data.meshes.new('surface'))
    surf.location.z = CUP_Z
    bpy.context.collection.objects.link(surf)
    surf.data.materials.append(CS)
    strm = bpy.data.objects.new('stream', bpy.data.meshes.new('stream'))
    bpy.context.collection.objects.link(strm)
    strm.data.materials.append(CT)
    # steam
    # its box: 11 cm across, 18 cm tall, its coordinates starting at the coffee's surface
    sme = bpy.data.meshes.new('steam')
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * 0.11, v.co.y * 0.11, (v.co.z + 0.5) * 0.18))
    bm.to_mesh(sme)
    bm.free()
    st = bpy.data.objects.new('steam', sme)
    bpy.context.collection.objects.link(st)
    st.location.z = CUP_Z + L_FULL - 0.002
    SM = steam_material()
    st.data.materials.append(SM)
    st.visible_shadow = False
    # light: the low sun through the glass, the room's sky for fill and reflections
    sun_data = bpy.data.lights.new('sun', 'SUN')
    sun_data.energy = 4.0
    sun_data.angle = math.radians(1.1)
    sun_data.color = (1.0, 0.84, 0.66)
    sun = bpy.data.objects.new('sun', sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = SUN_DIR.to_track_quat('Z', 'Y').to_euler()
    # the storefront glass behind the cup: a big soft window, the bright streaks on the glossy coffee and glaze
    wd = bpy.data.lights.new('window', 'AREA')
    wd.shape = 'RECTANGLE'
    wd.size, wd.size_y = 0.34, 0.035
    wd.energy = 7.0
    wd.color = (1.0, 0.93, 0.84)
    win = bpy.data.objects.new('window', wd)
    bpy.context.collection.objects.link(win)
    win.location = (0.05, 0.80, 0.70)
    win.rotation_euler = (Vector((0, 0, 0.03)) - win.location).to_track_quat('-Z', 'Y').to_euler()
    win.visible_camera = False
    # the leaf screen: 0.7 m toward the sun, facing it (near enough that the flecks stay round, not blurred away)
    bpy.ops.mesh.primitive_plane_add(size=1.6, location=SUN_DIR * 0.7)
    gb = bpy.context.object
    gb.name = 'gobo'
    gb.rotation_euler = SUN_DIR.to_track_quat('Z', 'Y').to_euler()
    gb.data.materials.append(gobo_material())
    gb.visible_camera = False
    gb.visible_glossy = False
    gb.visible_diffuse = False
    gb.visible_transmission = False
    gb.visible_volume_scatter = False
    w = bpy.data.worlds.new('room')
    sc.world = w
    wn, wl = nodes_of(w)
    env = wn.new('ShaderNodeTexEnvironment')
    env.image = bpy.data.images.load(os.path.join(CACHE, 'hdri', 'kiara_interior_2k.hdr'))
    mpw = wn.new('ShaderNodeMapping')
    mpw.inputs['Rotation'].default_value = (0, 0, math.radians(140))
    tcw = wn.new('ShaderNodeTexCoord')
    wl.new(tcw.outputs['Generated'], mpw.inputs['Vector'])
    wl.new(mpw.outputs['Vector'], env.inputs['Vector'])
    bg = wn['Background']
    bg.inputs['Strength'].default_value = 0.6
    wl.new(env.outputs['Color'], bg.inputs['Color'])
    # the camera: about 40 degrees down; the lens shift puts the cup in the bottom-right square
    cd = bpy.data.cameras.new('cam')
    cd.lens = 58
    cd.sensor_width = 36
    cd.shift_x, cd.shift_y = -0.21, 0.21
    cd.dof.use_dof = True
    cd.dof.aperture_fstop = 2.4
    cam = bpy.data.objects.new('cam', cd)
    bpy.context.collection.objects.link(cam)
    sc.camera = cam
    target = Vector((0.004, 0.0, 0.030))
    pos = Vector((-0.02, -0.40, 0.33))
    cam.location = pos
    cam.rotation_euler = (target - pos).to_track_quat('-Z', 'Y').to_euler()
    cd.dof.focus_distance = (target - pos).length
    return dict(cup=cup, surf=surf, strm=strm, CS=CS, CT=CT, SM=SM, sun=sun, gobo=gb, cam=cam, cd=cd, pos=pos, target=target)


# ---------------------------------------------------------------- the pour over time
def level(t):
    """The coffee's level (cup coords), None while the cup is still empty."""
    if t < T_LAND:
        return None
    k = min(1.0, (t - T_LAND) / (T_STOP - T_LAND + 0.25))
    return IN_BOTTOM + 0.0008 + (L_FULL - IN_BOTTOM - 0.0008) * (1 - (1 - k) ** 1.6)


def pour_amount(t):
    return smooth(T_HEAD - 0.02, T_HEAD + 0.08, t) * (1 - smooth(T_THIN, T_STOP, t))


IMPACT = (-0.006, 0.004)      # where the stream lands, a little off centre (x, y)


def impact(t):
    return (IMPACT[0] + 0.0012 * math.sin(t * 2.3), IMPACT[1] + 0.0010 * math.cos(t * 1.7))


def stream_mesh(me, t, Lw):
    """The rope of coffee: a tube from above the frame to the surface (or the cup's floor), its head
    falling in, its tail falling away after it breaks, thinning as the pour eases off."""
    bm = bmesh.new()
    top0 = CUP_Z + 0.30
    floor = CUP_Z + (Lw if Lw is not None else IN_BOTTOM)
    head = top0 - 0.5 * G * max(t - T_HEAD, 0.0) ** 2 * 0.55       # a viscous fall, slower than free
    bottom = max(head, floor - 0.002)
    top = top0 + 0.2 if t < T_STOP else top0 - 0.5 * G * 0.55 * (t - T_STOP) ** 2 - 0.25 * (t - T_STOP)
    if t < T_HEAD or top <= bottom + 0.002:
        bm.to_mesh(me); bm.free(); return
    thin = 1.0 - 0.55 * smooth(T_THIN - 0.2, T_STOP, t)
    ix, iy = impact(t)
    NS, NR = 90, 24
    rings = []
    for i in range(NS + 1):
        z = bottom + (top - bottom) * i / NS
        dz = z - floor
        r = 0.0056 * thin * (1 + 0.06 * math.sin(z * 140 + t * 9))
        r *= 1 + 0.9 * math.exp(-max(dz, 0) / 0.004)                 # it spreads where it lands
        if i == 0 and head > floor:                                    # the falling head: a rounded drop
            r *= 0.7
        if t > T_STOP and i == NS:
            r *= 0.4
        # a gentle sway, more higher up
        sx = 0.0016 * math.sin(t * 2.1 + z * 18) * min(1, dz / 0.06)
        sy = 0.0012 * math.cos(t * 1.6 + z * 14) * min(1, dz / 0.06)
        cx, cy = ix + sx, iy + sy
        ring = []
        for k in range(NR):
            a = 2 * math.pi * k / NR
            ring.append(bm.verts.new((cx + r * math.cos(a), cy + r * math.sin(a), z)))
        rings.append(ring)
    for i in range(NS):
        for k in range(NR):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % NR], rings[i + 1][(k + 1) % NR], rings[i + 1][k]))
    for ring, z in ((rings[0], bottom), (rings[-1], top)):
        c = bm.verts.new((sum(v.co.x for v in ring) / NR, sum(v.co.y for v in ring) / NR, z))
        for k in range(NR):
            bm.faces.new((ring[k], ring[(k + 1) % NR], c) if z == top else (ring[(k + 1) % NR], ring[k], c))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True


def surface_mesh(me, t, Lw, settle):
    """The coffee's surface in the cup: a disc at the level, a soft mound of coiling coffee where the
    stream lands, a meniscus up the wall, slow rings that die away."""
    bm = bmesh.new()
    if Lw is None:
        bm.to_mesh(me); bm.free(); return
    R = r_in(Lw) + 0.0006
    ix, iy = impact(t)
    pour = pour_amount(t)
    NR, NA = 60, 160
    verts = [[None] * NA for _ in range(NR + 1)]
    centre = bm.verts.new((0, 0, Lw))
    for i in range(1, NR + 1):
        rr = R * (i / NR) ** 0.85
        for k in range(NA):
            a = 2 * math.pi * k / NA
            x, y = rr * math.cos(a), rr * math.sin(a)
            d = math.hypot(x - ix, y - iy)
            z = Lw
            z += 0.0032 * pour * math.exp(-(d / 0.0085) ** 2)                       # the mound
            z += 0.00025 * pour * math.cos(d * 900 - t * 22) * math.exp(-d / 0.012)  # coils round the stream
            z += 0.00035 * settle * math.cos(d * 520 - t * 14) * math.exp(-d / 0.02) # rings after it stops
            z += 0.0011 * smooth(R - 0.0025, R, rr)                                  # the meniscus at the wall
            verts[i][k] = bm.verts.new((x, y, z))
    for k in range(NA):
        bm.faces.new((centre, verts[1][k], verts[1][(k + 1) % NA]))
    for i in range(1, NR):
        for k in range(NA):
            bm.faces.new((verts[i][k], verts[i + 1][k], verts[i + 1][(k + 1) % NA], verts[i][(k + 1) % NA]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True


ROT_RATE = 1.6        # radians per second while pouring


def swirl_rot(t):
    """How far the swirl has turned: steady while pouring, easing to a stop by the intro's end."""
    if t <= T_LAND:
        return 0.0
    if t <= T_STOP:
        return ROT_RATE * (t - T_LAND)
    span = INTRO - T_STOP
    x = min(t - T_STOP, span) / span
    return ROT_RATE * (T_STOP - T_LAND) + ROT_RATE * span * (x - x * x / 2)   # the rate falls linearly to 0


def state(o, t_intro, tau):
    """Sets everything for intro time t_intro (None in the loop) and loop time tau."""
    sc = bpy.context.scene
    t = t_intro if t_intro is not None else INTRO
    Lw = level(t)
    stream_mesh(o['strm'].data, t, Lw)
    settle = smooth(T_STOP - 0.1, T_STOP + 0.2, t) * math.exp(-1.6 * max(t - T_STOP, 0)) if t_intro is not None else 0.0
    surface_mesh(o['surf'].data, t, Lw, settle)
    ix, iy = impact(min(t, T_STOP))
    set_value(o['CS'], 'cx', ix)
    set_value(o['CS'], 'cy', iy)
    set_value(o['CS'], 'rot', swirl_rot(t))
    set_value(o['CS'], 'twist', 90.0 + 70.0 * smooth(T_LAND, T_STOP, t))
    set_value(o['CT'], 'flow', t * 0.9)
    # steam: rises at RISE m/s; two copies a loop's rise apart, cross-faded over the loop
    RISE = 0.035
    k = smooth(T_STOP - 0.3, INTRO, t) if t_intro is not None else 1.0
    tt = tau
    set_value(o['SM'], 'offA', RISE * tt)
    set_value(o['SM'], 'offB', RISE * (tt - LOOP))
    set_value(o['SM'], 'fade', max(tt, 0.0) / LOOP)
    set_value(o['SM'], 'dens', 26.0 * k)
    # the steam's box follows the level
    # (it starts just under the surface; the coffee hides what is below)
    # the leaves sway, periodic over the loop
    sw = 0.012 * math.sin(2 * math.pi * tau / LOOP) + 0.005 * math.sin(4 * math.pi * tau / LOOP + 1.1)
    set_value(o['gobo'].active_material, 'sway', sw)
    # the light comes up, warm first
    if t_intro is not None:
        lk = ease(t_intro / T_LIGHT)
        sc.view_settings.exposure = -7.0 * (1 - lk) + EXPOSURE * lk
        warm = smooth(0.0, 1.4, t_intro)
        o['sun'].data.color = (1.0, 0.64 + 0.16 * warm, 0.40 + 0.18 * warm)
        # a slow push in, settling on the final framing at the intro's end
        x = ease(t_intro / INTRO)
        o['cam'].location = o['target'] + (o['pos'] - o['target']) * (1 + 0.06 * (1 - x))
    else:
        sc.view_settings.exposure = EXPOSURE
        o['sun'].data.color = (1.0, 0.80, 0.58)
        o['cam'].location = o['pos']


EXPOSURE = 0.0


def setup_render(samples, size):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    cy = sc.cycles
    cy.device = 'CPU'
    cy.samples = samples
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.012
    cy.use_denoising = True
    cy.denoiser = 'OPENIMAGEDENOISE'
    cy.denoising_input_passes = 'RGB_ALBEDO_NORMAL'
    cy.denoising_prefilter = 'ACCURATE'
    cy.max_bounces = 8
    cy.diffuse_bounces = 3
    cy.glossy_bounces = 4
    cy.transmission_bounces = 4
    cy.volume_bounces = 0
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    cy.sample_clamp_indirect = 4.0
    cy.volume_step_rate = 2.0
    cy.volume_max_steps = 128
    sc.render.resolution_x = sc.render.resolution_y = size
    sc.render.resolution_percentage = 100
    sc.render.fps = FPS
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_depth = '8'
    sc.render.threads_mode = 'AUTO'
    sc.render.use_persistent_data = True


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    out = argv[0]
    opts = dict(mode='intro', frames=None, samples=64, size=1440, t=None)
    i = 1
    while i < len(argv):
        opts[argv[i].lstrip('-')] = argv[i + 1]
        i += 2
    bpy.ops.wm.read_factory_settings(use_empty=True)
    os.makedirs(out, exist_ok=True)
    setup_render(int(opts['samples']), int(opts['size']))
    o = build(int(opts['size']))
    sc = bpy.context.scene
    if opts['mode'] == 'still':
        t = float(opts['t'] or INTRO)
        state(o, t, t - INTRO)
        sc.render.filepath = os.path.join(out, f'still-{t:.2f}.png')
        bpy.ops.render.render(write_still=True)
        return
    n = int(round((INTRO if opts['mode'] == 'intro' else LOOP) * FPS))
    spec = opts['frames'] or f'0-{n - 1}'
    rng, step = (spec.split(':') + ['1'])[:2]
    a, b = rng.split('-')
    for f in range(int(a), min(int(b), n - 1) + 1, int(step)):
        dest = os.path.join(out, f'f{f:04d}.png')
        if os.path.exists(dest):
            continue
        t = f / FPS
        if opts['mode'] == 'intro':
            state(o, t, t - INTRO)        # the steam keeps rising through the intro; tau = 0 at its end
        else:
            state(o, None, t)
        sc.render.filepath = dest
        bpy.ops.render.render(write_still=True)
        print('frame', f, flush=True)


if __name__ == '__main__':
    main()
