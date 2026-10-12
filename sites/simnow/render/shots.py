"""Camera moves and lighting cues for the SimNow renders.

Each sequence is a list of per-frame states read by svj_studio.apply_state.
World space: metres, car nose toward -X, the camera-facing flank is -Y.
"""
from math import pi, sin

# Key shots of the scroll story (camera position, look-at target, lens mm, f-stop).
HERO = dict(pos=(-4.55, -3.3, 0.72), target=(0.1, 0.05, 0.5), lens=40, fstop=0, shift_x=-0.11, haze=1.0)
HEADLIGHT = dict(pos=(-3.0, -1.5, 0.70), target=(-2.02, -0.62, 0.60), lens=62, fstop=2.8, shift_x=-0.15, haze=0.35)
WHEEL = dict(pos=(-1.95, -2.3, 0.40), target=(-1.30, -0.98, 0.36), lens=52, fstop=2.8, shift_x=0.16, haze=0.35)
FLANK = dict(pos=(0.95, -3.45, 0.70), target=(0.45, -0.55, 0.52), lens=40, fstop=4.0, shift_x=-0.12, haze=0.5)
REAR = dict(pos=(5.1, -2.95, 1.45), target=(1.55, -0.05, 0.70), lens=40, fstop=5.6, shift_x=0.1, haze=0.8)
PROFILE = dict(pos=(0.0, -8.6, 0.95), target=(0.0, 0.0, 0.70), lens=48, fstop=0, shift_x=0.0, shift_y=-0.06, haze=1.0)

STORY = [HERO, HEADLIGHT, WHEEL, FLANK, REAR, PROFILE]
STORY_FRAMES = [34, 30, 28, 34, 34]  # frames per move between key shots

ALL_ON = dict(drl=1.0, beams=1.0, tail=1.0, spots=[1.0] * 6, soft=1.0, rim=1.0, haze=1.0)
SPOT_ORDER = [2, 5, 0, 3, 4, 1]


def lerp(a, b, t):
    return a + (b - a) * t


def vlerp(a, b, t):
    return tuple(lerp(x, y, t) for x, y in zip(a, b))


def clamp01(t):
    return max(0.0, min(1.0, t))


def smooth(t):
    t = clamp01(t)
    return t * t * (3 - 2 * t)


def ease_out(t):
    t = clamp01(t)
    return 1 - (1 - t) ** 3


def catmull(p0, p1, p2, p3, t):
    t2, t3 = t * t, t * t * t
    return tuple(
        0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
        for a, b, c, d in zip(p0, p1, p2, p3)
    )


def keyed(frame, keys):
    """Piecewise-linear value from [(frame, value), ...]."""
    if frame <= keys[0][0]:
        return keys[0][1]
    for (f0, v0), (f1, v1) in zip(keys, keys[1:]):
        if frame <= f1:
            return lerp(v0, v1, (frame - f0) / (f1 - f0))
    return keys[-1][1]


def spot_bang(frame, at):
    """A stage light hitting: fast rise, small overshoot, settle."""
    if frame < at:
        return 0.0
    d = frame - at
    if d < 2:
        return 0.6 * (d + 1) / 2
    return 1.0 + 0.25 * max(0.0, 1 - (d - 2) / 6)


def intro():
    n = 120
    start = dict(pos=(-6.3, -4.05, 0.55), target=(0.2, 0.1, 0.42), lens=34)
    frames = []
    for f in range(n):
        t = ease_out(f / (n - 1))
        st = dict(
            pos=vlerp(start['pos'], HERO['pos'], t),
            target=vlerp(start['target'], HERO['target'], t),
            lens=lerp(start['lens'], HERO['lens'], t),
            shift_x=lerp(0.0, HERO['shift_x'], t),
            fstop=0,
            drl=keyed(f, [(13, 0), (14, 0.25), (15, 0.0), (17, 0.55), (18, 0.12), (20, 0.85), (22, 0.45), (24, 1.0)]),
            beams=smooth((f - 30) / 10),
            tail=smooth((f - 26) / 8),
            spots=[0.0] * 6,
            soft=smooth((f - 94) / 24),
            rim=smooth((f - 98) / 21),
            haze=1.0,
        )
        for k, idx in enumerate(SPOT_ORDER):
            st['spots'][idx] = spot_bang(f, 46 + 8 * k)
        frames.append(st)
    return frames


def story():
    frames = []
    keys = STORY
    for seg, count in enumerate(STORY_FRAMES):
        p0 = keys[max(seg - 1, 0)]
        p1, p2 = keys[seg], keys[seg + 1]
        p3 = keys[min(seg + 2, len(keys) - 1)]
        last = seg == len(STORY_FRAMES) - 1
        for i in range(count + (1 if last else 0)):
            t = smooth(i / count)
            st = dict(ALL_ON)
            st['spots'] = list(ALL_ON['spots'])
            st['pos'] = catmull(p0['pos'], p1['pos'], p2['pos'], p3['pos'], t)
            st['target'] = catmull(p0['target'], p1['target'], p2['target'], p3['target'], t)
            st['lens'] = lerp(p1['lens'], p2['lens'], t)
            st['shift_x'] = lerp(p1['shift_x'], p2['shift_x'], t)
            st['shift_y'] = lerp(p1.get('shift_y', 0.0), p2.get('shift_y', 0.0), t)
            st['haze'] = lerp(p1['haze'], p2['haze'], t)
            # depth of field eases in and out with the close-ups
            f1 = p1['fstop'] or 16.0
            f2 = p2['fstop'] or 16.0
            st['fstop'] = lerp(f1, f2, t)
            frames.append(st)
    return frames


def test():
    """Look-dev frames: two intro moments and every key shot."""
    it = intro()
    out = [it[28], it[62], it[119]]
    for k in STORY[1:]:
        st = dict(ALL_ON)
        st.update(k)
        out.append(st)
    return out


SEQUENCES = {'intro': intro, 'story': story, 'test': test}
