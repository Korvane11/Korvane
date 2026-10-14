---
id: 26
title: "Offline render with a post-process depth of field: steam drawn into the scene took the cup's depth wherever it was dense, so the background seen through it came out in sharp focus, a box of crisp lines above the cup; fixed by drawing the steam as its own layer laid over the result after the blur"
status: open
type: open-source
skill: []
proposes_skill: [scroll-film-renders]
target_file: []
siblings_checked: "reuses the open candidate scroll-film-renders (0001, 0002, 0005, 0008, 0009, 0019, 0021-0025) as the home for rendered cinematic footage; threejs-postprocessing checked by description only: a real-time EffectComposer pass, not offline accumulation with a depth channel, assumed not to cover this, not read; checked, new-skill material"
area: "Offline frame rendering: translucent volumes (steam, smoke, haze) and a gathered depth of field"
date: 2026-10-14
session_context: "Eleven Cafē site: refining the opening scene's realism; the camera was raised so the coffee shows, and the background behind the steam turned sharp"
parked_until:
resolved:
resolution:
reference: "sites/eleven-cafe/render/pour.html (uSteamPass, the steam pass in accumulate(), uSteam in the post shader)"
commands_verified: "run: 1600x900 frame at the end of the pour, steam region cropped: a rectangle of sharp plank lines and a sharp post edge behind the steam, the rest of the background soft. run: same frame and a steam-loop frame after the change (scene without steam into the blur, steam accumulated separately over the scene's depth and laid over the blurred result): background soft behind the steam, steam wisps crisp, in both"
---

**Issue:** The renderer drew steam into the same buffer as the scene and,
so the steam itself would stay sharp, replaced the pixel's depth with the
cup's wherever the steam was dense enough (`dist = mix(dist, cupDist,
smoothstep(0.02, 0.35, alpha))`). A pixel has one depth, though, and the
steam is translucent: the depth of field blurred that pixel as if
everything in it sat at the cup, so the background seen through the
steam came out in focus. From a low camera the background behind the
steam was a plain wall and it went unnoticed. From a higher camera it was
the counter's planks, and a box of crisp lines appeared above the cup.

**Suggested improvement:** For the candidate skill, under post effects for
offline renders: a translucent layer cannot share the opaque scene's single
depth channel. Render the opaque scene alone and run the depth of field on
it. Render the translucent layer in a pass of its own: it reads the scene's
depth so it stops at surfaces, and adds up its colour and its coverage. Lay
it over the blurred result. When the layer is at the focus distance
(steam over the subject), it needs no blur of its own. With per-pass
accumulation, the layer's coverage blends by addition while the scene's
depth blends by minimum, so the two cannot share one render target.

**Principle:** One value per pixel can describe one surface. Where a pixel
shows two things (a translucent layer and what is behind it), any effect
keyed on that value must get the two separately, or it treats one of them
as the other.
