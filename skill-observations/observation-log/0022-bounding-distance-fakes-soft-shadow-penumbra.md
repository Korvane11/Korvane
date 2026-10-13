---
id: 22
title: "Raymarched soft shadow showed a saw-tooth edge: far from the object the scene returned a bounding volume's distance, and the soft shadow, which reads the distance's size as how near the ray passed, drew a false penumbra; shortening the step only made the teeth finer"
status: open
type: open-source
skill: []
proposes_skill: [scroll-film-renders]
target_file: []
siblings_checked: "reuses the open candidate scroll-film-renders (0001, 0002, 0005, 0008, 0009, 0019, 0021) as the home for rendered cinematic footage; threejs-* skills checked by name and description: real-time shadow maps, not signed-distance soft shadows, assumed not to cover this, not read; no other installed skill raymarches; checked, new-skill material"
area: "Offline frame rendering: signed-distance soft shadows in a scene that skips the exact distance outside a bounding volume"
date: 2026-10-13
session_context: "Eleven Cafē site: swapping the cup in the opening scene for the owner's stoneware mug; the first full-size preview showed teeth along the mug's shadow on the counter"
parked_until:
resolved:
resolution:
reference: "sites/eleven-cafe/render/pour.html (map(): gExact; softShadow(): the wider box and the closest-pass estimate)"
commands_verified: "run: the same 1600x900 frame three ways (scratch copies): reflection off, teeth stay; cup shadow on the counter off, teeth gone. run: step capped at 0.32 instead of 0.8 plus the closest-pass estimate: teeth about 2.5 times finer, not gone. run: shadow rays forced to the exact distance (gExact) in a box widened by 3 cm: teeth gone, frame time 7 s to 8 s"
---

**Issue:** The scene's distance function returned a bounding cylinder's
distance whenever a point was more than 0.6 cm outside it, to save
evaluating the cup. That is a safe lower bound for marching, but a soft
shadow uses the distance's size: `res = min(res, k * h / d)` treats a small
`h` as "the ray passed close to the object". Shadow rays from the counter
passed close to the cylinder, which is much wider than the cup's foot, so
they got a penumbra the cup does not cast. Where each ray switched from the
bound to the true distance between two steps, the shadow's edge came out as
teeth. A smaller step made the teeth finer, which looked like progress and
was not the cause. Switching each contribution off in turn (reflection, then
shadow) found the layer in two renders.

The same bounding box also clipped the penumbra: shadow rays that missed the
box returned "fully lit" while the penumbra reached beyond it.

**Suggested improvement:** For the candidate skill, in the post effects /
lighting section for offline raymarched renders:

- Soft shadows (and anything else that reads the distance's size, such as
  ambient occlusion or glow) must get the exact distance. Keep the bound for
  camera rays only, or switch it off with a flag while a shadow ray marches.
- Size a shadow ray's bounding box to the object plus its penumbra
  (about distance / k), not to the object alone.
- To find which layer an artefact is in, render the frame with each
  contribution off in turn before tuning any parameter. If tuning a step
  size changes an artefact's frequency but not whether it is there, the
  step is not the cause.

**Principle:** A shortcut that is safe for one consumer of a value can be
wrong for another. A lower bound is enough to march a ray, but any effect
that reads the value's size inherits the error. When adding a bound or an
approximation, list everything that reads the value, not only the caller
it was written for.
