---
id: 8
title: "Turning a short social clip into a site background is a repeatable workflow, with traps a box delogo and a portrait assumption both hit"
status: open
type: open-source
skill: []
proposes_skill: [scroll-film-renders]
target_file: []
siblings_checked: "no family registry yet; reuses the open candidate scroll-film-renders (0001, 0002, 0005) as the home for cinematic background footage, supplied or rendered; no installed skill prepares video assets (gsap-*, threejs-*, lightweight-3d-effects handle playback or real-time 3D only); checked, new-skill material, no propagation to installed skills"
area: "asset preparation: supplied short-form clips as looping web backgrounds"
date: 2026-10-12
session_context: "SimNow site: the owner sent a second TikTok clip to replace the background, asked for the watermark removed (permission confirmed) and for the intro to light the tail lights instead of the headlights"
parked_until:
resolved:
resolution:
reference: "sites/simnow/render/clean_clip.py (the resulting tool) and sites/simnow/README.md, Replacing the clip"
commands_verified: "run: clean_clip.py on the source reproduced the shipped drive.mp4 exactly (mean abs pixel difference 0.0 at 1, 6.8 and 12 s); a box delogo of the same clip left visible smears on the tail-light close-up and a sign, the mask inpaint did not"
---

**Issue:** This is the second time in this project that a clip from a social
platform became a site background, and the same steps came up both times.
Each step had a trap.
- **End card:** the platform appends a 5-6 s end card. Find it from a jump
  in frame variance (here 12.8 s) and cut it.
- **Watermark:** it jumps between two corners at a fixed time (5.0 s in both
  clips). ffmpeg `delogo` over a box smears visibly wherever the box crosses
  detail: a tail-light edge and a graffiti sign here. A per-pixel mask works
  much better. Take the pixels that stay bright in every frame of each
  stretch (the footage moves, the overlay doesn't), dilate them a few px,
  then inpaint only those (OpenCV Telea). The result was visibly clean.
- **Orientation:** the second clip was landscape footage stored on its side
  in a portrait frame. The number plate read top to bottom. That changes
  which way to rotate it, and the whole page layout: full-bleed on desktop,
  a top band on phones.
- **The "lights on" intro:** it keys on light sources, so the detector
  depends on the clip. Headlights key on luma. Red tail lights do not: their
  luma is low, so they need a redness test (red minus max(green, blue)). A
  thin light bar also needs a much stronger, wider bloom than a headlight
  to read as lights at all.
- **Stills:** poster, card and social images came from the cleaned clip, and
  their alt text and the footer credit had to change with it (a different
  car and a different creator).

**Suggested improvement:** Give the scroll-film-renders candidate (or a
sibling skill for supplied footage) a "clip to background" procedure in
this order:
1. A 1 fps contact sheet to read the shots, the end card, the watermark
   positions and the orientation.
2. Variance scan for the end-card frame.
3. Temporal-minimum masks for the watermark, then inpaint (not a delogo
   box).
4. Rotate if the frame is sideways.
5. Encode H.264 plus VP9 without audio.
6. Re-measure any light-keyed intro (luma for white lamps, redness for tail
   lights).
7. Swap the stills, alt text and credit.

A script like the one this produced (`render/clean_clip.py`, parameterised
by end frame, switch frame, two boxes and rotation) is the reusable core.

**Principle:** When an asset arrives through a platform that decorates it
(end cards, moving watermarks, storage rotation), treat the decorations as
data to detect, not as fixed boxes to blur. Overlays are the static part of
moving footage, and a mask built from that fact repairs far less of the
picture than a rectangle does.
