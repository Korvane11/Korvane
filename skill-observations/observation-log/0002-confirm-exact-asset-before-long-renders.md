---
id: 2
title: "Check the stand-in asset against the owner's reference, and ask for the owner's own photos, before starting hours of renders"
status: open
type: open-source
skill: []
proposes_skill: [scroll-film-renders]
target_file: []
siblings_checked: "no family registry yet; same candidate skill as 0001 (scroll-film-renders); img2threejs and threejs-loaders also take user-supplied models but render in real time — the rule applies to any long asset-bound build, noted here for the candidate only"
area: "asset fidelity gate before committing render time"
date: 2026-10-12
session_context: "SimNow site: rendering a base Aventador dressed with a code-built wing as a stand-in for the matte black Aventador SVJ in the owner's photo"
parked_until:
resolved:
resolution:
reference:
commands_verified: "none"
---

**Issue:** The owner sent a photo of a specific car (Aventador SVJ) and asked
for it to look "really really realistic". The only reachable model was a base
Aventador with no licence information; the SVJ-specific parts (wing,
splitter) were approximated in code and a two-hour render was started. The
owner stopped it: "I don't just want that model, I want it to look like the
picture". The mismatch was knowable at look-dev time: the stand-in's body,
bumpers, intakes and wheels differ from the reference, and no lighting or
grading closes that gap. The free CC BY SVJ that would fit was on a host the
container could not reach, so the owner was the only route to it, and asking
first would have cost minutes instead of hours.

**Suggested improvement:** In the candidate skill's look-dev step, put the
first test render next to the owner's reference image and list what differs
in the asset itself (shape, parts, proportions) versus what differs in
lighting and materials. If the asset differs, stop and get the exact asset
(owner download, purchase, or network allowance) before the long render;
only render a stand-in when the owner has agreed to one.

**Second instance (same session):** after the stand-in was rejected, asking
whether the reference photo was the owner's own turned up the best asset of
all: the photo itself, which (upscaled, graded and animated with headlight
glow and rain) met "as realistic as the picture" in under an hour, where the
render route was blocked on a model only the owner could fetch. The cheap
question ("is this photo yours, and do you have more?") belonged before any
synthetic imagery was built.

**Principle:** When the brief names a specific real object, fidelity of the
source asset is a gate, not a polish item. Check it against the reference
before spending the expensive step, and ask the person when only they can
fetch the right asset.
