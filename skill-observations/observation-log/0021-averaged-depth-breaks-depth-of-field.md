---
id: 21
title: "Offline renders with a post-process depth of field: averaging depth over anti-aliasing passes gave edge pixels a depth between the subject and the background, and the blur sprayed the sharp subject's edge into the background; three earlier focus bugs looked alike, and a fourth (samples too sparse near the centre) made slightly soft edges spiky"
status: open
type: open-source
skill: []
proposes_skill: [scroll-film-renders]
target_file: []
siblings_checked: "reuses the open candidate scroll-film-renders (0001, 0002, 0005, 0008, 0009, 0019) as the home for rendered cinematic footage; threejs-postprocessing (its description names DOF) checked by description only: a real-time EffectComposer pass, not offline accumulation with a depth channel, assumed not to cover this, not read; no other installed skill renders offline; checked, new-skill material"
area: "Offline frame rendering: jittered multi-pass accumulation followed by a gathered depth-of-field pass"
date: 2026-10-13
session_context: "Eleven Cafē site: re-rendering the opening scene (a cup by a window, golden light, soft background) in a WebGL raymarcher run headless, with accumulation passes for anti-aliasing and a depth-of-field gather afterwards"
parked_until:
resolved:
resolution:
reference: "sites/eleven-cafe/render/pour.html (accumulate(): blendEquationSeparate(FUNC_ADD, MIN); the post shader)"
commands_verified: "run: 1600x900 frames with soft focus on and off (preview2.cjs): with focus on, specks along the cup's left edge and rim; with it off, none. run: with depth kept as the per-pixel minimum over the passes (alpha blend MIN, cleared to 1e9), the same frame showed a clean edge. run: the coc debug view showed the cup at about 1 px and the background at 14 px, which ruled out a wrong focus distance before the edge cause was found"
---

**Issue:** The scene was rendered as 4 jittered passes summed into a
float buffer: colour in RGB, the hit distance in alpha. The depth-of-field
pass divided both by the pass count, then gathered a blur whose size came
from that depth. On the subject's silhouette some passes hit the cup (47 cm)
and some the background (150 cm), so the averaged depth was about 98 cm, a
surface that doesn't exist. Those edge pixels got a large blur circle while
holding the sharp cup's bright colour, and the gather sprayed them into the
background as fine specks around the cup.

Three earlier bugs in the same pass looked like "the cup is blurry" or "the
cup has a halo" too:

- a smoothstep with its edges reversed (weights inverted);
- the centre sample weighted 1 while the others were weighted 1/r²;
- sharp foreground samples allowed to spread over a blurred pixel.

Each needed its own diagnosis.

**A fourth, a day later:** after the camera was raised, the cup's far rim
(about 2.8 px out of focus) showed a spiky, saw-toothed edge against the
blurred background; with the effect off it was clean. The gather spread
its samples over the whole maximum circle (`r = sqrt(i / N) * maxCoC`), so
the nearest sample sat 2.8 px out. A pixel whose own circle was about that
size got a single sample, rotated at random per pixel, which came out as
spikes. A second, small set of samples filling a disk the size of the
pixel's own circle (24 of them) gave a clean edge.

**Suggested improvement:** For the candidate skill, in a section on post
effects for offline renders:

- Keep depth as the nearest value over the anti-aliasing passes (a MIN
  blend on the depth channel, cleared to a large value), not the average.
  Divide only the colour by the pass count.
- In a gathered depth of field, a sample in front of the centre spreads
  only if its own blur circle is large. Weight every sample by the inverse
  of its circle's area, the centre included.
- Sample the pixel's own circle densely, not only the widest one: a set
  of samples spread over the maximum radius leaves slightly soft edges
  with one random sample each.
- Debug with three views of the same frame: blur-circle size as grey, depth
  as grey, and the frame with the effect off. Compare the effect-off frame
  first.

**Principle:** Averaging is right for colour and wrong for anything that
selects a surface (depth, IDs, normals). At an edge the average belongs to
neither side, and every effect keyed on it misbehaves exactly there.
