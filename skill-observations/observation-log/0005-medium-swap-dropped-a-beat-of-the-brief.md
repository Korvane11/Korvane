---
id: 5
title: "Swapping the background medium silently dropped a beat of the owner's brief (headlights turning on), and the work was reported finished"
status: open
type: open-source
skill: [design-taste-frontend, redesign-existing-projects]
proposes_skill: [scroll-film-renders]
target_file: []
siblings_checked: "no family registry yet; design-direction skills with a ship check: design-taste-frontend (§14 FINAL PRE-FLIGHT CHECK, read: mechanical layout/CTA checks, nothing that re-walks the client's stated sequence) added; redesign-existing-projects added as the audit-first sibling, assumed to share the gap, not read for it; design-taste-frontend-v1 excluded (frozen legacy copy); impeccable excluded: its finish-reviewer agent already reviews against a direction contract, assumed, not read"
area: "completion check: verifying the owner's brief, beat by beat, after the implementation changes underneath it"
date: 2026-10-12
session_context: "SimNow site: the owner's brief was 'opens on black, the Lambo's lights come on, then the site opens over it driving at night'. The first build (3D render) had the lights-on beat inside its rendered intro frames; when the owner supplied a real clip, the intro became a plain fade-up from black, and the clip already starts with the lights on"
parked_until:
resolved:
resolution:
reference:
commands_verified: "none"
---

**Issue:** The owner's brief had three beats: black screen, headlights come
on, site opens over the car driving at night. The first implementation (a 3D
render) carried the middle beat implicitly: frames 1-48 of the render were
the lights switching on. When the background was replaced by a supplied clip,
the intro became a 1.6 s fade-up from black. The clip opens with the lights
already on, so the "lights come on" beat vanished. Nobody noticed, because
every check after the swap tested mechanics: the video plays, there are no
console errors, the sections render. The project memory file even recorded the
beat in the owner's words. The work was reported finished, and the owner's
next message was "The headlights aren't there when I open it". The fix
(a WebGL pass that shows only the headlights, flickering on, then reveals the
scene) took one turn once the gap was named.

**Suggested improvement:** In design-taste-frontend §14 (FINAL PRE-FLIGHT
CHECK), add a non-mechanical item: write the client's stated experience as a
numbered list of beats, in their words, and for each beat name the frame,
timestamp or element in the CURRENT build that delivers it. Re-run the list
whenever an asset, medium or library underneath is swapped, not only at
first ship. A beat with no named delivery point is a Pre-Flight Fail. For
time-based intros, the evidence is a screenshot at each beat's moment
(pause the timeline and seek, since headless screenshots are too slow to catch
real time), not a "plays without errors" run.

**Principle:** A brief is satisfied by the build, not by the history of the
build. When the implementation underneath changes, anything the old version
delivered as a side effect has to be re-proven against the new one. Checks
that test whether something runs cannot tell you whether it does what was
asked.
