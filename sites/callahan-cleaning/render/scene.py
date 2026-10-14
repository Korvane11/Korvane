"""Callahan Cleaning: the 3D scenes, built in Blender (bpy 5.2) and rendered with Cycles.

A Tucson living room at first light: white plaster walls, a Saltillo tile floor,
round wooden vigas across the ceiling, a linen sofa, a desert aloe by a tall window
with wooden blinds. In the opening the blinds tilt open and low morning sun comes in
through them in stripes; outside, a mesquite's leaves sway in the light, so the
stripes move a little (the loop).

    python3 render/scene.py <shot> <out_dir> [--layout land|port] [--frames A-B[:step]]
                            [--samples N] [--scale PCT]

Shots: film (the opening and the loop: frames 1-168, see INTRO_END, LOOP_LEN), and the stills
living, kitchen, moving, rental, office. Everything is in metres; Z is up.
Models, textures and skies are Poly Haven's (CC0), fetched by fetch_assets.py.
"""
import bpy, bmesh, math, os, sys, random, glob
from mathutils import Vector, Euler, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, 'cache')

# ---------------------------------------------------------------- the room (metres)
X0, X1 = -3.0, 3.2      # left wall (the window) .. right wall
Y0, Y1 = -1.2, 5.0      # front wall (behind the camera) .. back wall (the sofa)
H = 2.85                # ceiling
WIN_Y = (1.35, 3.95)    # the window opening in the left wall
WIN_Z = (0.42, 2.48)

# ---------------------------------------------------------------- the film's timing (24 fps)
FPS = 24
INTRO_END = 96          # frames 1-96: the blinds open, the camera settles
LOOP_LEN = 72           # frames 97-168: the loop (3 s); frame 169 would equal frame 97
BLIND_OPEN = (6, 62)    # the blinds turn from closed to open over these frames
BLIND_CLOSED, BLIND_OPENED = math.radians(84), math.radians(-16)


def ease(t):            # smootherstep
    t = max(0.0, min(1.0, t))
    return t * t * t * (t * (t * 6 - 15) + 10)


