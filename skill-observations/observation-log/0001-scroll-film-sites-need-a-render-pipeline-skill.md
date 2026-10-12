---
id: 1
title: "Photoreal scroll-film sites need an offline render pipeline skill; no installed skill covers it"
status: open
type: open-source
skill: []
proposes_skill: [scroll-film-renders]
target_file: []
siblings_checked: "no family registry yet; nearest installed skills threejs-*, gsap-scrolltrigger, img2threejs, lightweight-3d-effects, web3d-integration-patterns — all real-time WebGL or scroll mechanics, none covers offline path-traced frame sequences; checked — new-skill candidate, no propagation"
area: "workflow: cinematic product/car websites from a reference reel"
date: 2026-10-12
session_context: "Rebuilding a sim-racing lounge site so a matte black supercar looks photographic, matching a 'car polish website' reel (dark studio, spotlights, haze, macro shots scrubbed by scroll)"
parked_until:
resolved:
resolution:
reference:
commands_verified: "none"
---

**Issue:** The owner asked for a site that looks "really really realistic",
pointing at a reel whose look comes from photographic frame sequences
scrubbed by scroll, not real-time WebGL. The installed skills (three.js,
GSAP, img2threejs) all steer toward real-time 3D, which had already
produced a result the owner found not realistic enough. The workable route
was improvised from scratch: Blender as a pip package (`bpy`) in a headless
container, a scripted studio scene, look-dev at low resolution, render-time
profiling, a numpy grade, then a canvas player with holds, HD stills on the
holds and subject-aware cropping on portrait screens. Several of the steps
cost real time to rediscover:

- the light tree plus emissive meshes (headlight parts) doubled CPU render
  time; turning the light tree off and setting emission sampling to NONE
  halved it with no visible loss;
- a helper script named `inspect.py` shadowed the stdlib module and crashed
  `bpy` at import (fix: never name scripts after stdlib modules, run `-I`);
- spot lights placed inside their own housing meshes emitted nothing;
- matte black paint reads as grey primer unless fill lights on the camera
  side are removed and the paint has no clear coat.

**Suggested improvement:** A `scroll-film-renders` skill covering: when to
choose pre-rendered sequences over real-time 3D (photoreal asks, product
hero pages); the bpy install path; a scene template (studio, wet floor,
haze, spots, strips); look-dev and profiling steps with the performance
knobs above; frame budget maths (frames x seconds per frame vs. holds and
crossfades); the grade; and the web player (holds, HD stills, crossfade
between frames, projected focus points for portrait crops, reduced-motion
fallback).

**Principle:** When a request's quality bar is set by a reference made with
a different medium, identify the reference's production technique first
and match the technique, not just the look. Real-time tools chase a
pre-rendered look with diminishing returns.
