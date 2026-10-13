---
id: 23
title: "Raymarched soft self-shadow banded the outside of a bowl that is widest at its rim: rays from the lower body grazed the bulge above; jittering the rays only softened the steps, and the fix was to let the outside take shadow from the handle only"
status: open
type: open-source
skill: []
proposes_skill: [scroll-film-renders]
target_file: []
siblings_checked: "reuses the open candidate scroll-film-renders (0001, 0002, 0005, 0008, 0009, 0019, 0021, 0022) as the home for rendered cinematic footage; threejs-* skills checked by description: real-time shadow maps, not signed-distance shadows, assumed not to cover this, not read; checked, new-skill material"
area: "Offline frame rendering: signed-distance soft shadows cast by an object onto itself"
date: 2026-10-13
session_context: "Eleven Cafē site: rebuilding the opening scene's cup from the owner's photo (a round bowl, widest at the rim, side-lit by a low sun)"
parked_until:
resolved:
resolution:
reference: "sites/eleven-cafe/render/pour.html (shadeHit: outside and gOnlyHandle; softShadow: the jittered start and steps)"
commands_verified: "run: the 900x1600 frame with the cup's self-shadow on and off (scratch copy): stepped bands along the shadow edge on the body with it on, a smooth falloff with it off. run: start and step jittered per pass, k 14 to 10: bands softer, still there. run: outside points shadowed by the handle only: smooth edge, the rim's shadow inside the bowl kept"
---

**Issue:** The new cup is widest at the rim and curves in toward a small
base, and the low sun lit it from the side. Points on the lower body sent
shadow rays up toward the sun that skimmed the bulge above them. The
soft-shadow estimate (minimum of k * distance / travelled over samples) is
at its weakest on rays running along a surface, and it drew the shadow's
edge as a stack of bands. Jittering the start and the step per pass, so
the passes would average the bands out, only softened them.

The bowl's outside did not need that shadow: the wrapped diffuse term
already darkens it past the terminator, and the smooth version (self-shadow
off) looked right. What did need shadow was the inside (the rim shades the
far wall and the coffee) and anything the handle covers.

**Suggested improvement:** For the candidate skill, under lighting for
raymarched renders: when a smooth, convex-ish object shows banding along
its own shadow edge, render it once with self-shadow off. If that looks
right, exclude the object's own body from the shadow rays of its outer
surface (a flag the scene function reads), and keep full shadows for the
parts that really are shaded by the object: insides, and under handles or
other appendages.

**Principle:** Before tuning an estimate that fails at a known weak case,
check whether the case needs the estimate at all. Another term may already
produce the effect, and removing the estimate there is cleaner than
fighting it.