def ease_out(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


# ---------------------------------------------------------------- materials
def tex_material(name, tex, scale=1.0, tint=None, rough_mul=1.0, rough_add=0.0, bump=0.4,
                 coat=0.0, box=False, rot=0.0, sat=1.0, val=1.0):
    """A PBR material from one of the Poly Haven texture sets (Diffuse, nor_gl, Rough)."""
    d = os.path.join(CACHE, 'textures', tex)
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    n, l = nt.nodes, nt.links
    bsdf = n['Principled BSDF']
    tc = n.new('ShaderNodeTexCoord')
    mp = n.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (scale, scale, scale)
    mp.inputs['Rotation'].default_value = (0, 0, rot)
    l.new(tc.outputs['Object' if box else 'UV'], mp.inputs['Vector'])

    def img(file, colour):
        t = n.new('ShaderNodeTexImage')
        t.image = bpy.data.images.load(os.path.join(d, file), check_existing=True)
        t.image.colorspace_settings.name = 'sRGB' if colour else 'Non-Color'
        if box:
            t.projection = 'BOX'
            t.projection_blend = 0.25
        l.new(mp.outputs['Vector'], t.inputs['Vector'])
        return t

    dif = img('Diffuse.jpg', True)
    col = dif.outputs['Color']
    if sat != 1.0 or val != 1.0:
        hsv = n.new('ShaderNodeHueSaturation')
        hsv.inputs['Saturation'].default_value = sat
        hsv.inputs['Value'].default_value = val
        l.new(col, hsv.inputs['Color'])
        col = hsv.outputs['Color']
    if tint:
        mix = n.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        mix.blend_type = 'MULTIPLY'
        mix.inputs['Factor'].default_value = 1.0
        l.new(col, mix.inputs['A'])
        mix.inputs['B'].default_value = (*tint, 1)
        col = mix.outputs['Result']
    l.new(col, bsdf.inputs['Base Color'])
    r = img('Rough.jpg', False)
    mr = n.new('ShaderNodeMath')
    mr.operation = 'MULTIPLY_ADD'
    mr.inputs[1].default_value = rough_mul
    mr.inputs[2].default_value = rough_add
    l.new(r.outputs['Color'], mr.inputs[0])
    l.new(mr.outputs['Value'], bsdf.inputs['Roughness'])
    nm = img('nor_gl.jpg', False)
    nmap = n.new('ShaderNodeNormalMap')
    nmap.inputs['Strength'].default_value = bump
    l.new(nm.outputs['Color'], nmap.inputs['Color'])
    l.new(nmap.outputs['Normal'], bsdf.inputs['Normal'])
    if coat:
        bsdf.inputs['Coat Weight'].default_value = coat
        bsdf.inputs['Coat Roughness'].default_value = 0.08
    return m


def plain_material(name, colour, rough=0.5, metal=0.0, sheen=0.0, coat=0.0, sss=0.0, trans=0.0, emit=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*colour, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if sheen:
        b.inputs['Sheen Weight'].default_value = sheen
        b.inputs['Sheen Roughness'].default_value = 0.4
    if coat:
        b.inputs['Coat Weight'].default_value = coat
        b.inputs['Coat Roughness'].default_value = 0.05
    if sss:
        b.inputs['Subsurface Weight'].default_value = sss
        b.inputs['Subsurface Radius'].default_value = (0.3, 0.2, 0.15)
        b.inputs['Subsurface Scale'].default_value = 0.02
    if trans:
        b.inputs['Transmission Weight'].default_value = trans
    if emit:
        b.inputs['Emission Color'].default_value = (*emit[0], 1)
        b.inputs['Emission Strength'].default_value = emit[1]
    return m


def linen(name, colour, scale=3.0):
    """Woven linen: the rough_linen texture's weave, recoloured, with a soft sheen."""
    m = tex_material(name, 'rough_linen', scale=scale, bump=0.55, sat=0.0, val=1.0)
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    # recolour: the texture's value modulates our colour
    hsv = [x for x in nt.nodes if x.type == 'HUE_SAT'][0]
    mix = nt.nodes.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.blend_type = 'MULTIPLY'
    mix.inputs['Factor'].default_value = 1.0
    nt.links.new(hsv.outputs['Color'], mix.inputs['A'])
    mix.inputs['B'].default_value = (*colour, 1)
    br = nt.nodes.new('ShaderNodeBrightContrast')
    br.inputs['Bright'].default_value = 0.35
    nt.links.new(mix.outputs['Result'], br.inputs['Color'])
    nt.links.new(br.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Sheen Weight'].default_value = 0.6
    b.inputs['Sheen Roughness'].default_value = 0.35
    return m


def plaster(name, colour):
    """Hand-troweled lime plaster: an even warm white, a soft cloudy variation, a fine trowel bump."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    n, l = nt.nodes, nt.links
    b = n['Principled BSDF']
    tc = n.new('ShaderNodeTexCoord')
    big = n.new('ShaderNodeTexNoise')
    big.inputs['Scale'].default_value = 0.9
    big.inputs['Detail'].default_value = 4
    l.new(tc.outputs['Object'], big.inputs['Vector'])
    ramp = n.new('ShaderNodeMapRange')
    ramp.inputs['To Min'].default_value = 0.93
    ramp.inputs['To Max'].default_value = 1.03
    l.new(big.outputs['Fac'], ramp.inputs['Value'])
    mix = n.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.blend_type = 'MULTIPLY'
    mix.inputs['Factor'].default_value = 1.0
    mix.inputs['A'].default_value = (*colour, 1)
    l.new(ramp.outputs['Result'], mix.inputs['B'])
    l.new(mix.outputs['Result'], b.inputs['Base Color'])
    fine = n.new('ShaderNodeTexNoise')
    fine.inputs['Scale'].default_value = 7.0
    fine.inputs['Detail'].default_value = 8
    fine.inputs['Roughness'].default_value = 0.55
    l.new(tc.outputs['Object'], fine.inputs['Vector'])
    bump = n.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.08
    bump.inputs['Distance'].default_value = 0.004
    l.new(fine.outputs['Fac'], bump.inputs['Height'])
    l.new(bump.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Roughness'].default_value = 0.85
    return m


# ---------------------------------------------------------------- geometry helpers
def box(name, size, loc, mat=None, bevel=0.0, segs=3, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        bv = o.modifiers.new('bevel', 'BEVEL')
        bv.width = bevel
        bv.segments = segs
        bv.limit_method = 'ANGLE'
    if mat:
        o.data.materials.append(mat)
    smooth(o)
    return o


def smooth(o):
    for p in o.data.polygons:
        p.use_smooth = True


def cushion(name, size, loc, mat, soft=0.06, sag=0.012, rot=(0, 0, 0)):
    """A cushion: a rounded box, slightly crowned, with a faint random rumple."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bv = o.modifiers.new('bevel', 'BEVEL')
    bv.width = soft
    bv.segments = 6
    sub = o.modifiers.new('sub', 'SUBSURF')
    sub.levels = 2
    sub.render_levels = 3
    tex = bpy.data.textures.new(name + '_rumple', 'CLOUDS')
    tex.noise_scale = 0.18
    dsp = o.modifiers.new('rumple', 'DISPLACE')
    dsp.texture = tex
    dsp.strength = sag
    dsp.texture_coords = 'GLOBAL'
    o.data.materials.append(mat)
    smooth(o)
    return o


def load_model(asset, loc=(0, 0, 0), rot_z=0.0, height=None, scale=None, mat=None):
    """Import a Poly Haven glTF, parent its parts to one empty, put it on the floor at loc."""
    before = set(bpy.data.objects)
    f = glob.glob(os.path.join(CACHE, 'models', asset, '*.gltf'))[0]
    bpy.ops.import_scene.gltf(filepath=f)
    new = [o for o in bpy.data.objects if o not in before]
    root = bpy.data.objects.new(asset, None)
    bpy.context.scene.collection.objects.link(root)
    meshes = [o for o in new if o.type == 'MESH']
    lo = Vector((1e9, 1e9, 1e9)); hi = -lo
    for o in meshes:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
    for o in new:
        if o.parent is None:
            o.parent = root
        if mat and o.type == 'MESH':
            o.data.materials.clear()
            o.data.materials.append(mat)
    s = scale or ((height / (hi.z - lo.z)) if height else 1.0)
    root.scale = (s, s, s)
    root.rotation_euler = (0, 0, rot_z)
    c = (lo + hi) / 2
    root.location = Vector(loc) - Matrix.Rotation(rot_z, 3, 'Z') @ Vector((c.x * s, c.y * s, lo.z * s))
    return root


# ---------------------------------------------------------------- the room
def build_room(mats, window=True, vigas=True):
    t = 0.2
    # floor: sealed Saltillo tile
    box('floor', (X1 - X0 + 2 * t, Y1 - Y0 + 2 * t, t), ((X0 + X1) / 2, (Y0 + Y1) / 2, -t / 2), mats['floor'])
    box('ceiling', (X1 - X0 + 2 * t, Y1 - Y0 + 2 * t, t), ((X0 + X1) / 2, (Y0 + Y1) / 2, H + t / 2), mats['ceiling'])
    box('wall_back', (X1 - X0 + 2 * t, t, H), ((X0 + X1) / 2, Y1 + t / 2, H / 2), mats['wall'])
    box('wall_front', (X1 - X0 + 2 * t, t, H), ((X0 + X1) / 2, Y0 - t / 2, H / 2), mats['wall'])
    box('wall_right', (t, Y1 - Y0, H), (X1 + t / 2, (Y0 + Y1) / 2, H / 2), mats['wall'])
    # left wall, built around the window opening (deep adobe-style reveal: 0.32 m)
    d = 0.32
    xw = X0 - d / 2
    if window:
        y0, y1 = WIN_Y
        z0, z1 = WIN_Z
        box('wall_left_a', (d, y0 - Y0, H), (xw, (Y0 + y0) / 2, H / 2), mats['wall'])
        box('wall_left_b', (d, Y1 - y1, H), (xw, (y1 + Y1) / 2, H / 2), mats['wall'])
        box('wall_left_sill', (d, y1 - y0, z0), (xw, (y0 + y1) / 2, z0 / 2), mats['wall'])
        box('wall_left_head', (d, y1 - y0, H - z1), (xw, (y0 + y1) / 2, (z1 + H) / 2), mats['wall'])
        # rounded plaster edges on the reveal, a wooden sill
        box('sill', (d + 0.06, y1 - y0 + 0.08, 0.035), (xw + 0.03, (y0 + y1) / 2, z0 + 0.0175), mats['oak'], bevel=0.008)
        # the frame: thin dark bronze mullions, at the outer face
        fx = X0 - d + 0.03
        fr = mats['frame']
        box('frame_t', (0.05, y1 - y0, 0.05), (fx, (y0 + y1) / 2, z1 - 0.025), fr)
        box('frame_b', (0.05, y1 - y0, 0.05), (fx, (y0 + y1) / 2, z0 + 0.025), fr)
        box('frame_l', (0.05, 0.05, z1 - z0), (fx, y0 + 0.025, (z0 + z1) / 2), fr)
        box('frame_r', (0.05, 0.05, z1 - z0), (fx, y1 - 0.025, (z0 + z1) / 2), fr)
        box('frame_m', (0.04, 0.035, z1 - z0), (fx, (y0 + y1) / 2, (z0 + z1) / 2), fr)
    else:
        box('wall_left', (d, Y1 - Y0, H), (xw, (Y0 + Y1) / 2, H / 2), mats['wall'])
    # baseboards
    box('base_back', (X1 - X0, 0.015, 0.09), ((X0 + X1) / 2, Y1 - 0.0075, 0.045), mats['wall'])
    box('base_right', (0.015, Y1 - Y0, 0.09), (X1 - 0.0075, (Y0 + Y1) / 2, 0.045), mats['wall'])
    if vigas:
        for i, y in enumerate([0.2, 1.55, 2.9, 4.25]):
            bpy.ops.mesh.primitive_cylinder_add(radius=0.105, depth=X1 - X0 + 0.3, vertices=48,
                                                location=((X0 + X1) / 2, y, H - 0.09), rotation=(0, math.pi / 2, 0))
            v = bpy.context.active_object
            v.name = f'viga_{i}'
            v.data.materials.append(mats['viga'])
            smooth(v)
            dsp = v.modifiers.new('wobble', 'DISPLACE')
            tx = bpy.data.textures.new(f'viga_tx_{i}', 'CLOUDS')
            tx.noise_scale = 0.35
            dsp.texture = tx
            dsp.strength = 0.012
            dsp.texture_coords = 'GLOBAL'


def build_blinds(mats):
    """Faux-wood blinds inside the window opening; returns the slats (they rotate about Y)."""
    y0, y1 = WIN_Y
    z0, z1 = WIN_Z
    pitch = 0.046
    n = int((z1 - z0 - 0.08) / pitch)
    slats = []
    x = X0 - 0.07
    me = None
    for i in range(n):
        z = z1 - 0.07 - i * pitch
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, (y0 + y1) / 2, z))
        s = bpy.context.active_object
        s.name = f'slat_{i:02d}'
        s.scale = (0.05, (y1 - y0) - 0.04, 0.0035)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        bv = s.modifiers.new('bevel', 'BEVEL')
        bv.width = 0.0015
        bv.segments = 2
        s.data.materials.append(mats['slat'])
        slats.append(s)
    # headrail and the two ladder tapes
    box('headrail', (0.06, (y1 - y0) - 0.02, 0.045), (x, (y0 + y1) / 2, z1 - 0.03), mats['slat'], bevel=0.004)
    for yy in (y0 + 0.35, y1 - 0.35):
        box(f'tape_{yy:.2f}', (0.002, 0.024, z1 - z0 - 0.1), (x - 0.026, yy, (z0 + z1) / 2 + 0.02), mats['tape'])
        box(f'tape2_{yy:.2f}', (0.002, 0.024, z1 - z0 - 0.1), (x + 0.026, yy, (z0 + z1) / 2 + 0.02), mats['tape'])
    return slats


def set_blinds(slats, angle):
    for s in slats:
        s.rotation_euler = (0, angle, 0)


def build_canopy(mats, seed=7):
    """A mesquite outside the window, between the sun and the glass: only its shadow is seen.
    Small leaflets on a few branches; the whole crown sways (see sway())."""
    rnd = random.Random(seed)
    bm = bmesh.new()
    clusters = [(Vector((-6.2, 1.6 + rnd.uniform(-0.6, 3.2), rnd.uniform(1.6, 3.6))), rnd.uniform(0.5, 0.9)) for _ in range(6)]
    for c, r in clusters:
        for _ in range(240):
            p = c + Vector((rnd.gauss(0, r * 0.5), rnd.gauss(0, r), rnd.gauss(0, r * 0.6)))
            a = rnd.uniform(0, math.tau)
            ln, wd = rnd.uniform(0.05, 0.09), rnd.uniform(0.012, 0.022)
            u = Vector((math.cos(a), math.sin(a), rnd.uniform(-0.6, 0.6))).normalized()
            v = u.cross(Vector((1, 0, 0))).normalized()
            if v.length < 0.1:
                v = Vector((0, 0, 1))
            vs = [bm.verts.new(p + u * ln * k + v * wd * w) for k, w in ((-1, 0), (0, -1), (1, 0), (0, 1))]
            bm.faces.new(vs)
    me = bpy.data.meshes.new('canopy')
    bm.to_mesh(me)
    o = bpy.data.objects.new('canopy', me)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(mats['leaf'])
    o.visible_camera = False
    o.visible_glossy = False
    o.visible_transmission = False
    # pivot near the trunk so it sways like a crown
    pivot = bpy.data.objects.new('canopy_pivot', None)
    bpy.context.scene.collection.objects.link(pivot)
    pivot.location = (-6.4, 2.6, 0.2)
    o.parent = pivot
    o.location = -pivot.location
    return pivot


def sway(pivot, frame):
    """Periodic over LOOP_LEN frames, so the loop is seamless; the same formula runs through the intro."""
    ph = math.tau * (frame - (INTRO_END + 1)) / LOOP_LEN
    pivot.rotation_euler = (0.035 * math.sin(ph) + 0.012 * math.sin(2 * ph + 1.1),
                            0.010 * math.sin(ph + 0.6),
                            0.018 * math.sin(ph + 2.0))


# ---------------------------------------------------------------- the sofa (modern, low, linen)
def build_sofa(mats, x=0.35, y=4.55, w=2.36, d=0.98, rot=0.0):
    parts = []
    base_h, seat_h = 0.17, 0.44
    oat = mats['sofa']
    parts.append(box('sofa_plinth', (w - 0.08, d - 0.1, 0.06), (x, y, 0.03), mats['plinth'], bevel=0.01))
    parts.append(cushion('sofa_base', (w, d, base_h), (x, y, 0.06 + base_h / 2), oat, soft=0.035, sag=0.004))
    arm_w = 0.2
    for sx in (-1, 1):
        parts.append(cushion(f'sofa_arm_{sx}', (arm_w, d, 0.34), (x + sx * (w / 2 - arm_w / 2), y, 0.06 + base_h + 0.17), oat, soft=0.07, sag=0.004))
    parts.append(cushion('sofa_back', (w - 2 * arm_w, 0.2, 0.42), (x, y + d / 2 - 0.1, 0.06 + base_h + 0.21), oat, soft=0.08, sag=0.006))
    seat_w = (w - 2 * arm_w) / 2
    for i, sx in enumerate((-0.5, 0.5)):
        parts.append(cushion(f'sofa_seat_{i}', (seat_w - 0.01, d - 0.24, 0.15), (x + sx * seat_w, y - 0.1, 0.06 + base_h + 0.075), oat, soft=0.06, sag=0.012))
        parts.append(cushion(f'sofa_backc_{i}', (seat_w - 0.02, 0.2, 0.4), (x + sx * seat_w, y + d / 2 - 0.27, 0.06 + base_h + 0.15 + 0.17), oat, soft=0.09, sag=0.014, rot=(math.radians(-12), 0, 0)))
    return parts


# ---------------------------------------------------------------- render setup
def setup_render(layout, samples, scale, exposure=0.0, look='AgX - Base Contrast'):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    cy = sc.cycles
    cy.device = 'CPU'
    cy.samples = samples
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.01
    cy.use_denoising = True
    cy.denoiser = 'OPENIMAGEDENOISE'
    cy.denoising_input_passes = 'RGB_ALBEDO_NORMAL'
    cy.denoising_prefilter = 'ACCURATE'
    cy.max_bounces = 8
    cy.diffuse_bounces = 4
    cy.glossy_bounces = 3
    cy.transmission_bounces = 4
    cy.volume_bounces = 0
    cy.transparent_max_bounces = 8
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    cy.blur_glossy = 1.0
    cy.sample_clamp_indirect = 3.0
    cy.light_sampling_threshold = 0.01
    cy.volume_step_rate = 4.0
    cy.volume_max_steps = 256
    sc.render.film_transparent = False
    if layout == 'port':
        sc.render.resolution_x, sc.render.resolution_y = 720, 1280
    else:
        sc.render.resolution_x, sc.render.resolution_y = 1280, 720
    sc.render.resolution_percentage = scale
    sc.render.fps = FPS
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = look
    sc.view_settings.exposure = exposure
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_depth = '8'
    sc.render.threads_mode = 'AUTO'
    sc.render.use_persistent_data = True


def world(hdri, strength=1.0, rot=0.0):
    w = bpy.data.worlds.new('world')
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes['Background']
    env = nt.nodes.new('ShaderNodeTexEnvironment')
    env.image = bpy.data.images.load(os.path.join(CACHE, 'hdri', hdri + '.hdr'))
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Rotation'].default_value = (0, 0, rot)
    nt.links.new(tc.outputs['Generated'], mp.inputs['Vector'])
    nt.links.new(mp.outputs['Vector'], env.inputs['Vector'])
    nt.links.new(env.outputs['Color'], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = strength


def sun(direction, strength, colour=(1.0, 0.78, 0.55), angle=0.53):
    d = bpy.data.lights.new('sun', 'SUN')
    d.energy = strength
    d.color = colour
    d.angle = math.radians(angle)
    o = bpy.data.objects.new('sun', d)
    bpy.context.scene.collection.objects.link(o)
    o.rotation_euler = Vector(direction).normalized().to_track_quat('-Z', 'Y').to_euler()
    return o


def haze(density, lo, hi, colour=(1.0, 0.93, 0.85), aniso=0.55):
    c = box('haze', (hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]),
            ((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2))
    m = bpy.data.materials.new('haze')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.remove(nt.nodes['Principled BSDF'])
    v = nt.nodes.new('ShaderNodeVolumePrincipled')
    v.inputs['Density'].default_value = density
    v.inputs['Color'].default_value = (*colour, 1)
    v.inputs['Anisotropy'].default_value = aniso
    nt.links.new(v.outputs['Volume'], nt.nodes['Material Output'].inputs['Volume'])
    c.data.materials.append(m)
    c.visible_shadow = False
    return c


def camera(loc, target, lens=28, fstop=None, focus=None, shift=(0, 0), name='cam'):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.sensor_width = 36
    cd.shift_x, cd.shift_y = shift
    cd.clip_start = 0.05
    o = bpy.data.objects.new(name, cd)
    bpy.context.scene.collection.objects.link(o)
    aim(o, loc, target)
    if fstop:
        cd.dof.use_dof = True
        cd.dof.aperture_fstop = fstop
        cd.dof.focus_distance = focus or (Vector(target) - Vector(loc)).length
    bpy.context.scene.camera = o
    return o


def aim(o, loc, target):
    o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()


def lerp(a, b, t):
    return tuple(x + (y - x) * t for x, y in zip(a, b))


# ---------------------------------------------------------------- shared materials
def make_mats():
    M = {}
    M['wall'] = plaster('plaster', (0.93, 0.89, 0.83))
    M['ceiling'] = M['wall']
    M['floor'] = tex_material('saltillo', 'terracotta_floor_tiles', scale=0.42, box=True, bump=0.45,
                              rough_mul=0.4, rough_add=0.12, coat=0.6, sat=0.95, val=1.3)
    M['oak'] = tex_material('oak', 'white_oak_veneer', scale=1.2, box=True, bump=0.2, rough_mul=0.5, rough_add=0.3)
    M['viga'] = tex_material('viga', 'white_oak_veneer', scale=0.8, box=True, bump=0.8,
                             tint=(0.62, 0.45, 0.31), rough_mul=0.6, rough_add=0.35, rot=math.pi / 2)
    M['frame'] = plain_material('bronze', (0.035, 0.03, 0.026), rough=0.38, metal=0.6)
    M['slat'] = plain_material('slat', (0.86, 0.83, 0.78), rough=0.42, sss=0.05)
    M['tape'] = plain_material('tape', (0.8, 0.77, 0.72), rough=0.8)
    M['leaf'] = plain_material('leaf', (0.08, 0.12, 0.05), rough=0.6, trans=0.0)
    M['sofa'] = linen('sofa', (0.80, 0.75, 0.67), scale=4.0)
    M['plinth'] = plain_material('plinth', (0.05, 0.04, 0.035), rough=0.5)
    M['teal'] = linen('teal', (0.035, 0.20, 0.21), scale=5.0)       # Callahan's teal, in linen
    M['clay'] = linen('clay', (0.50, 0.24, 0.13), scale=5.0)
    M['rug'] = linen('rug', (0.82, 0.78, 0.70), scale=1.6)
    M['glaze_teal'] = plain_material('glaze_teal', (0.02, 0.17, 0.18), rough=0.12, coat=0.6)
    M['glaze_white'] = plain_material('glaze_white', (0.86, 0.84, 0.8), rough=0.18, coat=0.5)
    return M


# ---------------------------------------------------------------- shots
def living_room(M, with_window=True):
    """The living room every shot shares (the film, the 'living' still)."""
    build_room(M, window=with_window)
    build_sofa(M)
    # rug: a low, slightly rounded slab of woven wool
    cushion('rug', (3.0, 2.1, 0.012), (0.25, 3.15, 0.006), M['rug'], soft=0.004, sag=0.0)
    # pillows (Poly Haven's pillows, in our linen: teal and clay)
    p = load_model('throw_pillows_01', (-0.35, 4.62, 0.52), rot_z=math.radians(8), height=0.44)
    kids = [c for c in p.children_recursive if c.type == 'MESH']
    for i, c in enumerate(kids):
        c.data.materials.clear()
        c.data.materials.append(M['teal'] if i % 2 == 0 else M['clay'])
    load_model('modern_coffee_table_01', (0.3, 3.15, 0.012), rot_z=math.radians(90), height=0.36)
    load_model('wooden_bowl_01', (0.55, 3.05, 0.372), rot_z=0.4, scale=1.1)
    load_model('ceramic_vase_04', (0.0, 3.3, 0.372), rot_z=1.0, height=0.34, mat=M['glaze_teal'])
    load_model('modern_arm_chair_01', (2.15, 3.15, 0.0), rot_z=math.radians(115), height=0.86)
    load_model('side_table_01', (1.75, 4.6, 0.0), rot_z=0.0, height=0.5)
    load_model('ceramic_vase_01', (1.75, 4.6, 0.5), rot_z=0.3, height=0.42, mat=M['glaze_white'])
    load_model('potted_plant_04', (-2.35, 4.2, 0.0), rot_z=0.6, height=1.25)
    load_model('wicker_basket_02', (-1.95, 4.65, 0.0), rot_z=0.2, height=0.32)


SUN_DIR = (1.0, 0.36, -0.30)   # into the room from the window side: low morning sun, about 16 degrees up

# The film's camera: it drifts toward the window and settles (frames 1-INTRO_END), then holds for the loop.
CAM_LAND = dict(a=(2.75, -0.55, 1.42), b=(2.35, 0.2, 1.3), ta=(-1.2, 4.0, 0.95), tb=(-1.35, 3.85, 0.9), lens=24)
CAM_PORT = dict(a=(1.6, -0.5, 1.35), b=(1.2, 0.3, 1.25), ta=(-1.6, 3.6, 1.0), tb=(-1.75, 3.5, 0.95), lens=22)


def film_frame_state(objs, layout, frame):
    cam, slats, pivot = objs['cam'], objs['slats'], objs['pivot']
    c = CAM_PORT if layout == 'port' else CAM_LAND
    t = ease_out((frame - 1) / (INTRO_END - 1))
    aim(cam, lerp(c['a'], c['b'], t), lerp(c['ta'], c['tb'], t))
    bt = ease((frame - BLIND_OPEN[0]) / (BLIND_OPEN[1] - BLIND_OPEN[0]))
    set_blinds(slats, BLIND_CLOSED + (BLIND_OPENED - BLIND_CLOSED) * bt)
    sway(pivot, frame)


def build_film(layout):
    M = make_mats()
    living_room(M)
    slats = build_blinds(M)
    pivot = build_canopy(M)
    world('goegap_road', strength=1.1, rot=math.radians(200))
    sun(SUN_DIR, 11.0)
    haze(0.016, (X0 - 0.02, Y0, 0.0), (X1, Y1, H))
    c = CAM_PORT if layout == 'port' else CAM_LAND
    cam = camera(c['a'], c['ta'], lens=c['lens'], fstop=4.0, focus=4.2)
    return dict(cam=cam, slats=slats, pivot=pivot)


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    shot, out = argv[0], argv[1]
    opts = dict(layout='land', frames=None, samples=96, scale=100)
    i = 2
    while i < len(argv):
        k = argv[i].lstrip('-')
        opts[k] = argv[i + 1]
        i += 2
    layout = opts['layout']
    bpy.ops.wm.read_factory_settings(use_empty=True)
    os.makedirs(out, exist_ok=True)
    setup_render(layout, int(opts['samples']), int(opts['scale']), exposure=float(opts.get('exposure', 0.9)))
    if shot == 'film':
        objs = build_film(layout)
        spec = opts['frames'] or f'1-{INTRO_END + LOOP_LEN}'
        rng, step = (spec.split(':') + ['1'])[:2]
        a, b = rng.split('-')
        for f in range(int(a), int(b) + 1, int(step)):
            dest = os.path.join(out, f'{f:04d}.png')
            if os.path.exists(dest):
                continue
            bpy.context.scene.frame_set(f)
            film_frame_state(objs, layout, f)
            bpy.context.scene.render.filepath = dest
            bpy.ops.render.render(write_still=True)
            print('frame', f, flush=True)
    else:
        import stills
        stills.render(shot, out, layout, sys.modules[__name__])


if __name__ == '__main__':
    sys.path.insert(0, HERE)
    main()
